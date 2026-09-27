# Frontend guide

The UI is a dense workspace for large libraries. It is not a landing page and not a minimal CRUD app. The shell splits navigation, content, and detail.

```mermaid
flowchart LR
    A[Left panel] --> B[Central work area]
    B --> C[Contextual toolbar]
    B --> D[Active view]
    D --> E[Right panel / details]
```

Preserve these qualities when the UI changes:

- consistency among shell, toolbar, and panels
- tokens instead of hardcoded colors
- a clear split among navigation, content, and detail
- support for large libraries
- visible system state (loading, errors, reindex, missing previews)

## Boot sequence

```mermaid
flowchart TD
    A[main.tsx] --> B[AppShell]
    B --> C[AppProvider]
    C --> D[Desktop readiness and recovery]
    D --> E[App.tsx and RouterProvider]
    E --> F[MainLayout and views]
```

`main.tsx` mounts `AppShell` and loads global styles. The shell handles desktop readiness and restore before opening the application.

`AppProvider` owns the single `ThemeProvider` from `components/ui`, `SettingsProvider`, `ThemeSync`, `QueryProvider`, and `Toaster`.

`App.tsx` adds tooltips, view transitions, development inspection, feedback, error handling, catalog bootstrap, SSE refresh, and routing.

The file browser owns its navigation, selection, and view state through its current hooks and stores. TanStack Query owns server response caching.

## Routing

Configuration lives in `src/router.tsx`. `MainLayout` wraps the app. Routes mix eager and lazy views by domain, with wrappers for hierarchical folders and entity detail.

View families include dashboard, development, folders, all-files, all-images, videos, audios, documents, json-files, file3d, favorites, collections, albums, groups, tags, characters, places, world-items, concepts, wildcards, prompts, notes, properties, search, and settings.

## Component organization

| Path | Role |
| --- | --- |
| `src/components/ui/` | Primitives and wrappers: buttons, dialogs, tooltips, toaster, UI providers, accessibility |
| `src/components/layout/` | Application shell and panels |
| `src/components/features/file-browser/` | Folder routes, hierarchical navigation, exploration, selection |
| `src/components/features/file-viewer/` | Per-type viewing and viewer stores |
| `src/components/views/` | Product pages. Each folder is one section |

## Client state

Zustand stores live in `src/store/`: `ui.store.ts`, `selection.store.ts`, `search.store.ts`, `reindex.store.ts`, `thumbnails.store.ts`, `file-view.store.ts`, `details-panel.store.ts`, `entity-catalog-store.ts`, and per-entity stores in `entities/`.

TanStack Query, through `QueryProvider`, caches responses, invalidates queries, and syncs server state. Devtools are available in development.

Contexts also live in `src/providers/`, `src/lib/contexts/`, and `src/components/ui/`.

## Visual system

Styles load from `src/styles/app-globals.css`, `globals.css`, `scrollbar.css`, `selecto.css`, and `view-transition.css`. Tokens live in `tokens.css` and `design-tokens.css`.

The app supports multiple custom themes and resolves the system theme. See [`STYLES-AND-THEMES-GUIDE.md`](./STYLES-AND-THEMES-GUIDE.md).

## Backend interaction

The frontend talks to the backend through HTTP and the Query client, stores and hooks, SSE for refresh and progress, and preview, thumbnail, and original routes.

`EntityCatalogBootstrapper` preloads the entity catalog. `useNavigationRefresh` syncs navigation after server-side changes. Lazy routes keep the initial bundle smaller.

## Testing

Frontend tests use Vitest, jsdom, Testing Library, and `tests/setup.ts`. Setup includes `@testing-library/jest-dom/vitest`, `ResizeObserver`, `requestAnimationFrame`, `IntersectionObserver`, `matchMedia`, and SQLite pragmas for the test environment.

## How to change the frontend

1. Start at `router.tsx` and the involved view.
2. Decide whether the change lives in `components/views`, `features`, `store`, or `providers`.
3. Check whether the data comes from Query, Zustand, or both.
4. Confirm whether preview, thumbnail, or SSE already covers the flow.

## Related reading

- [`./STYLES-AND-THEMES-GUIDE.md`](./STYLES-AND-THEMES-GUIDE.md)
- [`./API-REFERENCE.md`](./API-REFERENCE.md)