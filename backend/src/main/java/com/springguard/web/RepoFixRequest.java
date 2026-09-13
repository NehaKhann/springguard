package com.springguard.web;

public record RepoFixRequest(String repoUrl, String token, String branch, String path) {}
