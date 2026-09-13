package com.springguard.model;

/** One detected security issue. source = "RULE"|"AI"; file = repo path (null for single-file scans). */
public final class Finding {
    public final String id;
    public final Severity severity;
    public final String title;
    public final String why;
    public final String fix;
    public final String source;
    public final String file;

    public Finding(String id, Severity severity, String title, String why, String fix) {
        this(id, severity, title, why, fix, "RULE", null);
    }

    public Finding(String id, Severity severity, String title, String why, String fix, String source) {
        this(id, severity, title, why, fix, source, null);
    }

    public Finding(String id, Severity severity, String title, String why, String fix, String source, String file) {
        this.id = id;
        this.severity = severity;
        this.title = title;
        this.why = why;
        this.fix = fix;
        this.source = source;
        this.file = file;
    }

    /** Return a copy of this finding tagged with a repo file path. */
    public Finding withFile(String filePath) {
        return new Finding(id, severity, title, why, fix, source, filePath);
    }

    public String id() { return id; }
    public Severity severity() { return severity; }
    public String title() { return title; }
    public String why() { return why; }
    public String fix() { return fix; }
    public String source() { return source; }
    public String file() { return file; }
}
