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
- Docker & Docker Compose (Redis only)
- A Supabase project (PostgreSQL hosting)

### Development

1. Start Redis:

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

   Fill in `DATABASE_URL` from Supabase Dashboard: Project Settings →
   Database → Connection string. Use the **Session Pooler** (port 5432),
   not the Transaction Pooler, because Prisma needs transactions.
   `DATABASE_URL_TEST` points to the same database with `?schema=test`.

4. Run Prisma migrations:

   ```bash
   pnpm exec prisma migrate dev
   ```

5. Start dev server:

   ```bash
   pnpm start:dev
   ```

App is running at `http://localhost:3000` (API under `/api`), Swagger docs at `http://localhost:3000/docs`.

## Available Scripts

| Script | Description |
|---|---|
| `pnpm start:dev` | Start dev server with watch mode |
| `pnpm build` | Build for production |
| `pnpm typecheck` | Typecheck without emit |
| `pnpm test` | Run unit tests (service, controller, linking engine) |
| `pnpm test:integration` | Run repository integration tests against a real PostgreSQL (needs `DATABASE_URL_TEST`) |
| `pnpm test:e2e` | Run HTTP end-to-end tests against the test schema |
| `pnpm lint` | Lint with ESLint |
| `pnpm format` | Format with Prettier |
| `pnpm verify` | Full verification gate (typecheck, lint, test) |

`pnpm test:integration` and `pnpm test:e2e` need the test schema in Supabase, so set `DATABASE_URL_TEST` and run `docker compose up -d` for Redis first.

## Project Structure

```text
src/
  main.ts              # Application bootstrap (Swagger, global pipe/filter/interceptor)
  app.module.ts        # Root module
  common/              # Cross-cutting: errors, filters, interceptors, pipes
  infra/               # Integrasi eksternal: prisma/, redis/
  auth/                # Authentication, RBAC, JWT guard, role decorator
  users/               # Akun, role, org reference
  regions/             # Hierarki wilayah
  kitchens/            # Master SPPG/dapur
  schools/             # Master sekolah
  health-units/        # Puskesmas/Dinkes
  suppliers/           # Master pemasok
  kitchen-school-service/ # Relasi dapur melayani sekolah
  batches/             # Batch management
  deliveries/          # Deliveries, receipt, consumption status
  reports/             # Symptom reports (idempotent)
  linking/             # Pure linking engine (no DB access)
  incidents/           # Incident lifecycle and summary
  actions/             # Follow-up actions and acknowledgement
  notifications/       # In-app notifications and queue processors
  audit/               # Append-only audit log
  config/              # Adjustable simulation parameters
  dev-scenario/        # Demo scenario endpoints (dev only)
  health/              # Health check endpoint
test/
  integration/
  e2e/
prisma/
  schema.prisma
  migrations/
docs/
```

## Documentation

- [Architecture](docs/architecture.md) (in Indonesian): structure, layers, dependency rules, testing strategy
- [Business rules](docs/business-rules.md) (in Indonesian): R1-R10, enums, parameters, test cases T1-T12
- [Domain context](docs/domain-context.md) (in Indonesian): terms, users, product boundaries
- [Database](docs/database.md) and [ERD](docs/erd.md) (in Indonesian): data model, entities, constraints
- [API contract](docs/api-contract.md) (in Indonesian): endpoint behavior, per-role access, error format
- [Tasks](docs/tasks.md): backlog, blockers, dependencies
- [PRD](docs/prd.md) (in Indonesian): requirements, business rules, implementation plan
- Swagger: `http://localhost:3000/docs` while the dev server is running