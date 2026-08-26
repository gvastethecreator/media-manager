# API reference

This reference groups the API by functional families. The backend includes business routes, operational support, previews, streams, and debug utilities.

## 1. Base URL and conventions

### Base URL

The local development server uses these URLs:

- Local development: `http://localhost:4000`
- API base: `http://localhost:4000/api`

### Endpoints outside `/api`

The following routes sit outside `/api`:

- `GET /health`
- Compatibility redirect from `/search` to `/api/search`

### Response formats

The API returns these payload types:

- JSON
- binaries (originals, thumbnails)
- preview SVG
- SSE streams on specific endpoints

## 2. Health and system

### Health

Use this endpoint to check process health:

- `GET /health`

### System and operations

Use these routes for operational state, metrics, and system utilities:

- `GET /api/system/*`
- `GET /api/stats`
- `GET /api/activity`
- `GET /api/queue/*`

## 3. Folders

Base: `/api/folders`

### Main endpoints observed in images

The folder family exposes these endpoints:

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

### Role of this family

This family covers the following work:

- folder navigation and structure
- visual folder previews
- aggregated folder content
- folder or global reindex

## 4. Images

Base: `/api/images`

### Main endpoints observed

The image family exposes these endpoints:

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

### What this family covers

This family covers the following work:

- image CRUD
- favorites and batch operations
- thumbnails and original bytes
- queries by folder, hash, and stats

## 5. Video and audio

### Videos

Base: `/api/videos`

This family includes list, detail, favorites, delete, and other video-domain endpoints.

### Audio

Base: `/api/audio`

Endpoints observed in `audios.effect.ts`:

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

### Specialized audio preview

The following preview routes also exist:

- `GET /api/audio-waveforms/:id/waveform`
- `GET /api/audio-waveforms/:id/info`
- `GET /api/audio-waveforms/:id/waveform/preview`

## 6. Organizers

### Albums

Base: `/api/albums`

The observed pattern includes these operations:

- list
- get by id
- create
- update
- delete
- add or remove relations
- query content

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

## 7. Worldbuilding

### Characters

Base: `/api/characters`

The observed pattern includes these operations:

- list
- detail
- create
- update
- delete
- favorites
- relations with images or other entities

### Places and concepts

These families use the following bases:

- `/api/places`
- `/api/concepts`

### Prompts

Base:

- `/api/prompts`

These three families come from `worldbuilding.effect.ts`.

## 8. Documents, JSON, 3D, and uploaded images

`file-services.effect.ts` mounts several sub-APIs.

### 3D

Base: `/api/file3ds`

This family includes these operations:

- list
- detail
- CRUD
- `GET /:id/thumbnail`

### Documents

Base: `/api/documents`

This family includes these operations:

- list
- detail
- CRUD
- `GET /:id/preview`
- `GET /:id/images`

### JSON files

Base: `/api/json-files`

This family includes these operations:

- list
- detail
- CRUD
- `GET /:id/preview`
- `GET /:id/images`

### Uploaded images

Base: `/api/uploaded-images`

This family exposes these endpoints:

- `GET /stats`
- `GET /`
- `GET /:id`
- `POST /upload`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

## 9. Filesystem and download

### Filesystem

Base: `/api/files`

Observed endpoints:

- `GET /directory/:path`
- `POST /directory`
- `PUT /rename`
- `POST /copy`
- `POST /move`
- `GET /content`

### Downloads

Base: `/api/download`

Observed operations:

- `POST /` with body `{ "path": "..." }`
- `GET /?path=...`

Both variants download the binary directly. The backend returns `Content-Type`, `Content-Length`, `Content-Disposition` with an encoded name, and `X-Content-Type-Options: nosniff`.

## 10. Search

Base: `/api/search`

### Observed endpoints

The search family exposes these endpoints:

- `GET /`
- `GET /images`
- `GET /fts`

### Behavior

Search supports these modes:

- global search by query
- image-specific search
- FTS search over files

## 11. Metadata and thumbnails

### Metadata

These families use the following bases:

- `/api/metadata`
- `/api/metadata-advanced`

Observed operations:

- point or bulk update
- advanced extraction or diagnosis from a path or object

### Thumbnails

These families use the following bases:

- `/api/thumbnails`
- `/api/thumbnails/unified`
- `/api/json`
- `/api/3d`

The preview system is split. Not every preview comes from the same router.

## 12. Favorites, settings, profiles, and events

### Favorites

Base: `/api/favorites`

### Settings

Base: `/api/settings`

### Profiles

Base: `/api/profiles`

### Events

Base: `/api/events`

Observed operations also include `GET /stream`, which supports SSE and eventing scenarios.

## 13. Reindex and operational logs

### Incremental reindex

Base: `/api/reindex`

### Reindex logs

Base: `/api/reindex-logs`

Observed endpoints:

- `GET /stats`
- `GET /errors`
- `GET /warnings`
- `GET /summary`
- `POST /cleanup`
- `GET /recent`

## 14. Debug and internal testing

The backend exposes auxiliary routes. Do not treat them as the main product API.

Relevant bases:

- `/api/debug`
- `/api/debug-entity-types`
- `/api/test-characters`

These routes help development and diagnosis. They are not the clean product surface.

## 15. Practical conventions for internal consumers

Follow these rules when you consume the API:

- Expect a mix of JSON, SVG, and binaries.
- Check whether an endpoint returns `data`, `pagination`, or a raw binary.
- Distinguish domain routes from technical routes.
- Confirm batch or specialized preview support before you add another operation.

## 16. Related documentation

The following documents complete this reference:

- [`./ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`./SERVICES-GUIDE.md`](./SERVICES-GUIDE.md)
- [`./IMPLEMENTATION-DETAILS.md`](./IMPLEMENTATION-DETAILS.md)
