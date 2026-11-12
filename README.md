# ALGIONS ACADEMY

ALGIONS is a responsive school operations workspace for administrators, teachers, and guardians. The application now runs as a React client plus a Node/Express API backed by SQLite, with server-side sessions, RBAC, database constraints, transactions, and seeded demo data.

## Local setup

Run these commands from either `E:\School Management System` or
`E:\School Management System\my-elsewhere-app`. The workspace root forwards
commands to the application folder.

```bash
npm install
npm run db:seed
npm start
# open http://localhost:3000
```

The browser client calls the API at `http://localhost:3001` during local
development. Keep the API process running alongside the React process. If a
previous development server is already using port 3000, stop that specific
process and restart `npm start` so the latest client bundle is loaded.

## Deployment

Deploy the React app and Express API as separate services when using Netlify
and Render, or deploy both together on Netlify using the included Function
wrapper:

- For the Netlify-only setup, keep `REACT_APP_API_URL` unset. The included
  `netlify.toml` rewrites `/api/*` to the Express Netlify Function. Set
  `SESSION_SECRET` and `NODE_ENV=production` in Netlify environment variables,
  then trigger a new deploy.
- For the separate-service setup, run the API on Render with `npm run server`
  and set `NODE_ENV=production`, `SESSION_SECRET`, and `DATABASE_PATH`. On
  Netlify, set `REACT_APP_API_URL` to the complete Render API URL ending in
  `/api`, for example `https://your-api.onrender.com/api`, then trigger a new
  deploy. React environment variables are embedded during the build.
- On Render, set `FRONTEND_URL` to the exact Netlify site URL and redeploy the
  API. Production sessions use secure cross-site cookies, so the frontend must
  use HTTPS.

The demo accounts are shown on the landing page and can be filled with one click:

| Role | Email | Password |
|---|---|---|
| Admin | admin@algions.edu | Admin@123 |
| Teacher | teacher@algions.edu | Teacher@123 |
| Guardian | guardian@algions.edu | Guardian@123 |

## Architecture

- `src/App.tsx`: accessible landing page, authentication modal, and role portals.
- `server/db.js`: SQLite schema, foreign keys, indexes, composite uniqueness, migrations-on-start, and deterministic seed data.
- `server/index.js`: Express API controllers, JWT HTTP-only cookie sessions, RBAC middleware, and transactional payment handling.
- `src/lib/database.ts`: typed client API adapter with a local fallback for unit tests.
- `src/components/ui/elsewhere-hero.tsx`: preserved full-bleed hero presentation.
- `scripts/seed.js`: repeatable `npm run db:seed` seed entrypoint.
- `docs/ER_DIAGRAM.md`, `docs/API_SPEC.md`, and `docs/TECHNICAL_REPORT.md`: persistence, API, and security design contracts.

For production, set `DATABASE_PATH` and `SESSION_SECRET` from `.env.example`, replace the SQLite adapter with a managed PostgreSQL/Prisma deployment if required, terminate TLS at the edge, and use a secrets manager. Every service method is enforced server-side; UI controls are not the authorization boundary.

## Commands

```bash
npm run db:seed
npm test
npm run test:api
npm run build
```

## Known limitations

The current UI still has a focused subset of the full commercial CRUD surface. A production deployment should add managed PostgreSQL, Prisma migrations, CSRF protection for non-SameSite deployments, rate limiting, email delivery, observability, backups, and object storage for report-card PDFs. Simulated payments intentionally do not contact a payment provider.
