'use client';

import { getThumbnail } from '@/app/actions/thumbnails.actions';
import { ThumbnailQuality } from '@/config/thumbnail.config';
import { logger } from '@/lib/logger';
import { toastService } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { useAlbumsStore } from '@/store/albums.store';
import { useCharactersStore } from '@/store/characters.store';
import { useCollectionsStore } from '@/store/collections.store';
import { useConceptStore } from '@/store/concept.store';
import { useFileManager } from '@/store/file-manager.store';
import { useImageResources } from '@/store/image-resources.store';
import { useNoteStore } from '@/store/note.store';
import { useObjectsStore } from '@/store/objects.store';
import { usePlacesStore } from '@/store/places.store';
import { usePromptStore } from '@/store/prompt.store';
import { useTagsStore } from '@/store/tags.store';
import type { FileItem } from '@/types/file-item';
import type { ViewMode } from '@/types/settings';
import { type VirtualItem, useVirtualizer } from '@tanstack/react-virtual';
import type * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ContextMenuAction } from './context-menu';
import { CardsView } from './views/cards-view';
import { GridView } from './views/grid-view';
import { ListView } from './views/list-view';
import { MasonryView } from './views/masonry-view';

const gridLogger = logger.withContext('FileGrid');

// Función auxiliar para parsear metadata
const getMetadata = (metadata: string | null) => {
	if (!metadata) {
		return null;
	}
	try {
		return JSON.parse(metadata);
	} catch {
		return null;
	}
};

// Tipos para la configuración del grid
interface BaseGridConfig {
	minColumns: number;
	maxColumns: number;
	itemBaseWidth: number;
	padding: number;
}

interface GridViewConfig extends BaseGridConfig {
	rowHeight: number;
	aspectRatio: number;
}

interface MasonryConfig extends BaseGridConfig {
	maxHeight: number;
	minHeight: number;
	columnGap: number;
	rowGap: number;
}

interface CardsConfig extends BaseGridConfig {
	rowHeight: number;
	aspectRatio: number;
}

interface ListConfig {
	height: number;
	padding: number;
}

interface GridGaps {
	grid: number;
	masonry: number;
	cards: number;
	list: number;
}

interface GridConfig {
	gap: GridGaps;
	grid: GridViewConfig;
	masonry: MasonryConfig;
	cards: CardsConfig;
	list: ListConfig;
	overscan: number;
}

// Configuración base del grid optimizada
export const GRID_CONFIG: GridConfig = {
	gap: {
		grid: 0,
		masonry: 8,
		cards: 16,
		list: 4,
	},
	grid: {
		minColumns: 4,
		maxColumns: 6,
		itemBaseWidth: 140,
		rowHeight: 140,
		padding: 0,
		aspectRatio: 1,
	},
	masonry: {
		minColumns: 4,
		maxColumns: 6,
		itemBaseWidth: 140,
		maxHeight: 300,
		minHeight: 100,
		padding: 0,
		columnGap: 2,
		rowGap: 2,
	},
	cards: {
		minColumns: 2,
		maxColumns: 3,
		itemBaseWidth: 360,
		rowHeight: 420,
		padding: 16,
		aspectRatio: 1.4,
	},
	list: {
		height: 80,
		padding: 4,
	},
	overscan: 30,
};

export interface FileGridProps {
	items: FileItem[];
	isResizing?: boolean;
	onItemClick?: (item: FileItem) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	loadMoreItems?: () => void;
}

