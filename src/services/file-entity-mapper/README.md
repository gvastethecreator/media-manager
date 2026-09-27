# File entity mapper

`FileEntityMapperCore` in `core.service.ts` processes images, videos, audio, documents, 3D files, and JSON through the processors in `processors/`.

## Processing order

1. Check file type and size before hashing.
2. Gather file information, check whether the source already exists, and create the basic entity when needed.
3. Extract metadata through the media-specific processor.
4. Generate the thumbnail or preview through that processor.

`createEntityFromFile` runs the sequence; `processFiles` queues multiple files. `MEDIA_MANAGER_INGEST_CONCURRENCY` is interpreted by `resolveFileEntityMapperConcurrency`. Reuse the current result types from `src/types/file-entity-mapper.ts` and inspect partial outcomes.

## Integration constraints

Import `FileEntityMapperCore` from `@/services/file-entity-mapper/core.service`. The older `file-entity-mapper.service.ts` wrapper still has callers; its presence does not justify restoring removed exports.

Canonical source resolution lives in `utils/canonical-source.utils.ts`. Image creation requires an authorized canonical source. Filesystem paths used inside the server are not a renderer API: browser requests still use authorized references and asset identities.

Hashing, file information, and metrics have existing utilities under `utils/`. Use those and the current processor methods instead of copying the old three-phase examples into another service.

Folder synchronization is documented in the [service guide](../README.md). The existing `core.concurrency.test.ts` and `scripts/reindex-canonical-sync.test.ts` cover concurrency and canonical reindex behavior through the repository test runners.
