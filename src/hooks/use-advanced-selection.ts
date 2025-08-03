/**
 * Hook para manejar selección avanzada con soporte para:
 * - Click simple: seleccionar un item
 * - Shift+Click: selección por rango
 * - Ctrl+Click: multi-selección individual
 * - Click derecho: selección contextual
 */

import { startTransition, useCallback, useMemo, useRef, useState } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import { useSelectionStore } from '@/store/selection.store';
import type { AnyEntityWithStats } from '@/types/migration';
import { useSelecto } from './use-selecto';

const logger = clientLogger.withContext('AdvancedSelection');

interface UseAdvancedSelectionProps {
	/** Items disponibles para selección */
	items: AnyEntityWithStats[];
	/** Callback cuando se abre el menú contextual */
	onContextMenu?: (e: React.MouseEvent, item: AnyEntityWithStats, selectedItems: AnyEntityWithStats[]) => void;
	/** Callback opcional cuando se selecciona un item */
	onItemSelect?: (item: AnyEntityWithStats) => void;
	/** Callback opcional cuando se hace click en un item */
	onItemClick?: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	/** Habilitar selección con drag usando react-selecto */
	enableDragSelection?: boolean;
	/** Contenedor para la selección con drag */
	dragContainer?: string | HTMLElement;
}

