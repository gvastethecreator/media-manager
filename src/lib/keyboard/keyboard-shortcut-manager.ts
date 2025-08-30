/**
 * @file Keyboard Shortcut Manager
 * @description Sistema de gestión de atajos de teclado para el navegador de archivos
 */

export interface KeyboardShortcutConfig {
	/** Tecla principal (ej: 'a', 'Delete', 'F2', 'Escape') */
	key: string;
	/** Modificadores requeridos */
	modifiers: readonly ('ctrl' | 'shift' | 'alt' | 'meta')[];
	/** Acción a ejecutar */
	action: string;
	/** Contexto donde aplica el shortcut */
	context?: 'global' | 'file-browser' | 'file-viewer' | 'context-menu';
	/** Descripción del shortcut */
	description: string;
	/** Si debe prevenir el comportamiento por defecto */
	preventDefault?: boolean;
	/** Si debe detener la propagación del evento */
	stopPropagation?: boolean;
}

export type ShortcutHandler = (event: KeyboardEvent, config: KeyboardShortcutConfig) => void | Promise<void>;

export class KeyboardShortcutManager {
	private shortcuts: Map<string, KeyboardShortcutConfig> = new Map();
	private handlers: Map<string, ShortcutHandler> = new Map();
	private isEnabled = true;
	private currentContext = 'global';

	constructor() {
		this.registerDefaultShortcuts();
	}

	/**
	 * Registra un shortcut
	 */
	register(shortcut: KeyboardShortcutConfig, handler: ShortcutHandler): void {
		const key = this.generateShortcutKey(shortcut);
		this.shortcuts.set(key, shortcut);
		this.handlers.set(shortcut.action, handler);
	}

	/**
	 * Desregistra un shortcut
	 */
	unregister(shortcut: KeyboardShortcutConfig): void {
		const key = this.generateShortcutKey(shortcut);
		this.shortcuts.delete(key);
		this.handlers.delete(shortcut.action);
	}

	/**
	 * Desregistra un shortcut por acción
	 */
	unregisterByAction(action: string): void {
		// Encontrar y eliminar el shortcut por acción
		const entries = Array.from(this.shortcuts.entries());
		for (const [key, shortcut] of entries) {
			if (shortcut.action === action) {
				this.shortcuts.delete(key);
				break;
			}
		}
		this.handlers.delete(action);
	}

	/**
	 * Maneja eventos de teclado
	 */
	handleKeyDown = (event: KeyboardEvent): boolean => {
		if (!this.isEnabled) {
			return false;
		}

		// Ignorar eventos en inputs, textareas, etc.
		const target = event.target as HTMLElement;
		if (this.shouldIgnoreTarget(target)) {
			return false;
		}

		const shortcutKey = this.generateKeyFromEvent(event);
		const shortcut = this.shortcuts.get(shortcutKey);

		if (!shortcut) {
			return false;
		}

		// Verificar contexto
		if (shortcut.context && shortcut.context !== 'global' && shortcut.context !== this.currentContext) {
			return false;
		}

		// Ejecutar handler
		const handler = this.handlers.get(shortcut.action);
		if (handler) {
			if (shortcut.preventDefault !== false) {
				event.preventDefault();
			}
			if (shortcut.stopPropagation !== false) {
				event.stopPropagation();
			}

			try {
				handler(event, shortcut);
			} catch (error) {
				console.error('Error executing keyboard shortcut handler:', error);
			}
			return true;
		}

		return false;
	};

	/**
	 * Establece el contexto actual
	 */
	setContext(context: string): void {
		this.currentContext = context;
	}

	/**
	 * Obtiene el contexto actual
	 */
	getContext(): string {
		return this.currentContext;
	}

	/**
	 * Habilita/deshabilita el manager
	 */
	setEnabled(enabled: boolean): void {
		this.isEnabled = enabled;
	}

	/**
	 * Estado actual (solo lectura)
	 */
	getEnabled(): boolean {
		return this.isEnabled;
	}

	/**
	 * Obtiene shortcuts para un contexto específico
	 */
	getShortcutsForContext(context: string): KeyboardShortcutConfig[] {
		return Array.from(this.shortcuts.values()).filter(
			(shortcut) => shortcut.context === context || shortcut.context === 'global'
		);
	}

	/**
	 * Obtiene todos los shortcuts registrados
	 */
	getAllShortcuts(): KeyboardShortcutConfig[] {
		return Array.from(this.shortcuts.values());
	}

	/**
	 * Genera una clave única para el shortcut
	 */
	private generateShortcutKey(shortcut: KeyboardShortcutConfig): string {
		const modifiers = [...shortcut.modifiers].sort().join('+');
		return modifiers ? `${modifiers}+${shortcut.key.toLowerCase()}` : shortcut.key.toLowerCase();
	}

	/**
	 * Genera una clave desde un evento de teclado
	 */
	private generateKeyFromEvent(event: KeyboardEvent): string {
		const modifiers: string[] = [];

		if (event.ctrlKey) {
			modifiers.push('ctrl');
		}
		if (event.shiftKey) {
			modifiers.push('shift');
		}
		if (event.altKey) {
			modifiers.push('alt');
		}
		if (event.metaKey) {
			modifiers.push('meta');
		}

		modifiers.sort();

		const key = event.key.toLowerCase();
		return modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key;
	}

