'use client';

import { FileViewer, type ImageItem } from '@/components/features/file-viewer/file-viewer';
import { ALL_ENTITIES } from '@/constants/entities';
import { Logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFileViewStore } from '@/store/file-view.store';
import { type FileBrowserItem } from '@/store/files/file-browser.store';
import { useImageResources } from '@/store/image-resources.store';
import { useSelectionStore } from '@/store/selection.store';
import type { FileItem } from '@/types/file-item';
import type * as React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { handleContextAction } from './context-menu/context-action-handler';
import { useEntityLoader } from './context-menu/hooks/use-entity-loader';
import { useGridView } from './hooks/use-grid-view';
import { useGridVirtualizer } from './hooks/use-grid-virtualizer';
import { CardsView } from './views/cards-view';
import { GridView } from './views/grid-view';
import { ListView } from './views/list-view';
import { MasonryView } from './views/masonry-view';
import { EmptyState } from '@/components/core/data-display';
import { FileText as FileTextIcon } from 'lucide-react';

const gridLogger = new Logger('FileBrowserGrid');
// const resourceLogger = new Logger('ImageResourceProcessor'); // Comentado

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
	items: FileBrowserItem[];
	isResizing?: boolean;
	onItemClick?: (item: FileBrowserItem) => void;
	onItemDoubleClick?: (item: FileBrowserItem) => void;
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
	const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('right-panel-collapsed') === 'true');

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
const FileBrowserComponent = ({
	items,
	isResizing,
	onItemClick,
	onItemDoubleClick,
	loadMoreItems,
}: FileBrowserProps) => {
	// Debug: Mostrar detalles de los items recibidos
	useEffect(() => {
		gridLogger.info(`🔍 FileBrowser recibió ${items?.length || 0} items`);
		if (items && items.length > 0) {
			const firstItem = items[0];
			gridLogger.debug('📄 Primer item recibido:', {
				id: firstItem.id,
				name: firstItem.name,
				type: firstItem.type,
				thumbnail: firstItem.thumbnail ? 'Disponible' : 'No disponible',
				imageUrl: firstItem.imageUrl,
				path: firstItem.path
			});
		} else {
			gridLogger.warn('⚠️ FileBrowser: No se recibieron items o el array está vacío');
		}
	}, [items]);

	const { selectedItems, toggleSelection, selectItem, clearSelection } = useSelectionStore();
	const { viewMode, setViewMode } = useFileViewStore();
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
			// gridLogger.info('✅ Entidades ya precargadas globalmente desde layout, omitiendo precarga desde FileBrowser'); // Comentado
			return;
		}

		// Verificar si hay una precarga en progreso en otro componente
		if (typeof window !== 'undefined' && window.entityPreloadInProgress) {
			// gridLogger.info('⏳ Hay una precarga en progreso en otro componente, omitiendo precarga desde FileBrowser'); // Comentado
			return;
		}

		// Evitar precargar múltiples veces en la misma instancia
		if (entitiesPreloadedRef.current) {
			return;
		}

		entitiesPreloadedRef.current = true;
		// gridLogger.info('🚀 Iniciando precarga de entidades de respaldo desde FileBrowser...'); // Comentado

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
					allEntities.map((entity) =>
						loadEntityData(entity as any).catch((err) => {
							// gridLogger.warn(`⚠️ Error al precargar ${entity}:`, err); // Comentado
							return [];
						})
					)
				);

				// Informar sobre el resultado de la precarga
				const succeeded = results.filter((r) => r.status === 'fulfilled').length;
				const failed = results.filter((r) => r.status === 'rejected').length;

				// gridLogger.info(
				// 	`✅ Precarga de respaldo completada desde FileBrowser: ${succeeded} exitosas, ${failed} fallidas` // Comentado
				// );

				// Marcar globalmente que la precarga está completa
				if (typeof window !== 'undefined') {
					window.entityPreloadComplete = true;
					window.entityPreloadInProgress = false;
				}
			} catch (error) {
				// gridLogger.error('❌ Error durante precarga de entidades:', error); // Comentado

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
	const mapFileItemToImageItem = useCallback(
		(fileItem: FileItem): ImageItem => {
			let processedItem = fileItem;

			// Verificar si estamos lidiando con un ReactPromise o un objeto Promise
			if (
				fileItem &&
				// ReactPromise tiene 'value', 'status', etc.
				((typeof fileItem === 'object' && 'value' in fileItem && 'status' in fileItem) ||
					// Promise regular
					fileItem instanceof Promise ||
					// Promesas serializadas como objetos
					(typeof fileItem === 'object' && fileItem !== null && 'then' in fileItem && typeof fileItem.then === 'function'))
			) {
				try {
					// gridLogger.warn('Detectado ReactPromise como item, intentando extraer el valor:', fileItem); // Comentado

					// Para ReactPromise podemos intentar obtener el valor directamente
					if ('value' in fileItem && typeof fileItem.value === 'string') {
						try {
							// Intentar parsear el valor como JSON
							const parsedItem = JSON.parse(fileItem.value);
							if (parsedItem && typeof parsedItem === 'object' && 'id' in parsedItem) {
								processedItem = parsedItem;
							}
						} catch (parseError) {
							// gridLogger.error('Error al parsear el valor del ReactPromise:', parseError); // Comentado
						}
					}
				} catch (promiseError) {
					// gridLogger.error('Error al procesar Promise/ReactPromise:', promiseError); // Comentado
				}
			}

			// ✨ Añadido para depuración
			const resource = imageResources.resources.get(processedItem.id);
			// gridLogger.debug(`Mapped ImageItem for ${processedItem.id}:`, { url: processedItem.thumbnail, shouldLoad: processedItem.thumbnail !== undefined }); // Comentado

			return {
				id: processedItem.id,
				src: processedItem.thumbnail || processedItem.imageUrl || '',
				alt: processedItem.name || 'Image',
				dimensions: {
					width: resource?.width || 0,
					height: resource?.height || 0,
				},
				// Asegurarnos de que las dimensiones sean válidas para el renderizado
				isValid: !!processedItem.thumbnail || !!processedItem.imageUrl,
			};
		},
		[imageResources.resources]
	);

	// Mapeamos los items de entrada para pasarlos al virtualizador y las vistas
	const processedItems = useMemo(
		() => items.map((item) => mapFileItemToImageItem(item)),
		[items, mapFileItemToImageItem]
	);

	// Hook para manejar la visibilidad del panel de detalles y el item seleccionado
	useEffect(() => {
		// gridLogger.debug('Selected items changed:', selectedItems.length); // Comentado

		// Si hay uno o más ítems seleccionados, muestra el panel y actualiza los ítems seleccionados.
		if (selectedItems.length > 0) {
			setVisible(true);
			setSelectedItems(selectedItems);
		} else {
			// gridLogger.debug('No items selected, hiding details panel.'); // Comentado
			setVisible(false);
			setSelectedItems([]);
		}
	}, [selectedItems, setVisible, setSelectedItems]);

	// Efecto para la carga de miniaturas cuando los items visibles cambian
	useEffect(() => {
		// gridLogger.debug(
		// 	'Items visibles o cambio de scroll/redimensionamiento, iniciando carga de miniaturas...'
		// );
		debouncedLoadThumbnails();
	}, [debouncedLoadThumbnails]);

	// Función para manejar el clic en un ítem (simple click)
	const handleItemClick = useCallback(
		(item: FileItem) => {
			// gridLogger.info(`Click en ítem: ${item.name} (ID: ${item.id})`); // Comentado

			// Si ya hay items seleccionados y no es el item clickeado, limpia la selección
			if (selectedItems.length > 0 && !selectedItems.some((s) => s.id === item.id)) {
				clearSelection();
			}
			selectItem(item);
			if (onItemClick) {
				onItemClick(item);
			}
		},
		[selectedItems, clearSelection, selectItem, onItemClick]
	);

	// Función para manejar el doble clic en un ítem
	const handleItemDoubleClick = useCallback(
		(item: FileItem) => {
			// gridLogger.info(`Doble click en ítem: ${item.name} (ID: ${item.id})`); // Comentado
			if (onItemDoubleClick) {
				onItemDoubleClick(item);
			}

			// Abrir el visor de imágenes si es una imagen y tiene una URL de miniatura válida
			if (item.type === 'image') {
				// gridLogger.debug('Abriendo visor de imágenes...'); // Comentado
				setViewerImages(processedItems.filter((img) => img.isValid && img.src.startsWith('/api/images/')) as ImageItem[]);
				const initialIndex = processedItems.findIndex((img) => img.id === item.id);
				if (initialIndex !== -1) {
					setViewerInitialIndex(initialIndex);
					setIsViewerOpen(true);
				}
			} else {
				// gridLogger.debug('El doble clic en el ítem no es una imagen o no es válida para el visor.'); // Comentado
			}
		},
		[onItemDoubleClick, processedItems]
	);

	// Función para manejar el clic derecho y abrir el menú contextual
	const handleContextMenu = useCallback(
		(item: FileItem, event: React.MouseEvent<HTMLElement>) => {
			event.preventDefault(); // Evitar el menú contextual nativo del navegador
			// gridLogger.info(`Context menu click on: ${item.name} (ID: ${item.id})`); // Comentado

			// Si el ítem no está seleccionado, seleccionarlo y limpiar otros
			if (!selectedItems.some((s) => s.id === item.id)) {
				clearSelection();
				selectItem(item);
			}

			const target = event.target as HTMLElement;
			const itemId = target.dataset.itemId;

			// Aquí puedes usar itemId para identificar el elemento al que se le hizo clic derecho
			// y mostrar el menú contextual apropiado.
			// gridLogger.debug(`Context menu event on item ID: ${itemId}`); // Comentado

			// Ejemplo de cómo manejar una acción del menú contextual
			handleContextAction(item as FileBrowserItem, 'copy');
		},
		[selectedItems, clearSelection, selectItem]
	);

	const ViewComponent = VIEW_COMPONENT_MAP[viewMode];

	//gridLogger.debug('FileBrowser renderizado con:', { // Comentado
	// 	itemsCount: items.length,
	// 	viewMode,
	// 	isResizing,
	// 	selectedItemsCount: selectedItems.length,
	// });

	if (!items || items.length === 0) {
		// gridLogger.info('No items to display in FileBrowser.'); // Comentado
		return (
			<EmptyState
				icon={FileTextIcon}
				title="No hay archivos para mostrar"
				description="Parece que no hay archivos en esta ubicación o no se encontraron resultados para tu búsqueda."
			/>
		);
	}

	// Aquí puedes decidir qué vista renderizar basándote en viewMode
	return (
		<div
			ref={constraintsRef}
			className={cn(
				'relative flex-1 flex flex-col h-full overflow-hidden',
				isTransitioning && 'pointer-events-none opacity-50'
			)}
		>
			<div ref={gridParentRef} onScroll={handleScroll} className="h-full overflow-y-auto scroll-smooth">
				<div
					className="relative w-full p-4 grid gap-4"
					style={{
						height: virtualizer.getTotalSize(),
						...(viewMode === 'grid' && { gridTemplateColumns: `repeat(auto-fill, minmax(${itemSize}px, 1fr))` }),
						...(viewMode === 'cards' && { gridTemplateColumns: `repeat(auto-fill, minmax(${itemSize}px, 1fr))` }),
					}}
				>
					{virtualizer.getVirtualItems().map((virtualItem) => {
						const item = processedItems[virtualItem.index];
						// gridLogger.debug(`Rendering virtual item index ${virtualItem.index}:`, item); // Comentado

						// Asegúrate de que el item exista antes de intentar renderizarlo
						if (!item) {
							// gridLogger.warn(`Skipping render for undefined item at index ${virtualItem.index}`); // Comentado
							return null;
						}

						const isSelected = selectedItems.some((selected) => selected.id === item.id);

						const commonProps = {
							key: item.id,
							item,
							isSelected,
							onClick: () => handleItemClick(item),
							onDoubleClick: () => handleItemDoubleClick(item),
							onContextMenu: (e: React.MouseEvent<HTMLElement>) => handleContextMenu(item, e),
							style: {
								position: 'absolute' as const,
								top: 0,
								left: 0,
								transform: `translateX(${virtualItem.start}px) translateY(${virtualItem.start}px)`,
								width: itemSize,
								height: virtualItem.size,
								// Aplicar altura calculada solo en modo masonry
								...(viewMode === 'masonry' && {
									height: calculateMasonryHeight(item.id, itemSize),
								}),
							},
						};

						return <ViewComponent key={item.id} {...commonProps} />;
					})}
					{loadMoreItems && (
						<div ref={loadMoreRef} className="h-1 w-full" /> // Elemento sentinel para cargar más
					)}
				</div>
			</div>

			{isViewerOpen && (
				<FileViewer
					images={viewerImages}
					initialIndex={viewerInitialIndex}
					onClose={() => {
						setIsViewerOpen(false);
						setViewerImages([]);
						setViewerInitialIndex(0);
					}}
				/>
			)}
		</div>
	);
};

// Exportar versión memoizada del componente
export const FileBrowser = memo(FileBrowserComponent);