export function FileGrid({ items, isResizing, onItemClick, onItemDoubleClick, loadMoreItems }: FileGridProps) {
	const parentRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState(0);
	const [isScrolling, setIsScrolling] = useState(false);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const previousViewMode = useRef<ViewMode | null>(null);
	const { selectedItems, viewMode, toggleItemSelection } = useFileManager();
	const imageResources = useImageResources();

	// Referencia para la cola de carga
	const loadQueueRef = useRef<Set<string>>(new Set());
	const retryCountRef = useRef<Map<string, number>>(new Map());
	const MAX_RETRIES = 3;

	// Dimensiones del grid memoizadas y optimizadas
	const { columns, itemSize, rowHeight } = useMemo(() => {
		const availableWidth = containerWidth || window.innerWidth - 48;
		const currentGap = GRID_CONFIG.gap[viewMode];
		const _config = GRID_CONFIG[viewMode];

		const calculateColumns = (config: BaseGridConfig) => {
			const { minColumns, maxColumns, itemBaseWidth, padding } = config;
			const totalPadding = padding * 2;
			const _totalGapWidth = currentGap * (maxColumns - 1);
			const availableWidthWithGap = availableWidth - totalPadding;
			const calculatedCols = Math.floor(availableWidthWithGap / (itemBaseWidth + currentGap));
			return Math.max(minColumns, Math.min(maxColumns, calculatedCols));
		};

		const calculateItemSize = (cols: number, config: BaseGridConfig) => {
			const totalPadding = config.padding * 2;
			const totalGapWidth = currentGap * (cols - 1);
			const availableWidthWithGap = availableWidth - totalPadding;
			const itemWidth = Math.floor((availableWidthWithGap - totalGapWidth) / cols);

			// Asegurar que el tamaño no exceda el máximo para el modo
			return Math.min(itemWidth, viewMode === 'masonry' ? config.itemBaseWidth * 1.5 : itemWidth);
		};

		let cols: number;
		let size: number;
		let height: number;

		switch (viewMode) {
			case 'masonry': {
				const config = GRID_CONFIG.masonry;
				cols = calculateColumns(config);
				size = calculateItemSize(cols, config);
				height = 0;
				break;
			}
			case 'cards': {
				const config = GRID_CONFIG.cards;
				cols = calculateColumns(config);
				size = calculateItemSize(cols, config);
				height = config.rowHeight;
				break;
			}
			case 'list': {
				const config = GRID_CONFIG.list;
				cols = 1;
				size = availableWidth - currentGap * 2 - config.padding * 2;
				height = config.height;
				break;
			}
			default: {
				const config = GRID_CONFIG.grid;
				cols = calculateColumns(config);
				size = calculateItemSize(cols, config);
				height = size;
			}
		}

		return { columns: cols, itemSize: size, rowHeight: height };
	}, [containerWidth, viewMode]);

	// Optimizar el cálculo de altura para masonry
	const calculateMasonryHeight = useCallback((item: FileItem, baseWidth: number) => {
		const metadata = getMetadata(item.metadata);
		const config = GRID_CONFIG.masonry;

		if (!metadata?.dimensions) {
			return config.minHeight;
		}

		const aspectRatio = metadata.dimensions.width / metadata.dimensions.height;
		const calculatedHeight = Math.round(baseWidth / aspectRatio);

		return Math.max(config.minHeight, Math.min(calculatedHeight, config.maxHeight));
	}, []);

	// Actualizar virtualizer con soporte mejorado para masonry
	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize: useCallback(
			(index: number) => {
				const item = items[index];
				if (!item) {
					return rowHeight + GRID_CONFIG.gap[viewMode];
				}

				switch (viewMode) {
					case 'masonry': {
						const height = calculateMasonryHeight(item, itemSize);
						return height + GRID_CONFIG.masonry.rowGap;
					}
					case 'cards':
						return GRID_CONFIG.cards.rowHeight + GRID_CONFIG.gap[viewMode];
					case 'list':
						return GRID_CONFIG.list.height + GRID_CONFIG.gap[viewMode];
					default:
						return itemSize + GRID_CONFIG.gap[viewMode];
				}
			},
			[items, viewMode, itemSize, rowHeight, calculateMasonryHeight]
		),
		overscan: GRID_CONFIG.overscan,
		horizontal: false,
		lanes: viewMode === 'list' ? 1 : columns,
		gap: viewMode === 'masonry' ? GRID_CONFIG.masonry.columnGap : GRID_CONFIG.gap[viewMode],
		scrollPaddingStart: GRID_CONFIG.gap[viewMode],
		scrollPaddingEnd: GRID_CONFIG.gap[viewMode],
	});

	// Función mejorada para cargar thumbnails con reintentos
	const loadThumbnail = useCallback(
		async (itemId: string) => {
			if (loadQueueRef.current.has(itemId)) {
				return null;
			}

			const retryCount = retryCountRef.current.get(itemId) || 0;
			if (retryCount >= MAX_RETRIES) {
				return null;
			}

			try {
				loadQueueRef.current.add(itemId);
				const thumbnail = await imageResources.getThumbnail(itemId);
				loadQueueRef.current.delete(itemId);
				if (thumbnail) {
					retryCountRef.current.delete(itemId);
					return thumbnail;
				}
				// Si no hay thumbnail, incrementar contador de reintentos
				retryCountRef.current.set(itemId, retryCount + 1);
				return null;
			} catch (err) {
				console.error('Error loading thumbnail:', err);
				loadQueueRef.current.delete(itemId);
				retryCountRef.current.set(itemId, retryCount + 1);
				return null;
			}
		},
		[imageResources]
	);

	// Efecto mejorado para precargar thumbnails
	useEffect(() => {
		const loadVisibleThumbnails = async () => {
			const visibleItems = virtualizer
				.getVirtualItems()
				.map((virtualItem) => items[virtualItem.index])
				.filter((item): item is FileItem => !!item);

			// Precargar thumbnails de items visibles
			const visibleIds = visibleItems.map((item) => item.id);
			imageResources.preloadResources(visibleIds);

			// Procesar items sin thumbnail en orden
			for (const item of visibleItems) {
				const resource = imageResources.resources.get(item.id);
				if (!resource?.thumbnail && !loadQueueRef.current.has(item.id)) {
					await loadThumbnail(item.id);
				}
			}
		};

		// Cargar thumbnails inmediatamente y después de un breve delay
		loadVisibleThumbnails();
		const timeoutId = setTimeout(loadVisibleThumbnails, 500);

		return () => clearTimeout(timeoutId);
	}, [items, imageResources, loadThumbnail, virtualizer]);

	// Limpiar timeouts
	useEffect(() => {
		return () => {
			if (scrollingTimeoutRef.current) {
				clearTimeout(scrollingTimeoutRef.current);
			}
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}
			if (transitionTimeoutRef.current) {
				clearTimeout(transitionTimeoutRef.current);
			}
		};
	}, []);

	// Forzar recálculo al cambiar de vista
	useEffect(() => {
		if (previousViewMode.current !== viewMode) {
			setIsTransitioning(true);
			if (transitionTimeoutRef.current) {
				clearTimeout(transitionTimeoutRef.current);
			}

			// Resetear scroll
			if (parentRef.current) {
				parentRef.current.scrollTop = 0;
			}

			// Forzar recálculo después de un breve delay
			transitionTimeoutRef.current = setTimeout(() => {
				if (parentRef.current) {
					const width = parentRef.current.offsetWidth;
					setContainerWidth(width);
					previousViewMode.current = viewMode;
					setIsTransitioning(false);
				}
			}, 50);
		}
	}, [viewMode]);

	// Optimizar ResizeObserver con mejor manejo de cambios
	useEffect(() => {
		if (!parentRef.current) {
			return;
		}

		const updateWidth = (width: number) => {
			if (width > 0 && (width !== containerWidth || previousViewMode.current !== viewMode)) {
				setContainerWidth(width);
				previousViewMode.current = viewMode;
			}
		};

		const resizeObserver = new ResizeObserver((entries) => {
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}

			const width = entries[0].contentRect.width;
			if (isResizing) {
				resizeTimeoutRef.current = setTimeout(() => {
					updateWidth(width);
				}, 100);
			} else {
				updateWidth(width);
			}
		});

		resizeObserver.observe(parentRef.current);
		return () => {
			resizeObserver.disconnect();
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}
		};
	}, [containerWidth, isResizing, viewMode]);

	// Optimizar el manejo del scroll infinito
	useEffect(() => {
		if (!loadMoreRef.current || !loadMoreItems) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry?.isIntersecting && !isScrolling) {
					requestAnimationFrame(() => {
						loadMoreItems();
					});
				}
			},
			{
				rootMargin: '100px 0px',
				threshold: 0,
			}
		);

		observer.observe(loadMoreRef.current);
		return () => observer.disconnect();
	}, [loadMoreItems, isScrolling]);

	// Mejorar el manejo de scroll
	const handleScroll = useCallback(() => {
		if (scrollingTimeoutRef.current) {
			clearTimeout(scrollingTimeoutRef.current);
		}

		// No bloquear la carga durante el scroll
		const visibleItems = virtualizer
			.getVirtualItems()
			.map((virtualItem) => items[virtualItem.index])
			.filter((item): item is FileItem => !!item);

		// Intentar cargar thumbnails faltantes durante el scroll
		for (const item of visibleItems) {
			const resource = imageResources.resources.get(item.id);
			if (!resource?.thumbnail && !loadQueueRef.current.has(item.id)) {
				loadThumbnail(item.id);
			}
		}

		setIsScrolling(true);
		scrollingTimeoutRef.current = setTimeout(() => {
			setIsScrolling(false);
		}, 150);
	}, [items, virtualizer, loadThumbnail, imageResources]);

	const handleContextAction = useCallback(
		(action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => {
			gridLogger.info(`⚡ Acción del menú contextual: ${action}`, {
				item: item.id,
				data,
			});

			// Acciones que no son de asociación de entidades
			switch (action) {
				case 'preview':
					onItemDoubleClick?.(item);
					break;
				case 'mark-toggle':
					gridLogger.info('🚩 Toggling mark status');
					// Utilizar toggleItemSelection para marcar/desmarcar
					// Pasamos true como segundo parámetro para indicar que es una selección múltiple
					// esto permite mantener los elementos ya marcados
					toggleItemSelection(item, true);
					toastService.system.info('Estado de selección cambiado');
					break;
				case 'open':
					gridLogger.info('📂 Abriendo ubicación del archivo', item.path);
					// Abrir ubicación del archivo en el explorador de archivos
					if (item.path) {
						window.electron?.openPath(item.path);
					}
					break;
				case 'download':
					gridLogger.info('⬇️ Descargando archivo', item.path);
					// Implementar descarga del archivo
					if (item.path) {
						window.electron?.downloadFile(item.path);
						toastService.system.success('Descarga iniciada');
					}
					break;
				case 'copy':
					gridLogger.info('📋 Copiando archivo al portapapeles', item.path);
					// Copiar al portapapeles
					if (item.path) {
						window.electron?.copyFileToClipboard(item.path);
						toastService.system.success('Imagen copiada al portapapeles');
					}
					break;
				case 'copy-path':
					gridLogger.info('📋 Copiando ruta del archivo al portapapeles', item.path);
					// Copiar ruta al portapapeles
					if (item.path) {
						navigator.clipboard
							.writeText(item.path)
							.then(() => {
								gridLogger.info('✅ Ruta copiada al portapapeles');
								toastService.system.success('Ruta copiada al portapapeles');
							})
							.catch((error) => {
								gridLogger.error('❌ Error al copiar ruta:', error);
								toastService.system.error('Error al copiar la ruta');
							});
					}
					break;
				case 'delete':
					gridLogger.info('🗑️ Eliminando archivo', item.path);
					// Implementar eliminación del archivo con confirmación
					if (item.path) {
						if (window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
							window.electron?.deleteFile(item.path);
							toastService.system.info('Archivo enviado a la papelera');
						}
					}
					break;
				// Acciones de creación de entidades
				case 'collection-create':
					gridLogger.info('🆕 Creando nueva colección');
					// Mostrar diálogo para crear colección
					window.dispatchEvent(
						new CustomEvent('open-create-collection-dialog', {
							detail: { imageId: item.id },
						})
					);
					break;
				case 'tag-create':
					gridLogger.info('🆕 Creando nueva etiqueta');
					// Mostrar diálogo para crear etiqueta
					window.dispatchEvent(
						new CustomEvent('open-create-tag-dialog', {
							detail: { imageId: item.id },
						})
					);
					break;
				case 'album-create':
					gridLogger.info('🆕 Creando nuevo álbum');
					// Mostrar diálogo para crear álbum
					window.dispatchEvent(
						new CustomEvent('open-create-album-dialog', {
							detail: { imageId: item.id },
						})
					);
					break;
				case 'character-create':
					gridLogger.info('🆕 Creando nuevo personaje');
					// Mostrar diálogo para crear personaje
					window.dispatchEvent(
						new CustomEvent('open-create-character-dialog', {
							detail: { imageId: item.id },
						})
					);
					break;
				case 'place-create':
					gridLogger.info('🆕 Creando nuevo lugar');
					// Mostrar diálogo para crear lugar
					window.dispatchEvent(
						new CustomEvent('open-create-place-dialog', {
							detail: { imageId: item.id },
						})
					);
					break;
				case 'object-create':
					gridLogger.info('🆕 Creando nuevo objeto');
					// Mostrar diálogo para crear objeto
					window.dispatchEvent(
						new CustomEvent('open-create-object-dialog', {
							detail: { imageId: item.id },
						})
					);
					break;
				case 'prompt-create':
					gridLogger.info('🆕 Creando nuevo prompt');
					// Mostrar diálogo para crear prompt
					window.dispatchEvent(
						new CustomEvent('open-create-prompt-dialog', {
							detail: { imageId: item.id },
						})
					);
					break;
				case 'note-create':
					gridLogger.info('🆕 Creando nueva nota');
					// Mostrar diálogo para crear nota
					window.dispatchEvent(
						new CustomEvent('open-create-note-dialog', {
							detail: { imageId: item.id },
						})
					);
					break;
				case 'concept-create':
					gridLogger.info('🆕 Creando nuevo concepto');
					// Mostrar diálogo para crear concepto
					window.dispatchEvent(
						new CustomEvent('open-create-concept-dialog', {
							detail: { imageId: item.id },
						})
					);
					break;
				// Acciones de asociación de entidades
				case 'collection-add':
					gridLogger.info('➕ Añadiendo imagen a colección', data);
					if (data?.id) {
						const collectionId = data.id as string;
						// Buscar la colección en el store para obtener el nombre
						const collection = useCollectionsStore.getState().collections.find((c) => c.id === collectionId);
						try {
							useCollectionsStore.getState().addImageToCollection(collectionId, item.id);
							toastService.collection.imageAdded(collection?.name);
						} catch (error) {
							gridLogger.error('❌ Error al añadir imagen a colección:', error);
							toastService.system.error('Error al añadir imagen a la colección');
						}
					}
					break;
				case 'tag-add':
					gridLogger.info('➕ Añadiendo etiqueta a imagen', data);
					if (data?.id) {
						const tagId = data.id as string;
						const tag = useTagsStore.getState().tags.find((t) => t.id === tagId);
						try {
							useTagsStore.getState().addTagToImage(tagId, item.id);
							toastService.tag.imageAdded(tag?.name);
						} catch (error) {
							gridLogger.error('❌ Error al añadir etiqueta a imagen:', error);
							toastService.system.error('Error al añadir etiqueta a la imagen');
						}
					}
					break;
				case 'album-add':
					gridLogger.info('➕ Añadiendo imagen a álbum', data);
					if (data?.id) {
						const albumId = data.id as string;
						const album = useAlbumsStore.getState().albums.find((a) => a.id === albumId);
						try {
							useAlbumsStore.getState().addImageToAlbum(albumId, item.id);
							toastService.system.success(`Imagen añadida al álbum "${album?.name || ''}"`);
						} catch (error) {
							gridLogger.error('❌ Error al añadir imagen a álbum:', error);
							toastService.system.error('Error al añadir imagen al álbum');
						}
					}
					break;
				case 'character-add':
					gridLogger.info('➕ Añadiendo imagen a personaje', data);
					if (data?.id) {
						const characterId = data.id as string;
						const character = useCharactersStore.getState().characters.find((c) => c.id === characterId);
						try {
							useCharactersStore.getState().addImageToCharacter(characterId, item.id);
							toastService.system.success(`Imagen añadida al personaje "${character?.name || ''}"`);
						} catch (error) {
							gridLogger.error('❌ Error al añadir imagen a personaje:', error);
							toastService.system.error('Error al añadir imagen al personaje');
						}
					}
					break;
				case 'place-add':
					gridLogger.info('➕ Añadiendo imagen a lugar', data);
					if (data?.id) {
						const placeId = data.id as string;
						const place = usePlacesStore.getState().places.find((p) => p.id === placeId);
						try {
							usePlacesStore.getState().addImageToPlace(placeId, item.id);
							toastService.system.success(`Imagen añadida al lugar "${place?.name || ''}"`);
						} catch (error) {
							gridLogger.error('❌ Error al añadir imagen a lugar:', error);
							toastService.system.error('Error al añadir imagen al lugar');
						}
					}
					break;
				case 'object-add':
					gridLogger.info('➕ Añadiendo imagen a objeto', data);
					if (data?.id) {
						const objectId = data.id as string;
						const objectEntity = useObjectsStore.getState().objects.find((o) => o.id === objectId);
						try {
							useObjectsStore.getState().addImageToObject(objectId, item.id);
							toastService.system.success(`Imagen añadida al objeto "${objectEntity?.name || ''}"`);
						} catch (error) {
							gridLogger.error('❌ Error al añadir imagen a objeto:', error);
							toastService.system.error('Error al añadir imagen al objeto');
						}
					}
					break;
				case 'prompt-add':
					gridLogger.info('➕ Añadiendo prompt a imagen', data);
					if (data?.id) {
						const promptId = data.id as string;
						const prompt = usePromptStore.getState().prompts.find((p) => p.id === promptId);
						try {
							// Suponiendo que existe una función addPromptToImage en el store de prompts
							if (usePromptStore.getState().addPromptToImage) {
								usePromptStore.getState().addPromptToImage(promptId, item.id);
								toastService.system.success(`Prompt "${prompt?.name || ''}" añadido a la imagen`);
							}
						} catch (error) {
							gridLogger.error('❌ Error al añadir prompt a imagen:', error);
							toastService.system.error('Error al añadir prompt a la imagen');
						}
					}
					break;
				case 'note-add':
					gridLogger.info('➕ Añadiendo nota a imagen', data);
					if (data?.id) {
						const noteId = data.id as string;
						const note = useNoteStore.getState().notes.find((n) => n.id === noteId);
						try {
							useNoteStore.getState().addNoteToImage(noteId, item.id);
							toastService.system.success(`Nota "${note?.name || ''}" añadida a la imagen`);
						} catch (error) {
							gridLogger.error('❌ Error al añadir nota a imagen:', error);
							toastService.system.error('Error al añadir nota a la imagen');
						}
					}
					break;
				case 'concept-add':
					gridLogger.info('➕ Añadiendo concepto a imagen', data);
					if (data?.id) {
						const conceptId = data.id as string;
						const concept = useConceptStore.getState().concepts.find((c) => c.id === conceptId);
						try {
							useConceptStore.getState().addConceptToImage(conceptId, item.id);
							toastService.system.success(`Concepto "${concept?.name || ''}" añadido a la imagen`);
						} catch (error) {
							gridLogger.error('❌ Error al añadir concepto a imagen:', error);
							toastService.system.error('Error al añadir concepto a la imagen');
						}
					}
					break;
				default:
					// No hay acción definida
					gridLogger.warn(`⚠️ Acción no implementada: ${action}`);
					break;
			}
		},
		[onItemDoubleClick, toggleItemSelection]
	);

	return (
		<div
			ref={parentRef}
			className={cn(
				'h-full w-full overflow-auto relative',
				viewMode === 'list' && 'px-2 py-1',
				isTransitioning && 'opacity-0 transition-opacity duration-50'
			)}
			onScroll={handleScroll}
			style={{
				height: '100%',
				width: '100%',
				position: 'relative',
				contain: 'strict',
				willChange: 'transform',
				padding: GRID_CONFIG[viewMode].padding,
			}}
		>
			<div
				style={{
					height: virtualizer.getTotalSize(),
					width: '100%',
					position: 'relative',
					contain: 'strict',
				}}
			>
				{!isTransitioning &&
					virtualizer.getVirtualItems().map((virtualItem) => {
						const item = items[virtualItem.index];
						if (!item) {
							return null;
						}

						const style: React.CSSProperties = {
							position: 'absolute',
							top: 0,
							left: 0,
							transform: `translate3d(${
								viewMode === 'list' ? 0 : virtualItem.lane * (itemSize + GRID_CONFIG.gap[viewMode])
							}px, ${virtualItem.start}px, 0)`,
							width: viewMode === 'list' ? '100%' : itemSize,
							height:
								viewMode === 'masonry'
									? calculateMasonryHeight(item, itemSize)
									: virtualItem.size - GRID_CONFIG.gap[viewMode],
							padding: 0,
							willChange: 'transform',
						};

						const ViewComponent = {
							grid: GridView,
							masonry: MasonryView,
							cards: CardsView,
							list: ListView,
						}[viewMode];

						const resource = imageResources.resources.get(item.id);
						const thumbnail = resource?.thumbnail || null;

						return (
							<div
								key={`${viewMode}-${virtualItem.key}`}
								data-index={virtualItem.index}
								className={cn('absolute')}
								style={style}
							>
								<ViewComponent
									item={item}
									onClick={onItemClick}
									onDoubleClick={onItemDoubleClick}
									onContextAction={handleContextAction}
									shouldLoad={true}
									isSelected={selectedItems.some((selected) => selected.id === item.id)}
									itemSize={itemSize}
									thumbnail={thumbnail}
									style={{
										width: '100%',
										height: '100%',
									}}
								/>
							</div>
						);
					})}
			</div>
			<div ref={loadMoreRef} className="h-px w-full" />
		</div>
	);
}
