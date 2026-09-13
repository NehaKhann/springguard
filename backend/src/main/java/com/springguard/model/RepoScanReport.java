package com.springguard.model;

import java.util.List;

/** Aggregate report for a whole-repo scan. status: ANALYZED | BAD_URL | NO_FILES | ERROR. */
public record RepoScanReport(int score, String grade, String summary, List<Finding> findings,
                             String status, String message, int filesScanned, String target) {}
