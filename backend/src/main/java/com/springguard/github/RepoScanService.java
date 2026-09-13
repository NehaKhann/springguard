package com.springguard.github;

import com.springguard.core.RuleEngine;
import com.springguard.core.Rules;
import com.springguard.model.Finding;
import com.springguard.model.RepoScanReport;
import com.springguard.model.ScanReport;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.List;

@Service
public class RepoScanService {

    private static final int MAX_FILE_BYTES = GitHubClient.MAX_FILE_BYTES;

    private final GitHubClient github;
    private final RuleEngine engine = new RuleEngine(Rules.ALL);

    public RepoScanService(GitHubClient github) {
        this.github = github;
    }

    public RepoScanReport scan(String repoUrl, String token, String requestedBranch) {
        GitHubClient.Repo repo = github.parse(repoUrl);
        if (repo == null) {
            return msg("BAD_URL", "Enter a GitHub repo URL like https://github.com/owner/repo.", null);
        }
        String target = repo.owner() + "/" + repo.name();

        try {
            String defaultBranch = github.defaultBranch(repo, token); // also validates the repo exists

            // Branch comes from: explicit field > branch in URL > repo default.
            // The folder/file SCOPE always comes from the URL (e.g. /tree/main/src/core or
            // /blob/main/.../Foo.java) — so you can scope to a folder AND override the branch
            // via the field at the same time.
            String fieldBranch = (requestedBranch != null && !requestedBranch.isBlank())
                    ? requestedBranch.trim().replaceAll("^/+|/+$", "")
                    : null;
            String urlCandidate = (repo.branch() != null && !repo.branch().isBlank())
                    ? repo.branch()
                    : null;

            String branch;   // the branch name (used for fetching file contents)
            String treeish;  // what we hand to the trees API (default name, or a validated SHA)
            String scope = null; // optional folder/file path to limit the scan to

            if (fieldBranch == null && urlCandidate == null) {
                // Default-branch scan: lean path, no extra branch-list call.
                branch = defaultBranch;
                treeish = defaultBranch;
            } else {
                java.util.Map<String, String> branches = github.branchShaMap(repo, token);

                // Pull the folder/file scope out of the URL by resolving the URL's own branch
                // prefix (independent of the field), and treating the leftover as the scope.
                if (urlCandidate != null) {
                    String urlBranch = github.resolveBranch(branches, urlCandidate);
                    if (urlBranch != null && urlCandidate.length() > urlBranch.length()) {
                        String leftover = urlCandidate.substring(urlBranch.length()).replaceAll("^/+", "");
                        if (!leftover.isBlank()) scope = leftover;
                    }
                }

                // The branch to actually scan: field wins, else the URL's branch.
                String candidate = fieldBranch != null ? fieldBranch : urlCandidate;
                String real = github.resolveBranch(branches, candidate);
                if (real == null) {
                    return msg("BRANCH_NOT_FOUND",
                            "Branch '" + candidate + "' was not found in " + target + ".", target);
                }
                branch = real;
                treeish = branches.get(real);
            }

            List<String> files = github.listRelevantFiles(repo, treeish, token, scope);
            if (files.isEmpty()) {
                String where = scope != null
                        ? "under '" + scope + "' on branch '" + branch + "'"
                        : "on branch '" + branch + "'";
                return new RepoScanReport(0, "\u2014", "", List.of(),
                        "NO_FILES", "No Java or Spring config files found " + where + ".", 0, target);
            }

            List<Finding> all = new ArrayList<>();
            int scanned = 0;
            for (String path : files) {
                String content;
                try {
                    content = github.fetchFile(repo, branch, path, token);
                } catch (Exception e) {
                    continue;
                }
                if (content == null || content.isBlank()) continue;
                if (content.length() > MAX_FILE_BYTES) content = content.substring(0, MAX_FILE_BYTES);
                for (Finding f : engine.detect(content)) {
                    all.add(f.withFile(path));
                }
                scanned++;
            }

            ScanReport rep = engine.reportFrom(all);
            String scopeLabel = scope != null ? ", " + scope : "";
            String summary = target + " (" + branch + scopeLabel + ") \u2014 scanned " + scanned + " file(s). " + rep.summary();
            return new RepoScanReport(rep.score(), rep.grade(), summary, rep.findings(),
                    "ANALYZED", null, scanned, target);

        } catch (RestClientResponseException e) {
            int code = e.getStatusCode().value();
            String message = switch (code) {
                case 401 -> "The token was rejected. Check it has Contents read access.";
                case 403 -> "GitHub rate limit reached. Add a GitHub token (it raises the limit from 60 to 5,000 per hour), or try again in a little while.";
                case 404 -> "Repo not found. If it's private, provide a token with Contents read access.";
                default -> "GitHub request failed (" + code + "). Please try again.";
            };
            return msg("ERROR", message, target);
        } catch (Exception e) {
            return msg("ERROR", "Could not scan that repo. Please check the URL and try again.", target);
        }
    }

    private RepoScanReport msg(String status, String message, String target) {
        return new RepoScanReport(0, "\u2014", "", List.of(), status, message, 0, target);
    }
}
