/**
 * @file Hook de selección para File Browser
 * @module file-browser-new/hooks/use-selection
 */

import { useCallback, useMemo } from 'react';
import { useSelectionStore } from '@/store/selection.store';
import type { BrowserItem, ClickModifiers } from '../types';

export interface UseSelectionOptions {
	/** Items disponibles para selección */
	items: BrowserItem[];
	/** Callback cuando cambia la selección */
	onSelectionChange?: (selectedIds: string[]) => void;
}

export interface UseSelectionResult {
	/** IDs seleccionados */
	selectedIds: string[];
	/** Set de IDs seleccionados (para lookup rápido) */
	selectedSet: Set<string>;
	/** ID del item activo */
	activeId: string | null;
	/** Cantidad de items seleccionados */
	selectedCount: number;
	/** Si hay selección */
	hasSelection: boolean;
	/** Seleccionar un item (reemplaza selección) */
	selectItem: (id: string) => void;
	/** Toggle selección de un item */
	toggleSelection: (id: string) => void;
	/** Seleccionar rango de items */
	selectRange: (fromId: string, toId: string) => void;
	/** Seleccionar todos los items */
	selectAll: () => void;
	/** Limpiar selección */
	clearSelection: () => void;
	/** Establecer item activo */
	setActiveItem: (id: string | null) => void;
	/** Procesar click con modificadores */
	handleClick: (item: BrowserItem, modifiers?: ClickModifiers) => void;
	/** Verificar si item está seleccionado */
	isSelected: (id: string) => boolean;
	/** Verificar si item está activo */
	isActive: (id: string) => boolean;
}

/**
 * Hook unificado de selección
 */
export function useSelection({ items, onSelectionChange }: UseSelectionOptions): UseSelectionResult {
	// Store global de selección
	const selectedIds = useSelectionStore((s) => s.selectedIds);
	const activeId = useSelectionStore((s) => s.activeId);
	const setSelectedIds = useSelectionStore((s) => s.setSelectedIds);
	const toggleSelectedId = useSelectionStore((s) => s.toggleSelectedId);
	const setActiveId = useSelectionStore((s) => s.setActiveId);

	// IDs disponibles para selección
	const availableIds = useMemo(() => items.map((it) => it.id), [items]);

	// Set para lookup rápido
	const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

	// Seleccionar un solo item
	const selectItem = useCallback(
		(id: string) => {
			setSelectedIds([id]);
			setActiveId(id);
			onSelectionChange?.([id]);
		},
		[setSelectedIds, setActiveId, onSelectionChange]
	);

	// Toggle selección
	const toggleSelection = useCallback(
		(id: string) => {
			toggleSelectedId(id);
			setActiveId(id);
			const newSelection = selectedSet.has(id)
				? selectedIds.filter((sid) => sid !== id)
				: [...selectedIds, id];
			onSelectionChange?.(newSelection);
		},
		[toggleSelectedId, setActiveId, selectedIds, selectedSet, onSelectionChange]
	);

	// Seleccionar rango
	const selectRange = useCallback(
		(fromId: string, toId: string) => {
			const startIdx = availableIds.indexOf(fromId);
			const endIdx = availableIds.indexOf(toId);

			if (startIdx === -1 || endIdx === -1) return;

			const [from, to] = startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
			const rangeIds = availableIds.slice(from, to + 1);

			setSelectedIds(rangeIds);
			setActiveId(toId);
			onSelectionChange?.(rangeIds);
		},
		[availableIds, setSelectedIds, setActiveId, onSelectionChange]
	);

	// Seleccionar todos
	const selectAll = useCallback(() => {
		setSelectedIds(availableIds);
		onSelectionChange?.(availableIds);
	}, [availableIds, setSelectedIds, onSelectionChange]);

	// Limpiar selección
	const clearSelection = useCallback(() => {
		setSelectedIds([]);
		setActiveId(null);
		onSelectionChange?.([]);
	}, [setSelectedIds, setActiveId, onSelectionChange]);

	// Establecer item activo
	const setActiveItem = useCallback(
		(id: string | null) => {
			setActiveId(id);
		},
		[setActiveId]
	);

	// Procesar click con modificadores
	const handleClick = useCallback(
		(item: BrowserItem, modifiers?: ClickModifiers) => {
			const mods = modifiers ?? { ctrlKey: false, metaKey: false, shiftKey: false };
			const isToggle = mods.ctrlKey || mods.metaKey;
			const isRange = mods.shiftKey;

			if (isRange && selectedIds.length > 0 && activeId) {
				selectRange(activeId, item.id);
			} else if (isToggle) {
				toggleSelection(item.id);
			} else {
				selectItem(item.id);
			}
		},
		[selectedIds.length, activeId, selectRange, toggleSelection, selectItem]
	);

	// Helpers
	const isSelected = useCallback((id: string) => selectedSet.has(id), [selectedSet]);
	const isActive = useCallback((id: string) => activeId === id, [activeId]);

	return {
		selectedIds,
		selectedSet,
		activeId,
		selectedCount: selectedIds.length,
		hasSelection: selectedIds.length > 0,
		selectItem,
		toggleSelection,
		selectRange,
		selectAll,
		clearSelection,
		setActiveItem,
		handleClick,
		isSelected,
		isActive,
	};
}
