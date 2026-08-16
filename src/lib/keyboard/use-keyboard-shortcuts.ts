/**
 * @file React hook for keyboard shortcuts integration
 * @description Hook para integrar el sistema de atajos de teclado con componentes React
 */

import { useCallback, useEffect, useRef } from 'react';
import {
	type KeyboardShortcutConfig,
	keyboardShortcutManager,
	type ShortcutHandler,
} from './keyboard-shortcut-manager';

export interface UseKeyboardShortcutsOptions {
	/** Contexto donde aplicar los shortcuts */
	context?: string;
	/** Si debe habilitar los shortcuts automáticamente */
	enabled?: boolean;
	/** Elemento donde escuchar los eventos (por defecto window) */
	target?: HTMLElement | Window | null;
}

export interface UseKeyboardShortcutsReturn {
	/** Obtener shortcuts del contexto actual */
	getShortcuts: () => KeyboardShortcutConfig[];
	/** Registrar un nuevo shortcut */
	register: (shortcut: KeyboardShortcutConfig, handler: ShortcutHandler) => void;
	/** Cambiar contexto */
	setContext: (context: string) => void;
	/** Habilitar/deshabilitar */
	setEnabled: (enabled: boolean) => void;
	/** Desregistrar un shortcut */
	unregister: (shortcut: KeyboardShortcutConfig) => void;
	/** Desregistrar por acción */
	unregisterByAction: (action: string) => void;
}

/**
 * Hook para usar keyboard shortcuts en componentes React
 */
export const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions = {}): UseKeyboardShortcutsReturn => {
	const { context = 'global', enabled = true, target = typeof window !== 'undefined' ? window : null } = options;

	const contextRef = useRef(context);
	const enabledRef = useRef(enabled);

	// Actualizar contexto cuando cambie
	useEffect(() => {
		if (contextRef.current !== context) {
			keyboardShortcutManager.setContext(context);
			contextRef.current = context;
		}
	}, [context]);

	// Actualizar estado enabled cuando cambie
	useEffect(() => {
		if (enabledRef.current !== enabled) {
			keyboardShortcutManager.setEnabled(enabled);
			enabledRef.current = enabled;
		}
	}, [enabled]);

	// Configurar event listeners
	useEffect(() => {
		if (!target) {
			return;
		}

		// Adaptar a EventListener tipado
		const handleKeyDown: EventListener = (evt) => {
			// Delegate solo si es KeyboardEvent
			if (evt instanceof KeyboardEvent) {
				keyboardShortcutManager.handleKeyDown(evt);
			}
		};

		target.addEventListener('keydown', handleKeyDown);

		return () => {
			target.removeEventListener('keydown', handleKeyDown);
		};
	}, [target]);

	// Funciones del manager
	const register = useCallback((shortcut: KeyboardShortcutConfig, handler: ShortcutHandler) => {
		keyboardShortcutManager.register(shortcut, handler);
	}, []);

	const unregister = useCallback((shortcut: KeyboardShortcutConfig) => {
		keyboardShortcutManager.unregister(shortcut);
	}, []);

	const unregisterByAction = useCallback((action: string) => {
		keyboardShortcutManager.unregisterByAction(action);
	}, []);

	const setContext = useCallback((newContext: string) => {
		keyboardShortcutManager.setContext(newContext);
		contextRef.current = newContext;
	}, []);

	const setEnabled = useCallback((newEnabled: boolean) => {
		keyboardShortcutManager.setEnabled(newEnabled);
		enabledRef.current = newEnabled;
	}, []);

	const getShortcuts = useCallback(() => {
		return keyboardShortcutManager.getShortcutsForContext(contextRef.current);
	}, []);

	return {
		register,
		unregister,
		unregisterByAction,
		setContext,
		setEnabled,
		getShortcuts,
	};
};

/**
 * Hook específico para el navegador de archivos
 */
export const useFileBrowserShortcuts = () => {
	return useKeyboardShortcuts({
		context: 'file-browser',
		enabled: true,
	});
};

/**
 * Hook específico para menús contextuales
 */
export const useContextMenuShortcuts = () => {
	return useKeyboardShortcuts({
		context: 'context-menu',
		enabled: true,
	});
};
