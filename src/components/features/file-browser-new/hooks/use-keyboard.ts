/**
 * @file Hook de navegación por teclado para File Browser
 * @module file-browser-new/hooks/use-keyboard
 */

import { useCallback, useEffect, useRef } from 'react';
import type { BrowserItem, ViewMode, ItemClickHandler, ItemDoubleClickHandler } from '../types';

export interface UseKeyboardNavigationOptions {
	/** Items para navegar */
	items: BrowserItem[];
	/** ID del item activo actual */
	activeId: string | null;
	/** Modo de vista actual */
	viewMode: ViewMode;
	/** Handler de click */
	onItemClick?: ItemClickHandler;
	/** Handler de doble click / Enter */
	onItemDoubleClick?: ItemDoubleClickHandler;
	/** Handler para cambiar item activo */
	onActiveChange?: (id: string | null) => void;
	/** Ref del contenedor */
	containerRef: React.RefObject<HTMLElement | null>;
	/** Columnas (para navegación grid) */
	columns?: number;
	/** Deshabilitado */
	disabled?: boolean;
}

export interface UseKeyboardNavigationResult {
	/** Handler de tecla */
	handleKeyDown: (e: React.KeyboardEvent) => void;
	/** Handler nativo (para listeners en document/window) */
	handleNativeKeyDown: (e: KeyboardEvent) => void;
	/** Si la navegación está activa */
	isActive: boolean;
}

type KeyboardLikeEvent = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'preventDefault'>;

/**
 * Calcula columnas visibles basado en contenedor y tamaño de item
 */
function estimateColumns(container: HTMLElement | null, itemSize: number): number {
	if (!container) return 4;
	const containerWidth = container.clientWidth;
	const gap = 8; // gap por defecto
	return Math.max(1, Math.floor((containerWidth + gap) / (itemSize + gap)));
}

/**
 * Hook de navegación por teclado
 */
export function useKeyboardNavigation({
	items,
	activeId,
	viewMode,
	onItemClick,
	onItemDoubleClick,
	onActiveChange,
	containerRef,
	columns: columnsOverride,
	disabled = false,
}: UseKeyboardNavigationOptions): UseKeyboardNavigationResult {
	const isActiveRef = useRef(false);

	// Calcular columnas para navegación
	const getColumns = useCallback(() => {
		if (columnsOverride) return columnsOverride;
		if (viewMode === 'list' || viewMode === 'table') return 1;
		return estimateColumns(containerRef.current, 150);
	}, [columnsOverride, viewMode, containerRef]);

	// Encontrar índice del item activo
	const getActiveIndex = useCallback(() => {
		if (!activeId) return -1;
		return items.findIndex((it) => it.id === activeId);
	}, [items, activeId]);

	// Navegar a índice
	const navigateToIndex = useCallback(
		(index: number, e?: React.KeyboardEvent) => {
			if (index < 0 || index >= items.length) return;

			const item = items[index];
			onActiveChange?.(item.id);

			// Si tiene shift, hacer selección de rango via click
			if (e?.shiftKey && onItemClick) {
				onItemClick(item, { ctrlKey: false, metaKey: false, shiftKey: true });
			}
		},
		[items, onActiveChange, onItemClick]
	);

	// Handler de teclas
	const handleKeyDownCore = useCallback(
		(e: KeyboardLikeEvent) => {
			if (disabled || items.length === 0) return;

			const currentIndex = getActiveIndex();
			const cols = getColumns();

			switch (e.key) {
				case 'ArrowUp': {
					e.preventDefault();
					const targetIndex = viewMode === 'list' || viewMode === 'table' ? currentIndex - 1 : currentIndex - cols;
					if (targetIndex >= 0) {
						navigateToIndex(targetIndex, e);
					}
					break;
				}

				case 'ArrowDown': {
					e.preventDefault();
					const targetIndex = viewMode === 'list' || viewMode === 'table' ? currentIndex + 1 : currentIndex + cols;
					if (targetIndex < items.length) {
						navigateToIndex(targetIndex, e);
					}
					break;
				}

				case 'ArrowLeft': {
					e.preventDefault();
					if (currentIndex > 0) {
						navigateToIndex(currentIndex - 1, e);
					}
					break;
				}

				case 'ArrowRight': {
					e.preventDefault();
					if (currentIndex < items.length - 1) {
						navigateToIndex(currentIndex + 1, e);
					}
					break;
				}

				case 'Home': {
					e.preventDefault();
					navigateToIndex(0, e);
					break;
				}

				case 'End': {
					e.preventDefault();
					navigateToIndex(items.length - 1, e);
					break;
				}

				case 'PageUp': {
					e.preventDefault();
					const pageItems = cols * 5; // ~5 filas
					navigateToIndex(Math.max(0, currentIndex - pageItems), e);
					break;
				}

				case 'PageDown': {
					e.preventDefault();
					const pageItems = cols * 5;
					navigateToIndex(Math.min(items.length - 1, currentIndex + pageItems), e);
					break;
				}

				case 'Enter': {
					e.preventDefault();
					if (currentIndex >= 0 && onItemDoubleClick) {
						onItemDoubleClick(items[currentIndex]);
					}
					break;
				}

				case ' ': {
					e.preventDefault();
					if (currentIndex >= 0 && onItemClick) {
						onItemClick(items[currentIndex], {
							ctrlKey: e.ctrlKey,
							metaKey: e.metaKey,
							shiftKey: e.shiftKey,
						});
					}
					break;
				}

				case 'Escape': {
					e.preventDefault();
					onActiveChange?.(null);
					// También podría limpiar selección si se desea
					break;
				}

				case 'a':
				case 'A': {
					if (e.ctrlKey || e.metaKey) {
						e.preventDefault();
						// Seleccionar todos - delegado al componente padre
						// Se podría agregar un callback onSelectAll
					}
					break;
				}

				default:
					break;
			}
		},
		[
			disabled,
			items,
			getActiveIndex,
			getColumns,
			viewMode,
			navigateToIndex,
			onItemClick,
			onItemDoubleClick,
			onActiveChange,
		]
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			handleKeyDownCore(e);
		},
		[handleKeyDownCore]
	);

	const handleNativeKeyDown = useCallback(
		(e: KeyboardEvent) => {
			handleKeyDownCore(e);
		},
		[handleKeyDownCore]
	);

	// Focus handler para activar navegación (cuando cualquier hijo recibe foco)
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleFocusIn = () => {
			isActiveRef.current = true;
			// Si no hay item activo, activar el primero
			if (!activeId && items.length > 0) {
				onActiveChange?.(items[0].id);
			}
		};

		const handleFocusOut = (ev: FocusEvent) => {
			const nextTarget = ev.relatedTarget;
			if (nextTarget && nextTarget instanceof Node && container.contains(nextTarget)) {
				return;
			}
			isActiveRef.current = false;
		};

		container.addEventListener('focusin', handleFocusIn);
		container.addEventListener('focusout', handleFocusOut);

		return () => {
			container.removeEventListener('focusin', handleFocusIn);
			container.removeEventListener('focusout', handleFocusOut);
		};
	}, [containerRef, activeId, items, onActiveChange]);

	return {
		handleKeyDown,
		handleNativeKeyDown,
		isActive: isActiveRef.current,
	};
}