export function useAdvancedSelection({
	items,
	onContextMenu,
	onItemSelect,
	onItemClick,
	enableDragSelection = true,
	dragContainer,
}: UseAdvancedSelectionProps) {
	const {
		selectedIds,
		selectedItems,
		lastSelectedItem,
		setSelectedIds,
		addToSelection,
		removeFromSelection,
		toggleSelection,
		clearSelection,
		selectRange,
		isItemSelected,
	} = useSelectionStore();

	// Estado optimista para respuesta inmediata de UI
	const [optimisticSelection, setOptimisticSelection] = useState<string[]>([]);

	// Ref para rastrear el último índice seleccionado para el rango
	const lastSelectedIndexRef = useRef<number>(-1);

	// Mapa de índices para búsquedas O(1) en lugar de O(n)
	const itemIndexMap = useMemo(() => {
		const map = new Map<string, number>();
		items.forEach((item, index) => {
			map.set(item.id, index);
		});
		return map;
	}, [items]);

	// Función auxiliar para encontrar el índice de un item - ahora O(1)
	const findItemIndex = useCallback(
		(itemId: string): number => {
			return itemIndexMap.get(itemId) ?? -1;
		},
		[itemIndexMap]
	);

	// Logging asíncrono para no bloquear la UI
	const asyncLog = useCallback((level: 'debug', message: string, data?: any) => {
		if (process.env.NODE_ENV !== 'production') {
			// Usar requestIdleCallback para logging no bloqueante
			if (window.requestIdleCallback) {
				window.requestIdleCallback(() => {
					logger[level](message, data);
				});
			} else {
				// Fallback para navegadores que no soportan requestIdleCallback
				setTimeout(() => {
					logger[level](message, data);
				}, 0);
			}
		}
	}, []);

	// Integración con react-selecto para selección con drag
	const handleSelectoSelect = useCallback(
		(elements: Element[]) => {
			const selectedItemIds = elements.map((el) => el.getAttribute('data-item-id')).filter(Boolean) as string[];

			if (selectedItemIds.length > 0) {
				setSelectedIds(selectedItemIds);
				asyncLog('debug', '🎯 Selección por drag:', { count: selectedItemIds.length, ids: selectedItemIds });
			}
		},
		[setSelectedIds, asyncLog]
	);

	const handleSelectoDeselect = useCallback(
		(elements: Element[]) => {
			const deselectedIds = elements.map((el) => el.getAttribute('data-item-id')).filter(Boolean) as string[];

			asyncLog('debug', '🧹 Deselección por drag:', { count: deselectedIds.length, ids: deselectedIds });
		},
		[asyncLog]
	);

	const { isActive: isDragSelecting } = useSelecto({
		container: dragContainer,
		selectableTargets: ['[data-item-id]'],
		onSelect: handleSelectoSelect,
		onDeselect: handleSelectoDeselect,
		enabled: enableDragSelection,
		selectColor: '#3b82f6',
		selectOpacity: 0.1,
	});

	// Función auxiliar para obtener items en un rango
	const getItemsInRange = useCallback(
		(startIndex: number, endIndex: number): string[] => {
			const start = Math.min(startIndex, endIndex);
			const end = Math.max(startIndex, endIndex);
			return items.slice(start, end + 1).map((item) => item.id);
		},
		[items]
	);

	// Handler principal para clicks
	const handleItemClick = useCallback(
		(item: AnyEntityWithStats, e: React.MouseEvent) => {
			e.preventDefault();

			const itemIndex = findItemIndex(item.id);
			const isShiftClick = e.shiftKey;
			const isCtrlClick = e.ctrlKey || e.metaKey;
			const isCurrentlySelected = isItemSelected(item.id);

			// Respuesta visual inmediata con estado optimista
			if (!isShiftClick && !isCtrlClick) {
				// Para click simple, mostrar inmediatamente la selección
				setOptimisticSelection([item.id]);
			} else if (isCtrlClick) {
				// Para Ctrl+click, actualizar inmediatamente
				setOptimisticSelection((prev) =>
					isCurrentlySelected ? prev.filter((id) => id !== item.id) : [...prev, item.id]
				);
			}

			// Logging asíncrono para no bloquear
			asyncLog('debug', '🖱️ Click detectado:', {
				itemId: item.id,
				itemIndex,
				isShiftClick,
				isCtrlClick,
				isCurrentlySelected,
				selectedCount: selectedIds.length,
			});

			// Operaciones costosas diferidas con startTransition
			startTransition(() => {
				if (isShiftClick) {
					// Shift+Click: Selección por rango
					if (lastSelectedIndexRef.current === -1 || selectedIds.length === 0) {
						setSelectedIds([item.id]);
						lastSelectedIndexRef.current = itemIndex;
						asyncLog('debug', '📊 Rango iniciado:', { startIndex: itemIndex });
					} else {
						const rangeIds = getItemsInRange(lastSelectedIndexRef.current, itemIndex);
						setSelectedIds(rangeIds);
						asyncLog('debug', '📊 Rango seleccionado:', {
							from: lastSelectedIndexRef.current,
							to: itemIndex,
							count: rangeIds.length,
						});
					}
				} else if (isCtrlClick) {
					// Ctrl+Click: Multi-selección individual
					if (isCurrentlySelected) {
						removeFromSelection(item.id);
						asyncLog('debug', '➖ Removido de multi-selección:', item.id);

						if (selectedIds.length === 1) {
							lastSelectedIndexRef.current = -1;
						}
					} else {
						addToSelection(item.id);
						lastSelectedIndexRef.current = itemIndex;
						asyncLog('debug', '➕ Agregado a multi-selección:', item.id);
					}
				} else {
					// Click simple: Seleccionar solo este item
					setSelectedIds([item.id]);
					lastSelectedIndexRef.current = itemIndex;
					asyncLog('debug', '🎯 Selección simple:', item.id);
				}

				// Limpiar estado optimista después de actualizar el store
				setOptimisticSelection([]);
			});

			// Callbacks diferidos para no bloquear la UI
			if (onItemSelect || onItemClick) {
				requestIdleCallback(() => {
					onItemSelect?.(item);
					onItemClick?.(item, e);
				});
			}
		},
		[
			selectedIds,
			isItemSelected,
			setSelectedIds,
			addToSelection,
			removeFromSelection,
			findItemIndex,
			getItemsInRange,
			asyncLog,
			onItemSelect,
			onItemClick,
		]
	);

	// Handler para click derecho
	const handleItemContextMenu = useCallback(
		(item: AnyEntityWithStats, e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const isCurrentlySelected = isItemSelected(item.id);

			// Logging asíncrono para no bloquear
			asyncLog('debug', '🖱️ Click derecho detectado:', {
				itemId: item.id,
				isCurrentlySelected,
				selectedCount: selectedIds.length,
			});

			// Operaciones diferidas con startTransition
			startTransition(() => {
				// Si el item no está seleccionado, seleccionarlo
				if (!isCurrentlySelected) {
					setSelectedIds([item.id]);
					lastSelectedIndexRef.current = findItemIndex(item.id);
					asyncLog('debug', '🎯 Item seleccionado por click derecho:', item.id);
				}
			});

			// Obtener los items actualmente seleccionados
			const currentSelectedItems = isCurrentlySelected ? (selectedItems as AnyEntityWithStats[]) : [item];

			// Llamar al callback del menú contextual de forma diferida
			requestIdleCallback(() => {
				onContextMenu?.(e, item, currentSelectedItems);
			});
		},
		[selectedIds, selectedItems, isItemSelected, setSelectedIds, findItemIndex, asyncLog, onContextMenu]
	);

	// Handler para clicks en espacio vacío
	const handleEmptySpaceClick = useCallback(
		(e: React.MouseEvent) => {
			const target = e.target as HTMLElement;
			const currentTarget = e.currentTarget as HTMLElement;

			// Verificar que realmente es un click en espacio vacío
			const isEmptySpaceClick =
				target === currentTarget ||
				(!target.closest('[data-entity-card]') &&
					!target.closest('.entity-card') &&
					!target.closest('button') &&
					!target.closest('[role="button"]') &&
					!target.closest('input') &&
					!target.closest('textarea') &&
					!target.closest('.context-menu') &&
					!target.closest('[data-testid="file-browser-item"]') &&
					currentTarget.contains(target));

			if (isEmptySpaceClick && selectedIds.length > 0) {
				asyncLog('debug', '🧹 Deseleccionando por click en espacio vacío');
				clearSelection();
				lastSelectedIndexRef.current = -1;
			}
		},
		[selectedIds.length, clearSelection, asyncLog]
	);

	// Función para seleccionar todos los items
	const selectAll = useCallback(() => {
		const allIds = items.map((item) => item.id);
		setSelectedIds(allIds);
		lastSelectedIndexRef.current = items.length - 1;
		asyncLog('debug', '🎯 Todos los items seleccionados:', allIds.length);
	}, [items, setSelectedIds, asyncLog]);

	// Función para obtener el item seleccionado para navegación por teclado
	const getSelectedItemForKeyboard = useCallback((): AnyEntityWithStats | null => {
		if (selectedIds.length === 1) {
			return items.find((item) => item.id === selectedIds[0]) || null;
		}
		return lastSelectedItem as AnyEntityWithStats | null;
	}, [selectedIds, items, lastSelectedItem]);

	return {
		// Handlers principales
		handleItemClick,
		handleItemContextMenu,
		handleEmptySpaceClick,

		// Funciones de utilidad
		selectAll,
		clearSelection,
		getSelectedItemForKeyboard,

		// Estado
		selectedIds,
		selectedItems,
		hasSelection: selectedIds.length > 0,
		selectionCount: selectedIds.length,
		isDragSelecting,

		// Funciones auxiliares
		isItemSelected,
		findItemIndex,
	};
}
