/**
 * Undo/Redo Manager Service
 *
 * This service provides undo/redo capabilities for file operations
 * such as copy, move, delete, and rename operations. It maintains
 * an action history and allows users to revert operations.
 */

import { clientLogger } from '@/lib/logger/client-logger';

// Browser-compatible EventEmitter implementation
interface UndoRedoEvents {
	payload: UndoRedoState;
	type: 'stateChanged';
}
type URListener<T> = (payload: T) => void;

class EventEmitter {
	private readonly events = new Map<string, Set<URListener<any>>>();

	on<TEvent extends UndoRedoEvents['type']>(
		event: TEvent,
		listener: URListener<Extract<UndoRedoEvents, { type: TEvent }>['payload']>
	): this {
		const set = this.events.get(event) ?? new Set();
		set.add(listener as URListener<any>);
		this.events.set(event, set);
		return this;
	}

	emit<TEvent extends UndoRedoEvents['type']>(
		event: TEvent,
		payload: Extract<UndoRedoEvents, { type: TEvent }>['payload']
	): boolean {
		const set = this.events.get(event);
		if (!set) return false;
		for (const listener of set) {
			try {
				(listener as URListener<typeof payload>)(payload);
			} catch (error) {
				clientLogger.error('Error in event listener:', error);
			}
		}
		return true;
	}

	removeListener<TEvent extends UndoRedoEvents['type']>(
		event: TEvent,
		listener: URListener<Extract<UndoRedoEvents, { type: TEvent }>['payload']>
	): this {
		const set = this.events.get(event);
		if (set) set.delete(listener as URListener<any>);
		return this;
	}

	removeAllListeners(event?: UndoRedoEvents['type']): this {
		if (event) this.events.delete(event);
		else this.events.clear();
		return this;
	}
}

import { getEntityName, getEntityPath } from '@/lib/utils/entity-properties.utils';
import type { AnyEntityWithStats } from '@/types/entities';
import { copyFile, deleteFile, moveFile, renameFile } from '../file/file.service';
import { toastService } from '../toast/toast.service';

// Undo/Redo action types
export interface UndoableAction {
	/** Check if action can be undone */
	canUndo: () => boolean;
	/** Action description for UI */
	description: string;
	/** Execute the action */
	execute: () => Promise<void>;
	/** Unique action identifier */
	id: string;
	/** Original data for undo operation */
	originalData?: any;
	/** Target data for redo operation */
	targetData?: any;
	/** Timestamp when action was executed */
	timestamp: number;
	/** Action type */
	type: UndoActionType;
	/** Undo the action */
	undo: () => Promise<void>;
}

export type UndoActionType =
	| 'copy'
	| 'move'
	| 'delete'
	| 'rename'
	| 'create-folder'
	| 'paste'
	| 'duplicate'
	| 'add-to-collection'
	| 'remove-from-collection'
	| 'add-tag'
	| 'remove-tag';

export interface UndoRedoOptions {
	/** Enable automatic cleanup of old actions */
	autoCleanup?: boolean;
	/** Cleanup interval in milliseconds */
	cleanupInterval?: number;
	/** Maximum number of actions to keep in history */
	maxHistorySize?: number;
}

export interface UndoRedoState {
	/** Can redo next action */
	canRedo: boolean;
	/** Can undo current action */
	canUndo: boolean;
	/** Current position in history */
	currentIndex: number;
	/** Last action description */
	lastAction?: string;
	/** Total actions in history */
	totalActions: number;
}

/**
 * Undo/Redo Manager Service
 * Manages action history and provides undo/redo functionality
 */
class UndoRedoManager extends EventEmitter {
	private history: UndoableAction[] = [];
	private currentIndex = -1;
	private readonly options: Required<UndoRedoOptions>;
	private cleanupTimer?: ReturnType<typeof setInterval>;

