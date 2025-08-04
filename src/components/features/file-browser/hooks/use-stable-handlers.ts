import { useCallback, useEffect, useRef } from 'react';
import type { AnyEntityWithStats } from '@/types/migration';

/**
 * Hook para crear handlers estables que no cambien entre renders
 * OPTIMIZACIÓN: Evita re-renders innecesarios en componentes hijos
 */
export function useStableHandlers(
	items: AnyEntityWithStats[],
	{
		onItemClick,
		onItemDoubleClick,
		onItemSelect,
		setSelectedIds,
		setFocusedId,
		toggleSelection,
		focusedId,
	}: {
		onItemClick?: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
		onItemDoubleClick?: (item: AnyEntityWithStats) => void;
		onItemSelect?: (item: AnyEntityWithStats) => void;
		setSelectedIds: (ids: string[]) => void;
		setFocusedId: (id: string) => void;
		toggleSelection: (id: string) => void;
		focusedId?: string;
	}
) {
	// Map estable para lookup O(1) de items por ID
	const itemsByIdRef = useRef(new Map<string, AnyEntityWithStats>());

	// Actualizar el Map solo cuando los items cambien
	useEffect(() => {
		const newMap = new Map<string, AnyEntityWithStats>();
		for (const item of items) {
			newMap.set(item.id, item);
		}
		itemsByIdRef.current = newMap;
	}, [items]);

	// Referencias estables para handlers que no cambian entre renders
	const handlersRef = useRef({
		handleItemClickById: (_id: string, _e: React.MouseEvent) => {},
		handleItemDoubleClickById: (_id: string) => {},
		handleItemSelectById: (_id: string) => {},
	});

	// Actualizar handlers internos sin cambiar referencias estables
	useEffect(() => {
		handlersRef.current.handleItemClickById = (id: string, e: React.MouseEvent) => {
			const item = itemsByIdRef.current.get(id);
			if (!item) return;

			onItemClick?.(item, e);

			// Lógica de selección integrada
			if (e.ctrlKey || e.metaKey) {
				toggleSelection(id);
			} else if (e.shiftKey && focusedId) {
				const currentIndex = items.findIndex((i) => i.id === id);
				const focusedIndex = items.findIndex((i) => i.id === focusedId);
				if (currentIndex !== -1 && focusedIndex !== -1) {
					const start = Math.min(currentIndex, focusedIndex);
					const end = Math.max(currentIndex, focusedIndex);
					const idsToSelect = items.slice(start, end + 1).map((i) => i.id);
					setSelectedIds(idsToSelect);
				}
			} else {
				setSelectedIds([id]);
			}
			setFocusedId(id);
		};

		handlersRef.current.handleItemDoubleClickById = (id: string) => {
			const item = itemsByIdRef.current.get(id);
			if (item) {
				onItemDoubleClick?.(item);
			}
		};

		handlersRef.current.handleItemSelectById = (id: string) => {
			const item = itemsByIdRef.current.get(id);
			if (item) {
				onItemSelect?.(item);
			}
		};
	}, [items, onItemClick, onItemDoubleClick, onItemSelect, setSelectedIds, setFocusedId, toggleSelection, focusedId]);

	// Funciones estables que nunca cambian de referencia
	const stableHandleItemClickById = useCallback((id: string, e: React.MouseEvent) => {
		handlersRef.current.handleItemClickById(id, e);
	}, []);

	const stableHandleItemDoubleClickById = useCallback((id: string) => {
		handlersRef.current.handleItemDoubleClickById(id);
	}, []);

	const stableHandleItemSelectById = useCallback((id: string) => {
		handlersRef.current.handleItemSelectById(id);
	}, []);

	// Helper para obtener item por ID
	const getItemById = useCallback((id: string) => {
		return itemsByIdRef.current.get(id) || null;
	}, []);

	return {
		handleItemClickById: stableHandleItemClickById,
		handleItemDoubleClickById: stableHandleItemDoubleClickById,
		handleItemSelectById: stableHandleItemSelectById,
		getItemById,
	};
}
