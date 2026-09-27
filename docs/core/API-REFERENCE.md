# API reference

Local development API: `http://localhost:4000/api`. Responses are JSON, binaries (originals and thumbnails), preview SVG, or SSE on specific endpoints.

This page describes exposed route families. Resolve exact payloads and status codes from the mounted module in `src/server/routes/` and its existing HTTP tests. A method in a service is not automatically a public endpoint.

## Base URL and conventions

- Local server: `http://localhost:4000`
- API base: `http://localhost:4000/api`

Routes outside `/api`:

- `GET /health`
- Compatibility redirect from `/search` to `/api/search`

## Health and system

- `GET /health`

Operational state, metrics, and system utilities:

- `GET /api/system/*`
- `GET /api/activity`
- `GET /api/queue/*`

Global `/api/stats/*` and `/api/system/stats` requests return `410` with `AUTHORIZED_SCOPE_REQUIRED`. Global aggregates remain unavailable until they can respect authorized media roots.

## Folders

Base: `/api/folders`

- `GET /`
- `GET /tree`
- `GET /root`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`
- `GET /:id/ancestors`
- `GET /:id/files`
- `GET /:id/files/stats`
- `GET /:id/preview`
- `POST /reindex-all`
- `POST /:id/reindex`
- `POST /reindex` (legacy/compatibility)

This family covers folder navigation and structure, visual folder previews, aggregated folder content, and folder or global reindex.

## Images

Base: `/api/images`

- `GET /`
- `GET /favorites`
- `GET /by-hash/:hash`
- `GET /folder/:folderId`
- `GET /folder/:folderId/count`
- `POST /`
- `GET /:id/stats`
- `PATCH /:id`
- `POST /:id/tags`
- `DELETE /:id`
- `DELETE /batch`
- `POST /:id/thumbnail/generate`
- `GET /:id/thumbnail`
- `GET /:id/content`
- `GET /:id/original`
- `GET /:id`

This family covers image CRUD, favorites and batch operations, thumbnails and original bytes, and queries by folder, hash, and stats.

## Video and audio

### Videos

Base: `/api/videos`

This family includes list, detail, favorites, delete, and other video-domain endpoints.

### Audio

Base: `/api/audio`

Endpoints in `audios.effect.ts`:

- `GET /`
- `GET /favorites`
- `GET /stats/format`
- `GET /by-hash/:hash`
- `GET /folder/:folderId`
- `GET /folder/:folderId/count`
- `GET /:id/waveform`
- `GET /:id`
- `GET /:id/stats`
- `POST /`
- `PATCH /:id`
- `DELETE /:id`
- `DELETE /batch`

Preview routes:

- `GET /api/audio-waveforms/:id/waveform`
- `GET /api/audio-waveforms/:id/info`
- `GET /api/audio-waveforms/:id/waveform/preview`

## Organizers

### Albums

Base: `/api/albums`

Album operations include list, get by id, create, update, delete, add or remove relations, and query content.

### Collections

Base: `/api/collections`

The collection pattern matches albums.

### Groups, wildcards, notes, properties, world-items

`secondary-services.effect.ts` mounts these bases:

- `/api/groups`
- `/api/wildcards`
- `/api/notes`
- `/api/properties`
- `/api/world-items`

## Worldbuilding

### Characters

Base: `/api/characters`

Character operations include list, detail, create, update, delete, favorites, and relations with images or other entities.

### Places and concepts

- `/api/places`
- `/api/concepts`

### Prompts

- `/api/prompts`

These three families come from `worldbuilding.effect.ts`.

## Documents, JSON, 3D, and uploaded images

`file-services.effect.ts` mounts several sub-APIs.

### 3D

Base: `/api/file3ds`

Operations: list, detail, CRUD, and `GET /:id/thumbnail`.

### Documents

Base: `/api/documents`

Operations: list, detail, CRUD, `GET /:id/preview`, and `GET /:id/images`.

### JSON files

Base: `/api/json-files`

Operations: list, detail, CRUD, `GET /:id/preview`, and `GET /:id/images`.

### Uploaded images

Base: `/api/uploaded-images`

- `GET /stats`
- `GET /`
- `GET /:id`
- `POST /upload`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

## Filesystem and download

The client never sends a raw filesystem path. Routes take an authorized root reference or an asset identity.

### Filesystem

Base: `/api/files`

Live endpoints:

- `GET /roots`
- `GET /directory` with an authorized query reference
- `GET /content` with `assetId` and `assetType`, or an authorized query reference
- `POST /assets/move` with `assets` and `targetFolderId`
- `GET /recovery-status`
- `POST /recovery/reconcile`

These raw mutations return `410` with `DOMAIN_OPERATION_REQUIRED`:

- `POST /directory`
- `PUT /rename`
- `POST /copy`
- `POST /move`

Move assets with `POST /api/files/assets/move` and a `targetFolderId`.

### Downloads

Base: `/api/download`

- `POST /` with `{ "asset": { "assetId", "assetType" } }` or an authorized `source`
- `GET /` with `assetId` and `assetType`, or an authorized query reference

Both flows return `Content-Type`, `Content-Length`, `Content-Disposition` with an encoded name, and `X-Content-Type-Options: nosniff`.

## Search

Base: `/api/search`

- `GET /`
- `GET /images`
- `GET /fts`

Search supports global search by query, image-specific search, and FTS search over files. The FTS response contains `items`, `total`, and `engine`. FTS results include a numeric `score` in ascending ranking order. `DISABLE_FTS5=1` selects the LIKE fallback; `SEARCH_FTS_REQUIRE=1` returns `503` with `required: true` when FTS is unavailable. Results remain filtered by root permissions.

## Metadata and thumbnails

### Metadata

- `/api/metadata`
- `/api/metadata-advanced`

`PUT /api/metadata/:id` updates one record. `PUT /api/metadata/bulk-update` accepts `{ updates: [{ id, data }] }` and returns `{ updated, errors }`. Advanced extraction and diagnosis remain under `/api/metadata-advanced`.

### Thumbnails

- `/api/thumbnails`
- `/api/thumbnails/unified`
- `/api/json`
- `/api/3d`

The preview system is split. Not every preview comes from the same router.

## Favorites, settings, profiles, and events

- Favorites: `/api/favorites`
- Settings: `/api/settings`
- Profiles: `/api/profiles`
- Events: `/api/events`

Use `POST /api/favorites/toggle` with `{ entityType, entityId }`, or `PUT /api/favorites/state` with an explicit `isFavorite` value. Former entity-specific `/:id/favorite` and `/batch/favorite` routes return `410` and identify `/api/favorites/toggle` as their successor.

`GET /api/events/stream` supports SSE.

## Reindex and operational logs

### Incremental reindex

Base: `/api/reindex`

### Reindex logs

Base: `/api/reindex-logs`

- `GET /stats`
- `GET /errors`
- `GET /warnings`
- `GET /summary`
- `POST /cleanup`
- `GET /recent`

## Debug and internal testing

These routes help development and diagnosis. They are not the product API:

- `/api/debug`
- `/api/debug-entity-types`
- `/api/test-characters`

## Types and service boundaries

Routes call services; services own Drizzle access; transformers own DTO conversion. Import the current entity contracts from `src/types/entities/<entity>/types.ts` and the existing schema files where present. Do not import legacy database types or assume that all entity families expose the same enriched shape. Preserve domain IDs, nullable fields, and serialization at the active route boundary.

## Consumer conventions

- Expect a mix of JSON, SVG, and binaries.
- Check whether an endpoint returns `data`, `pagination`, or a raw binary.
- Distinguish domain routes from technical routes.
- Confirm batch or specialized preview support before you add another operation.