# Code map · media-manager

generated: 2026-09-05T05:06:00Z
commit: 0b9c124bb400
scope: .

counts: 20 nodes · 105 edges · 0 flows · 0 unknown

## Modules

- `electron` · `electron` · module · Electron
  callers: scripts (imports)
  callees: external-dependencies (imports), scripts (imports), src-runtime (imports)
  tests: scripts/desktop-contract.test.ts, scripts/desktop-data-migrate.test.ts, scripts/desktop-supervisor.test.ts
  entry: electron/main/index.ts:resolveUserDataFromArgv

- `external-dependencies` · `drizzle.config.ts` · external · External
  callers: electron (imports), other-modules (imports), scripts (imports), src (imports), src-components (imports), src-config (imports), src-hooks (imports), src-lib (imports), src-platform (imports), src-providers (imports), src-server (imports), src-services (imports), src-store (imports), src-transformers (imports), src-types (imports), vite-config (imports)
  callees: (none)
  tests: (none)
  entry: drizzle.config.ts:drizzle-kit

- `other-modules` · `drizzle.config.ts` · module · Other Modules
  callers: src-components (imports), src-lib (imports), src-store (imports)
  callees: external-dependencies (imports), src-lib (imports), src-types (imports)
  tests: (none)
  entry: drizzle.config.ts:import 'dotenv/config';

