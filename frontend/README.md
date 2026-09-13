# SpringGuard — Frontend

React + TypeScript (Vite) UI for SpringGuard, a security auditor for Java / Spring Boot code.
Paste a file or point it at a GitHub repo to get an A–F security grade with plain-language
findings, an AI review, downloadable reports, saved history, and AI auto-fix with a
before/after diff.

- **Live app:** https://springguard-frontend.vercel.app
- **Backend repo:** https://github.com/NehaKhann/springguard-backend

> Heads-up: the live demo's backend runs on a free tier and sleeps when idle, so the first
> scan can take ~30–60s to wake up. **Running locally is much faster** and is the recommended
> way to develop or contribute.

---

## Tech stack

- React 18 + TypeScript
- Vite (dev server + build)
- No UI framework dependency for the diff/zip — both are dependency-free helpers
  (`DiffView.tsx`, `zip.ts`)

---

## Prerequisites

- **Node.js 18+** and npm (`node -v`)
- The **backend running** (locally on `:8080`, or a deployed URL). See the backend repo's
  README to start it.

---

## 1. Install

```bash
npm install
```

## 2. Point it at the backend

There are two ways the frontend finds the API:

- **Local dev (default, easiest):** the Vite dev server proxies `/api` → `http://localhost:8080`
  (see `vite.config.ts`). So if your backend runs locally on 8080, **you don't need to
  configure anything** — just run the dev server.

- **A remote/deployed backend:** create a `.env` file in the project root:
  ```
  VITE_API_BASE=https://your-backend-url.onrender.com
  ```
  When `VITE_API_BASE` is set, the app calls that URL directly. When it's empty (default), it
  uses the `/api` proxy above.

## 3. Run

```bash
npm run dev
```
Open the URL it prints (usually `http://localhost:5173`).

To build for production:
```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

---

## Using the app

1. **Landing screen** — sign in / create an account, or **Continue without signing in**.
2. **Paste code** — paste a Spring Boot file → **Scan for vulnerabilities** → grade + findings
   + AI review. Then **Fix with AI** → review the diff → **Apply** / **Copy**.
3. **GitHub repo** — enter a repo URL (optional branch, optional read-only token for private
   repos / higher rate limit) → scan. Then **Fix with AI** generates a suggested fix per
   flagged file; review each diff, **Accept** the ones you want, and **Download accepted as
   ZIP**.
4. **Signed in?** Save scans to history, reopen them, and delete them.

Reports can be downloaded as Markdown or plain text.

---

## Project layout

```
src/
  App.tsx          main app: scan modes, report, history, AI fix flows
  Landing.tsx      sign-in / sign-up gate
  AuthPanel.tsx    login / register form
  HistoryPanel.tsx saved-scan list
  DiffView.tsx     dependency-free before/after line diff
  zip.ts           dependency-free ZIP builder (for "download fixes")
  api.ts           all backend calls (uses VITE_API_BASE or /api proxy)
  types.ts         shared types
  styles.css       dark security-themed design system
```

---

## Deployment

The hosted app is on **Vercel**. Set `VITE_API_BASE` to your backend URL in the Vercel project
settings (Environment Variables) so the deployed frontend talks to the deployed backend.

## Contributing

Contributions welcome — see the backend repo's `CONTRIBUTING.md` for how the scanning works,
how to add rules, and how to extend SpringGuard to other Java frameworks. Frontend help
(accessibility, mobile polish, new report views, severity filtering) is very welcome too.

## License

MIT.
