# Keyboard shortcuts

`keyboard-shortcut-manager.ts` stores shortcut definitions and handlers, filters events by context, and ignores text-entry targets. `use-keyboard-shortcuts.ts` connects it to React and removes its event listener on cleanup. `use-context-menu-navigation.ts` handles menu navigation.

Import the existing hooks from `@/lib/keyboard`. `useKeyboardShortcuts` accepts `context`, `enabled`, and `target`; it returns registration, context, and enable/disable methods. Use `register` with a `KeyboardShortcutConfig` and the action handler. Pair registrations with their existing cleanup path.

## Contexts and behavior

The manager recognizes context names such as `global`, `file-browser`, `context-menu`, and `file-viewer`. Global shortcuts apply across contexts. Inspect the current definitions and connected handlers before advertising a shortcut: registration alone does not implement a filesystem mutation.

FileBrowser's grid navigation uses `src/components/features/file-browser/hooks/use-keyboard.ts`. It handles active items, arrow navigation, and selection callbacks. Viewer navigation has its own hook in `src/components/features/file-viewer/use-keyboard-navigation.ts`.

Keep focus and editable fields working when changing shortcuts. Existing tests are in `__tests__/`; use the repository's isolated `bun run test` command and a real browser flow for behavior that depends on focus or layout. See the [frontend guide](../../../docs/core/FRONTEND-GUIDE.md).
