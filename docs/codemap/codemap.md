# Code map: media-manager

Generated: 2026-09-09T16:36:28Z | Commit: `81979a3e501d` | Schema: 2
Generation: `7288ababb08d34a4984af65b4cec30e3ff73a25834f8f8a2e7f8456262e8cabd`
Scope: . | Inventory: working-tree
Nodes: 2171 | Edges: 12051 | Flows: 5

## Coverage

- Analysis: **partial**; 2030 analyzed of 2056 included files.
- Configuration files: 2; omitted untracked files: 0.
- Unresolved references and analysis limits: 11809.
- Static references and call paths do not prove runtime execution or test coverage.

## Modules

- `docs/site.js` | module | Repository | callers: none | callees: none | tests: 0 | entry: none
- `drizzle.config.ts` | module | Repository | callers: none | callees: external:javascript:dotenv, external:javascript:drizzle-kit, external:javascript:drizzle-kit | tests: 0 | entry: none
- `electron/main/data-dir.ts` | module | Repository | callers: electron/main/index.ts, electron/main/index.ts, electron/main/supervisor.ts, electron/main/supervisor.ts | callees: external:javascript:node:fs, external:javascript:node:fs, external:javascript:node:path, external:javascript:node:path | tests: 1 | entry: none
- `electron/main/data-migrate-marker.ts` | module | Repository | callers: electron/main/data-migrate.ts, electron/main/data-migrate.ts, electron/main/restore-source.ts, electron/main/restore-source.ts | callees: electron/main/migration-marker.ts, external:javascript:node:fs, external:javascript:node:fs, external:javascript:node:path | tests: 0 | entry: none
- `electron/main/data-migrate.ts` | module | Repository | callers: scripts/desktop-data-migrate.test.ts, scripts/desktop-data-migrate.test.ts | callees: electron/main/data-migrate-marker.ts, electron/main/data-migrate-marker.ts, electron/main/migration-marker.ts, external:javascript:bun:sqlite | tests: 1 | entry: none
- `electron/main/desktop-log.ts` | module | Repository | callers: electron/main/index.ts, electron/main/index.ts | callees: external:javascript:node:fs, external:javascript:node:fs, external:javascript:node:path, external:javascript:node:path | tests: 0 | entry: none
- `electron/main/index.ts` | module | Repository | callers: none | callees: electron/main/data-dir.ts, electron/main/data-dir.ts, electron/main/desktop-log.ts, electron/main/desktop-log.ts | tests: 0 | entry: none
- `electron/main/migration-marker.ts` | module | Repository | callers: electron/main/data-migrate-marker.ts, electron/main/data-migrate.ts, electron/main/restore-source.ts | callees: none | tests: 0 | entry: none
- `electron/main/restore-source.ts` | module | Repository | callers: electron/main/index.ts, electron/main/index.ts, scripts/desktop-data-migrate.test.ts, scripts/desktop-data-migrate.test.ts | callees: electron/main/data-migrate-marker.ts, electron/main/data-migrate-marker.ts, electron/main/migration-marker.ts, external:javascript:node:fs | tests: 1 | entry: none
- `electron/main/run-migrate.ts` | module | Repository | callers: electron/main/index.ts, electron/main/index.ts | callees: external:javascript:node:child_process, external:javascript:node:child_process | tests: 0 | entry: none
- `electron/main/runtime-mode.ts` | module | Repository | callers: electron/main/index.ts, electron/main/index.ts, scripts/desktop-contract.test.ts, scripts/desktop-contract.test.ts | callees: external:javascript:node:fs, external:javascript:node:fs, external:javascript:node:path, external:javascript:node:path | tests: 1 | entry: none
- `electron/main/security.ts` | module | Repository | callers: electron/main/index.ts, electron/main/index.ts, scripts/desktop-contract.test.ts, scripts/desktop-contract.test.ts | callees: electron/shared/ipc-contract.ts, electron/shared/ipc-contract.ts | tests: 1 | entry: none
- `electron/main/supervisor.ts` | module | Repository | callers: electron/main/index.ts, scripts/desktop-supervisor.test.ts | callees: electron/main/data-dir.ts, electron/main/data-dir.ts, electron/shared/ipc-contract.ts, external:javascript:node:child_process | tests: 1 | entry: none
- `electron/preload/index.ts` | module | Repository | callers: none | callees: electron/shared/desktop-api.ts, electron/shared/ipc-contract.ts, external:javascript:electron, external:javascript:node:module | tests: 0 | entry: none
- `electron/shared/desktop-api.ts` | module | Repository | callers: electron/preload/index.ts | callees: electron/shared/ipc-contract.ts | tests: 0 | entry: none
- `electron/shared/ipc-contract.ts` | module | Repository | callers: electron/main/index.ts, electron/main/index.ts, electron/main/security.ts, electron/main/security.ts | callees: none | tests: 1 | entry: none
- `external:javascript:@dnd-kit/core` | external | External | callers: src/components/ui/data-grid-table-dnd-rows.tsx, src/components/ui/data-grid-table-dnd-rows.tsx, src/components/ui/data-grid-table-dnd.tsx, src/components/ui/data-grid-table-dnd.tsx | callees: none | tests: 0 | entry: none
- `external:javascript:@dnd-kit/modifiers` | external | External | callers: src/components/ui/data-grid-table-dnd-rows.tsx, src/components/ui/data-grid-table-dnd.tsx | callees: none | tests: 0 | entry: none
- `external:javascript:@dnd-kit/sortable` | external | External | callers: src/components/ui/data-grid-table-dnd-rows.tsx, src/components/ui/data-grid-table-dnd-rows.tsx, src/components/ui/data-grid-table-dnd.tsx, src/components/ui/data-grid-table-dnd.tsx | callees: none | tests: 0 | entry: none
- `external:javascript:@dnd-kit/utilities` | external | External | callers: src/components/ui/data-grid-table-dnd-rows.tsx, src/components/ui/data-grid-table-dnd.tsx | callees: none | tests: 0 | entry: none
- Showing 20 of 2171 nodes. Query `impact --module <path>` or open the HTML hierarchy for the rest.

