# SpringGuard — Backend

A Spring Boot service that scans Java / Spring Boot code for security issues and grades it
A–F. It combines a deterministic rule engine (21 rules) with an optional AI review pass, can
scan a pasted file or a whole GitHub repository, supports user accounts with saved scan
history, and can propose AI fixes for flagged files.

- **Live API:** https://springguard-backend.onrender.com
- **Frontend repo:** https://github.com/NehaKhann/springguard-frontend

> Heads-up: the live demo runs on a free tier and sleeps when idle, so the first request after
> a quiet period can take ~30–60s to wake up. **Running locally is much faster** and is the
> recommended way to develop or contribute.

---

## Tech stack

- Java 17, Spring Boot 3.3.5 (Maven)
- Spring Security + JWT (jjwt) + BCrypt
- Spring Data JPA / Hibernate
- PostgreSQL (any instance; the hosted demo uses [Neon](https://neon.tech))
- An OpenAI-compatible LLM endpoint for the optional AI review / fix (the demo uses Groq)

---

## Prerequisites

- **JDK 17** (`java -version` should report 17)
- **Maven** (or use the bundled `mvnw` if present)
- A **PostgreSQL database** — a free [Neon](https://neon.tech) project works great
- *(Optional)* an **LLM API key** for the AI review/fix features (e.g. a free
  [Groq](https://console.groq.com) key). Without it, the app runs fine — the AI pass is simply
  skipped and only the rule engine is used.

---

## 1. Get a database (Neon, free)

1. Create an account at https://neon.tech and create a new project.
2. Open the project's **Connection Details** and copy the connection info. You need:
   - host (e.g. `ep-xxxx-xxxx.region.aws.neon.tech`)
   - database name (e.g. `neondb`)
   - user (e.g. `neondb_owner`)
   - password
3. Build a JDBC URL in this form (note `sslmode=require`, which Neon needs):
   ```
   jdbc:postgresql://<host>/<database>?sslmode=require
   ```

You do **not** need to create any tables — JPA creates/updates them on startup
(`spring.jpa.hibernate.ddl-auto=update`).

> Any PostgreSQL works (local Docker, Supabase, RDS, etc.) — Neon is just an easy free option.

---

## 2. (Optional) Get an AI key

The AI review and AI fix use an OpenAI-compatible chat-completions endpoint.
The demo uses **Groq** because it has a generous free tier:

1. Sign up at https://console.groq.com and create an API key.
2. The defaults already point at Groq (`https://api.groq.com/openai/v1`,
   model `llama-3.3-70b-versatile`). You can override the base URL/model with env vars if you
   want to use a different OpenAI-compatible provider.

If you skip this, leave `GROQ_API_KEY` unset — the rule engine still works; the AI card and
the "Fix with AI" features simply won't run.

---

## 3. Configuration (environment variables)

The app reads everything from environment variables — **no secrets are hardcoded**. See
`src/main/resources/application.properties`.

| Variable        | Required | Example / default                                              | Purpose |
|-----------------|----------|----------------------------------------------------------------|---------|
| `DB_URL`        | yes      | `jdbc:postgresql://<host>/neondb?sslmode=require`              | JDBC URL |
| `DB_USER`       | yes      | `neondb_owner`                                                 | DB user |
| `DB_PASSWORD`   | yes      | `your-db-password`                                             | DB password |
| `JWT_SECRET`    | yes*     | a long random string                                           | Signs JWTs. *Has a dev default, but always set your own. |
| `GROQ_API_KEY`  | no       | `gsk_...`                                                      | Enables the AI review/fix. Omit to disable AI. |
| `GROQ_MODEL`    | no       | `llama-3.3-70b-versatile`                                      | Override the model. |
| `GROQ_BASE_URL` | no       | `https://api.groq.com/openai/v1`                               | Override the OpenAI-compatible endpoint. |
| `PORT`          | no       | `8080`                                                         | Server port. |

> Generate a JWT secret quickly: `openssl rand -base64 48` (or any long random string).

---

## 4. Run it locally

### Windows (PowerShell)

```powershell
# from the project root
$env:DB_URL="jdbc:postgresql://<host>/neondb?sslmode=require"
$env:DB_USER="neondb_owner"
$env:DB_PASSWORD="your-db-password"
$env:JWT_SECRET="a-long-random-secret"
$env:GROQ_API_KEY="gsk_..."   # optional; omit to disable AI

mvn clean spring-boot:run
```

### macOS / Linux (bash)

```bash
export DB_URL="jdbc:postgresql://<host>/neondb?sslmode=require"
export DB_USER="neondb_owner"
export DB_PASSWORD="your-db-password"
export JWT_SECRET="a-long-random-secret"
export GROQ_API_KEY="gsk_..."   # optional

mvn clean spring-boot:run
```

When you see `Started SpringGuardApplication`, it's up on `http://localhost:8080`.

Quick check:
```bash
curl http://localhost:8080/api/health
```

> Tip: if port 8080 is busy, stop the other process (Windows:
> `netstat -ano | findstr :8080` then `taskkill /PID <pid> /F`) or set `PORT`.
> Always use `mvn clean ...` after pulling changes to avoid stale compiled classes.

---

## API overview

| Method | Path                  | Auth | Purpose |
|--------|-----------------------|------|---------|
| GET    | `/api/health`         | no   | Health check |
| POST   | `/api/scan`           | no   | Scan pasted code → grade + findings (+ AI review if enabled) |
| POST   | `/api/scan-repo`      | no   | Scan a GitHub repo (URL, optional branch, optional token) |
| POST   | `/api/fix`            | no   | AI-rewrite pasted code with fixes |
| POST   | `/api/fix-repo-file`  | no   | AI-rewrite a single repo file with fixes |
| POST   | `/api/auth/register`  | no   | Create an account → JWT |
| POST   | `/api/auth/login`     | no   | Log in → JWT |
| POST   | `/api/scans`          | JWT  | Save a scan to history |
| GET    | `/api/scans`          | JWT  | List saved scans |
| DELETE | `/api/scans/{id}`     | JWT  | Delete a saved scan |

GitHub repo scans: public repos need no token. A token (Contents: read-only) is optional and
**never stored or logged** — it's used only for that one request, and it raises GitHub's rate
limit from 60 to 5,000 requests/hour.

---

## Project layout

```
src/main/java/com/springguard/
  core/      RuleEngine, Rules (21 detection rules), ScanService, AiReviewService, InputClassifier
  github/    GitHubClient (repo/branch/file fetch), RepoScanService
  web/       ScanController, RepoScanController, FixController (+ request/response records)
  auth/      register/login, JWT issuing
  security/  SecurityConfig, JwtService, JwtAuthFilter
  history/   save/list/delete saved scans
  model/     Finding, ScanReport, RepoScanReport, entities (User, ScanRecord)
  repo/      JPA repositories
```

See `CONTRIBUTING.md` for how to add new rules and how to extend SpringGuard to other Java
frameworks (Quarkus, JSP, Struts, etc.).

---

## Deployment (free tier)

The hosted demo runs on **Render** (backend) with a **Neon** database. A `Dockerfile` is
included (multi-stage Maven build → JRE 17). Set the same environment variables above in your
host's dashboard. The frontend is a separate repo deployed on Vercel.

## License

MIT — use it, learn from it, build on it.
