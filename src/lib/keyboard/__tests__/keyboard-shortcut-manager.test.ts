/**
 * @file Tests for KeyboardShortcutManager
 * @description Tests básicos para el sistema de atajos de teclado
 */

import { vi, type Mock } from 'vitest';
import { KeyboardShortcutManager, type ShortcutHandler } from '../keyboard-shortcut-manager';

describe('KeyboardShortcutManager', () => {
	let manager: KeyboardShortcutManager;
	let mockHandler: Mock<ShortcutHandler>;

	beforeEach(() => {
		manager = new KeyboardShortcutManager();
		mockHandler = vi.fn();
		// Configurar document.activeElement mock para JSDOM
		if (!document.activeElement) {
			document.body.focus();
		}
	});

	it('should register and execute shortcuts', () => {
		const shortcut = {
			key: 'a',
			modifiers: ['ctrl'] as const,
			action: 'test-action',
			description: 'Test shortcut',
		};

		manager.register(shortcut, mockHandler);

		// Simular evento de teclado con target asignado posteriormente (KeyboardEventInit no acepta target)
		const event = new KeyboardEvent('keydown', {
			key: 'a',
			ctrlKey: true,
		});
		Object.defineProperty(event, 'target', { value: document.body, writable: false });

		const handled = manager.handleKeyDown(event);

		expect(handled).toBe(true);
		expect(mockHandler).toHaveBeenCalledWith(event, shortcut);
	});

	it('should not execute shortcuts when disabled', () => {
		const shortcut = {
			key: 'a',
			modifiers: ['ctrl'] as const,
			action: 'test-action',
			description: 'Test shortcut',
		};

		manager.register(shortcut, mockHandler);
		manager.setEnabled(false);

		const event = new KeyboardEvent('keydown', {
			key: 'a',
			ctrlKey: true,
		});

		const handled = manager.handleKeyDown(event);

		expect(handled).toBe(false);
		expect(mockHandler).not.toHaveBeenCalled();
	});

	it('should respect context restrictions', () => {
		const shortcut = {
			key: 'a',
			modifiers: ['ctrl'] as const,
			action: 'test-action',
			description: 'Test shortcut',
			context: 'file-browser' as const,
		};

		manager.register(shortcut, mockHandler);
		manager.setContext('different-context');

		const event = new KeyboardEvent('keydown', {
			key: 'a',
			ctrlKey: true,
		});
		Object.defineProperty(event, 'target', { value: document.body, writable: false });

		const handled = manager.handleKeyDown(event);

		expect(handled).toBe(false);
		expect(mockHandler).not.toHaveBeenCalled();
	});

	it('should execute global shortcuts in any context', () => {
		const shortcut = {
			key: 'escape',
			modifiers: [] as const,
			action: 'global-action',
			description: 'Global shortcut',
			context: 'global' as const,
		};

		manager.register(shortcut, mockHandler);
		manager.setContext('any-context');

		const event = new KeyboardEvent('keydown', { key: 'escape' });
		Object.defineProperty(event, 'target', { value: document.body, writable: false });

		const handled = manager.handleKeyDown(event);

		expect(handled).toBe(true);
		expect(mockHandler).toHaveBeenCalled();
	});

	it('should unregister shortcuts', () => {
		const shortcut = {
			key: 'a',
			modifiers: ['ctrl'] as const,
			action: 'test-action',
			description: 'Test shortcut',
		};

		manager.register(shortcut, mockHandler);
		manager.unregister(shortcut);

		const event = new KeyboardEvent('keydown', {
			key: 'a',
			ctrlKey: true,
		});
		Object.defineProperty(event, 'target', { value: document.body, writable: false });

		const handled = manager.handleKeyDown(event);

		expect(handled).toBe(false);
		expect(mockHandler).not.toHaveBeenCalled();
	});

	it('should get shortcuts for context', () => {
		const globalShortcut = {
			key: 'q',
			modifiers: [] as const,
			action: 'custom-global-action',
			description: 'Custom Global shortcut',
			context: 'global' as const,
		};

		const contextShortcut = {
			key: 'w',
			modifiers: ['ctrl'] as const,
			action: 'custom-context-action',
			description: 'Custom Context shortcut',
			context: 'file-browser' as const,
		};

		manager.register(globalShortcut, mockHandler);
		manager.register(contextShortcut, mockHandler);

		const fileBrowserShortcuts = manager.getShortcutsForContext('file-browser');

		// Verifica que se incluyen los shortcuts custom registrados
		expect(fileBrowserShortcuts.some((s) => s.action === 'custom-global-action')).toBe(true);
		expect(fileBrowserShortcuts.some((s) => s.action === 'custom-context-action')).toBe(true);
	});
});
