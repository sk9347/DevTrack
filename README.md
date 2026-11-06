# DevTrack

A personal learning tracker: plan daily tasks, log real study time against habits, and see consistency over time.
Follows `DevTrack_Architecture_and_Implementation_Plan.pdf` (Next.js + NestJS + Prisma + PostgreSQL, pnpm monorepo).

## What is built

| Area | Status |
| --- | --- |
| Auth (register / login / logout, httpOnly cookie) | done |
| Habits (daily target minutes, days per week, archive) | done |
| Tasks per day (done state, minutes logged per task) | done |
| Study sessions (real duration, optional task link) | done |
| Daily track (`/analytics/day`), weekly + 30-day overview, streaks, heatmap | done |
| Goals, roadmaps, topics, notes, Docker/NGINX deploy, AI features | not yet (PDF phases 3, 6, 7) |

Rules from the plan that the code enforces: timestamps stored in UTC and bucketed into days in the user's timezone;
duration is recorded, not just a checkbox; a missed day never erases earlier work or the longest streak;
analytics are computed from stored sessions, never from counters.

## Run it

```bash
pnpm install
pnpm db:up                       # PostgreSQL 17 on localhost:5434
cp .env.example apps/api/.env    # then: cd apps/api && npx prisma migrate deploy
pnpm --filter api start:dev      # API  http://localhost:4000/api/v1
pnpm --filter web dev            # Web  http://localhost:3000
node scripts/seed-demo.mjs       # optional: demo@devtrack.dev / correct-horse with 12 weeks of history
```

Host port is 5434 (not 5433 as in the PDF) because 5433 is commonly taken by a local PostgreSQL.

Already running PostgreSQL? Skip `pnpm db:up`, run `CREATE DATABASE devtrack;` on it, and set `DATABASE_URL` in `apps/api/.env` to that server (for example `postgresql://USER:PASSWORD@localhost:5433/devtrack?schema=public`). `.env` is gitignored, so credentials stay local. The API tests use their own `devtrack_test` database from `apps/api/.env.test`.

## Tests

```bash
pnpm --filter api test        # unit: dates, streaks, heat levels, habit completion
pnpm --filter api test:e2e    # API against a real PostgreSQL (database devtrack_test)
pnpm --filter web test        # components, API client, forms
```

Create the e2e database once: `docker exec devtrack-postgres psql -U devtrack -c "CREATE DATABASE devtrack_test"`,
then `DATABASE_URL=...devtrack_test npx prisma migrate deploy`.
