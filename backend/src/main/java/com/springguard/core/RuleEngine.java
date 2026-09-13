package com.springguard.core;

import com.springguard.model.Finding;
import com.springguard.model.ScanReport;
import com.springguard.model.Severity;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Runs every rule against code, then turns findings into a 0-100 score and A-F grade.
 * Detection and scoring are separate so a repo scan can detect per-file, then score the
 * combined findings with the exact same logic as a single-file scan.
 */
public class RuleEngine {

    private final List<SecurityRule> rules;

    public RuleEngine(List<SecurityRule> rules) {
        this.rules = rules;
    }

    /** Detect findings in a single piece of code (no scoring). */
    public List<Finding> detect(String code) {
        String safe = code == null ? "" : code;
        List<Finding> findings = new ArrayList<>();
        for (SecurityRule rule : rules) {
            if (rule.matches(safe)) {
                findings.add(new Finding(rule.id(), rule.severity(), rule.title(), rule.why(), rule.fix()));
            }
        }
        return findings;
    }

    /** Build a scored report from an already-collected list of findings. */
    public ScanReport reportFrom(List<Finding> findings) {
        List<Finding> sorted = new ArrayList<>(findings);
        sorted.sort(Comparator.comparingInt(f -> f.severity().ordinal()));
        int score = computeScore(sorted);
        String grade = grade(score);
        String summary = summarise(sorted, grade);
        return new ScanReport(score, grade, summary, sorted);
    }

    public ScanReport scan(String code) {
        return reportFrom(detect(code));
    }

    private int computeScore(List<Finding> findings) {
        int score = 100;
        for (Finding f : findings) {
            score -= f.severity().weight();
        }
        return Math.max(0, score);
    }

    private String grade(int score) {
        if (score >= 90) return "A";
        if (score >= 75) return "B";
        if (score >= 60) return "C";
        if (score >= 40) return "D";
        return "F";
    }

    private String summarise(List<Finding> findings, String grade) {
        if (findings.isEmpty()) {
            return "No known issues found. Grade " + grade + ".";
        }
        long high = findings.stream().filter(f -> f.severity() == Severity.HIGH).count();
        long medium = findings.stream().filter(f -> f.severity() == Severity.MEDIUM).count();
        long low = findings.stream().filter(f -> f.severity() == Severity.LOW).count();
        return "Grade " + grade + " \u2014 found " + findings.size() + " issue(s): "
                + high + " high, " + medium + " medium, " + low + " low.";
    }
}
