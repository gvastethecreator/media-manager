/**
 * Use Undo/Redo Hook
 *
 * This hook provides a React interface for the undo/redo manager,
 * managing state updates and providing convenient methods for components.
 */

import { useCallback, useEffect, useState } from 'react';
import { type UndoableAction, type UndoRedoState, undoRedoManager } from '@/services/undo-redo/undo-redo-manager';
import type { AnyEntityWithStats } from '@/types/entities';

export interface UseUndoRedoOptions {
	/** Enable automatic state updates */
	autoUpdate?: boolean;
	/** Enable keyboard shortcuts */
	enableKeyboardShortcuts?: boolean;
}

export interface UseUndoRedoReturn {
	/** Current undo/redo state */
	state: UndoRedoState;
	/** Execute an undoable action */
	execute: (action: UndoableAction) => Promise<void>;
	/** Undo the last action */
	undo: () => Promise<void>;
	/** Redo the next action */
	redo: () => Promise<void>;
	/** Check if undo is possible */
	canUndo: boolean;
	/** Check if redo is possible */
	canRedo: boolean;
	/** Clear all history */
	clear: () => void;
	/** Get action history */
	getHistory: () => UndoableAction[];
	/** Create common actions */
	actions: {
		createCopyAction: (items: AnyEntityWithStats[], targetPath: string) => UndoableAction;
		createMoveAction: (items: AnyEntityWithStats[], targetPath: string) => UndoableAction;
		createDeleteAction: (items: AnyEntityWithStats[]) => UndoableAction;
		createRenameAction: (item: AnyEntityWithStats, newName: string) => UndoableAction;
	};
}

/**
 * Hook for managing undo/redo operations
 */
export function useUndoRedo(options: UseUndoRedoOptions = {}): UseUndoRedoReturn {
	const { autoUpdate = true, enableKeyboardShortcuts = true } = options;

	const [state, setState] = useState<UndoRedoState>(() => undoRedoManager.getState());

	// Declarar undo/redo antes de efectos que los referencian
	const undo = useCallback(async () => {
		await undoRedoManager.undo();
		if (!autoUpdate) {
			setState(undoRedoManager.getState());
		}
	}, [autoUpdate]);

	const redo = useCallback(async () => {
		await undoRedoManager.redo();
		if (!autoUpdate) {
			setState(undoRedoManager.getState());
		}
	}, [autoUpdate]);

	// Update state when manager state changes
	useEffect(() => {
		if (!autoUpdate) {
			return;
		}

		const handleStateChange = (newState: UndoRedoState) => {
			setState(newState);
		};

		undoRedoManager.on('stateChanged', handleStateChange);

		return () => {
			undoRedoManager.removeListener('stateChanged', handleStateChange);
		};
	}, [autoUpdate]);

	// Keyboard shortcuts
	useEffect(() => {
		if (!enableKeyboardShortcuts) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			// Ctrl+Z for undo
			if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
				event.preventDefault();
				undo();
				return;
			}

			// Ctrl+Shift+Z or Ctrl+Y for redo
			if ((event.ctrlKey && event.shiftKey && event.key === 'Z') || (event.ctrlKey && event.key === 'y')) {
				event.preventDefault();
				redo();
				return;
			}
		};

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [enableKeyboardShortcuts, redo, undo]);

	// Execute an undoable action
	const execute = useCallback(
		async (action: UndoableAction) => {
			await undoRedoManager.execute(action);
			if (!autoUpdate) {
				setState(undoRedoManager.getState());
			}
		},
		[autoUpdate]
	);

	// (undo/redo ya declarados arriba)

	// Clear all history
	const clear = useCallback(() => {
		undoRedoManager.clear();
		if (!autoUpdate) {
			setState(undoRedoManager.getState());
		}
	}, [autoUpdate]);

	// Get action history
	const getHistory = useCallback(() => {
		return undoRedoManager.getHistory();
	}, []);

	// Action creators
	const actions = {
		createCopyAction: useCallback((items: AnyEntityWithStats[], targetPath: string) => {
			return undoRedoManager.createCopyAction(items, targetPath);
		}, []),

		createMoveAction: useCallback((items: AnyEntityWithStats[], targetPath: string) => {
			return undoRedoManager.createMoveAction(items, targetPath);
		}, []),

		createDeleteAction: useCallback((items: AnyEntityWithStats[]) => {
			return undoRedoManager.createDeleteAction(items);
		}, []),

		createRenameAction: useCallback((item: AnyEntityWithStats, newName: string) => {
			return undoRedoManager.createRenameAction(item, newName);
		}, []),
	};

	return {
		state,
		execute,
		undo,
		redo,
		canUndo: state.canUndo,
		canRedo: state.canRedo,
		clear,
		getHistory,
		actions,
	};
}

/**
 * Hook for undo/redo keyboard shortcuts only
 */
export function useUndoRedoShortcuts(): void {
	useUndoRedo({ autoUpdate: false, enableKeyboardShortcuts: true });
}

/**
 * Hook for undo/redo state only (no shortcuts)
 */
export function useUndoRedoState(): Pick<UseUndoRedoReturn, 'state' | 'canUndo' | 'canRedo'> {
	const { state, canUndo, canRedo } = useUndoRedo({ enableKeyboardShortcuts: false });
	return { state, canUndo, canRedo };
}
