package com.springguard.core;

import com.springguard.model.Severity;

import java.util.regex.Pattern;

/**
 * A single detection rule. If {@code pattern} matches the submitted code,
 * a Finding is raised with the given metadata.
 */
public final class SecurityRule {
    private final String id;
    private final Severity severity;
    private final String title;
    private final String why;
    private final String fix;
    private final Pattern pattern;

    public SecurityRule(String id, Severity severity, String title, String why, String fix, Pattern pattern) {
        this.id = id;
        this.severity = severity;
        this.title = title;
        this.why = why;
        this.fix = fix;
        this.pattern = pattern;
    }

    public String id() { return id; }
    public Severity severity() { return severity; }
    public String title() { return title; }
    public String why() { return why; }
    public String fix() { return fix; }
    public Pattern pattern() { return pattern; }

    public boolean matches(String code) {
        return pattern.matcher(code).find();
    }
}
