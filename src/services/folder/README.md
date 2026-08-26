# FolderService: Folder management service

## Description

This central service manages Folders, indexing, reindex, deletion, and real-time event emission.

- **Stack:** Bun Runtime, React, Drizzle ORM, custom events, Express.
- **Location:** `src/services/folder/`

## Modular structure (refactored)

The service is split into specialized modules to improve maintainability.

### `folder-api.service.ts` (~105 lines)

**Responsibility**: CRUD operations that use the fetch API (client)

- Functions: `getFolders`, `getFolder`, `createFolder`, `updateFolder`, `deleteFolder`, `getFoldersWithStats`
- **Use**: React components, TanStack Query hooks

### `folder-stats.service.ts` (~140 lines)

**Responsibility**: Optimized statistics with direct SQL

- Main function: `getFolderMediaCountsBatch(folderIds[])` - Batch counts (avoids N+1)
- **Use**: Transformers, backend services

### `index.ts`

**Responsibility**: Unified entry point

- Re-exports all modules while the public API stays unchanged

## Supported events

The service emits the following events:

- `PROGRESS` → `folder:progress`
- `COMPLETE` → `folder:complete`
- `ERROR` → `folder:error`
- `REINDEX_ALL_PROGRESS` → `folder:reindexAll:progress`
- `REINDEX_ALL_COMPLETE` → `folder:reindexAll:complete`

## Event emission diagram

```mermaid
graph TD
  S[Folder operation (index/reindex)] -->|Success| C[emitEvent(COMPLETE)]
  S -->|Error| E[emitEvent(ERROR)]
  S -->|Progress| P[emitEvent(PROGRESS)]
  G[Global reindex] -->|Progress| GP[emitEvent(REINDEX_ALL_PROGRESS)]
  G -->|Finishes| GC[emitEvent(REINDEX_ALL_COMPLETE)]
```

## Emission and propagation flow

When a process finishes, the service emits the matching event (`COMPLETE` or `REINDEX_ALL_COMPLETE`).

The event is mapped and propagated to the central system (`folder:complete`, `folder:reindexAll:complete`).

The frontend listens to these events and updates the UI in real time.

## Emission example

```ts
this.emitEvent(FOLDER_EVENTS.COMPLETE, folderResponse);
this.emitEvent(FOLDER_EVENTS.REINDEX_ALL_COMPLETE, completionStatus);
```

## Best practices

Always emit the completion event after success.

Emit `ERROR` on failures and clear state.

Document any relevant change in this README.
