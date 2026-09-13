# Deployment notes (post-monorepo-merge)

This repo used to be two separate repos (`springguard-backend`, `springguard-frontend`),
each deployed straight from its own repo root. Both services have since been repointed
at this monorepo, building from a subfolder. This doc records how, for reference if you
ever need to redo it (a new environment, a disaster-recovery rebuild, etc.).

## Backend — Render

Render's "Root Directory" and connected-repo settings can be changed either from the
dashboard, or via the Render API (what was actually used here, with a personal API key
from Account Settings → API Keys):

```bash
curl -X PATCH -H "Authorization: Bearer $RENDER_KEY" -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/<service-id>" \
  -d '{"repo":"https://github.com/NehaKhann/springguard","branch":"main","rootDir":"backend"}'

curl -X PATCH -H "Authorization: Bearer $RENDER_KEY" -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/<service-id>" \
  -d '{"serviceDetails":{"healthCheckPath":"/api/health"}}'

curl -X POST -H "Authorization: Bearer $RENDER_KEY" -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/<service-id>/deploys" -d '{}'
```

Note: changing an env var (e.g. `PUT .../env-vars/<KEY>`) does **not** itself restart the
running instance — it takes effect only on the next deploy, so follow it with the
`/deploys` call above if you need it applied immediately.

Equivalent dashboard path, if you don't have an API key handy:

1. Open the service in the Render dashboard.
2. **Settings → Build & Deploy → Repository**: change the connected repo to
   `NehaKhann/springguard` (grant Render's GitHub App access to the new repo first if
   needed: GitHub → Settings → Applications → Render → Repository access).
3. **Settings → Build & Deploy → Root Directory**: set to `backend`.
4. Dockerfile path stays `./Dockerfile` (relative to the root directory — no change
   needed).
5. Environment variables are stored on the service, not the repo, so they carry over.
6. Trigger a manual deploy.
7. Verify: `curl https://springguard-backend.onrender.com/api/health` (may take 30-60s
   on first hit if the free-tier instance was asleep).

`render.yaml` at the repo root documents the intended config for Blueprint-based
infra-as-code, if you want to move off dashboard/API-managed settings later.

## Frontend — Vercel

Done via the Vercel CLI, once authenticated and the new repo was accessible to Vercel's
GitHub App (this worked without any extra GitHub App authorization step — the app
apparently had "all repositories" access already):

```bash
cd frontend
vercel link --project springguard-frontend --yes
vercel git connect https://github.com/NehaKhann/springguard.git --yes
vercel project update springguard-frontend --root-directory frontend
vercel --prod --yes   # run from the repo root, not frontend/, so root-directory applies correctly
```

If `vercel git connect` ever fails because Vercel's GitHub App isn't authorized for a
repo, authorize it first: GitHub → Settings → Applications → Vercel → Repository access.

`VITE_API_BASE` (if set) is a project environment variable and is unaffected by the
repo/root-directory change.

## Status

Both services are live and building from this monorepo as of the last deploy. Verify
anytime with:

```bash
curl https://springguard-backend.onrender.com/api/health
curl -I https://springguard-frontend.vercel.app
```
