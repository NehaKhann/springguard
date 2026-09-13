package com.springguard.web;

/** status: OK | AI_OFF | ERROR. original/fixedCode null unless OK. */
public record RepoFixResponse(String status, String message, String path,
                              String original, String fixedCode) {}
