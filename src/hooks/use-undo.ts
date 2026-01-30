/**
 * @file useUndo Hook
 * @module hooks/use-undo
 * @description Sistema de undo/redo con persistencia temporal
 * UX: Permite deshacer operaciones destructivas
 */

import { useCallback, useRef, useState } from 'react';
import { toastService } from '@/lib/ui/toast';

interface UndoableAction<T = unknown> {
	/** ID único de la acción */
	id: string;
	/** Descripción para mostrar al usuario */
	description: string;
	/** Timestamp de cuándo se ejecutó */
	timestamp: number;
	/** Datos necesarios para revertir */
	data: T;
	/** Función para deshacer */
	undo: () => Promise<void> | void;
	/** Función opcional para rehacer */
	redo?: () => Promise<void> | void;
	/** Tiempo de vida en ms (default: 30000 = 30s) */
	ttl?: number;
}

interface UseUndoOptions {
	/** Duración por defecto del undo en ms */
	defaultTtl?: number;
	/** Máximo número de acciones en historia */
	maxHistory?: number;
	/** Mostrar toast automáticamente */
	showToast?: boolean;
}

/**
 * Hook para manejar operaciones deshacibles
 *
 * @example
 * const { execute, undo, canUndo, history } = useUndo({ defaultTtl: 30000 });
 *
 * const handleDelete = async (item) => {
 *   await execute({
 *     id: `delete-${item.id}`,
 *     description: `Eliminar "${item.name}"`,
 *     data: item,
 *     undo: async () => {
 *       await restoreItem(item);
 *     },
 *     undoAction: async () => {
 *       await deleteItem(item.id);
 *     }
 *   });
 * };
 */
export function useUndo(options: UseUndoOptions = {}) {
	const { defaultTtl = 30_000, maxHistory = 10, showToast = true } = options;

	const [history, setHistory] = useState<UndoableAction[]>([]);
	const [currentIndex, setCurrentIndex] = useState(-1);
	const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
	const undoByIdRef = useRef<(id: string) => Promise<boolean>>(async () => false);

	// Limpiar timeout cuando se desmonta
	const clearActionTimeout = useCallback((id: string) => {
		const timeout = timeoutsRef.current.get(id);
		if (timeout) {
			clearTimeout(timeout);
			timeoutsRef.current.delete(id);
		}
	}, []);

	// Agregar acción al historial
	const execute = useCallback(
		async <T = unknown>(action: Omit<UndoableAction<T>, 'timestamp'>): Promise<void> => {
			const fullAction: UndoableAction = {
				...action,
				timestamp: Date.now(),
			};

			// Eliminar acciones futuras si estamos en medio del historial
			const newHistory = history.slice(0, currentIndex + 1);

			// Agregar nueva acción
			newHistory.push(fullAction);

			// Limitar tamaño del historial
			if (newHistory.length > maxHistory) {
				const removed = newHistory.shift();
				if (removed) {
					clearActionTimeout(removed.id);
				}
			}

			setHistory(newHistory);
			setCurrentIndex(newHistory.length - 1);

			// Configurar auto-expiración
			const ttl = action.ttl ?? defaultTtl;
			if (ttl > 0) {
				const timeout = setTimeout(() => {
					setHistory((prev) => prev.filter((a) => a.id !== fullAction.id));
					timeoutsRef.current.delete(fullAction.id);
				}, ttl);
				timeoutsRef.current.set(fullAction.id, timeout);
			}

			// Mostrar toast con opción de deshacer
			if (showToast) {
				toastService.success(`${action.description} completado`, {
					action: {
						label: 'Deshacer',
						onClick: () => undoByIdRef.current(fullAction.id),
					},
					duration: Math.min(ttl, 10_000), // Máximo 10 segundos visible
				});
			}
		},
		[history, currentIndex, maxHistory, defaultTtl, showToast, clearActionTimeout]
	);

	// Deshacer la última acción
	const undo = useCallback(async (): Promise<boolean> => {
		if (currentIndex < 0) return false;

		const action = history[currentIndex];
		if (!action) return false;

		try {
			await action.undo();
			setCurrentIndex((prev) => prev - 1);
			clearActionTimeout(action.id);

			if (showToast) {
				toastService.success(`Se deshizo: ${action.description}`);
			}

			return true;
		} catch (error) {
			toastService.error('No se pudo deshacer la acción');
			return false;
		}
	}, [history, currentIndex, showToast, clearActionTimeout]);

	// Deshacer acción específica por ID
	const undoById = useCallback(
		async (id: string): Promise<boolean> => {
			const action = history.find((a) => a.id === id);
			if (!action) return false;

			try {
				await action.undo();
				setHistory((prev) => prev.filter((a) => a.id !== id));
				setCurrentIndex((prev) => Math.min(prev, history.length - 2));
				clearActionTimeout(id);

				return true;
			} catch (error) {
				toastService.error('No se pudo deshacer la acción');
				return false;
			}
		},
		[history, clearActionTimeout]
	);

	// Update ref to avoid circular dependency
	undoByIdRef.current = undoById;

	// Rehacer la siguiente acción
	const redo = useCallback(async (): Promise<boolean> => {
		const nextIndex = currentIndex + 1;
		if (nextIndex >= history.length) return false;

		const action = history[nextIndex];
		if (!action?.redo) return false;

		try {
			await action.redo();
			setCurrentIndex(nextIndex);

			if (showToast) {
				toastService.success(`Se rehizo: ${action.description}`);
			}

			return true;
		} catch (error) {
			toastService.error('No se pudo rehacer la acción');
			return false;
		}
	}, [history, currentIndex, showToast]);

	// Limpiar historial
	const clear = useCallback(() => {
		for (const timeout of timeoutsRef.current.values()) {
			clearTimeout(timeout);
		}
		timeoutsRef.current.clear();
		setHistory([]);
		setCurrentIndex(-1);
	}, []);

	// Estados computados
	const canUndo = currentIndex >= 0;
	const canRedo = currentIndex < history.length - 1 && history[currentIndex + 1]?.redo !== undefined;

	return {
		// Acciones
		execute,
		undo,
		redo,
		undoById,
		clear,

		// Estado
		history,
		currentIndex,
		canUndo,
		canRedo,
	};
}

export default useUndo;
