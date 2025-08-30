import { useCallback, useEffect, useRef } from 'react';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import type { MediaItem } from '../components/media-thumbnail';

export interface UseKeyboardNavigationOptions {
	items: MediaItem[];
	onItemClick?: (item: MediaItem, modifiers?: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
	containerRef?: React.RefObject<HTMLElement | null>;
	viewMode?: string;
	groupBy?: string;
	disabled?: boolean;
}

export interface KeyboardNavigationState {
	focusedIndex: number;
	isKeyboardFocused: boolean;
}

/**
 * Hook para manejar navegación por teclado en el file browser
 */
export function useKeyboardNavigation({
	items,
	onItemClick,
	onItemDoubleClick,
	containerRef,
	viewMode = 'grid',
	groupBy,
	disabled = false,
}: UseKeyboardNavigationOptions) {
	const focusedIndexRef = useRef(0);
	const isKeyboardFocusedRef = useRef(false);

	// Stores
	const { selectedIds, activeId, setActiveId, setSelectedIds, toggleSelectedId, addSelectedId } = useSelectionStore();
	const { openViewer, closeViewer, isOpen: isFileViewerOpen } = useFileViewerStore();

	// Obtener el índice del elemento activo actual
	const getCurrentIndex = useCallback(() => {
		if (activeId) {
			const index = items.findIndex((item) => item.id === activeId);
			return index >= 0 ? index : 0;
		}
		// Si no hay active, usar el primer item seleccionado
		if (selectedIds.length > 0) {
			const index = items.findIndex((item) => selectedIds.includes(item.id));
			return index >= 0 ? index : 0;
		}
		return 0;
	}, [activeId, selectedIds, items]);

	// Scroll para mantener el item visible - mejorado para diferentes vistas
	const scrollToItem = useCallback(
		(index: number) => {
			if (!containerRef?.current || index < 0 || index >= items.length) return;

			const container = containerRef.current;

			// Buscar diferentes tipos de elementos que podrían representar items
			const selectors = [
				'[data-item-index]',
				'[data-file-id]',
				'.file-item',
				'.media-item',
				'canvas', // Para vistas canvas, scroll por cálculo
			];

			let targetElement: HTMLElement | null = null;

			// Intentar encontrar el elemento del item específico
			for (const selector of selectors) {
				const elements = container.querySelectorAll(selector);

				if (selector === 'canvas' && elements.length > 0) {
					// Para vistas canvas, calcular posición y hacer scroll manual
					scrollToCanvasItem(container, index, viewMode);
					return;
				}

				if (elements[index]) {
					targetElement = elements[index] as HTMLElement;
					break;
				}
			}

			if (targetElement) {
				const containerRect = container.getBoundingClientRect();
				const targetRect = targetElement.getBoundingClientRect();

				// Verificar si el elemento está fuera de vista
				const isOutOfView =
					targetRect.top < containerRect.top ||
					targetRect.bottom > containerRect.bottom ||
					targetRect.left < containerRect.left ||
					targetRect.right > containerRect.right;

				if (isOutOfView) {
					targetElement.scrollIntoView({
						behavior: 'smooth',
						block: 'nearest',
						inline: 'nearest',
					});
				}
			} else {
				// Fallback: scroll general basado en la vista
				scrollToCanvasItem(container, index, viewMode);
			}
		},
		[containerRef, items.length, viewMode]
	);

	// Helper para scroll en vistas canvas
	const scrollToCanvasItem = useCallback((container: HTMLElement, index: number, viewMode: string) => {
		if (!container) return;

		const containerHeight = container.clientHeight;
		const containerWidth = container.clientWidth;

		let targetY = 0;

		switch (viewMode) {
			case 'list':
			case 'table': {
				const rowHeight = 60; // altura estimada de fila
				targetY = index * rowHeight;
				break;
			}
			case 'grid':
			case 'cards': {
				const itemSize = viewMode === 'cards' ? 180 : 120;
				const gap = 8;
				const columns = Math.max(1, Math.floor((containerWidth + gap) / (itemSize + gap)));
				const row = Math.floor(index / columns);
				const rowHeight = itemSize + gap;
				targetY = row * rowHeight;
				break;
			}
			case 'masonry': {
				// Para masonry es más complejo, usar scroll aproximado
				const columnWidth = 200;
				const columns = Math.max(1, Math.floor(containerWidth / columnWidth));
				const approxRowHeight = 250; // altura promedio
				const row = Math.floor(index / columns);
				targetY = row * approxRowHeight;
				break;
			}
			case 'single': {
				// Single view no necesita scroll vertical
				return;
			}
			default: {
				const itemSize = 120;
				const columns = Math.max(1, Math.floor(containerWidth / itemSize));
				const row = Math.floor(index / columns);
				targetY = row * itemSize;
				break;
			}
		}

		// Centrar el item en la vista
		const centerY = targetY - containerHeight / 2;
		container.scrollTo({
			top: Math.max(0, centerY),
			behavior: 'smooth',
		});
	}, []);

	// Calcular navegación basada en el view mode - mejorado
	const getNavigationIndices = useCallback(
		(currentIndex: number, direction: 'up' | 'down' | 'left' | 'right'): number => {
			const itemCount = items.length;
			if (itemCount === 0) return -1;

			switch (viewMode) {
				case 'list':
				case 'table': {
					// Navegación vertical simple
					switch (direction) {
						case 'up':
							return Math.max(0, currentIndex - 1);
						case 'down':
							return Math.min(itemCount - 1, currentIndex + 1);
						case 'left':
						case 'right':
						default:
							return currentIndex; // No cambio en modo lista
					}
				}

				case 'single': {
					// En single view, left/right cambian entre items
					switch (direction) {
						case 'left':
							return Math.max(0, currentIndex - 1);
						case 'right':
							return Math.min(itemCount - 1, currentIndex + 1);
						default:
							return currentIndex; // No cambio para up/down en single
					}
				}

				default: {
					// Navegación de grid para grid, cards, masonry y otros
					const container = containerRef?.current;
					let columns = 4; // default fallback

					if (container) {
						const itemSize = viewMode === 'cards' ? 180 : 120;
						const gap = 8;
						columns = Math.max(1, Math.floor((container.clientWidth + gap) / (itemSize + gap)));
					}

					const row = Math.floor(currentIndex / columns);
					const col = currentIndex % columns;
					const totalRows = Math.ceil(itemCount / columns);

					switch (direction) {
						case 'up':
							if (row > 0) {
								const newIndex = (row - 1) * columns + col;
								return Math.min(newIndex, itemCount - 1);
							}
							return currentIndex;
						case 'down':
							if (row < totalRows - 1) {
								const newIndex = (row + 1) * columns + col;
								return Math.min(newIndex, itemCount - 1);
							}
							return currentIndex;
						case 'left':
							return Math.max(0, currentIndex - 1);
						case 'right':
							return Math.min(itemCount - 1, currentIndex + 1);
						default:
							return currentIndex;
					}
				}
			}
		},
		[items.length, viewMode, containerRef]
	);

	// Manejar navegación con teclado - mejorado
	const handleNavigation = useCallback(
		(direction: 'up' | 'down' | 'left' | 'right', event: KeyboardEvent) => {
			if (disabled || items.length === 0) return;

			event.preventDefault();
			event.stopPropagation();

			const currentIndex = getCurrentIndex();
			const newIndex = getNavigationIndices(currentIndex, direction);

			if (newIndex >= 0 && newIndex < items.length && newIndex !== currentIndex) {
				const newItem = items[newIndex];
				focusedIndexRef.current = newIndex;
				isKeyboardFocusedRef.current = true;

				// Manejar selección según modificadores
				if (event.shiftKey && selectedIds.length > 0) {
					// Selección de rango
					const lastActiveIndex = getCurrentIndex();
					const start = Math.min(lastActiveIndex, newIndex);
					const end = Math.max(lastActiveIndex, newIndex);
					const rangeIds = items.slice(start, end + 1).map((item) => item.id);
					setSelectedIds(rangeIds);
					setActiveId(newItem.id);
				} else if (event.ctrlKey || event.metaKey) {
					// Solo mover el foco sin cambiar selección
					setActiveId(newItem.id);
				} else {
					// Navegación normal - seleccionar el nuevo item
					setSelectedIds([newItem.id]);
					setActiveId(newItem.id);
				}

				// Scroll al elemento si está fuera de vista
				setTimeout(() => scrollToItem(newIndex), 50);
			}
		},
		[disabled, items, getCurrentIndex, getNavigationIndices, selectedIds, setActiveId, setSelectedIds, scrollToItem]
	);

	// Manejar selección con espaciado - mejorado
	const handleSpaceSelection = useCallback(
		(event: KeyboardEvent) => {
			if (disabled || items.length === 0) return;

			event.preventDefault();
			event.stopPropagation();

			const currentIndex = getCurrentIndex();
			const currentItem = items[currentIndex];

			if (currentItem) {
				if (event.ctrlKey || event.metaKey) {
					// Ctrl+Espacio - toggle selección del item actual sin mover foco
					toggleSelectedId(currentItem.id);
					// Mantener el item como activo para continuar navegación
					setActiveId(currentItem.id);
				} else {
					// Espacio normal - seleccionar solo el item actual
					setSelectedIds([currentItem.id]);
					setActiveId(currentItem.id);
				}
			}
		},
		[disabled, items, getCurrentIndex, toggleSelectedId, setSelectedIds, setActiveId]
	);

	// Manejar Enter para abrir file viewer - mejorado
	const handleEnter = useCallback(
		(event: KeyboardEvent) => {
			if (disabled || items.length === 0) return;

			event.preventDefault();
			event.stopPropagation();

			const currentIndex = getCurrentIndex();
			const currentItem = items[currentIndex];

			if (currentItem) {
				// Convertir MediaItem a ImageItem para el viewer
				const viewerItems = items.map((item) => ({
					id: item.id,
					name: item.name || '',
					type: item.entityType || 'image',
					path: item.path || '',
					size: item.size || 0,
					width: item.width || null,
					height: item.height || null,
					url: item.path || '',
					thumbnail: item.thumbnailUrl || null,
					thumbnailUrl: item.thumbnailUrl || '',
					metadata: null,
				}));

				openViewer(viewerItems, currentIndex);
				onItemDoubleClick?.(currentItem);
			}
		},
		[disabled, items, getCurrentIndex, openViewer, onItemDoubleClick]
	);

	// Manejar Escape - mejorado
	const handleEscape = useCallback(
		(event: KeyboardEvent) => {
			event.preventDefault();
			event.stopPropagation();

			if (isFileViewerOpen) {
				closeViewer();
			} else {
				// Limpiar selección si no hay file viewer abierto
				setSelectedIds([]);
				setActiveId(null);
				isKeyboardFocusedRef.current = false;
			}
		},
		[isFileViewerOpen, closeViewer, setSelectedIds, setActiveId]
	);

	// Manejar Home/End - mejorado
	const handleHomeEnd = useCallback(
		(event: KeyboardEvent, direction: 'home' | 'end') => {
			if (disabled || items.length === 0) return;

			event.preventDefault();
			event.stopPropagation();

			const newIndex = direction === 'home' ? 0 : items.length - 1;
			const newItem = items[newIndex];

			if (newItem) {
				focusedIndexRef.current = newIndex;
				isKeyboardFocusedRef.current = true;

				if (event.shiftKey && selectedIds.length > 0) {
					// Seleccionar desde el item actual hasta home/end
					const currentIndex = getCurrentIndex();
					const start = direction === 'home' ? 0 : Math.min(currentIndex, newIndex);
					const end = direction === 'home' ? Math.max(currentIndex, newIndex) : items.length - 1;
					const rangeIds = items.slice(start, end + 1).map((item) => item.id);
					setSelectedIds(rangeIds);
				} else {
					setSelectedIds([newItem.id]);
				}
				setActiveId(newItem.id);
				setTimeout(() => scrollToItem(newIndex), 50);
			}
		},
		[disabled, items, selectedIds, getCurrentIndex, setSelectedIds, setActiveId, scrollToItem]
	);

	// Event listener principal - mejorado
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			// Solo procesar si el foco está en el container del file browser o no hay otro elemento focusable activo
			const target = event.target as HTMLElement;
			const isInFileBrowser =
				containerRef?.current?.contains(target) ||
				target.closest('[data-testid="file-browser"]') ||
				target.tagName === 'BODY'; // Permitir cuando el body tiene foco

			// No interceptar si hay inputs o elementos editables con foco
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
				return;
			}

