package com.springguard.model;

/** What the client sends in: the Spring Boot code/config to audit. */
public class ScanRequest {
    public String code;

    public ScanRequest() {}
    public ScanRequest(String code) { this.code = code; }

    public String code() { return code; }
}
