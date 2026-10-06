/**
 * @file Integration test for keyboard shortcuts
 * @description Test de integración básico para verificar que el sistema funciona
 */

import { KeyboardShortcutManager } from '../keyboard-shortcut-manager';

describe('Keyboard Shortcuts Integration', () => {
	let manager: KeyboardShortcutManager;

	beforeEach(() => {
		manager = new KeyboardShortcutManager();
	});

	it('should have default shortcuts registered', () => {
		const shortcuts = manager.getAllShortcuts();

		// Verificar que hay shortcuts por defecto
		expect(shortcuts.length).toBeGreaterThan(0);

		// Verificar algunos shortcuts específicos
		const selectAllShortcut = shortcuts.find((s) => s.action === 'select-all');
		expect(selectAllShortcut).toBeDefined();
		expect(selectAllShortcut?.key).toBe('a');
		expect(selectAllShortcut?.modifiers).toContain('ctrl');

		const deleteShortcut = shortcuts.find((s) => s.action === 'delete-selected');
		expect(deleteShortcut).toBeDefined();
		expect(deleteShortcut?.key).toBe('delete');

		const escapeShortcut = shortcuts.find((s) => s.action === 'cancel-or-close');
		expect(escapeShortcut).toBeDefined();
		expect(escapeShortcut?.key).toBe('escape');
	});

	it('should filter shortcuts by context', () => {
		const fileBrowserShortcuts = manager.getShortcutsForContext('file-browser');
		const contextMenuShortcuts = manager.getShortcutsForContext('context-menu');

		// File browser debería tener shortcuts específicos + globales
		expect(fileBrowserShortcuts.length).toBeGreaterThan(0);

		// Context menu debería tener shortcuts de navegación
		expect(contextMenuShortcuts.length).toBeGreaterThan(0);

		// Verificar que hay shortcuts específicos para cada contexto
		const hasFileBrowserSpecific = fileBrowserShortcuts.some((s) => s.context === 'file-browser');
		const hasContextMenuSpecific = contextMenuShortcuts.some((s) => s.context === 'context-menu');

		expect(hasFileBrowserSpecific).toBe(true);
		expect(hasContextMenuSpecific).toBe(true);
	});

	it('should handle context switching', () => {
		expect(manager.getContext()).toBe('global');

		manager.setContext('file-browser');
		expect(manager.getContext()).toBe('file-browser');

		manager.setContext('context-menu');
		expect(manager.getContext()).toBe('context-menu');
	});

	it('should enable/disable functionality', () => {
		expect(manager.getEnabled()).toBe(true);

		manager.setEnabled(false);
		expect(manager.getEnabled()).toBe(false);

		manager.setEnabled(true);
		expect(manager.getEnabled()).toBe(true);
	});
});
