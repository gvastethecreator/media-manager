'use client';

import { FileViewer, type ImageItem } from '@/components/features/file-viewer/file-viewer';
import { ALL_ENTITIES } from '@/constants/entities';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFileManager } from '@/store/files/file-manager.store';
import { useImageResources } from '@/store/image-resources.store';
import type { FileItem } from '@/types/file-item';
import type * as React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GRID_CONFIG } from './config/grid-config';
import { handleContextAction } from './context-menu/context-action-handler';
import type { ContextMenuAction } from './context-menu/context-menu';
import { useEntityLoader } from './context-menu/hooks/use-entity-loader';
import { useGridView } from './hooks/use-grid-view';
import { useGridVirtualizer } from './hooks/use-grid-virtualizer';
import { CardsView } from './views/cards-view';
import { GridView } from './views/grid-view';
import { ListView } from './views/list-view';
import { MasonryView } from './views/masonry-view';

// Para propósitos de depuración - mantenemos esta variable aunque esté sin usar en la mayoría de los casos
const gridLogger = clientLogger.withContext('FileGrid');

/**
 * FileBrowser - Componente avanzado para visualización y gestión de archivos
 *
 * Este componente implementa una interfaz de navegación de archivos con múltiples modos de visualización
 * (grid, lista, masonry, tarjetas) y funcionalidades avanzadas como virtualización, carga optimizada
 * de miniaturas, selección múltiple y panel de detalles interactivo.
 *
 * @see Documentación completa en docs/components/file-browser.md
 */
export interface FileBrowserProps {
	items: FileItem[];
	isResizing?: boolean;
	onItemClick?: (item: FileItem) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	loadMoreItems?: () => void;
}

// Memoizamos los componentes de vista para evitar renderizaciones innecesarias
const MemoizedGridView = memo(GridView);
const MemoizedMasonryView = memo(MasonryView);
const MemoizedCardsView = memo(CardsView);
const MemoizedListView = memo(ListView);

// Mapeo memoizado de componentes de vista
const VIEW_COMPONENT_MAP = {
	grid: MemoizedGridView,
	masonry: MemoizedMasonryView,
	cards: MemoizedCardsView,
	list: MemoizedListView,
};

// Memoizamos el estado del panel colapsado para evitar lecturas frecuentes del localStorage
const useRightPanelState = () => {
	const [isCollapsed, setIsCollapsed] = useState(() =>
		localStorage.getItem('right-panel-collapsed') === 'true'
	);

	const updateCollapsedState = useCallback((newState: boolean) => {
		localStorage.setItem('right-panel-collapsed', String(newState));
		setIsCollapsed(newState);
	}, []);

	return { isCollapsed, updateCollapsedState };
};

/**
 * Componente principal para la visualización y navegación de archivos
 *
 * Características principales:
 * - Múltiples modos de visualización (grid, lista, masonry, tarjetas)
 * - Virtualización para rendimiento optimizado
 * - Carga diferida de miniaturas
 * - Panel de detalles interactivo y arrastrable
 * - Selección múltiple de archivos
 * - Integración con sistema de menú contextual
 */
