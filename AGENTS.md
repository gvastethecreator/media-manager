# AGENTS.md

Media Manager is a local-first workbench for large creative libraries. The web app is React 19 + Express on Bun 1.3.14. Desktop is an Electron supervisor around that Bun runtime. The renderer uses `/api` only. It does not receive Node, `ipcRenderer`, or a generic invoke bridge.

Committed docs and UI strings are English. Session talk with Cristian is Spanish.

## Before you change code

1. Read `CONTEXT.md` for product words.
2. Read `CONTEXT-MAP.md` for context boundaries.
3. Read `docs/adr/` for accepted decisions in the area you will change.
4. Read `docs/codemap/codemap.md` for callers. If the map cannot answer, refresh it before product edits.
5. Use the existing service, transformer, and route files. Do not add barrel `index.ts` files in those folders.

Done when you can name the owning context, the service file, and the HTTP or test seam that will prove the change.

## Hard rules

- Routes call services. Services own Drizzle. Transformers own DTOs.
- Import from `@/` paths. Do not use deep relative imports.
- The client never sends a raw filesystem path. Move assets with `POST /api/files/assets/move` and a `targetFolderId`.
- Do not present undo, redo, pause, or cancel unless that control drives a server mutation with durable compensation.
- `bun run test` creates an isolated disposable SQLite database per file. Do not point tests at a personal database.
- CAUTION: `bun run db:reset` deletes a database. Run it only on a marked disposable DB, with the exact confirmation the command prints.
- Do not rewrite git history. Do not commit secrets, personal databases, uploads, or logs.
- Tickets live in GitHub Issues and `.scratch/media-manager/issues/`. Never write tickets under `docs/`.

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
- Architecture, schema, API, services, frontend: `docs/core/`
- Desktop cutover evidence: `docs/migration/`
- Context ownership: `docs/planning/context-architecture/`
- Tracker contracts: `docs/agents/`
- Local work (ignored): `.scratch/`

## Agent skills

### Issue tracker

GitHub Issues and the linked GitHub Project hold live state. `.scratch/` holds synchronized local mirrors. See `docs/agents/issue-tracker.md`.

### Triage labels

Use `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, or `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context monolith: root `CONTEXT.md` plus `CONTEXT-MAP.md` and `docs/adr/`. See `docs/agents/domain.md`.
