# Service layer

Routes call services, services own Drizzle access, and transformers own DTO conversion. Import from the existing `@/` file path. Do not add barrel `index.ts` files to services, routes, or transformers.

## Follow a request

Start at the mounted route in `src/server/routes/`. Its imports identify the implementation in `src/services/` or `src/server/services/`. Some files in `src/services/`, such as `folder/folder-api.service.ts`, are HTTP clients; check the file before importing it into the renderer.

Domain services cover media, organizers, worldbuilding entities, settings, and background work. Use the [API reference](../../docs/core/API-REFERENCE.md) for exposed operations. A service method or domain type does not establish that a route exists.

## Indexing and metadata

Folder reindexing enters `folder/reindex/folder-reindex.service.ts` and uses `folder/reindex/canonical-folder-reindex.ts` for canonical synchronization. Preserve authorized roots, asset identities, progress events, and per-file outcomes.

The [file entity mapper](file-entity-mapper/README.md) dispatches media processing. Metadata parsers live in `src/server/services/metadata/`; the active parser entry point is `unified-parser.service.ts`. Keep extraction separate from DTO formatting and UI state.

## Effect boundaries

Existing Effect services use `Effect.try` for synchronous parsing or validation and `Effect.tryPromise` for asynchronous work. An asynchronous Drizzle callback must return a Promise; existing services use `async () => await query`. Execute or provide the Effect at the existing adapter boundary. Do not return an unevaluated Effect from a function declared to return a Promise.

Keep entity IDs in their domain type; do not assume every ID is a UUID. Reuse current error types and response handling instead of introducing a second conversion layer.

## Data and verification

Preserve the SQL migration history and upgrade, adoption, and recovery tooling. Removing an unused TypeScript implementation does not prove that an existing database can lose its columns or migration records.

Use `bun run test` for isolated domain tests and `bun run test:tooling` for the existing HTTP, migration, and runner checks. Never point tests at a personal database. Choose the public seam that observes the changed behavior and preserve failure output.