	constructor(options: UndoRedoOptions = {}) {
		super();
		this.options = {
			maxHistorySize: 50,
			autoCleanup: true,
			cleanupInterval: 300_000, // 5 minutes
			...options,
		};

		if (this.options.autoCleanup) {
			this.startCleanupTimer();
		}
	}

	/**
	 * Execute an undoable action
	 */
	async execute(action: UndoableAction): Promise<void> {
		try {
			// Execute the action
			await action.execute();

			// Remove any actions after current index (for branching)
			this.history = this.history.slice(0, this.currentIndex + 1);

			// Add new action to history
			this.history.push(action);
			this.currentIndex = this.history.length - 1;

			// Trim history if it exceeds max size
			this.trimHistory();

			// Emit state change
			this.emitStateChange();

			// Show success toast
			toastService.success(action.description);
		} catch (error) {
			clientLogger.error('Failed to execute action:', error);
			toastService.error(`Error: ${action.description}`);
			throw error;
		}
	}

	/**
	 * Undo the last action
	 */
	async undo(): Promise<void> {
		if (!this.canUndoAction()) {
			toastService.warning('No hay acciones para deshacer');
			return;
		}

		const action = this.history[this.currentIndex];

		try {
			if (!action.canUndo()) {
				toastService.warning('Esta acción no se puede deshacer');
				return;
			}

			await action.undo();
			this.currentIndex--;

			this.emitStateChange();
			toastService.success(`Deshecho: ${action.description}`);
		} catch (error) {
			clientLogger.error('Failed to undo action:', error);
			toastService.error(`Error al deshacer: ${action.description}`);
			throw error;
		}
	}

	/**
	 * Redo the next action
	 */
	async redo(): Promise<void> {
		if (!this.canRedoAction()) {
			toastService.warning('No hay acciones para rehacer');
			return;
		}

		const action = this.history[this.currentIndex + 1];

		try {
			await action.execute();
			this.currentIndex++;

			this.emitStateChange();
			toastService.success(`Rehecho: ${action.description}`);
		} catch (error) {
			clientLogger.error('Failed to redo action:', error);
			toastService.error(`Error al rehacer: ${action.description}`);
			throw error;
		}
	}

	/**
	 * Check if undo is possible
	 */
	canUndoAction(): boolean {
		return this.currentIndex >= 0 && this.history.length > 0;
	}

	/**
	 * Check if redo is possible
	 */
	canRedoAction(): boolean {
		return this.currentIndex < this.history.length - 1;
	}

	/**
	 * Get current state
	 */
	getState(): UndoRedoState {
		return {
			currentIndex: this.currentIndex,
			totalActions: this.history.length,
			canUndo: this.canUndoAction(),
			canRedo: this.canRedoAction(),
			lastAction: this.history[this.currentIndex]?.description,
		};
	}

	/**
	 * Get action history
	 */
	getHistory(): UndoableAction[] {
		return [...this.history];
	}

	/**
	 * Clear all history
	 */
	clear(): void {
		this.history = [];
		this.currentIndex = -1;
		this.emitStateChange();
		toastService.info('Historial de acciones limpiado');
	}

	/**
	 * Create a copy action
	 */
	createCopyAction(items: AnyEntityWithStats[], targetPath: string): UndoableAction {
		const copiedPaths: string[] = [];

		return {
			id: this.generateId(),
			type: 'copy',
			timestamp: Date.now(),
			description: `Copiar ${items.length} elemento(s)`,
			execute: async () => {
				for (const item of items) {
					const itemPath = getEntityPath(item);
					const targetFilePath = `${targetPath}/${getEntityName(item)}`;
					await copyFile(itemPath, targetFilePath);
					copiedPaths.push(targetFilePath);
				}
			},
			undo: async () => {
				for (const p of copiedPaths) {
					await deleteFile(p);
				}
				copiedPaths.length = 0;
			},
			canUndo: () => copiedPaths.length > 0,
			originalData: items,
			targetData: { targetPath, copiedPaths },
		};
	}

