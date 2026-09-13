# SpringGuard

A security auditor for Java / Spring Boot code. Paste a file or point it at a GitHub
repository and get an A–F security grade, plain-language findings from a 21-rule
deterministic engine, an optional AI review pass for context-sensitive issues, and
AI-generated fixes with a before/after diff.

- **Live app:** https://springguard-frontend.vercel.app
- **Live API:** https://springguard-backend.onrender.com

> The live demo runs on free tiers and sleeps when idle, so the first request after a
> quiet period can take ~30–60s to wake up. Running locally is faster and is the
> recommended way to develop.

This is a monorepo combining what were previously two separate repositories
(`springguard-backend` and `springguard-frontend`); full commit history from both was
preserved during the merge.

## Structure

```
backend/    Spring Boot 3 API — rule engine, AI review/fix, auth, scan history
frontend/   React + TypeScript (Vite) UI
```

Each has its own README with full setup instructions:

- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)

## How it works

1. **Rule engine (21 rules):** deterministic static-analysis checks for common Spring
   Boot security issues (e.g. disabled CSRF protection, permissive CORS, hardcoded
   secrets, missing `@PreAuthorize`, SQL built via string concatenation, weak password
   encoding). Every finding maps to a severity and contributes to an A–F grade.
2. **AI review pass (optional):** when an LLM API key is configured, an additional pass
   looks for context-sensitive issues the rule engine can't express as a fixed pattern,
   and can propose a rewritten, fixed version of a flagged file with a diff view.
3. **Two scan modes:** paste a single file, or point at a GitHub repository (with an
   optional branch and optional read-only token for private repos / higher rate limits).
4. **Accounts:** JWT-based sign-in to save scans to history and revisit them later.

## Tech stack

**Backend** — Java 17, Spring Boot 3.3.5, Spring Security, Spring Data JPA/Hibernate,
PostgreSQL, JWT auth, GitHub REST API integration, optional OpenAI-compatible LLM
endpoint for AI review/fix.

**Frontend** — React 18, TypeScript, Vite, dependency-free diff viewer and ZIP export.

**Deployment** — Backend on Render (Docker), frontend on Vercel, both building from
their respective subfolder in this monorepo.

## Running locally

Both services need to run together for the full app to work:

```bash
# Terminal 1 — backend (see backend/README.md for required env vars)
cd backend
mvn clean spring-boot:run

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` to `http://localhost:8080` by default, so no
extra configuration is needed for local development.

## Contributing

See [backend/CONTRIBUTING.md](backend/CONTRIBUTING.md) for how the rule engine works,
how to add new rules, and how to extend SpringGuard to other Java frameworks. Frontend
contributions (accessibility, mobile polish, new report views) are also welcome.

## License

MIT — use it, learn from it, build on it.
