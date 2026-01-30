/**
 * @file Keyboard module exports
 * @description Exportaciones principales del módulo de teclado
 */

export type { KeyboardShortcutConfig, ShortcutHandler } from './keyboard-shortcut-manager';
export { KeyboardShortcutManager, keyboardShortcutManager } from './keyboard-shortcut-manager';
export type { ContextMenuNavigationOptions, ContextMenuNavigationReturn } from './use-context-menu-navigation';
export { useContextMenuNavigation } from './use-context-menu-navigation';
export type { UseKeyboardShortcutsOptions, UseKeyboardShortcutsReturn } from './use-keyboard-shortcuts';
export { useContextMenuShortcuts, useFileBrowserShortcuts, useKeyboardShortcuts } from './use-keyboard-shortcuts';
