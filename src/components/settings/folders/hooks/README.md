# useFolders and related hooks

## Description

This module contains the main `useFolders` hook and helper hooks for Folder management in application settings.

The hooks manage state, CRUD operations, reindex, polling, real-time events, and backend synchronization.

- **Stack:** Vite, React 19, Zustand, React Query, HTTP routes, Zod, custom events.
- **Location:** `src/components/settings/folders/hooks/`

## Included hooks

The module includes the following hooks:

- `useFolders`: Main hook that orchestrates the full Folder flow.
- `useFoldersState`: Local state and actions (folders, stats, errors).
- `useFoldersPolling`: Safe polling for process status.
- `useFoldersEvents`: Subscription to backend events.
- `useFoldersOperations`: CRUD and business operations.

## Real-time update flow

```mermaid
graph TD
  A[Backend process finishes] --> B[Event/Callback onComplete]
  B --> C[setProcessStatus(complete)]
  C --> D[loadFolders() + loadStats()]
  D --> E[UI refreshes state]
  E --> F[setTimeout clears state]
```

## Usage example

```tsx
import { useFolders } from './hooks/use-folders';

function FoldersSettings() {
  const {
    folders, stats, isProcessing, processStatus,
    handleAddFolder, handleReindexFolder, ...
  } = useFolders();

  // ...render and logic
}
```

## Best practices

Always validate with Zod before you persist data.

Use the canonical types from `@/app/actions/folders/folder-types.ts`.

Do not import Prisma types in any client file.

Document any relevant change in this README.

## References

- [Folder transformers](../../../transformers/folder/README.md)
- [Event architecture](../../../lib/events/README.md)