const FileBrowserComponent = ({ items, isResizing, onItemClick, onItemDoubleClick, loadMoreItems }: FileBrowserProps) => {
	const { selectedItems, viewMode, toggleItemSelection } = useFileManager();
	const imageResources = useImageResources();
	const { setVisible, setSelectedItems } = useDetailsPanel();
	const { isCollapsed, updateCollapsedState } = useRightPanelState();
	const constraintsRef = useRef<HTMLDivElement>(null);
	const prevSelectedItemIdsRef = useRef<string>('');
	const prevSelectedItemRef = useRef<FileItem | null>(null);
	const { loadEntityData } = useEntityLoader();

	// Referencia para trackear los IDs de los items ya cargados - movida fuera del useEffect
	const loadedItemIdsRef = useRef<Set<string>>(new Set());

	// Estados para el visor de imágenes
	const [isViewerOpen, setIsViewerOpen] = useState(false);
	const [viewerImages, setViewerImages] = useState<ImageItem[]>([]);
	const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

	// Referencia para controlar si ya se realizó la precarga de entidades
	const entitiesPreloadedRef = useRef<boolean>(false);

	// Crear una referencia local para el div parent
	const gridParentRef = useRef<HTMLDivElement>(null);

	// Usar los hooks para separar la lógica
	const { parentRef, loadMoreRef, containerWidth, isTransitioning, handleScroll, debouncedLoadThumbnails } =
		useGridView({
			viewMode,
			isResizing,
			loadMoreItems,
		});

	// Hook para virtualización - usamos un cast de tipo para resolver el problema de incompatibilidad
	const { itemSize, virtualizer, calculateMasonryHeight } = useGridVirtualizer({
		items,
		parentRef: gridParentRef as React.RefObject<HTMLDivElement>,
		viewMode,
		containerWidth,
	});

	// Efecto para actualizar la virtualización cuando cambie el ordenamiento
	useEffect(() => {
		if (virtualizer) {
			virtualizer.measure();
			virtualizer.scrollToIndex(0);
		}
	}, [virtualizer]);

	// Efecto para precargar todas las entidades necesarias al montar el componente
	useEffect(() => {
		// Verificar si ya se hizo la precarga a nivel global o en esta instancia
		if (typeof window !== 'undefined' && window.entityPreloadComplete) {
			gridLogger.info('✅ Entidades ya precargadas globalmente desde layout, omitiendo precarga desde FileBrowser');
			return;
		}

		// Verificar si hay una precarga en progreso en otro componente
		if (typeof window !== 'undefined' && window.entityPreloadInProgress) {
			gridLogger.info('⏳ Hay una precarga en progreso en otro componente, omitiendo precarga desde FileBrowser');
			return;
		}

		// Evitar precargar múltiples veces en la misma instancia
		if (entitiesPreloadedRef.current) {
			return;
		}

		entitiesPreloadedRef.current = true;
		gridLogger.info('🚀 Iniciando precarga de entidades de respaldo desde FileBrowser...');

		// Marcar que una precarga está en progreso
		if (typeof window !== 'undefined') {
			window.entityPreloadInProgress = true;
		}

		// Lista completa de entidades a precargar proactivamente (usando las constantes centralizadas)
		const allEntities = [...ALL_ENTITIES];

		// Precargar todas las entidades en paralelo
		const preloadAllEntities = async () => {
			try {
				const results = await Promise.allSettled(
					allEntities.map(entity =>
						loadEntityData(entity as any)
							.catch(err => {
								gridLogger.warn(`⚠️ Error al precargar ${entity}:`, err);
								return [];
							})
					)
				);

				// Informar sobre el resultado de la precarga
				const succeeded = results.filter(r => r.status === 'fulfilled').length;
				const failed = results.filter(r => r.status === 'rejected').length;

				gridLogger.info(`✅ Precarga de respaldo completada desde FileBrowser: ${succeeded} exitosas, ${failed} fallidas`);

				// Marcar globalmente que la precarga está completa
				if (typeof window !== 'undefined') {
					window.entityPreloadComplete = true;
					window.entityPreloadInProgress = false;
				}
			} catch (error) {
				gridLogger.error('❌ Error durante precarga de entidades:', error);

				// Limpiar el estado de precarga en progreso en caso de error
				if (typeof window !== 'undefined') {
					window.entityPreloadInProgress = false;
				}
			}
		};

		preloadAllEntities();

		// Limpiar estados si el componente se desmonta durante la precarga
		return () => {
			if (typeof window !== 'undefined' && !window.entityPreloadComplete) {
				window.entityPreloadInProgress = false;
			}
		};
	}, [loadEntityData]);

	// Función memoizada para mapear FileItem a ImageItem
	const mapFileItemToImageItem = useCallback((fileItem: FileItem): ImageItem => ({
		id: fileItem.id,
		name: fileItem.name,
		type: fileItem.type,
		path: fileItem.path,
		size: fileItem.size,
		width: fileItem.width || null,
		height: fileItem.height || null,
		url: fileItem.thumbnail || undefined,
		thumbnail: fileItem.thumbnail,
		src: fileItem.thumbnail || undefined,
		alt: fileItem.name,
		mimeType: undefined,
		metadata: fileItem.metadata,
		parsedMetadata: undefined
	}), []);

	// Función memoizada para mapear FileItem a ImageItem para el panel de detalles
	const mapToDetailsImageItem = useCallback((item: FileItem): ImageItem => ({
		id: item.id,
		name: item.name,
		path: item.path,
		url: item.thumbnail || undefined,
		src: item.thumbnail || '',
		alt: item.name,
		metadata: item.metadata,
		fileSize: item.size,
		width: item.width,
		height: item.height,
		tags: item.tags?.map((tag) => tag.name),
		createdAt: item.createdAt,
		updatedAt: item.updatedAt,
		mimeType: item.type === 'image' ? 'image/jpeg' : undefined, // Ajustar según el tipo real
		parsedMetadata: item.metadata ? JSON.parse(item.metadata) : undefined,
	}), []);

	// Manejador personalizado para el clic en ítems - optimizado
	const handleItemClick = useCallback(
		(item: FileItem) => {
			// Evitar procesamiento si es el mismo ítem y ya está seleccionado
			if (prevSelectedItemRef.current?.id === item.id &&
				selectedItems.length === 1 &&
				selectedItems[0].id === item.id) {
				return;
			}

			prevSelectedItemRef.current = item;

			// Actualizar selección
			toggleItemSelection(item, false);

			// Mostrar y expandir panel de detalles si está colapsado
			if (isCollapsed) {
				updateCollapsedState(false);
			}
			setVisible(true);

			// Actualizar el panel de detalles inmediatamente con el item seleccionado
			const mappedItem = mapToDetailsImageItem(item);
			setSelectedItems([mappedItem]);

			// Llamar al callback onItemClick si existe
			if (onItemClick) {
				onItemClick(item);
			}
		},
		[toggleItemSelection, setVisible, onItemClick, selectedItems, isCollapsed, updateCollapsedState, mapToDetailsImageItem, setSelectedItems]
	);

	// Manejador personalizado para el doble clic en ítems
	const handleItemDoubleClick = useCallback(
		(item: FileItem) => {
			// Verificar que sea una imagen
			if (item && item.type === 'image') {
				// Convertir FileItem a ImageItem (según la interfaz de FileViewer.tsx)
				const imageItems = items
					.filter(fileItem => fileItem.type === 'image')
					.map(mapFileItemToImageItem);

				// Encontrar el índice del elemento seleccionado
				const initialIndex = imageItems.findIndex(img => img.id === item.id);

				if (initialIndex !== -1) {
					// Establecer los datos del visor
					setViewerImages(imageItems);
					setViewerInitialIndex(initialIndex);
					// Abrir el visor
					setIsViewerOpen(true);
				}
			}

			// Llamar al callback externo si existe
			if (onItemDoubleClick) {
				onItemDoubleClick(item);
			}
		},
		[items, onItemDoubleClick, mapFileItemToImageItem]
	);

	// Función wrapper memoizada para toggleItemSelection
	const toggleItemSelectionWrapper = useCallback(
		(fileItem: FileItem, isMultiSelect = false) => {
			toggleItemSelection(fileItem, isMultiSelect);
		},
		[toggleItemSelection]
	);

	// Manejador de acciones contextuales - memoizado
	const handleContextMenuAction = useCallback(
		(action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => {
			handleContextAction(action, item, data, handleItemDoubleClick, toggleItemSelectionWrapper);
		},
		[handleItemDoubleClick, toggleItemSelectionWrapper]
	);

	// Efecto para cargar thumbnails visibles cuando cambia la lista
	useEffect(() => {
		if (!virtualizer || items.length === 0 || isTransitioning) {
			return;
		}

		// Usamos un ID de efecto para controlar los montajes/desmontajes
		const effectId = Math.random().toString(36);
		let isEffectActive = true;

		// Función para cargar thumbnails con debounce interno
		const loadThumbnailsForVisibleItems = () => {
			if (!isEffectActive) return;

			const visibleItems = virtualizer
				.getVirtualItems()
				.map((virtualItem) => items[virtualItem.index])
				.filter((item): item is FileItem => !!item && !!item.id);

			// Solo procesar si hay elementos visibles
			if (visibleItems.length === 0) return;

			// Filtrar solo los items que aún no han sido procesados
			const newVisibleItems = visibleItems.filter(item => {
				// Si ya lo hemos procesado, omitirlo
				if (loadedItemIdsRef.current.has(item.id)) return false;

				// Marcar como procesado para no volver a procesarlo
				loadedItemIdsRef.current.add(item.id);
				return true;
			});

			// Si no hay nuevos elementos para cargar, salir
			if (newVisibleItems.length === 0) return;

			// Usar el debounce para cargar los thumbnails
			debouncedLoadThumbnails(newVisibleItems);
		};

		// Cargar inicialmente
		loadThumbnailsForVisibleItems();

		// Limpiar cuando cambia la dependencia
		return () => {
			isEffectActive = false;
		};
	}, [virtualizer, items, isTransitioning, debouncedLoadThumbnails]);

	// Efecto para manejar la actualización del panel de detalles de forma optimizada
	useEffect(() => {
		if (selectedItems.length === 0) {
			setSelectedItems([]);
			return;
		}

		const selectedItemIds = selectedItems.map(item => item.id).sort().join(',');
		if (selectedItemIds === prevSelectedItemIdsRef.current) {
			return;
		}

		prevSelectedItemIdsRef.current = selectedItemIds;

		// Mapear todos los items seleccionados
		const mappedItems = selectedItems.map(mapToDetailsImageItem);
		setSelectedItems(mappedItems);

		// Asegurar que el panel de detalles esté visible si hay items seleccionados
		if (mappedItems.length > 0 && !isCollapsed) {
			updateCollapsedState(true);
		}
	}, [selectedItems, setSelectedItems, mapToDetailsImageItem, updateCollapsedState, isCollapsed]);

	// Sincronizar nuestra ref local con la ref del hook
	useEffect(() => {
		if (gridParentRef.current) {
			parentRef.current = gridParentRef.current;
		}
	}, [parentRef]);

	// Memoizamos los elementos virtualizados para evitar recálculos innecesarios
	const virtualItems = useMemo(() => {
		if (isTransitioning || !virtualizer) return [];
		return virtualizer.getVirtualItems();
	}, [virtualizer, isTransitioning]);

	// Estilo general del contenedor - memoizado para evitar recreaciones
	const containerStyle = useMemo(() => ({
		height: virtualizer ? virtualizer.getTotalSize() : 0,
		width: '100%',
		position: 'relative' as const,
		contain: 'strict' as const,
	}), [virtualizer]);

	// Estilo del contenedor principal de la grilla - memoizado
	const gridContainerStyle = useMemo(() => ({
		height: '100%',
		width: '100%',
		position: 'relative' as const,
		contain: 'strict' as const,
		willChange: 'transform',
		padding: GRID_CONFIG[viewMode].padding,
	}), [viewMode]);

	// Clase del contenedor de la grilla - memoizada
	const gridContainerClassName = useMemo(() =>
		cn(
			'h-full w-full overflow-auto relative transition-all duration-200',
			viewMode === 'list' && 'px-2 py-1',
			isTransitioning && 'opacity-0 transition-opacity duration-50'
		),
		[viewMode, isTransitioning]);

	// Función para procesar/extraer item si es una promesa
	const processItem = useCallback((item: FileItem): FileItem => {
		let processedItem = item;

		// Verificar si estamos lidiando con un ReactPromise o un objeto Promise
		if (
			item &&
			// ReactPromise tiene 'value', 'status', etc.
			((typeof item === 'object' && 'value' in item && 'status' in item) ||
				// Promise regular
				item instanceof Promise ||
				// Promesas serializadas como objetos
				(typeof item === 'object' && item !== null && 'then' in item && typeof item.then === 'function'))
		) {
			try {
				gridLogger.warn('Detectado ReactPromise como item, intentando extraer el valor:', item);

				// Para ReactPromise podemos intentar obtener el valor directamente
				if ('value' in item && typeof item.value === 'string') {
					try {
						// Intentar parsear el valor como JSON
						const parsedItem = JSON.parse(item.value);
						if (parsedItem && typeof parsedItem === 'object' && 'id' in parsedItem) {
							processedItem = parsedItem;
						}
					} catch (parseError) {
						gridLogger.error('Error al parsear el valor del ReactPromise:', parseError);
					}
				}
			} catch (promiseError) {
				gridLogger.error('Error al procesar Promise/ReactPromise:', promiseError);
			}
		}

		return processedItem;
	}, []);

	// Renderizado de cada elemento virtual - memoizado
	const renderVirtualItem = useCallback((virtualItem: any) => {
		const item = items[virtualItem.index];
		if (!item) {
			return null;
		}

		// Procesar el item (manejar casos de ReactPromise)
		const processedItem = processItem(item);

		// Verificar que el item tenga un ID válido
		if (!processedItem.id || typeof processedItem.id !== 'string' || processedItem.id.trim() === '') {
			gridLogger.warn('Intentando renderizar item con ID inválido:', processedItem);
			return null;
		}

		const style: React.CSSProperties = {
			position: 'absolute',
			top: 0,
			left: 0,
			transform: `translate3d(${viewMode === 'list' ? 0 : virtualItem.lane * (itemSize + GRID_CONFIG.gap[viewMode])
				}px, ${virtualItem.start}px, 0)`,
			width: viewMode === 'list' ? '100%' : itemSize,
			height:
				viewMode === 'masonry'
					? calculateMasonryHeight(processedItem, itemSize)
					: virtualItem.size - GRID_CONFIG.gap[viewMode],
			padding: 0,
			willChange: 'transform',
		};

		const ViewComponent = VIEW_COMPONENT_MAP[viewMode];

		// Ahora que sabemos que item.id es válido, podemos acceder al recurso
		const resource = imageResources.resources.get(processedItem.id);
		const thumbnail = resource?.thumbnail || null;

		// Verificar si el item está seleccionado
		const isSelected = selectedItems.some((selected) => selected.id === processedItem.id);

		// Propiedades de estilo del item
		const itemStyle = {
			width: '100%',
			height: '100%',
		};

		return (
			<div
				key={`${viewMode}-${virtualItem.key}`}
				data-index={virtualItem.index}
				className="absolute"
				style={style}
			>
				<ViewComponent
					item={processedItem}
					onClick={handleItemClick}
					onDoubleClick={handleItemDoubleClick}
					onContextAction={handleContextMenuAction}
					shouldLoad={true}
					isSelected={isSelected}
					itemSize={itemSize}
					thumbnail={thumbnail}
					style={itemStyle}
				/>
			</div>
		);
	}, [
		items,
		viewMode,
		itemSize,
		calculateMasonryHeight,
		imageResources,
		selectedItems,
		handleItemClick,
		handleItemDoubleClick,
		handleContextMenuAction,
		processItem
	]);

	// Función para cerrar el visor - memoizada
	const handleCloseViewer = useCallback(() => {
		setIsViewerOpen(false);
	}, []);

	return (
		<div ref={constraintsRef} className="relative h-full w-full">
			<div
				ref={gridParentRef}
				className={gridContainerClassName}
				onScroll={handleScroll}
				style={gridContainerStyle}
			>
				<div style={containerStyle}>
					{!isTransitioning && virtualItems.map(renderVirtualItem)}
				</div>
				<div ref={loadMoreRef} className="h-px w-full" />
			</div>

			{/* Visor de imágenes */}
			<FileViewer
				images={viewerImages}
				initialIndex={viewerInitialIndex}
				isOpen={isViewerOpen}
				onClose={handleCloseViewer}
			/>
		</div>
	);
};

// Exportar versión memoizada del componente
export const FileBrowser = memo(FileBrowserComponent);
