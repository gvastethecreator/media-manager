/**
 * @file Hook personalizado para lógica de selección del FileBrowser
 * @module components/features/file-browser/hooks/use-file-browser-selection
 * @description Hook que maneja toda la lógica de selección, eventos y atajos de teclado
 */

import { useUndoRedo } from '@/hooks/use-undo-redo';
import { useFileBrowserShortcuts } from '@/lib/keyboard';
import { toastService } from '@/lib/ui/toast';
import { useSelectionStore } from '@/store/selection.store';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import { type AnyEntityWithStats } from '@/types/migration';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
	convertItemToViewerFormat,
	handleCopyAction,
	handleCutAction,
	handleOtherActions,
} from '../utils/file-browser-helpers';

interface UseFileBrowserSelectionProps {
	items: AnyEntityWithStats[];
	selectedIds: string[];
	onItemClick?: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick?: (item: AnyEntityWithStats) => void;
}

export const useFileBrowserSelection = ({
	items,
	selectedIds,
	onItemClick,
	onItemDoubleClick,
}: UseFileBrowserSelectionProps) => {
	// Store de selección
	const globalSelectedIds = useSelectionStore((state) => state.selectedIds);
	const clearSelection = useSelectionStore((state) => state.clearSelection);
	const focusedId = useSelectionStore((state) => state.focusedId);
	const setFocusedId = useSelectionStore((state) => state.setFocusedId);
	const setSelectedIds = useSelectionStore((state) => state.setSelectedIds);
	const toggleSelection = useSelectionStore((state) => state.toggleSelection);

	// File Viewer
	const { openViewer } = useFileViewerStore();

	// Undo/Redo
	const { undo, redo } = useUndoRedo({ enableKeyboardShortcuts: true });

	// Keyboard shortcuts
	const { register, setContext } = useFileBrowserShortcuts();

	// Map de items por ID para lookups rápidos
	const itemsByIdRef = useRef(new Map<string, AnyEntityWithStats>());
	const lastItemsHashRef = useRef<string>('');

	// Actualizar el Map solo cuando los items realmente cambien
	useMemo(() => {
		const currentHash = items
			.map((item) => item.id)
			.sort()
			.join(',');
		if (currentHash !== lastItemsHashRef.current) {
			itemsByIdRef.current.clear();
			for (const item of items) {
				itemsByIdRef.current.set(item.id, item);
			}
			lastItemsHashRef.current = currentHash;
		}
		return itemsByIdRef.current;
	}, [items]);

	// IDs efectivamente seleccionados
	const effectiveSelectedIds = useMemo(() => {
		return globalSelectedIds.length > 0 ? globalSelectedIds : selectedIds;
	}, [globalSelectedIds, selectedIds]);

	// ==================== HANDLERS DE EVENTOS ====================

	const handleItemClick = useCallback(
		(item: AnyEntityWithStats, e: React.MouseEvent) => {
			e.stopPropagation();

			if (e.ctrlKey || e.metaKey) {
				toggleSelection(item.id);
			} else if (e.shiftKey && focusedId) {
				const currentIndex = items.findIndex((i) => i.id === item.id);
				const focusedIndex = items.findIndex((i) => i.id === focusedId);
				if (currentIndex !== -1 && focusedIndex !== -1) {
					const start = Math.min(currentIndex, focusedIndex);
					const end = Math.max(currentIndex, focusedIndex);
					const idsToSelect = items.slice(start, end + 1).map((i) => i.id);
					setSelectedIds(idsToSelect);
				}
			} else {
				setSelectedIds([item.id]);
			}
			setFocusedId(item.id);

			if (onItemClick) {
				// Llamada directa para evitar latencia perceptible en la UI
				onItemClick(item, e);
			}
		},
		[toggleSelection, focusedId, items, setSelectedIds, setFocusedId, onItemClick]
	);

	const handleItemClickById = useCallback(
		(itemId: string, e: React.MouseEvent) => {
			e.stopPropagation();

			if (e.ctrlKey || e.metaKey) {
				toggleSelection(itemId);
			} else if (e.shiftKey && focusedId) {
				const currentIndex = items.findIndex((i) => i.id === itemId);
				const focusedIndex = items.findIndex((i) => i.id === focusedId);
				if (currentIndex !== -1 && focusedIndex !== -1) {
					const start = Math.min(currentIndex, focusedIndex);
					const end = Math.max(currentIndex, focusedIndex);
					const idsToSelect = items.slice(start, end + 1).map((i) => i.id);
					setSelectedIds(idsToSelect);
				}
			} else {
				setSelectedIds([itemId]);
			}
			setFocusedId(itemId);

			if (onItemClick) {
				const item = itemsByIdRef.current.get(itemId);
				if (item) {
					// Llamada directa para reacción inmediata
					onItemClick(item, e);
				}
			}
		},
		[toggleSelection, focusedId, items, setSelectedIds, setFocusedId, onItemClick]
	);

	const handleItemDoubleClick = useCallback(
		(item: AnyEntityWithStats) => {
			onItemDoubleClick?.(item);
		},
		[onItemDoubleClick]
	);

	const handleItemDoubleClickById = useCallback(
		(itemId: string) => {
			if (onItemDoubleClick) {
				const item = itemsByIdRef.current.get(itemId);
				if (item) {
					onItemDoubleClick(item);
				}
			}
		},
		[onItemDoubleClick]
	);

	// ==================== HANDLERS DE ACCIONES ====================

	const handleSelectAll = useCallback(() => {
		const allIds = items.map((item) => item.id);
		setSelectedIds(allIds);
		toastService.info(`${items.length} elementos seleccionados`);
	}, [items, setSelectedIds]);

	const handleCancelOrClose = useCallback(() => {
		clearSelection();
	}, [clearSelection]);

	const handleOpenSelected = useCallback(() => {
		if (effectiveSelectedIds.length === 0) {
			toastService.warning('No hay elementos seleccionados para abrir');
			return;
		}

		const selectedItem = items.find((item) => item.id === effectiveSelectedIds[0]);
		if (selectedItem) {
			const selectedItems = items.filter((item) => effectiveSelectedIds.includes(item.id));
			const imageItems = selectedItems.map(convertItemToViewerFormat);
			const initialIndex = imageItems.findIndex((item) => item.id === selectedItem.id);
			openViewer(imageItems, Math.max(0, initialIndex));
		}
	}, [effectiveSelectedIds, items, openViewer]);

	const handleContextMenuAction = useCallback(
		(action: string) => {
			switch (action) {
				case 'copy':
					handleCopyAction(effectiveSelectedIds, items);
					break;
				case 'cut':
					handleCutAction(effectiveSelectedIds, items);
					break;
				default:
					handleOtherActions(action, effectiveSelectedIds);
					break;
			}
		},
		[effectiveSelectedIds, items]
	);

	// ==================== CONFIGURACIÓN DE SHORTCUTS ====================

	useEffect(() => {
		setContext('file-browser');
	}, [setContext]);

	useEffect(() => {
		register({ key: 'z', modifiers: ['ctrl'], context: 'file-browser', description: 'Deshacer', action: 'undo' }, undo);
		register({ key: 'y', modifiers: ['ctrl'], context: 'file-browser', description: 'Rehacer', action: 'redo' }, redo);
		register(
			{
				key: 'z',
				modifiers: ['ctrl', 'shift'],
				context: 'file-browser',
				description: 'Rehacer (alternativo)',
				action: 'redo-alt',
			},
			redo
		);
		register(
			{ key: 'a', modifiers: ['ctrl'], context: 'file-browser', description: 'Seleccionar todo', action: 'select-all' },
			handleSelectAll
		);
		register(
			{ key: 'escape', modifiers: [], context: 'global', description: 'Cancelar selección', action: 'cancel-or-close' },
			handleCancelOrClose
		);
		register(
			{
				key: 'enter',
				modifiers: [],
				context: 'file-browser',
				description: 'Abrir seleccionado',
				action: 'open-selected',
			},
			handleOpenSelected
		);
		register(
			{
				key: ' ',
				modifiers: [],
				context: 'file-browser',
				description: 'Previsualizar seleccionado',
				action: 'preview-selected',
			},
			handleOpenSelected
		);
	}, [register, undo, redo, handleSelectAll, handleCancelOrClose, handleOpenSelected]);

	return {
		effectiveSelectedIds,
		focusedId,
		handleItemClick,
		handleItemClickById,
		handleItemDoubleClick,
		handleItemDoubleClickById,
		handleSelectAll,
		handleCancelOrClose,
		handleOpenSelected,
		handleContextMenuAction,
		clearSelection,
		setSelectedIds,
		toggleSelection,
		setFocusedId,
	};
};
