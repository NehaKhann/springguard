package com.springguard.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Talks to the GitHub REST API. Token is optional (needed only for private repos). */
@Component
public class GitHubClient {

    public static final int MAX_FILES = 40;
    public static final int MAX_FILE_BYTES = 200_000;

    private final ObjectMapper mapper;
    private final RestClient http;

    public GitHubClient(ObjectMapper mapper) {
        this.mapper = mapper;
        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout(8000);
        rf.setReadTimeout(15000);
        this.http = RestClient.builder().requestFactory(rf).build();
    }

    /** branch is the branch named in the URL (.../tree/<branch>), or null if none. */
    public record Repo(String owner, String name, String branch) {}

    public Repo parse(String url) {
        if (url == null) return null;
        String u = url.trim().replaceFirst("^https?://", "").replaceFirst("^www\\.", "");
        u = u.replaceAll("[#?].*$", ""); // drop #line-anchors and ?query params
        if (!u.startsWith("github.com/")) return null;
        String[] parts = u.substring("github.com/".length()).split("/");
        if (parts.length < 2) return null;
        String owner = parts[0];
        String repo = parts[1];
        if (repo.endsWith(".git")) repo = repo.substring(0, repo.length() - 4);
        if (owner.isBlank() || repo.isBlank()) return null;

        String branch = null;
        // .../tree/<branch>[/folder...]  or  .../blob/<branch>/<file>
        // We keep the whole segment after tree/blob as a "candidate"; the real branch and any
        // folder/file scope are separated later against the actual branch list.
        if (parts.length >= 4 && ("tree".equals(parts[2]) || "blob".equals(parts[2]))) {
            StringBuilder b = new StringBuilder();
            for (int i = 3; i < parts.length; i++) {
                if (parts[i].isBlank()) continue;
                if (b.length() > 0) b.append('/');
                b.append(parts[i]);
            }
            if (b.length() > 0) branch = b.toString();
        }
        return new Repo(owner, repo, branch);
    }

    public String defaultBranch(Repo repo, String token) throws Exception {
        String json = apiGet("https://api.github.com/repos/" + repo.owner() + "/" + repo.name(), token, false);
        return mapper.readTree(json).path("default_branch").asText("main");
    }

    /** All branch names that actually exist in the repo (paged, capped). */
    public java.util.List<String> listBranchNames(Repo repo, String token) throws Exception {
        return new ArrayList<>(branchShaMap(repo, token).keySet());
    }

    /** All branches in the repo as name -> commit SHA (paged, capped). One source of truth. */
    public java.util.Map<String, String> branchShaMap(Repo repo, String token) throws Exception {
        java.util.Map<String, String> map = new java.util.LinkedHashMap<>();
        for (int page = 1; page <= 5; page++) { // up to 500 branches
            String url = "https://api.github.com/repos/" + repo.owner() + "/" + repo.name()
                    + "/branches?per_page=100&page=" + page;
            String json = apiGet(url, token, false);
            JsonNode arr = mapper.readTree(json);
            if (!arr.isArray() || arr.isEmpty()) break;
            for (JsonNode b : arr) {
                String name = b.path("name").asText("");
                String sha = b.path("commit").path("sha").asText("");
                if (!name.isBlank() && !sha.isBlank()) map.put(name, sha);
            }
            if (arr.size() < 100) break;
        }
        return map;
    }

    /**
     * A GitHub "/tree/" URL segment can be a branch, OR a branch followed by a folder path,
     * and a branch name can itself contain slashes. Resolve the real branch by matching the
     * longest leading prefix of {@code candidate} against the actual branch names.
     * Returns the matched branch name (and its SHA via the out-map) or null if none match.
     */
    public String resolveBranch(java.util.Map<String, String> branches, String candidate) {
        if (candidate == null || candidate.isBlank()) return null;
        String[] parts = candidate.split("/");
        for (int k = parts.length; k >= 1; k--) {
            StringBuilder b = new StringBuilder();
            for (int i = 0; i < k; i++) {
                if (i > 0) b.append('/');
                b.append(parts[i]);
            }
            String name = b.toString();
            if (branches.containsKey(name)) return name;
        }
        return null;
    }

    /** Exact commit SHA for a branch that is confirmed to exist, else null. */
    public String branchSha(Repo repo, String branch, String token) {
        try {
            // Confirm the branch is genuinely in the repo's branch list (no loose fallback).
            if (!listBranchNames(repo, token).contains(branch)) {
                return null;
            }
            String json = apiGet("https://api.github.com/repos/" + repo.owner() + "/" + repo.name()
                    + "/branches/" + branch, token, false);
            String sha = mapper.readTree(json).path("commit").path("sha").asText("");
            return sha.isBlank() ? null : sha;
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 404) return null;
            throw e;
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }

    public List<String> listRelevantFiles(Repo repo, String treeish, String token, String scope) throws Exception {
        String url = "https://api.github.com/repos/" + repo.owner() + "/" + repo.name()
                + "/git/trees/" + treeish + "?recursive=1";
        String json = apiGet(url, token, false);
        JsonNode tree = mapper.readTree(json).path("tree");

        boolean scoped = scope != null && !scope.isBlank();
        List<String> files = new ArrayList<>();
        if (tree.isArray()) {
            for (JsonNode node : tree) {
                if (!"blob".equals(node.path("type").asText())) continue;
                String path = node.path("path").asText("");
                long size = node.path("size").asLong(0);
                // If a folder/file scope is given, only include paths inside it (before the cap).
                if (scoped && !(path.equals(scope) || path.startsWith(scope + "/"))) continue;
                if (isRelevant(path) && size <= MAX_FILE_BYTES) {
                    files.add(path);
                }
            }
        }
        files.sort(Comparator.comparingInt(p -> p.contains("/test/") ? 1 : 0));
        return files.size() > MAX_FILES ? files.subList(0, MAX_FILES) : files;
    }

    private boolean isRelevant(String path) {
        String p = path.toLowerCase();
        return p.endsWith(".java") || p.endsWith(".properties") || p.endsWith(".yml") || p.endsWith(".yaml");
    }

    public String fetchFile(Repo repo, String branch, String path, String token) throws Exception {
        if (token != null && !token.isBlank()) {
            String url = "https://api.github.com/repos/" + repo.owner() + "/" + repo.name()
                    + "/contents/" + path + "?ref=" + branch;
            return apiGet(url, token, true);
        }
        String rawUrl = "https://raw.githubusercontent.com/" + repo.owner() + "/" + repo.name()
                + "/" + branch + "/" + path;
        return http.get().uri(rawUrl).header("User-Agent", "SpringGuard").retrieve().body(String.class);
    }

    private String apiGet(String url, String token, boolean raw) {
        var req = http.get().uri(url)
                .header("User-Agent", "SpringGuard")
                .header("X-GitHub-Api-Version", "2022-11-28")
                .header("Accept", raw ? "application/vnd.github.raw" : "application/vnd.github+json");
        if (token != null && !token.isBlank()) {
            req = req.header("Authorization", "Bearer " + token);
        }
        return req.retrieve().body(String.class);
    }
}
