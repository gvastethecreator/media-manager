# API reference

Local development API: `http://localhost:4000/api`. Responses are JSON, binaries (originals and thumbnails), preview SVG, or SSE on specific endpoints.

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
- `GET /api/stats`
- `GET /api/activity`
- `GET /api/queue/*`

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
- `POST /:id/favorite`
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
- `POST /:id/favorite`
- `POST /:id/tags`
- `POST /batch/favorite`
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
- `POST /:id/favorite`
- `POST /batch/favorite`
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

Search supports global search by query, image-specific search, and FTS search over files.

## Metadata and thumbnails

### Metadata

- `/api/metadata`
- `/api/metadata-advanced`

Operations include point or bulk update and advanced extraction or diagnosis from a path or object.

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

`GET /stream` supports SSE.

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

## Consumer conventions

- Expect a mix of JSON, SVG, and binaries.
- Check whether an endpoint returns `data`, `pagination`, or a raw binary.
- Distinguish domain routes from technical routes.
- Confirm batch or specialized preview support before you add another operation.