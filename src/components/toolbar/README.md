# Main toolbar

This toolbar sits at the top of the application.

The toolbar manages bulk file actions and the view mode.

The directory includes the following files:

- **main-toolbar.tsx**: Holds general action buttons.
- **entity-details.tsx**: Shows information for the selected entity.

The toolbar reads view mode and sort order from the `view-options` slice.

The toolbar gets file selection from `selection.store`.

FileBrowser and the toolbar share that state without coupling.

These components integrate with the main layout.