	/**
	 * Create a move action
	 */
	createMoveAction(items: AnyEntityWithStats[], targetPath: string): UndoableAction {
		const originalPaths = items.map((item) => getEntityPath(item));

		return {
			id: this.generateId(),
			type: 'move',
			timestamp: Date.now(),
			description: `Mover ${items.length} elemento(s)`,
			execute: async () => {
				for (const item of items) {
					const itemPath = getEntityPath(item);
					const targetFilePath = `${targetPath}/${item.name}`;
					await moveFile(itemPath, targetFilePath);
				}
			},
			undo: async () => {
				for (let i = 0; i < items.length; i++) {
					const newPath = `${targetPath}/${getEntityName(items[i])}`;
					await moveFile(newPath, originalPaths[i]);
				}
			},
			canUndo: () => true,
			originalData: { items, originalPaths },
			targetData: { targetPath },
		};
	}

	/**
	 * Create a delete action
	 */
	createDeleteAction(items: AnyEntityWithStats[]): UndoableAction {
		return {
			id: this.generateId(),
			type: 'delete',
			timestamp: Date.now(),
			description: `Eliminar ${items.length} elemento(s)`,
			execute: async () => {
				for (const item of items) {
					const itemPath = getEntityPath(item);
					await deleteFile(itemPath);
				}
			},
			undo: async () => {
				// Note: This is a simplified undo for delete
				// In a real implementation, you might want to move to trash first
				toastService.warning('No se puede deshacer la eliminación de archivos');
			},
			canUndo: () => false, // Delete operations typically can't be undone
			originalData: items,
		};
	}

	/**
	 * Create a rename action
	 */
	createRenameAction(item: AnyEntityWithStats, newName: string): UndoableAction {
		const originalName = getEntityName(item);

		return {
			id: this.generateId(),
			type: 'rename',
			timestamp: Date.now(),
			description: `Renombrar "${originalName}" a "${newName}"`,
			execute: async () => {
				const itemPath = getEntityPath(item);
				await renameFile(itemPath, newName);
			},
			undo: async () => {
				const itemPath = getEntityPath(item);
				const newPath = `${itemPath.substring(0, itemPath.lastIndexOf('/'))}/${newName}`;
				await renameFile(newPath, originalName);
			},
			canUndo: () => true,
			originalData: { item, originalName },
			targetData: { newName },
		};
	}

	/**
	 * Trim history to max size
	 */
	private trimHistory(): void {
		if (this.history.length > this.options.maxHistorySize) {
			const removeCount = this.history.length - this.options.maxHistorySize;
			this.history.splice(0, removeCount);
			this.currentIndex -= removeCount;
			if (this.currentIndex < -1) {
				this.currentIndex = -1;
			}
		}
	}

	/**
	 * Emit state change event
	 */
	private emitStateChange(): void {
		this.emit('stateChanged', this.getState());
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `undo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Start cleanup timer
	 */
	private startCleanupTimer(): void {
		this.cleanupTimer = setInterval(() => {
			this.cleanupOldActions();
		}, this.options.cleanupInterval);
	}

	/**
	 * Cleanup old actions (older than 1 hour)
	 */
	private cleanupOldActions(): void {
		const oneHourAgo = Date.now() - 3_600_000; // 1 hour
		const initialLength = this.history.length;

		this.history = this.history.filter((action) => action.timestamp > oneHourAgo);

		if (this.history.length !== initialLength) {
			this.currentIndex = Math.min(this.currentIndex, this.history.length - 1);
			this.emitStateChange();
		}
	}

	/**
	 * Cleanup resources
	 */
	destroy(): void {
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
		}
		this.removeAllListeners();
		this.clear();
	}
}

// Export singleton instance
export const undoRedoManager = new UndoRedoManager();
export default undoRedoManager;
