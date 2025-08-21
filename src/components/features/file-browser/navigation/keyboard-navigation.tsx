import React, { useCallback, useEffect, useRef } from 'react';
import { keyboardShortcutManager } from '@/lib/keyboard/keyboard-shortcut-manager';
import { useSelectionStore } from '@/store/selection.store';
import type { AnyEntityWithStats } from '@/types/migration';

interface KeyboardNavigationProps {
	items: AnyEntityWithStats[];
	containerRef: React.RefObject<HTMLElement>;
	getItemElement: (itemId: string) => HTMLElement | null;
	onOpenItem?: (item: AnyEntityWithStats) => void;
	onPreviewItem?: (item: AnyEntityWithStats) => void;
	gridColumns?: number;
	viewType: 'list' | 'grid' | 'cards' | 'masonry';
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
	items,
	containerRef,
	getItemElement,
	onOpenItem,
	onPreviewItem,
	gridColumns = 4,
	viewType,
}) => {
	const {
		selectedItems,
		selectedIds,
		focusedId,
		isItemSelected,
		toggleSelection,
		selectItem,
		clearSelection,
		isMultiSelectMode,
		setMultiSelectMode,
		setFocusedId,
		addToSelection,
		removeFromSelection,
		setSelection,
		selectRange,
	} = useSelectionStore();

	const lastSelectedIndexRef = useRef<number>(-1);
	const isNavigatingRef = useRef(false);

	// Calcular el índice del elemento enfocado basado en focusedId
	const focusedIndex = React.useMemo(() => {
		if (!focusedId) {
			return -1;
		}
		return items.findIndex((item) => item.id === focusedId);
	}, [focusedId, items]);

	// Obtener el índice de un elemento
	const getItemIndex = useCallback(
		(itemId: string): number => {
			return items.findIndex((item) => item.id === itemId);
		},
		[items]
	);

	// Obtener el elemento en un índice específico
	const getItemAtIndex = useCallback(
		(index: number): AnyEntityWithStats | null => {
			return items[index] || null;
		},
		[items]
	);

	// Helper: calcular último índice seleccionado de forma segura (después de definir focusedIndex/getItemIndex)
	const getLastSelectedIndex = useCallback((): number => {
		if (selectedItems.length === 0) {
			return focusedIndex;
		}
		const lastSelectedId = selectedItems.at(-1)?.id;
		if (!lastSelectedId) {
			return focusedIndex;
		}
		return getItemIndex(lastSelectedId);
	}, [selectedItems, focusedIndex, getItemIndex]);

	// Helper: aplicar selección según navegación
	const applySelectionOnNavigate = useCallback(
		(targetIndex: number, targetItemId: string, extend: boolean) => {
			if (extend && isMultiSelectMode) {
				const lastSelectedIndex = getLastSelectedIndex();
				if (lastSelectedIndex !== -1) {
					const start = Math.min(lastSelectedIndex, targetIndex);
					const end = Math.max(lastSelectedIndex, targetIndex);
					const rangeIds = items.slice(start, end + 1).map((it) => it.id);
					selectRange(rangeIds);
				}
				return;
			}
			setSelection([targetItemId]);
		},
		[isMultiSelectMode, getLastSelectedIndex, items, selectRange, setSelection]
	);

	// Hacer scroll a un elemento
	const scrollToItem = useCallback(
		(itemId: string) => {
			const element = getItemElement(itemId);
			if (!(element && containerRef.current)) {
				return;
			}

			const container = containerRef.current;
			const containerRect = container.getBoundingClientRect();
			const elementRect = element.getBoundingClientRect();

			// Verificar si el elemento está visible
			const isVisible =
				elementRect.top >= containerRect.top &&
				elementRect.bottom <= containerRect.bottom &&
				elementRect.left >= containerRect.left &&
				elementRect.right <= containerRect.right;

			if (!isVisible) {
				element.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest',
					inline: 'nearest',
				});
			}
		},
		[getItemElement, containerRef]
	);

	// Función para enfocar un elemento por índice
	const focusItem = useCallback(
		(index: number) => {
			if (index < 0 || index >= items.length) {
				return;
			}

			const item = items[index];
			setFocusedId(item.id);

			// Hacer scroll al elemento si es necesario
			scrollToItem(item.id);
		},
		[items, scrollToItem, setFocusedId]
	);

	// Navegar a un elemento específico
	const navigateToItem = useCallback(
		(targetIndex: number, extend = false) => {
			if (targetIndex < 0 || targetIndex >= items.length) {
				return;
			}

			const targetItem = items[targetIndex];
			if (!targetItem) {
				return;
			}

			setFocusedId(targetItem.id);
			applySelectionOnNavigate(targetIndex, targetItem.id, extend);
			scrollToItem(targetItem.id);
		},
		[items, setFocusedId, applySelectionOnNavigate, scrollToItem]
	);

	// Navegación con flechas
	// Helper: calcular siguiente índice con baja complejidad
	const computeNextIndex = useCallback(
		(currentIndex: number, direction: 'up' | 'down' | 'left' | 'right'): number => {
			const clamp = (v: number, min: number, max: number) => {
				if (v < min) {
					return min;
				}
				if (v > max) {
					return max;
				}
				return v;
			};
			const maxIndex = items.length - 1;
			if (currentIndex < 0) {
				return 0;
			}
			if (viewType === 'list') {
				const listDelta: Record<'up' | 'down' | 'left' | 'right', number> = {
					up: -1,
					down: 1,
					left: 0,
					right: 0,
				};
				return clamp(currentIndex + listDelta[direction], 0, maxIndex);
			}
			const gridDelta: Record<'up' | 'down' | 'left' | 'right', number> = {
				left: -1,
				right: 1,
				up: -gridColumns,
				down: gridColumns,
			};
			return clamp(currentIndex + gridDelta[direction], 0, maxIndex);
		},
		[items.length, viewType, gridColumns]
	);

	const handleArrowNavigation = useCallback(
		(direction: 'up' | 'down' | 'left' | 'right', extend = false) => {
			if (items.length === 0) {
				return;
			}
			const baseIndex = focusedIndex === -1 ? 0 : focusedIndex;
			const targetIndex = computeNextIndex(baseIndex, direction);
			navigateToItem(targetIndex, extend);
		},
		[items.length, focusedIndex, computeNextIndex, navigateToItem]
	);

	// Navegación por páginas
	const handlePageNavigation = useCallback(
		(direction: 'pageup' | 'pagedown', extend = false) => {
			if (!containerRef.current || items.length === 0) {
				return;
			}

			const container = containerRef.current;
			const containerHeight = container.clientHeight;
			const itemHeight = viewType === 'list' ? 60 : 200; // Estimación
			const itemsPerPage = Math.floor(containerHeight / itemHeight);

			let currentIndex = focusedIndex;

			if (currentIndex === -1) {
				currentIndex = 0;
			}

			let targetIndex = currentIndex;
			if (direction === 'pageup') {
				targetIndex = Math.max(0, currentIndex - itemsPerPage);
			} else {
				targetIndex = Math.min(items.length - 1, currentIndex + itemsPerPage);
			}

			navigateToItem(targetIndex, extend);
		},
		[containerRef, focusedIndex, navigateToItem, viewType, items.length]
	);

	// Ir al inicio o final
	const handleHomeEnd = useCallback(
		(direction: 'home' | 'end', extend = false) => {
			if (items.length === 0) {
				return;
			}

			const targetIndex = direction === 'home' ? 0 : items.length - 1;
			navigateToItem(targetIndex, extend);
		},
		[items.length, navigateToItem]
	);

	// Registrar atajos de teclado
	useEffect(() => {
		// Navegación con flechas
		keyboardShortcutManager.register(
			{
				key: 'arrowup',
				modifiers: [],
				action: 'navigate-up',
				context: 'file-browser',
				description: 'Navegar hacia arriba',
			},
			() => handleArrowNavigation('up')
		);

		keyboardShortcutManager.register(
			{
				key: 'arrowdown',
				modifiers: [],
				action: 'navigate-down',
				context: 'file-browser',
				description: 'Navegar hacia abajo',
			},
			() => handleArrowNavigation('down')
		);

		keyboardShortcutManager.register(
			{
				key: 'arrowleft',
				modifiers: [],
				action: 'navigate-left',
				context: 'file-browser',
				description: 'Navegar hacia la izquierda',
			},
			() => handleArrowNavigation('left')
		);

		keyboardShortcutManager.register(
			{
				key: 'arrowright',
				modifiers: [],
				action: 'navigate-right',
				context: 'file-browser',
				description: 'Navegar hacia la derecha',
			},
			() => handleArrowNavigation('right')
		);

		// Navegación extendida con Shift
		keyboardShortcutManager.register(
			{
				key: 'arrowup',
				modifiers: ['shift'],
				action: 'navigate-up-extend',
				context: 'file-browser',
				description: 'Extender selección hacia arriba',
			},
			() => handleArrowNavigation('up', true)
		);

		keyboardShortcutManager.register(
			{
				key: 'arrowdown',
				modifiers: ['shift'],
				action: 'navigate-down-extend',
				context: 'file-browser',
				description: 'Extender selección hacia abajo',
			},
			() => handleArrowNavigation('down', true)
		);

		keyboardShortcutManager.register(
			{
				key: 'arrowleft',
				modifiers: ['shift'],
				action: 'navigate-left-extend',
				context: 'file-browser',
				description: 'Extender selección hacia la izquierda',
			},
			() => handleArrowNavigation('left', true)
		);

		keyboardShortcutManager.register(
			{
				key: 'arrowright',
				modifiers: ['shift'],
				action: 'navigate-right-extend',
				context: 'file-browser',
				description: 'Extender selección hacia la derecha',
			},
			() => handleArrowNavigation('right', true)
		);

		// Navegación por páginas
		keyboardShortcutManager.register(
			{
				key: 'pageup',
				modifiers: [],
				action: 'navigate-page-up',
				context: 'file-browser',
				description: 'Página anterior',
			},
			() => handlePageNavigation('pageup')
		);

		keyboardShortcutManager.register(
			{
				key: 'pagedown',
				modifiers: [],
				action: 'navigate-page-down',
				context: 'file-browser',
				description: 'Página siguiente',
			},
			() => handlePageNavigation('pagedown')
		);

		keyboardShortcutManager.register(
			{
				key: 'pageup',
				modifiers: ['shift'],
				action: 'navigate-page-up-extend',
				context: 'file-browser',
				description: 'Extender selección página anterior',
			},
			() => handlePageNavigation('pageup', true)
		);

		keyboardShortcutManager.register(
			{
				key: 'pagedown',
				modifiers: ['shift'],
				action: 'navigate-page-down-extend',
				context: 'file-browser',
				description: 'Extender selección página siguiente',
			},
			() => handlePageNavigation('pagedown', true)
		);

		// Home/End
		keyboardShortcutManager.register(
			{
				key: 'home',
				modifiers: [],
				action: 'navigate-home',
				context: 'file-browser',
				description: 'Ir al inicio',
			},
			() => handleHomeEnd('home')
		);

		keyboardShortcutManager.register(
			{
				key: 'end',
				modifiers: [],
				action: 'navigate-end',
				context: 'file-browser',
				description: 'Ir al final',
			},
			() => handleHomeEnd('end')
		);

		keyboardShortcutManager.register(
			{
				key: 'home',
				modifiers: ['shift'],
				action: 'navigate-home-extend',
				context: 'file-browser',
				description: 'Extender selección al inicio',
			},
			() => handleHomeEnd('home', true)
		);

		keyboardShortcutManager.register(
			{
				key: 'end',
				modifiers: ['shift'],
				action: 'navigate-end-extend',
				context: 'file-browser',
				description: 'Extender selección al final',
			},
			() => handleHomeEnd('end', true)
		);

		// Abrir elemento
		keyboardShortcutManager.register(
			{
				key: 'enter',
				modifiers: [],
				action: 'open-focused',
				context: 'file-browser',
				description: 'Abrir elemento enfocado',
			},
			() => {
				if (focusedIndex !== -1 && onOpenItem) {
					const item = items[focusedIndex];
					onOpenItem(item);
				}
			}
		);

		// Vista previa
		keyboardShortcutManager.register(
			{
				key: ' ',
				modifiers: [],
				action: 'preview-focused',
				context: 'file-browser',
				description: 'Vista previa del elemento enfocado',
			},
			() => {
				if (focusedIndex !== -1 && onPreviewItem) {
					const item = items[focusedIndex];
					onPreviewItem(item);
				}
			}
		);

		// Cleanup
		return () => {
			const actions = [
				'navigate-up',
				'navigate-down',
				'navigate-left',
				'navigate-right',
				'navigate-up-extend',
				'navigate-down-extend',
				'navigate-left-extend',
				'navigate-right-extend',
				'navigate-page-up',
				'navigate-page-down',
				'navigate-page-up-extend',
				'navigate-page-down-extend',
				'navigate-home',
				'navigate-end',
				'navigate-home-extend',
				'navigate-end-extend',
				'open-focused',
				'preview-focused',
			];

			for (const action of actions) {
				keyboardShortcutManager.unregisterByAction(action);
			}
		};
	}, [handleArrowNavigation, handlePageNavigation, handleHomeEnd, focusedIndex, items, onOpenItem, onPreviewItem]);

	// Actualizar el último índice seleccionado cuando cambia la selección
	useEffect(() => {
		if (selectedIds.length > 0) {
			const lastSelectedId = selectedIds.at(-1);
			if (lastSelectedId) {
				const index = getItemIndex(lastSelectedId);
				if (index >= 0) {
					lastSelectedIndexRef.current = index;
				}
			}
		}
	}, [selectedIds, getItemIndex]);

	// Enfocar el primer elemento si no hay nada seleccionado
	useEffect(() => {
		if (items.length > 0 && selectedIds.length === 0 && !focusedId) {
			setFocusedId(items[0].id);
		}
	}, [items, selectedIds, focusedId, setFocusedId]);

	return null; // Este componente no renderiza nada, solo maneja la navegación
};

export default KeyboardNavigation;
