# GEMINI.md - Image Manager Context

This file serves as the primary context and instructional guide for interacting with the **Image Manager** project.

## 1. Project Overview

**Image Manager** is a high-performance, monolithic client-server application for managing large volumes of multimedia files. It runs as a Web App (React/Express). Desktop development is moving from Tauri to Electron. Follow `AGENTS.md` for the live desktop commands.

- **Type:** Monolithic Client-Server (Web + Desktop)
- **Runtime:** [Bun](https://bun.sh) (v1.2+)
- **Database:** SQLite via [Drizzle ORM](https://orm.drizzle.team)

### Tech Stack

| Layer        | Technology                               | Key Libraries                                     |
| :----------- | :--------------------------------------- | :------------------------------------------------ |
| **Frontend** | React 19, Vite+ (Vite + Rolldown)        | Zustand, TanStack Query, Tailwind CSS 4, Radix UI |
| **Backend**  | Express 5, Bun                           | Drizzle ORM, Sharp, Effect-TS (partial)           |
| **Desktop**  | Electron supervisor + Bun backend (Tauri until cutover) |                          |
| **Testing**  | Vitest (Unit), Playwright (E2E)          |                                                   |
| **Tooling**  | Vite+, Oxc (Lint/Format), TypeScript 7   |                                                   |

---

## 2. Critical Development Rules

### 🛑 Protocol (Strict Adherence Required)

1. **Explore First:** Before changing code, search and read relevant files to understand existing patterns.
2. **Plan:** Create a clear, step-by-step **TODO list** before executing changes.
3. **Language:** The codebase documentation is mixed (English/Spanish). **Responses to the user should default to Spanish** unless the user specifically initiates in English.
4. **Testing:** NEVER accept failing tests. Run relevant tests before declaring a task complete.
5. **Atomic Changes:** Make small, typed, and consistent changes. Verify frequently.

### 🎨 Code Style & Conventions

- **Linting:** Use **Oxc** through `bun run lint`, `bun run format`, `bun run check`, and `bun run check:full` when you need a full repo formatting audit.
- **Imports:** Always use **absolute paths** (e.g., `import { ... } from '@/services/video'`).
- **File Parallelism:** Vitest is configured with `fileParallelism: true`. Each file uses an isolated disposable SQLite database.
- **Strict Types:** No `any`. Define types in `src/types` or Drizzle schemas.

---

## 3. Architecture & Patterns

The project follows a strict layered architecture. **Do not bypass layers.**

### Layer Flow

`Frontend UI` -> `TanStack Query` -> `Express API` -> `Service Layer` -> `Drizzle ORM` -> `SQLite`

### Key Patterns

1. **Service Layer (`src/services/<entity>/`)**
   - All business logic resides here.
   - **Pattern:** Singleton object with methods (`create`, `get`, `list`, `update`, `delete`).
   - **Rule:** Controllers/Routes should _never_ query Drizzle directly. They must use Services.

2. **Transformers (`src/transformers/<entity>/`)**
   - Convert Drizzle models to Frontend DTOs.
   - **Naming:** `fromDrizzle<Entity>WithCounts`.
   - **Rule:** Enrich data (e.g., formatting sizes, generating URLs) here, not in the Service or UI.

3. **Store (`src/store/`)**
   - State management via **Zustand**.
   - **Pattern:** Granular stores (one per domain), using `immer` and `devtools`.

4. **Database Schema (`src/lib/drizzle/schema/`)**
   - Organized by domain (core, files, organization, etc.).
   - **Relations:** Defined in `src/lib/drizzle/relations.ts`.

---

## 4. Operational Commands

### Development

- `bun run dev:full` - Start Frontend + Backend + HMR (Primary dev command).
- `bun run desktop:dev` - Start the Electron desktop shell.

### Testing

- `bun run test` - Run Unit Tests (Vitest).
- `bun run test:e2e` - Run E2E Tests (Playwright).
- `bun run test:ui` - Open Playwright UI.

### Database

- `bun run db:push` - Push schema changes to the database.
- `bun run db:studio` - Open Drizzle Studio GUI.
- `bun run db:reset` - **Destructive:** Reset database and seed.

### Quality

- `bun run check` - Run the operational gate (lint + typecheck).
- `bun run check:full` - Run the full Vite+ repo audit (lint + formatting).
- `bun run lint` - Run Oxlint directly.
- `bun run tsc` - Run TypeScript type checking.

---

## 5. File Structure Reference

```text
src/
├── components/          # React components (Views, Features, UI)
├── server/              # Express Backend
│   ├── routes/          # API Routes (Calls Services)
├── services/            # Business Logic (Calls ORM)
├── transformers/        # DTO Transformers
├── lib/
│   ├── drizzle/         # Database Schema & Migrations
│   └── logger/          # Logging Utilities
├── store/               # Zustand Stores
├── types/               # TypeScript Definitions
```

## 6. Agents & Automation

- **`AGENTS.md`**: Contains detailed instructions for AI agents. **Read this if you need deep context on specific patterns.**
- **`docs/`**: Contains architectural documentation.
  - `ARCHITECTURE.md`: High-level system design.
  - `DATABASE-SCHEMA.md`: DB details.

## 7. Troubleshooting

- **`SQLITE_BUSY`**: Ensure no other processes are locking the DB. Vitest runs sequentially to prevent this.
- **Type Errors**: Run `bun run tsc` to isolate.
- **Bun + Vite+**: Vite+ is used for frontend tasks, but Bun remains the package manager/runtime for this repo.
