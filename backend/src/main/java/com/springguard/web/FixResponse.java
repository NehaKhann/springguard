package com.springguard.web;

/** status: OK | AI_OFF | ERROR. fixedCode is null unless OK. */
public record FixResponse(String status, String message, String fixedCode) {}