- `repository` · `package.json` · module · Repository
  callers: (none)
  callees: scripts (calls), scripts-db (calls), src-server (calls)
  tests: (none)
  entry: package.json:{

- `scripts` · `scripts` · service · Scripts
  callers: electron (imports), repository (calls), src-runtime (imports)
  callees: electron (imports), external-dependencies (imports), scripts-db (imports), src-config (imports), src-lib (imports), src-runtime (imports), src-server (imports), src-services (imports)
  tests: scripts/apply-production-database.test.ts, scripts/desktop-data-migrate.test.ts, scripts/local-session-security.test.ts, scripts/run-tests-isolated.test.ts, scripts/safety-contracts.test.ts
  entry: scripts/apply-production-database.ts:resolveProductionMigrationsDirectory

- `scripts-db` · `scripts/db` · database · Scripts
  callers: repository (calls), scripts (imports)
  callees: src-lib (imports), src-server (imports), src-services (imports)
  tests: scripts/db/backup-retention.test.ts, scripts/db/canonical-asset-schema.test.ts, scripts/db/database-safety.test.ts, scripts/db/export-schema.test.ts, scripts/db/image-asset-link-schema.test.ts
  entry: scripts/db/backup-retention.ts:isInside

- `src` · `src` · module · Src
  callers: src-platform (imports)
  callees: external-dependencies (imports), src-components (imports), src-hooks (imports), src-lib (imports), src-platform (imports), src-providers (imports), src-store (imports)
  tests: (none)
  entry: src/App.tsx:SSENavigationRefresher

- `src-components` · `src/components` · interface · Src
  callers: src (imports), src-config (imports), src-hooks (imports), src-lib (imports), src-platform (imports), src-providers (imports), src-store (imports)
  callees: external-dependencies (imports), other-modules (imports), src-config (imports), src-hooks (imports), src-lib (imports), src-platform (imports), src-providers (imports), src-services (imports), src-store (imports), src-transformers (imports), src-types (imports)
  tests: src/components/features/file-browser-new/components/file-operation-dialogs.test.tsx, src/components/features/file-browser-new/components/folder-browser-visual.test.tsx, src/components/features/file-browser-new/components/status-bar.test.tsx, src/components/features/file-browser-new/hooks/use-delete.test.ts, src/components/settings/common/dynamic-create-form.test.tsx
  entry: src/components/ui/index.ts:/**

- `src-config` · `src/config` · module · Src
  callers: scripts (imports), src-components (imports), src-hooks (imports), src-lib (imports), src-server (imports), src-services (imports), vite-config (imports)
  callees: external-dependencies (imports), src-components (imports), src-lib (imports), src-types (imports)
  tests: scripts/safety-contracts.test.ts, tests/unit/entity-type-configs.spec.ts
  entry: src/config/empty.ts:Stats

- `src-hooks` · `src/hooks` · module · Src
  callers: src (imports), src-components (imports), src-lib (imports)
  callees: external-dependencies (imports), src-components (imports), src-config (imports), src-lib (imports), src-platform (imports), src-providers (imports), src-services (imports), src-store (imports), src-types (imports)
  tests: src/hooks/__tests__/use-list-view-config.test.tsx, src/hooks/__tests__/use-thumbnail.test.tsx, src/hooks/use-move.test.ts
  entry: src/hooks/index.ts:/**

- `src-lib` · `src/lib` · module · Src
  callers: other-modules (imports), scripts (imports), scripts-db (imports), src (imports), src-components (imports), src-config (imports), src-hooks (imports), src-providers (imports), src-server (imports), src-services (imports), src-store (imports), src-transformers (imports), src-types (imports)
  callees: external-dependencies (imports), other-modules (imports), src-components (imports), src-config (imports), src-hooks (imports), src-platform (imports), src-providers (imports), src-server (imports), src-services (imports), src-store (imports), src-transformers (imports), src-types (imports)
  tests: scripts/apply-production-database.test.ts, scripts/audio-canonical-http.test.ts, scripts/authorized-file-mutation.test.ts, scripts/authorized-files-routes.test.ts, scripts/db/relation-catalog.test.ts
  entry: src/lib/index.ts:/**

- `src-platform` · `src/platform` · module · Src
  callers: src (imports), src-components (imports), src-hooks (imports), src-lib (imports)
  callees: external-dependencies (imports), src (imports), src-components (imports), src-providers (imports)
  tests: (none)
  entry: src/platform/app-shell-structure-plan.ts:APP_SHELL_STRUCTURE_VERSION

- `src-providers` · `src/providers` · module · Src
  callers: src (imports), src-components (imports), src-hooks (imports), src-lib (imports), src-platform (imports)
  callees: external-dependencies (imports), src-components (imports), src-lib (imports), src-store (imports), src-types (imports)
  tests: (none)
  entry: src/providers/ViewTransitionProvider.tsx:ViewTransitionProvider

- `src-runtime` · `src/runtime` · service · Src
  callers: electron (imports), scripts (imports), src-server (imports)
  callees: scripts (imports)
  tests: scripts/http-input-limits.test.ts, scripts/local-app-broker.test.ts
  entry: src/runtime/http-limits.ts:API_JSON_BODY_LIMIT

- `src-server` · `src/server` · service · Src
  callers: repository (calls), scripts (imports), scripts-db (imports), src-lib (imports), src-services (imports), src-types (imports)
  callees: external-dependencies (imports), src-config (imports), src-lib (imports), src-runtime (imports), src-services (imports), src-transformers (imports), src-types (imports)
  tests: scripts/audio-canonical-http.test.ts, scripts/authorized-file-mutation.test.ts, scripts/authorized-files-routes.test.ts, scripts/authorized-roots.test.ts, scripts/document-canonical-http.test.ts
  entry: src/server/index.ts:shutdown

- `src-services` · `src/services` · service · Src
  callers: scripts (imports), scripts-db (imports), src-components (imports), src-hooks (imports), src-lib (imports), src-server (imports), src-store (imports), src-types (imports)
  callees: external-dependencies (imports), src-config (imports), src-lib (imports), src-server (imports), src-store (imports), src-transformers (imports), src-types (imports)
  tests: scripts/audio-canonical-http.test.ts, scripts/db/media-specialization-query-plan.test.ts, scripts/document-canonical-http.test.ts, scripts/image-canonical-http.test.ts, scripts/image-canonical-root-registry.test.ts
  entry: src/services/file-entity-mapper/metadata/index.ts:export * from './audio-metadata.extractor';

- `src-store` · `src/store` · database · Src
  callers: src (imports), src-components (imports), src-hooks (imports), src-lib (imports), src-providers (imports), src-services (imports), src-types (imports)
  callees: external-dependencies (imports), other-modules (imports), src-components (imports), src-lib (imports), src-services (imports), src-transformers (imports), src-types (imports)
  tests: tests/unit/file-browser-store.spec.ts
  entry: src/store/index.ts:export * from './selection.store';

- `src-transformers` · `src/transformers` · module · Src
  callers: src-components (imports), src-lib (imports), src-server (imports), src-services (imports), src-store (imports), src-types (imports)
  callees: external-dependencies (imports), src-lib (imports), src-types (imports)
  tests: tests/unit/sort-media-items.spec.ts, tests/unit/transformers/image.transformer.spec.ts
  entry: src/transformers/activity/index.ts:/**

- `src-types` · `src/types` · module · Src
  callers: other-modules (imports), src-components (imports), src-config (imports), src-hooks (imports), src-lib (imports), src-providers (imports), src-server (imports), src-services (imports), src-store (imports), src-transformers (imports)
  callees: external-dependencies (imports), src-lib (imports), src-server (imports), src-services (imports), src-store (imports), src-transformers (imports)
  tests: src/components/settings/forms/create-note-form.test.tsx, src/lib/api/taxonomy-artifacts.test.ts, src/lib/utils/folder/hierarchical-navigation.test.ts, src/services/album/__tests__/album.favorite.effect.test.ts, src/services/album/__tests__/album.service.effect.test.ts
  entry: src/types/entities/index.ts:/**

- `vite-config` · `vite.config.ts` · module · Vite.Config
  callers: (none)
  callees: external-dependencies (imports), src-config (imports)
  tests: (none)
  entry: vite.config.ts:getManualChunkName

## Edges

- electron -> external-dependencies · imports
- electron -> scripts · imports
- electron -> src-runtime · imports
- other-modules -> external-dependencies · imports
- other-modules -> src-lib · imports
- other-modules -> src-types · imports
- repository -> scripts · calls
- repository -> scripts-db · calls
- repository -> src-server · calls
- scripts -> electron · imports
- scripts -> external-dependencies · imports
- scripts -> scripts-db · imports
- scripts -> src-config · imports
- scripts -> src-lib · imports
- scripts -> src-runtime · imports
- scripts -> src-server · imports
- scripts -> src-services · imports
- scripts-db -> src-lib · imports
- scripts-db -> src-server · imports
- scripts-db -> src-services · imports
- src -> external-dependencies · imports
- src -> src-components · imports
- src -> src-hooks · imports
- src -> src-lib · imports
- src -> src-platform · imports
- src -> src-providers · imports
- src -> src-store · imports
- src-components -> external-dependencies · imports
- src-components -> other-modules · imports
- src-components -> src-config · imports
- src-components -> src-hooks · imports
- src-components -> src-lib · imports
- src-components -> src-platform · imports
- src-components -> src-providers · imports
- src-components -> src-services · imports
- src-components -> src-store · imports
- src-components -> src-transformers · imports
- src-components -> src-types · imports
- src-config -> external-dependencies · imports
- src-config -> src-components · imports
- src-config -> src-lib · imports
- src-config -> src-types · imports
- src-hooks -> external-dependencies · imports
- src-hooks -> src-components · imports
- src-hooks -> src-config · imports
- src-hooks -> src-lib · imports
- src-hooks -> src-platform · imports
- src-hooks -> src-providers · imports
- src-hooks -> src-services · imports
- src-hooks -> src-store · imports
- src-hooks -> src-types · imports
- src-lib -> external-dependencies · imports
- src-lib -> other-modules · imports
- src-lib -> src-components · imports
- src-lib -> src-config · imports
- src-lib -> src-hooks · imports
- src-lib -> src-platform · imports
- src-lib -> src-providers · imports
- src-lib -> src-server · imports
- src-lib -> src-services · imports
- src-lib -> src-store · imports
- src-lib -> src-transformers · imports
- src-lib -> src-types · imports
- src-platform -> external-dependencies · imports
- src-platform -> src · imports
- src-platform -> src-components · imports
- src-platform -> src-providers · imports
- src-providers -> external-dependencies · imports
- src-providers -> src-components · imports
- src-providers -> src-lib · imports
- src-providers -> src-store · imports
- src-providers -> src-types · imports
- src-runtime -> scripts · imports
- src-server -> external-dependencies · imports
- src-server -> src-config · imports
- src-server -> src-lib · imports
- src-server -> src-runtime · imports
- src-server -> src-services · imports
- src-server -> src-transformers · imports
- src-server -> src-types · imports
- src-services -> external-dependencies · imports
- src-services -> src-config · imports
- src-services -> src-lib · imports
- src-services -> src-server · imports
- src-services -> src-store · imports
- src-services -> src-transformers · imports
- src-services -> src-types · imports
- src-store -> external-dependencies · imports
- src-store -> other-modules · imports
- src-store -> src-components · imports
- src-store -> src-lib · imports
- src-store -> src-services · imports
- src-store -> src-transformers · imports
- src-store -> src-types · imports
- src-transformers -> external-dependencies · imports
- src-transformers -> src-lib · imports
- src-transformers -> src-types · imports
- src-types -> external-dependencies · imports
- src-types -> src-lib · imports
- src-types -> src-server · imports
- src-types -> src-services · imports
- src-types -> src-store · imports
- src-types -> src-transformers · imports
- vite-config -> external-dependencies · imports
- vite-config -> src-config · imports

## Unknown

- none

## Flows

- none
