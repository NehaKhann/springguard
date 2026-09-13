# Deployment notes (post-monorepo-merge)

This repo used to be two separate repos (`springguard-backend`, `springguard-frontend`),
each deployed straight from its own repo root. Both services now need to be repointed at
this monorepo and told to build from a subfolder.

## Backend — Render

Render's "Root Directory" setting for an existing service can only be changed from the
dashboard (or by adopting the `render.yaml` blueprint in this repo, which is a bigger
change — repointing an existing service to a Blueprint sync). The straightforward path:

1. Open the `springguard-backend` service in the Render dashboard.
2. **Settings → Build & Deploy → Repository**: change the connected repo from
   `NehaKhann/springguard-backend` to `NehaKhann/springguard` (you may need to grant
   Render's GitHub App access to the new repo first, via GitHub → Settings →
   Applications → Render → Repository access).
3. **Settings → Build & Deploy → Root Directory**: set to `backend`.
4. Confirm the Dockerfile path resolves to `backend/Dockerfile` (default `./Dockerfile`
   relative to the root directory is correct — no change needed).
5. Environment variables (`DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`,
   `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_BASE_URL`) are unaffected by this move — they're
   stored on the service, not in the repo.
6. Trigger a manual deploy and watch the build logs.
7. Verify: `curl https://springguard-backend.onrender.com/api/health` (may take 30-60s
   on first hit if the free-tier instance was asleep).

`render.yaml` at the repo root documents the intended config for future infra-as-code
use, but changing the connected repo/root directory the first time is a dashboard step.

## Frontend — Vercel

This part *can* be done via the Vercel CLI once it's authenticated and the new repo is
accessible to Vercel's GitHub App:

```bash
cd frontend
vercel link --project springguard-frontend --yes
vercel git connect https://github.com/NehaKhann/springguard.git --yes
vercel project update springguard-frontend --root-directory frontend
```

If `vercel git connect` fails because Vercel's GitHub App isn't authorized for the new
`springguard` repo yet, authorize it first: GitHub → Settings → Applications → Vercel →
Repository access → add `springguard`. Then re-run the command.

After reconnecting, push to `main` (or trigger `vercel --prod` manually) and verify:
`https://springguard-frontend.vercel.app` loads and can reach the backend.

`VITE_API_BASE` (if set) is a project environment variable and is unaffected by the
repo/root-directory change.
