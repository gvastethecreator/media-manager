# Client state

Zustand stores own shared UI state and existing entity operations. TanStack Query, configured by `src/providers/query-provider.tsx`, caches server responses. Follow the current consumer before deciding which state owner to change.

## Entry points

| Path | State |
| --- | --- |
| `selection.store.ts` | Shared selection |
| `ui/view-options.slice.ts` | View, filter, and sort preferences |
| `ui.store.ts` | Shared interface state |
| `search.store.ts` | Search state |
| `reindex.store.ts` | Reindex progress |
| `entities/` | Domain stores, actions, selectors, and slices |

Other feature stores remain alongside these files. Use each store's current actions and types; entity families do not all implement the same API. Existing persistence configuration defines which preferences survive reloads. Temporary loading, error, and hover state should remain temporary.

Components select the state they need. Mutations use the current HTTP client or store action, then update or invalidate the affected data. Keep selection, navigation, and Query invalidation consistent after a mutation.

For layout and API boundaries, see the [frontend guide](../../docs/core/FRONTEND-GUIDE.md). Verify affected behavior through its existing test or browser flow.
