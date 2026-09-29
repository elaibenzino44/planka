# Base44 dev environment notes (PLANKA)

- Run: `docker compose -f docker-compose.base44.yml up -d --build`. Services: `postgres`, `planka-server` (Sails, nodemon, port 1337 internal only), `planka-client` (Vite dev server, host port 3000).
- Single origin: the browser only talks to Vite on :3000; Vite proxies `/api` and `/socket.io` to `planka-server` via `PROXY_TARGET`.
- The server's `/` renders `views/index.ejs` (gitignored, produced by a production client build). Without it every non-API GET 500s ("Could not render view index"), so the Base44 compose writes a stub on startup when it's missing. The healthcheck hits `/api/config` (401 = healthy).
- First server boot is slow (~2-4 min): `npm ci` plus `postinstall` builds a Python venv (Apprise) into the `server-venv` volume. `npm run db:init` runs migrations + seeds on every start (idempotent).
- node_modules / .venv live in named volumes, not in the repo. Build image = `Dockerfile.dev` (node:24-alpine + bash/python/build tools, no source baked in).
- Demo admin (from `.env.base44-defaults`): `demo` / `demo`. First login shows a terms-acceptance step.
- `SECRET_KEY` comes from `/run/base44/app.env` (dev placeholder generated). SMTP/S3/OIDC are optional and not configured.
- Verify: `curl -s localhost:3000/` returns Vite HTML; `curl -X POST localhost:3000/api/access-tokens -H 'Content-Type: application/json' -d '{"emailOrUsername":"demo","password":"demo"}'` returns a (pending) token.
- Tests: `npm test` in `server/` (mocha) and `client/`.
