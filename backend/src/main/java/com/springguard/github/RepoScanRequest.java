package com.springguard.github;

/** token: optional, only for private repos. branch: optional, blank = repo default. */
public record RepoScanRequest(String repoUrl, String token, String branch) {}