			if (!(isInFileBrowser || isFileViewerOpen)) return;

			switch (event.key) {
				case 'ArrowUp':
					handleNavigation('up', event);
					break;
				case 'ArrowDown':
					handleNavigation('down', event);
					break;
				case 'ArrowLeft':
					handleNavigation('left', event);
					break;
				case 'ArrowRight':
					handleNavigation('right', event);
					break;
				case ' ':
					handleSpaceSelection(event);
					break;
				case 'Enter':
					handleEnter(event);
					break;
				case 'Escape':
					handleEscape(event);
					break;
				case 'Home':
					handleHomeEnd(event, 'home');
					break;
				case 'End':
					handleHomeEnd(event, 'end');
					break;
				case 'a':
				case 'A':
					if (event.ctrlKey || event.metaKey) {
						event.preventDefault();
						event.stopPropagation();
						const allIds = items.map((item) => item.id);
						setSelectedIds(allIds);
						if (items.length > 0) {
							setActiveId(items[0].id);
						}
					}
					break;
				default:
					// No acción para otras teclas
					break;
			}
		},
		[
			containerRef,
			isFileViewerOpen,
			handleNavigation,
			handleSpaceSelection,
			handleEnter,
			handleEscape,
			handleHomeEnd,
			items,
			setSelectedIds,
			setActiveId,
		]
	);

	// Registrar event listeners - mejorado
	useEffect(() => {
		if (disabled) return;

		// Escuchar en document para capturar todas las teclas
		document.addEventListener('keydown', handleKeyDown, { capture: true });

		return () => {
			document.removeEventListener('keydown', handleKeyDown, { capture: true });
		};
	}, [handleKeyDown, disabled]);

	// Mantener el foco visible cuando se selecciona por primera vez
	useEffect(() => {
		if (activeId && !isKeyboardFocusedRef.current) {
			const activeIndex = items.findIndex((item) => item.id === activeId);
			if (activeIndex >= 0) {
				focusedIndexRef.current = activeIndex;
			}
		}
	}, [activeId, items]);

	// Enfocar el container cuando se inicia navegación por teclado
	useEffect(() => {
		if (isKeyboardFocusedRef.current && containerRef?.current) {
			containerRef.current.focus();
		}
	}, [containerRef]);

	return {
		focusedIndex: focusedIndexRef.current,
		isKeyboardFocused: isKeyboardFocusedRef.current,
		getCurrentIndex,
		scrollToItem,
	};
}

/**
 * Componente wrapper que agrega navegación por teclado a cualquier container
 */
export interface KeyboardNavigationWrapperProps {
	items: MediaItem[];
	children: React.ReactNode;
	onItemClick?: (item: MediaItem, modifiers?: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
	viewMode?: string;
	groupBy?: string;
	disabled?: boolean;
	className?: string;
}

export function KeyboardNavigationWrapper({
	items,
	children,
	onItemClick,
	onItemDoubleClick,
	viewMode,
	groupBy,
	disabled,
	className,
}: KeyboardNavigationWrapperProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	// Usar el hook de navegación por teclado
	const { focusedIndex, isKeyboardFocused } = useKeyboardNavigation({
		items,
		onItemClick,
		onItemDoubleClick,
		containerRef,
		viewMode,
		groupBy,
		disabled,
	});

	return (
		<div
			ref={containerRef}
			className={className}
			data-keyboard-navigation="true"
			data-focused-index={focusedIndex}
			data-keyboard-focused={isKeyboardFocused}
		>
			{children}
		</div>
	);
}
