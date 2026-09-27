# File viewers

`file-viewer.tsx` composes the main viewer; `multi-entity-viewer.tsx` selects viewers by entity type. `file-content-renderer.tsx` and the modules in `viewers/` handle media rendering. Use their current props and `file-viewer.types.ts` when extending a view.

## Responsibilities

- `use-focus-management.ts`: viewer focus.
- `use-keyboard-navigation.ts`: keyboard navigation.
- `use-zoom-pan.ts`: zoom and pan state.
- `use-image-loader.ts`: image loading.
- `use-toolbar-actions.ts` and `toolbar-actions.tsx`: toolbar behavior.
- `file-info-panel.tsx` and `thumbnail-navigation.tsx`: details and neighboring items.

The viewer family includes image, video, audio, document, Markdown, JSON, 3D, and generic-file views. Browser codec support and the selected viewer determine playback and preview behavior; an indexed extension does not guarantee browser playback.

Use the existing content, original, thumbnail, and download endpoints described in the [API reference](../../../../docs/core/API-REFERENCE.md). Do not expose raw paths to the client.

When changing a viewer, exercise open, next/previous, close, focus return, and the affected media control in a real browser. Preserve loading, missing-preview, and failure states. Follow the [frontend guide](../../../../docs/core/FRONTEND-GUIDE.md) for layout and state ownership.
