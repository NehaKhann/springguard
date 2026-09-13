package com.springguard.core;

import com.springguard.model.Severity;

import java.util.List;
import java.util.regex.Pattern;

/**
 * The catalog of Spring Boot security checks. Each rule looks for a known
 * misconfiguration and carries its own plain-language explanation + fix.
 *
 * Adding a new check = adding one entry here. (Future: per-language packs + an AI second pass.)
 */
public final class Rules {

    private static final int FLAGS = Pattern.CASE_INSENSITIVE;

    public static final List<SecurityRule> ALL = List.of(

            new SecurityRule("csrf-disabled", Severity.HIGH,
                    "CSRF protection is disabled",
                    "Turning off CSRF lets an attacker trick a logged-in user's browser into making unwanted state-changing requests (cross-site request forgery).",
                    "Only disable CSRF for stateless APIs that use tokens. For session-based apps, leave it on. If you truly need it off, scope it narrowly instead of globally.",
                    Pattern.compile("csrf\\s*\\(\\s*\\)\\s*\\.\\s*disable|csrf\\s*\\(\\s*[a-z]+\\s*->\\s*[a-z]+\\s*\\.\\s*disable", FLAGS)),

            new SecurityRule("permit-all", Severity.HIGH,
                    "All requests are permitted without authentication",
                    "anyRequest().permitAll() leaves every endpoint open to the public, including ones that should require a logged-in user.",
                    "Require authentication by default: .anyRequest().authenticated() and only permitAll() the specific public paths (login, health, static assets).",
                    Pattern.compile("anyRequest\\s*\\(\\s*\\)\\s*\\.\\s*permitAll", FLAGS)),

            new SecurityRule("wildcard-cors", Severity.MEDIUM,
                    "CORS allows any origin (*)",
                    "Allowing all origins lets any website call your API from a user's browser, which can expose data or enable abuse.",
                    "List the specific front-end origins you trust, e.g. allowedOrigins(\"https://yourapp.com\") instead of \"*\".",
                    Pattern.compile("@CrossOrigin\\s*\\(\\s*origins\\s*=\\s*\"\\*\"|allowedOrigins\\s*\\(\\s*\"\\*\"", FLAGS)),

            new SecurityRule("empty-crossorigin", Severity.MEDIUM,
                    "@CrossOrigin with no origins allows any site",
                    "@CrossOrigin() with no settings defaults to allowing requests from any origin.",
                    "Name the trusted origins explicitly, e.g. @CrossOrigin(origins = \"https://yourapp.com\").",
                    Pattern.compile("@CrossOrigin\\s*\\(\\s*\\)", FLAGS)),

            new SecurityRule("actuator-exposed", Severity.HIGH,
                    "All actuator endpoints are exposed",
                    "Exposing every actuator endpoint can leak environment variables, configuration, and internal metrics, and some endpoints can change app state.",
                    "Expose only what you need, e.g. management.endpoints.web.exposure.include=health,info and secure the rest behind authentication.",
                    Pattern.compile("management\\.endpoints\\.web\\.exposure\\.include\\s*=\\s*\\*", FLAGS)),

            new SecurityRule("health-details-always", Severity.MEDIUM,
                    "Health endpoint shows full details to everyone",
                    "show-details=always reveals internal components and their status to any caller, which helps an attacker map your system.",
                    "Use management.endpoint.health.show-details=when-authorized (or never).",
                    Pattern.compile("management\\.endpoint\\.health\\.show-details\\s*=\\s*always", FLAGS)),

            new SecurityRule("hardcoded-db-password", Severity.HIGH,
                    "Database password is hardcoded in properties",
                    "A password committed in application.properties ends up in source control where anyone with repo access can read it.",
                    "Move it to an environment variable or a secrets manager: spring.datasource.password=${DB_PASSWORD}.",
                    Pattern.compile("spring\\.datasource\\.password\\s*=\\s*(?!\\$\\{)\\S+", FLAGS)),

            new SecurityRule("hardcoded-secret", Severity.HIGH,
                    "An API key or secret is hardcoded",
                    "A secret written into code or config is exposed to anyone who can read the source or its history.",
                    "Move it to an environment variable or secrets manager and reference it, e.g. ${API_KEY}.",
                    Pattern.compile("(api[_.-]?key|client[_.-]?secret|access[_.-]?key)\\s*[=:]\\s*(?!\\$\\{)\\S{6,}", FLAGS)),

            new SecurityRule("hardcoded-credential", Severity.HIGH,
                    "A password is hardcoded in source",
                    "A password written directly in the code is visible to anyone who can read the file or its git history.",
                    "Load it from an environment variable or secrets manager instead of hardcoding it.",
                    Pattern.compile("(password|passwd|pwd)\\s*=\\s*\"[^\"]+\"", FLAGS)),

            new SecurityRule("weak-jwt-secret", Severity.HIGH,
                    "JWT signing secret is weak or hardcoded",
                    "A short or obvious signing secret (like \"secret\") can be brute-forced, letting an attacker forge valid tokens and impersonate any user.",
                    "Use a long, random secret supplied via environment variable: jwt.secret=${JWT_SECRET} (256-bit / 32+ chars).",
                    Pattern.compile("jwt\\.secret\\s*=\\s*(?!\\$\\{)(secret|password|changeme|123\\S*|.{1,15})\\s*$", FLAGS | Pattern.MULTILINE)),

            new SecurityRule("jwt-no-expiration", Severity.MEDIUM,
                    "JWT tokens do not expire",
                    "A token with no expiry stays valid forever, so a leaked token can never be aged out and keeps working indefinitely.",
                    "Set a sensible lifetime, e.g. jwt.expiration=3600000 (1 hour) and use refresh tokens for longer sessions.",
                    Pattern.compile("jwt\\.expiration\\s*=\\s*0\\b", FLAGS)),

            new SecurityRule("noop-password-encoder", Severity.HIGH,
                    "Passwords are stored without hashing",
                    "NoOpPasswordEncoder keeps passwords as plain text, so a database leak exposes every user's password directly.",
                    "Use BCryptPasswordEncoder (or Argon2) so passwords are securely hashed.",
                    Pattern.compile("NoOpPasswordEncoder", FLAGS)),

            new SecurityRule("weak-hashing", Severity.MEDIUM,
                    "A broken hash algorithm is used (MD5 / SHA-1)",
                    "MD5 and SHA-1 are broken for security use and can be collided or brute-forced.",
                    "Use SHA-256 or stronger for hashing, and BCrypt/Argon2 specifically for passwords.",
                    Pattern.compile("MessageDigest\\.getInstance\\s*\\(\\s*\"(MD5|SHA-1|SHA1)\"", FLAGS)),

            new SecurityRule("sql-injection-concat", Severity.HIGH,
                    "SQL is built by string concatenation",
                    "Concatenating user input into a query string allows SQL injection, letting an attacker read or modify the database.",
                    "Use parameterized queries / bind parameters (setParameter, ? placeholders) instead of building SQL with \"+\".",
                    Pattern.compile("(createQuery|createNativeQuery|executeQuery|executeUpdate|prepareStatement)\\s*\\(\\s*\"[^\"]*\"\\s*\\+", FLAGS)),

            new SecurityRule("command-injection", Severity.HIGH,
                    "External input may reach a system command",
                    "Passing untrusted input to Runtime.exec or ProcessBuilder can let an attacker run arbitrary commands on the server.",
                    "Avoid invoking the shell with user input; use safe APIs and validate/allow-list any arguments.",
                    Pattern.compile("Runtime\\.getRuntime\\(\\)\\.exec\\s*\\(|new\\s+ProcessBuilder\\s*\\(", FLAGS)),

            new SecurityRule("insecure-deserialization", Severity.MEDIUM,
                    "Java native deserialization is used",
                    "Deserializing untrusted data with ObjectInputStream can lead to remote code execution.",
                    "Avoid Java native deserialization of untrusted input; prefer a safe format like JSON with a vetted library.",
                    Pattern.compile("new\\s+ObjectInputStream\\s*\\(", FLAGS)),

            new SecurityRule("open-redirect", Severity.MEDIUM,
                    "Redirect target comes straight from user input",
                    "Redirecting to a URL taken directly from a request parameter enables open-redirect phishing.",
                    "Validate the target against an allow-list of known-safe paths before redirecting.",
                    Pattern.compile("sendRedirect\\s*\\([^)]*getParameter", FLAGS)),

            new SecurityRule("h2-console-enabled", Severity.MEDIUM,
                    "H2 database console is enabled",
                    "An exposed H2 console can let an attacker run SQL or browse data, especially if reachable in production.",
                    "Disable it in production (spring.h2.console.enabled=false) or restrict access tightly.",
                    Pattern.compile("spring\\.h2\\.console\\.enabled\\s*=\\s*true", FLAGS)),

            new SecurityRule("leaking-exception", Severity.MEDIUM,
                    "Internal error details are exposed to clients",
                    "Returning raw exception messages or stack traces can reveal class names, queries, and paths that help an attacker map your system.",
                    "Log the detail server-side and return a generic message. Use @ControllerAdvice to map exceptions to safe responses.",
                    Pattern.compile("printStackTrace\\s*\\(|throw\\s+new\\s+\\w*Exception\\s*\\(\\s*e\\.getMessage\\s*\\(\\s*\\)", FLAGS)),

            new SecurityRule("show-sql", Severity.LOW,
                    "SQL logging is enabled",
                    "Logging all SQL can leak schema and data details and clutter production logs.",
                    "Turn off show-sql in production: spring.jpa.show-sql=false.",
                    Pattern.compile("spring\\.jpa\\.show-sql\\s*=\\s*true", FLAGS)),

            new SecurityRule("pii-in-logs", Severity.MEDIUM,
                    "Personal data may be written to logs",
                    "Logging emails, phone numbers, or passwords stores personal data in plain text, which conflicts with PDPL/GDPR data-minimisation and security duties.",
                    "Avoid logging personal fields. Mask or omit them, e.g. log a user id instead of an email, and never log credentials.",
                    Pattern.compile("log(ger)?\\.(info|debug|warn|error)\\s*\\([^)]*(password|email|phone|iqama|nationalId)", FLAGS))
    );

    private Rules() {}
}
