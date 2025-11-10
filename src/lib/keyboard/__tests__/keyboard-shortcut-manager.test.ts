/**
 * @file Tests for KeyboardShortcutManager
 * @description Tests básicos para el sistema de atajos de teclado
 */

import { beforeEach, describe, expect, it,vi } from 'vitest';
import { KeyboardShortcutManager } from '../keyboard-shortcut-manager';

describe('KeyboardShortcutManager', () => {
	let manager: KeyboardShortcutManager;
	let mockHandler: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		manager = new KeyboardShortcutManager();
		mockHandler = vi.fn();
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

		const handled = manager.handleKeyDown(event);

		expect(handled).toBe(false);
		expect(mockHandler).not.toHaveBeenCalled();
	});

	it('should get shortcuts for context', () => {
		// Limpiar shortcuts por defecto para este test
		manager.clearAll();

		const globalShortcut = {
			key: 'escape',
			modifiers: [] as const,
			action: 'global-action',
			description: 'Global shortcut',
			context: 'global' as const,
		};

		const contextShortcut = {
			key: 'a',
			modifiers: ['ctrl'] as const,
			action: 'context-action',
			description: 'Context shortcut',
			context: 'file-browser' as const,
		};

		manager.register(globalShortcut, mockHandler);
		manager.register(contextShortcut, mockHandler);

		const fileBrowserShortcuts = manager.getShortcutsForContext('file-browser');

		expect(fileBrowserShortcuts).toHaveLength(2); // global + context-specific
		expect(fileBrowserShortcuts.some((s) => s.action === 'global-action')).toBe(true);
		expect(fileBrowserShortcuts.some((s) => s.action === 'context-action')).toBe(true);
	});
});