	/**
	 * Determina si debe ignorar el target del evento
	 */
	private shouldIgnoreTarget(target: HTMLElement): boolean {
		const tagName = target.tagName.toLowerCase();
		const isEditable = target.isContentEditable;
		const isInput = ['input', 'textarea', 'select'].includes(tagName);

		return isInput || isEditable;
	}

	/**
	 * Registra shortcuts por defecto para el navegador de archivos
	 */
	private registerDefaultShortcuts(): void {
		// Shortcuts globales
		const defaultShortcuts: Omit<KeyboardShortcutConfig, 'action'>[] = [
			{
				key: 'a',
				modifiers: ['ctrl'],
				context: 'file-browser',
				description: 'Seleccionar todo',
				preventDefault: true,
			},
			{
				key: 'delete',
				modifiers: [],
				context: 'file-browser',
				description: 'Eliminar elementos seleccionados',
				preventDefault: true,
			},
			{
				key: 'f2',
				modifiers: [],
				context: 'file-browser',
				description: 'Renombrar elemento seleccionado',
				preventDefault: true,
			},
			{
				key: 'escape',
				modifiers: [],
				context: 'global',
				description: 'Cancelar selección o cerrar menús',
				preventDefault: true,
			},
			{
				key: 'c',
				modifiers: ['ctrl'],
				context: 'file-browser',
				description: 'Copiar elementos seleccionados',
				preventDefault: true,
			},
			{
				key: 'x',
				modifiers: ['ctrl'],
				context: 'file-browser',
				description: 'Cortar elementos seleccionados',
				preventDefault: true,
			},
			{
				key: 'v',
				modifiers: ['ctrl'],
				context: 'file-browser',
				description: 'Pegar elementos',
				preventDefault: true,
			},
			{
				key: 'enter',
				modifiers: [],
				context: 'file-browser',
				description: 'Abrir elemento seleccionado',
				preventDefault: true,
			},
			{
				key: ' ',
				modifiers: [],
				context: 'file-browser',
				description: 'Vista previa del elemento seleccionado',
				preventDefault: true,
			},
		];

		// Shortcuts para navegación en menú contextual
		const contextMenuShortcuts: Omit<KeyboardShortcutConfig, 'action'>[] = [
			{
				key: 'arrowdown',
				modifiers: [],
				context: 'context-menu',
				description: 'Navegar hacia abajo en el menú',
				preventDefault: true,
			},
			{
				key: 'arrowup',
				modifiers: [],
				context: 'context-menu',
				description: 'Navegar hacia arriba en el menú',
				preventDefault: true,
			},
			{
				key: 'arrowright',
				modifiers: [],
				context: 'context-menu',
				description: 'Abrir submenú',
				preventDefault: true,
			},
			{
				key: 'arrowleft',
				modifiers: [],
				context: 'context-menu',
				description: 'Cerrar submenú',
				preventDefault: true,
			},
			{
				key: 'enter',
				modifiers: [],
				context: 'context-menu',
				description: 'Ejecutar acción seleccionada',
				preventDefault: true,
			},
			{
				key: 'escape',
				modifiers: [],
				context: 'context-menu',
				description: 'Cerrar menú contextual',
				preventDefault: true,
			},
		];

		// Registrar shortcuts con acciones por defecto (evitar forEach)
		for (const shortcut of [...defaultShortcuts, ...contextMenuShortcuts]) {
			const action = this.generateActionFromShortcut(shortcut);
			this.shortcuts.set(this.generateShortcutKey({ ...shortcut, action }), {
				...shortcut,
				action,
			});
		}
	}

	/**
	 * Genera un nombre de acción basado en el shortcut
	 */
	private generateActionFromShortcut(shortcut: Omit<KeyboardShortcutConfig, 'action'>): string {
		const { key, modifiers, context } = shortcut;

		// Mapeo de shortcuts comunes a acciones
		const actionMap: Record<string, string> = {
			'ctrl+a': 'select-all',
			delete: 'delete-selected',
			f2: 'rename-selected',
			escape: 'cancel-or-close',
			'ctrl+c': 'copy-selected',
			'ctrl+x': 'cut-selected',
			'ctrl+v': 'paste',
			enter: context === 'context-menu' ? 'context-menu-execute' : 'open-selected',
			' ': 'preview-selected',
			arrowdown: 'context-menu-down',
			arrowup: 'context-menu-up',
			arrowright: 'context-menu-right',
			arrowleft: 'context-menu-left',
		};

		const shortcutKey = this.generateShortcutKey({ ...shortcut, action: '' });
		return actionMap[shortcutKey] || `action-${shortcutKey}`;
	}
}

// Instancia singleton del manager
export const keyboardShortcutManager = new KeyboardShortcutManager();

// Hook para usar el manager en componentes React
export const useKeyboardShortcuts = () => {
	return {
		manager: keyboardShortcutManager,
		register: keyboardShortcutManager.register.bind(keyboardShortcutManager),
		unregister: keyboardShortcutManager.unregister.bind(keyboardShortcutManager),
		setContext: keyboardShortcutManager.setContext.bind(keyboardShortcutManager),
		setEnabled: keyboardShortcutManager.setEnabled.bind(keyboardShortcutManager),
	};
};
