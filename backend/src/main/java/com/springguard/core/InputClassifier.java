package com.springguard.core;

/**
 * Lightweight check for whether pasted text looks like Spring Boot / Java code or config.
 * Keeps SpringGuard honest: if it can't recognise the input as Spring/Java, it says so
 * instead of returning a misleading clean grade.
 */
public final class InputClassifier {

    // Tokens that strongly suggest Java or Spring Boot source / config.
    private static final String[] MARKERS = {
        "springframework", "@springbootapplication", "@restcontroller", "@controller",
        "@service", "@repository", "@configuration", "@bean", "@autowired",
        "@getmapping", "@postmapping", "@requestmapping", "@crossorigin", "@entity",
        "@override", "securityfilterchain", "httpsecurity", "http.csrf",
        "authorizehttprequests", ".permitall", "public class", "package ",
        "import java", "system.out.println",
        // common Spring property prefixes
        "spring.", "management.endpoints", "server.port", "logging.level",
        "jwt.", "datasource"
    };

    public static boolean looksLikeSpringOrJava(String code) {
        String c = code.toLowerCase();
        for (String m : MARKERS) {
            if (c.contains(m)) return true;
        }
        return false;
    }

    private InputClassifier() {}
}
