# Contributing to SpringGuard

Thanks for your interest! SpringGuard is built to be easy to extend. This guide covers how the
scanner works, how to add a new detection rule, and — importantly — **how to extend it beyond
Spring Boot to other Java frameworks and languages** (Quarkus, Jakarta EE, JSP, Struts, etc.).

Running locally is the best way to develop (the free-tier demo is slow). See `README.md` for
setup.

---

## How the scanner works (the short version)

A scan has up to three layers:

1. **Input classification** — `core/InputClassifier.java` checks the pasted text looks like
   Java/Spring code so SpringGuard doesn't return a misleading "clean" grade on random text.
2. **Rule engine** — `core/RuleEngine.java` runs every rule in `core/Rules.java` against the
   code. Each rule is a regex + metadata. Matches become `Finding`s; the engine scores them
   (HIGH/MEDIUM/LOW weights) into an A–F grade.
3. **AI review (optional)** — `core/AiReviewService.java` sends the code to an LLM for a second
   pass that catches context-dependent issues (e.g. IDOR) regex can't see. Advisory only; it
   doesn't change the rule grade.

Repo scanning (`github/`) fetches files and runs the same rule engine per file.

---

## Add a new detection rule (easiest contribution)

A rule is one entry in the `Rules.ALL` list in `core/Rules.java`:

```java
new SecurityRule(
    "unique-id",                      // stable id, kebab-case
    Severity.HIGH,                    // HIGH | MEDIUM | LOW
    "Short human title",              // shown as the finding title
    "Why this is risky, in plain language for a non-expert.",
    "How to fix it, concretely.",
    Pattern.compile("your-regex-here", Pattern.CASE_INSENSITIVE)
),
```

Guidelines:
- **Keep `why`/`fix` plain-language.** The whole point is that a junior dev understands it.
- **Avoid false positives.** Test your regex against real code that *should* and *should not*
  match. A noisy rule is worse than no rule.
- **Pick severity honestly** — HIGH = exploitable/serious, MEDIUM = risky default, LOW =
  hygiene.
- Add the rule, run locally, paste sample code that should trip it, and confirm it appears and
  the grade moves as expected.

That's it — no other file needs to change to add a rule.

---

## Extend SpringGuard to other Java frameworks / languages

Out of the box the rules target **Spring Boot**. The architecture, though, is framework-neutral
— a rule is just "regex + explanation," and nothing is hardwired to Spring. Here's how to make
it understand Quarkus, Jakarta EE, JSP, Struts, Micronaut, plain servlets, etc.

### Step 1 — Let the classifier recognise the framework
`core/InputClassifier.java` has a `MARKERS` array of tokens that say "this is Java/Spring." Add
markers for the framework you're targeting so its code isn't rejected as "not Spring/Java." For
example:
- **Quarkus:** `io.quarkus`, `@path`, `@applicationscoped`, `quarkus.`
- **Jakarta EE / servlets:** `javax.servlet`, `jakarta.servlet`, `@webservlet`, `httpservletrequest`
- **JSP:** `<%@ page`, `<%`, `jsp:`, `taglib`
- **Struts:** `org.apache.struts`, `actionsupport`, `struts.xml`, `<action `

### Step 2 — Add a rule pack for that framework
Add framework-specific checks to `Rules.ALL` (or, better, create a new file like
`RulesQuarkus.java` that exposes its own `List<SecurityRule>` and have `Rules.ALL` concatenate
the packs). Some starter ideas per framework:

- **JSP / servlets (classic XSS & friends):**
  - Unescaped output: `<%= ... %>` or `out.print(request.getParameter(...))` → reflected XSS.
  - `response.getWriter().print(request.getParameter(...))` without encoding.
  - Disabled `HttpOnly`/`Secure` cookie flags.
- **Struts:**
  - Known dangerous patterns like OGNL expression evaluation on user input
    (the class of issue behind several historical Struts CVEs).
  - `<action>` mappings without input validation.
- **Quarkus / Jakarta REST (JAX-RS):**
  - `@PermitAll` on resources that should be restricted.
  - Missing `@RolesAllowed` / `@Authenticated` on sensitive endpoints.
  - CORS set to `*` in `application.properties` (`quarkus.http.cors.origins=*`).
- **General Java (language-level, framework-agnostic):**
  - SQL built with string concatenation (`"SELECT ... " + userInput`) → SQL injection.
  - `Runtime.getRuntime().exec(...)` on untrusted input → command injection.
  - `ObjectInputStream.readObject()` on untrusted data → insecure deserialization.
  - Weak crypto: `MD5`, `DES`, `ECB`, `Random` used for tokens.
  - Hardcoded credentials/secrets in source.

### Step 3 — (Recommended) make rule packs selectable
For a clean design, group rules by framework and let the engine run the relevant pack(s).
A simple approach: keep `Rules.ALL` for the cross-cutting Java rules, add `Rules.SPRING`,
`Rules.JSP`, `Rules.STRUTS`, etc., and either run all packs (simplest) or detect the framework
from the classifier markers and run the matching pack plus the general Java pack.

### Step 4 — Repo scanning already helps you
The GitHub scanner (`github/GitHubClient.java`) already pulls `.java`, `.properties`, `.yml`,
`.yaml` files. To scan JSP/XML config (e.g. `struts.xml`, `web.xml`, `.jsp`), extend the file
extension filter in `listRelevantFiles` to include those types.

### Step 5 — The AI pass is already framework-agnostic
`AiReviewService` just sends code to an LLM and asks for security issues — it isn't Spring-
specific, so it already provides useful review for other frameworks. You can tune its prompt to
mention the target framework for sharper results.

**In short:** add classifier markers → add a rule pack → (optionally) widen the repo file
filter. The rule format, scoring, grading, reports, and AI layers all work unchanged.

---

## Pull request checklist

- [ ] Ran locally and tested the change against real sample code.
- [ ] New rules: verified no obvious false positives, plain-language `why`/`fix`, sensible
      severity, unique id.
- [ ] No secrets committed (keys, DB passwords). Config stays in env vars.
- [ ] Kept user-facing copy beginner-friendly.

Open an issue first if you're planning something big (e.g. a whole new framework pack) so we
can align on structure.

Thank you for contributing!
