# Zustand stores

The `store` folder centralizes global application state with Zustand.

Each entity has a subdirectory in `entities/` with slices that form one unified store.

```
store/
├── base.store.ts        # common configuration
├── entities/            # stores per entity
│   └── folder/          # example entity
├── ui/                  # shared UI slices
└── store.factory.ts     # helpers that create stores
```

Selectors live in each `store.ts` so components can use memoized access.

## Featured slices

The following slices are the main shared stores:

- **view-options**: Stores view, filter, and sort preferences in `localStorage`.
- **selection**: Centralizes file selection for the toolbar and FileBrowser.
