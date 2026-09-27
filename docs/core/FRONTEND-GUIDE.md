# Frontend guide

The workspace separates navigation, content, and details. Preserve large-library browsing, visible loading and error states, and consistent controls across the shell, toolbar, and panels.

## Entry points

`src/main.tsx` mounts `AppShell` and loads global styles. The shell handles desktop readiness and recovery before opening `App.tsx` and the router.

`src/providers/app-provider.tsx` composes `ThemeProvider` from `components/ui`, `SettingsProvider`, `ThemeSync`, `QueryProvider`, and `Toaster`. TanStack Query owns server response caching.

`src/router.tsx` defines the routes and eager or lazy views. Start there, then follow the view's imports. `App.tsx` also installs tooltips, view transitions, error handling, catalog bootstrap, and SSE refresh.

## Component ownership

| Path | Responsibility |
| --- | --- |
| `src/components/layout/` and `panels/` | Workspace layout, navigation, and details |
| `src/components/views/` | Route-level pages and entity views |
| `src/components/features/file-browser/` | Browsing, navigation, selection, and view modes |
| `src/components/features/file-viewer/` | Media display, focus, and viewer controls |
| `src/components/cards/` | Entity cards; use each component's current props |
| `src/components/settings/` | Settings views and their active hooks |
| `src/components/ui/` | Shared controls, dialogs, tooltips, and accessibility |
| `src/components/forms/` | Form controls and entity inputs |

Use current component and domain types instead of copying an old entity example. The [tag input guide](../../src/components/ui/tag/README.md) covers its required provider composition; the [viewer guide](../../src/components/features/file-viewer/README.md) identifies media rendering entry points.

## Layout and keyboard behavior

Virtualized grids require a measurable container. Their layout ancestors must provide full size, a shrinking flex child, and a column layout: `h-full w-full min-h-0 min-w-0 flex-1 flex flex-col`. Inspect CentralPanel, ResizablePanel, and PanelGroup when a new wrapper produces zero width or a stuck skeleton. Document exceptions and check the rendered grid.

FileBrowser navigation uses `features/file-browser/hooks/use-keyboard.ts`. Shared shortcut registration lives separately in [the keyboard module](../../src/lib/keyboard/README.md). A configured shortcut alone does not prove that a product action is connected.

## State and data

Use [Zustand stores](../../src/store/README.md) for existing UI and entity state. Check whether the affected flow uses a store, Query, or both before changing it. Keep selection and view preferences with their current owners.

The renderer uses `/api` over HTTP. It has no Node API, `ipcRenderer`, or generic invoke bridge. SSE refreshes navigation and progress; preview, thumbnail, and original routes serve media. `EntityCatalogBootstrapper` loads the entity catalog, and `useNavigationRefresh` responds to server changes.

The client must not send raw filesystem paths. Move assets through `POST /api/files/assets/move` with `targetFolderId`. Preserve authorization and partial-success or recovery states. Do not expose undo, redo, pause, or cancel without a server mutation and durable compensation. See the [API reference](API-REFERENCE.md).

## Styles

Use semantic tokens and the existing theme provider. [Styles and themes](STYLES-AND-THEMES-GUIDE.md) covers colors and theme registration; [animations](../guides/ANIMATIONS-GUIDE.md) describes the current motion implementation and its limits.

## Verification

Reuse the affected tests. `bun run test` isolates databases; frontend cases use Vitest, jsdom, Testing Library, and `tests/setup.ts`.

For UI behavior, exercise the real route in a browser. Verify navigation, selection, settings, loading and error states, and any affected server mutation. A first-paint screenshot does not prove the flow. Use `bun run test:e2e` for the existing browser suite when that scope is needed.
