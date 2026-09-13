package com.springguard.core;

import com.springguard.model.Finding;
import com.springguard.model.ScanReport;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/** Validates input, runs the rule engine, then adds a best-effort AI review pass. */
@Service
public class ScanService {

    private static final int MAX_CHARS = 100_000;

    private final RuleEngine engine = new RuleEngine(Rules.ALL);
    private final AiReviewService aiReview;

    public ScanService(AiReviewService aiReview) {
        this.aiReview = aiReview;
    }

    public ScanReport scan(String code) {
        if (code == null || code.isBlank()) {
            return new ScanReport(0, "\u2014", "", List.of(),
                    "EMPTY", "Paste some Spring Boot code to scan.");
        }
        if (code.length() > MAX_CHARS) {
            return new ScanReport(0, "\u2014", "", List.of(),
                    "TOO_LARGE", "That's a lot of code. Paste a single config or controller file (under ~100k characters).");
        }
        if (!InputClassifier.looksLikeSpringOrJava(code)) {
            return new ScanReport(0, "\u2014", "", List.of(),
                    "NOT_SPRING", "This doesn't look like Spring Boot or Java code. SpringGuard is built specifically for Spring Boot projects.");
        }

        // Rule pass (deterministic) — sets the score and grade.
        ScanReport base = engine.scan(code);

        // AI pass (best-effort) — adds extra, clearly-labelled findings without changing the grade.
        List<Finding> aiFindings = aiReview.review(code);
        if (aiFindings.isEmpty()) {
            return base;
        }

        List<Finding> merged = new ArrayList<>(base.findings());
        merged.addAll(aiFindings);
        return new ScanReport(base.score(), base.grade(), base.summary(), merged, "ANALYZED", null);
    }
}