## Edges

- `drizzle.config.ts` -> `external:javascript:dotenv` | imports
- `drizzle.config.ts` -> `external:javascript:drizzle-kit` | calls
- `drizzle.config.ts` -> `external:javascript:drizzle-kit` | imports
- `electron/main/data-dir.ts` -> `external:javascript:node:fs` | calls
- `electron/main/data-dir.ts` -> `external:javascript:node:fs` | imports
- `electron/main/data-dir.ts` -> `external:javascript:node:path` | calls
- `electron/main/data-dir.ts` -> `external:javascript:node:path` | imports
- `electron/main/data-dir.ts` -> `external:javascript:node:url` | calls
- `electron/main/data-dir.ts` -> `external:javascript:node:url` | imports
- `electron/main/data-migrate-marker.ts` -> `electron/main/migration-marker.ts` | imports
- `electron/main/data-migrate-marker.ts` -> `external:javascript:node:fs` | calls
- `electron/main/data-migrate-marker.ts` -> `external:javascript:node:fs` | imports
- `electron/main/data-migrate-marker.ts` -> `external:javascript:node:path` | calls
- `electron/main/data-migrate-marker.ts` -> `external:javascript:node:path` | imports
- `electron/main/data-migrate.ts` -> `electron/main/data-migrate-marker.ts` | calls
- `electron/main/data-migrate.ts` -> `electron/main/data-migrate-marker.ts` | imports
- `electron/main/data-migrate.ts` -> `electron/main/migration-marker.ts` | imports
- `electron/main/data-migrate.ts` -> `external:javascript:bun:sqlite` | imports
- `electron/main/data-migrate.ts` -> `external:javascript:node:fs` | calls
- `electron/main/data-migrate.ts` -> `external:javascript:node:fs` | imports
- `electron/main/data-migrate.ts` -> `external:javascript:node:path` | calls
- `electron/main/data-migrate.ts` -> `external:javascript:node:path` | imports
- `electron/main/data-migrate.ts` -> `external:javascript:node:url` | calls
- `electron/main/data-migrate.ts` -> `external:javascript:node:url` | imports
- `electron/main/data-migrate.ts` -> `scripts/apply-production-database.ts` | calls
- `electron/main/data-migrate.ts` -> `scripts/apply-production-database.ts` | imports
- `electron/main/desktop-log.ts` -> `external:javascript:node:fs` | calls
- `electron/main/desktop-log.ts` -> `external:javascript:node:fs` | imports
- `electron/main/desktop-log.ts` -> `external:javascript:node:path` | calls
- `electron/main/desktop-log.ts` -> `external:javascript:node:path` | imports
- `electron/main/index.ts` -> `electron/main/data-dir.ts` | calls
- `electron/main/index.ts` -> `electron/main/data-dir.ts` | imports
- `electron/main/index.ts` -> `electron/main/desktop-log.ts` | calls
- `electron/main/index.ts` -> `electron/main/desktop-log.ts` | imports
- `electron/main/index.ts` -> `electron/main/restore-source.ts` | calls
- `electron/main/index.ts` -> `electron/main/restore-source.ts` | imports
- `electron/main/index.ts` -> `electron/main/run-migrate.ts` | calls
- `electron/main/index.ts` -> `electron/main/run-migrate.ts` | imports
- `electron/main/index.ts` -> `electron/main/runtime-mode.ts` | calls
- `electron/main/index.ts` -> `electron/main/runtime-mode.ts` | imports
- `electron/main/index.ts` -> `electron/main/security.ts` | calls
- `electron/main/index.ts` -> `electron/main/security.ts` | imports
- `electron/main/index.ts` -> `electron/main/supervisor.ts` | imports
- `electron/main/index.ts` -> `electron/shared/ipc-contract.ts` | calls
- `electron/main/index.ts` -> `electron/shared/ipc-contract.ts` | imports
- `electron/main/index.ts` -> `external:javascript:electron` | imports
- `electron/main/index.ts` -> `external:javascript:node:fs` | calls
- `electron/main/index.ts` -> `external:javascript:node:fs` | imports
- `electron/main/index.ts` -> `external:javascript:node:module` | calls
- `electron/main/index.ts` -> `external:javascript:node:module` | imports
- Showing 50 of 12051 edges; JSON contains every edge and its evidence.

