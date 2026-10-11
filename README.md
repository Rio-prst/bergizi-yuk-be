# BergiziYuk Backend

Backend API for BergiziYuk, a system that traces school symptom reports back to the food batches that were served (MBG program). It links each report to the batches the school actually received, finds other schools that received the same batch, and tracks follow-up actions by health officers until they are resolved.

> Tracing results are signals for investigation, not a determination of the cause of poisoning. All demo data is fictional.

## Tech Stack

- Node.js 22
- NestJS
- PostgreSQL 16 (Prisma)
- Redis 7 (BullMQ, for notifications and reminders)
- Zod + nestjs-zod (schema validation)
- Jest + Supertest

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm
- Docker & Docker Compose

### Development

1. Start PostgreSQL and Redis:

   ```bash
   docker compose up -d
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment (set `JWT_SECRET` to a long random value):

   ```bash
   cp .env.example .env
   ```

4. Run Prisma migrations:

   ```bash
   pnpm exec prisma migrate dev
   ```

5. Start dev server:

   ```bash
   pnpm start:dev
   ```

App is running at `http://localhost:3000`, Swagger docs at `http://localhost:3000/docs`.

## Available Scripts

| Script | Description |
|---|---|
| `pnpm start:dev` | Start dev server with watch mode |
| `pnpm build` | Build for production |
| `pnpm typecheck` | Typecheck without emit |
| `pnpm test` | Run unit tests (including the linking engine) |
| `pnpm test:e2e` | Run HTTP end-to-end tests against the `bergiziyuk_test` database |
| `pnpm lint` | Lint with ESLint |
| `pnpm format` | Format with Prettier |
| `pnpm verify` | Full verification gate (typecheck, lint, test) |

`pnpm test:e2e` uses the PostgreSQL service from Docker Compose, so run `docker compose up -d` first.

## Project Structure

```text
src/
  main.ts              # Application bootstrap
  app.module.ts        # Root module
  common/              # Shared infra (guards, decorators, filters, interceptors)
  infra/               # Infrastructure (Prisma, Redis/queue)
  auth/                # Authentication and RBAC
  master-data/         # Regions, kitchens, schools, health units, suppliers
  batches/             # Batch management
  deliveries/          # Deliveries, receipt, consumption status
  reports/             # Symptom reports (idempotent)
  linking/             # Pure linking engine (no DB access)
  incidents/           # Incident lifecycle and summary
  actions/             # Follow-up actions and acknowledgement
  notifications/       # In-app notifications and queue processors
  audit/               # Append-only audit log
  dev-scenario/        # Demo scenario endpoints (dev only)
prisma/
  schema.prisma
  migrations/
```

## Documentation

- [PRD BergiziYuk](docs/PRD-BergiziYuk.html) (in Indonesian): requirements, business rules, data model, implementation plan
- [Backend details](docs/README-detail.md) (in Indonesian): environment variables, API overview, linking rules, enums, and test cases
- Swagger: `http://localhost:3000/docs` while the dev server is running