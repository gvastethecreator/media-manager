# AGENTS.md

Media Manager is a local-first workbench for large creative libraries. The web app is React 19 + Express on Bun 1.3.14. Desktop is an Electron supervisor around that Bun runtime. The renderer uses `/api` only. It does not receive Node, `ipcRenderer`, or a generic invoke bridge.

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

## Commands

`package.json` is the command list. Do not invent scripts.

| Command | Purpose |
| --- | --- |
| `bun run dev:full` | Frontend and backend |
| `bun run desktop:dev` | Electron shell |
| `bun run check` | Lint and typecheck |
| `bun run test` | Isolated unit and integration tests |
| `bun run test:tooling` | Tooling tests |
| `bun run test:e2e` | Playwright |
| `bun run build` | Vite client and Bun server |
| `bun run db:migrate -- --database <path>` | Versioned migrations |
| `bun run db:studio -- --database <path>` | Studio on an explicit DB |

Install with `bun install --frozen-lockfile`.

## Proof

Prove the changed behavior at the cheapest public seam. A failing test is not done. Record the exact command you ran.

If the change is UI, exercise the real route in the browser. A screenshot of first paint is not proof.

## Docs

- Product entry: `README.md`
- API: `docs/core/API-REFERENCE.md`
- Frontend: `docs/core/FRONTEND-GUIDE.md`