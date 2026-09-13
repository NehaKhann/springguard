package com.springguard.model;

import java.util.List;

/** The graded result: score, grade, summary, findings — plus a status and message
 *  used when the input can't be analysed (empty, not Spring, too large). */
public final class ScanReport {
    public final int score;
    public final String grade;
    public final String summary;
    public final List<Finding> findings;
    public final String status;   // ANALYZED | EMPTY | NOT_SPRING | TOO_LARGE
    public final String message;  // user-facing note when status != ANALYZED

    public ScanReport(int score, String grade, String summary, List<Finding> findings) {
        this(score, grade, summary, findings, "ANALYZED", null);
    }

    public ScanReport(int score, String grade, String summary, List<Finding> findings,
                      String status, String message) {
        this.score = score;
        this.grade = grade;
        this.summary = summary;
        this.findings = findings;
        this.status = status;
        this.message = message;
    }

    public int score() { return score; }
    public String grade() { return grade; }
    public String summary() { return summary; }
    public List<Finding> findings() { return findings; }
    public String status() { return status; }
    public String message() { return message; }
}
