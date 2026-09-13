package com.springguard.model;

/** How serious a finding is. The weight is subtracted from the security score. */
public enum Severity {
    HIGH(25),
    MEDIUM(12),
    LOW(5);

    private final int weight;

    Severity(int weight) {
        this.weight = weight;
    }

    public int weight() {
        return weight;
    }
}
