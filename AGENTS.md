# AGENTS.md

Media Manager is a local-first workbench for large creative libraries. The web app is React 19 + Express on Bun 1.4.0. Desktop is an Electron supervisor around that Bun runtime. The renderer uses `/api` only. It does not receive Node, `ipcRenderer`, or a generic invoke bridge.

Committed docs and UI strings are English.

## Before you change code

1. Read `README.md` for product purpose, status, and commands.
2. Use the existing service, transformer, and route files. Do not add barrel `index.ts` files in those folders.

Done when you can name the service file and the HTTP or test seam that will prove the change.

## Hard rules

- Routes call services. Services own Drizzle. Transformers own DTOs.
- Import from `@/` paths. Do not use deep relative imports.
- The client never sends a raw filesystem path. Move assets with `POST /api/files/assets/move` and a `targetFolderId`.
- Do not present undo, redo, pause, or cancel unless that control drives a server mutation with durable compensation.
- `bun run test` creates an isolated disposable SQLite database per file. Do not point tests at a personal database.
- CAUTION: `bun run db:reset` deletes a database. Run it only on a marked disposable DB, with the exact confirmation the command prints.
- Do not rewrite git history. Do not commit secrets, personal databases, uploads, or logs.

## Commands and proof

Use the commands in `package.json`; [README.md](README.md#development-commands) explains the common ones. Install with `bun install --frozen-lockfile`.

For migrations or Studio, use `bun run db:migrate -- --database <path>` or `bun run db:studio -- --database <path>` with an explicit database path.

Prove the changed behavior at the cheapest public seam. A failing test is not done. Record the exact command you ran.

If the change is UI, exercise the real route in the browser. A screenshot of first paint is not proof.

## Context pointers

- Product, startup, and commands: [README.md](README.md).
- HTTP routes, payloads, and authorization: [API reference](docs/core/API-REFERENCE.md).
- UI layout, state, and browser proof: [Frontend guide](docs/core/FRONTEND-GUIDE.md).
- Service boundaries, indexing, and Effect execution: [Service layer](src/services/README.md).