## Unknown

- `package.json:1`: unresolved-local-import (./electron/dist/main.cjs)
- `scripts/audio-canonical-http.test.ts:21`: object-member-call-not-resolved (db)
- `scripts/audio-canonical-http.test.ts:22`: object-member-call-not-resolved (db)
- `scripts/audio-canonical-http.test.ts:24`: object-member-call-not-resolved (db)
- `scripts/audio-canonical-http.test.ts:25`: object-member-call-not-resolved (db)
- `scripts/audio-canonical-http.test.ts:47`: object-member-call-not-resolved (db)
- `scripts/audio-canonical-http.test.ts:50`: object-member-call-not-resolved (express)
- `scripts/audio-canonical-http.test.ts:51`: trigger-handler-not-resolved (audiosRouter)
- `scripts/audio-canonical-http.test.ts:91`: object-member-call-not-resolved (expect)
- `scripts/audio-canonical-http.test.ts:91`: object-member-call-not-resolved (expect)
- `scripts/audio-canonical-http.test.ts:95`: object-member-call-not-resolved (db)
- `scripts/audio-canonical-http.test.ts:96`: object-member-call-not-resolved (expect)

## Flows

- route registration GET /: `src/server/routes/download.effect.ts` -> `src/services/file-entity-mapper/utils/file-info.utils.ts` | Static call path reaches src/services/file-entity-mapper/utils/file-info.utils.ts:getMimeTypeFromExtension
- route registration POST /: `src/server/routes/download.effect.ts` -> `src/server/security/media-asset-reference.ts` -> `external:javascript:drizzle-orm` | Static call path reaches external:javascript:drizzle-orm:eq
- route registration USE /api/file3ds: `src/server/route-registry.ts` -> `src/server/routes/file-services.effect.ts` | Static call path reaches src/server/routes/file-services.effect.ts:file3dsEffectRouter
- route registration USE /api/json-files: `src/server/route-registry.ts` -> `src/server/routes/file-services.effect.ts` | Static call path reaches src/server/routes/file-services.effect.ts:jsonFilesEffectRouter
- route registration GET /:id/content: `src/server/routes/images.effect.ts` -> `external:javascript:node:fs` | Static call path reaches external:javascript:node:fs:readFile

## Architecture changes

- Nodes: +2171 / -0; edges: +12051 / -0.
- Boundary changes: 0; new cycles: 14.

## Read next

- Use `status` before relying on this generation.
- Use `impact --changed` for possible impact and related test evidence.
- Use `diff --before <model> --after <model>` for architecture changes.
