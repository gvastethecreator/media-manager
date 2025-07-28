/**
 * @file Keyboard module exports
 * @description Exportaciones principales del módulo de teclado
 */

export { KeyboardShortcutManager, keyboardShortcutManager } from './keyboard-shortcut-manager';
export type { KeyboardShortcutConfig, ShortcutHandler } from './keyboard-shortcut-manager';

export { useKeyboardShortcuts, useFileBrowserShortcuts, useContextMenuShortcuts } from './use-keyboard-shortcuts';
export type { UseKeyboardShortcutsOptions, UseKeyboardShortcutsReturn } from './use-keyboard-shortcuts';

export { useContextMenuNavigation } from './use-context-menu-navigation';
export type { ContextMenuNavigationOptions, ContextMenuNavigationReturn } from './use-context-menu-navigation';