'use client';

import { EmptyState } from '@/components/core/data-display';
import { FileViewer, type ImageItem } from '@/components/features/file-viewer/file-viewer';
import { ClientLogger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFileStoreBase } from '@/store/entities/file';
import { useImageResources } from '@/store/image-resources.store';
import type { FileItem } from '@/types/file-item';
import { FileText as FileTextIcon } from 'lucide-react';
import type * as React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GridGaps } from './config/grid-config';
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

const gridLogger = new ClientLogger({ context: 'FileBrowserGrid' });
// const resourceLogger = new Logger('ImageResourceProcessor'); // Comentado

// Declarar el tipo para window.entityPreloadStartTime
declare global {
	interface Window {
		entityPreloadComplete?: boolean;
		entityPreloadInProgress?: boolean;
		entityPreloadStartTime?: number;
	}
}

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
	const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('right-panel-collapsed') === 'true');

	const updateCollapsedState = useCallback((newState: boolean) => {
		localStorage.setItem('right-panel-collapsed', String(newState));
		setIsCollapsed(newState);
	}, []);

	return { isCollapsed, updateCollapsedState };
};

// Modificar la interfaz FileBrowserItem para incluir las propiedades que necesitamos
type FileBrowserItem = FileItem & {
	contextMenu?: string;
	actionHandler?: (action: string) => void;
	imageUrl?: string; // Añadir imageUrl como opcional
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
			gridLogger.debug('📄 Primer item recibido:', logItemInfo(firstItem));
		} else {
			gridLogger.warn('⚠️ FileBrowser: No se recibieron items o el array está vacío');
		}
	}, [items]);

	const viewMode = useFileStoreBase((state) => state.viewMode);
	const selectedFileIds = useFileStoreBase((state) => state.selectedFileIds);
	const selectFile = useFileStoreBase((state) => state.selectFile);
	const toggleSelectFile = useFileStoreBase((state) => state.toggleSelectFile);
	const deselectAllFiles = useFileStoreBase((state) => state.deselectAllFiles);
	const selectedItems = useMemo(() => {
		const setIds = new Set(selectedFileIds);
		return items.filter((it) => setIds.has(it.id));
	}, [items, selectedFileIds]);
	// Seleccionar solo la versión del store para forzar re-renders cuando las miniaturas cambien.
	const version = useImageResources((state) => state.version);
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
	const { columns, itemSize, virtualizer, calculateMasonryHeight } = useGridVirtualizer({
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
		// Evitar precargar múltiples veces en la misma instancia
		if (entitiesPreloadedRef.current) {
			return;
		}

		// Si la precarga global ya está completa, no hacemos nada
		if (typeof window !== 'undefined' && window.entityPreloadComplete) {
			gridLogger.info('✅ Entidades ya precargadas globalmente desde layout, omitiendo precarga desde FileBrowser');
			return;
		}

		// Si hay una precarga en progreso que lleva más de 5 segundos, asumimos que
		// algo salió mal y la marcamos como completada para evitar bloqueos
		if (typeof window !== 'undefined' && window.entityPreloadInProgress) {
			const preloadStartTime = window.entityPreloadStartTime || 0;
			const now = Date.now();
			if (now - preloadStartTime > 5000) {
				// 5 segundos
				gridLogger.warn('⚠️ Detectada precarga bloqueada por más de 5 segundos, liberando precarga');
				window.entityPreloadInProgress = false;
				window.entityPreloadComplete = true;
			}

			if (window.entityPreloadInProgress) {
				// Verificar si todavía está en progreso después de la posible liberación
				gridLogger.info('⏳ Hay una precarga en progreso en otro componente, omitiendo precarga desde FileBrowser');
				return;
			}
		}

		entitiesPreloadedRef.current = true;
		gridLogger.info('🚀 Iniciando precarga de entidades de respaldo desde FileBrowser...');

		// Marcar que una precarga está en progreso y registrar el tiempo de inicio
		if (typeof window !== 'undefined') {
			window.entityPreloadInProgress = true;
			window.entityPreloadStartTime = Date.now();

			// Asegurar que entityPreloadInProgress se limpia después de un tiempo máximo
			setTimeout(() => {
				if (typeof window !== 'undefined' && window.entityPreloadInProgress && !window.entityPreloadComplete) {
					gridLogger.warn('⚠️ Forzando finalización de precarga (timeout) para evitar bloqueo');
					window.entityPreloadInProgress = false;
					window.entityPreloadComplete = true;
				}
			}, 5000); // 5 segundos de timeout máximo (reducido de 10 a 5)
		}

		// Lista reducida de entidades esenciales a precargar
		const essentialEntities = ['folders', 'tags', 'collections'];

		// Precargar solo entidades esenciales para evitar bloqueos
		const preloadEssentialEntities = async () => {
			try {
				const results = await Promise.allSettled(
					essentialEntities.map((entity) =>
						loadEntityData(entity as any).catch((err) => {
							gridLogger.warn(`⚠️ Error al precargar ${entity}:`, err);
							return [];
						})
					)
				);

				// Informar sobre el resultado de la precarga
				const succeeded = results.filter((r) => r.status === 'fulfilled').length;
				const failed = results.filter((r) => r.status === 'rejected').length;

				gridLogger.info(
					`✅ Precarga de respaldo completada desde FileBrowser: ${succeeded} exitosas, ${failed} fallidas`
				);

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
					window.entityPreloadComplete = true; // Marcamos como completa para evitar bloqueos
				}
			}
		};

		// Ejecutar la precarga en segundo plano
		setTimeout(() => {
			preloadEssentialEntities().catch((error) => {
				gridLogger.error('❌ Error no capturado en precarga:', error);
				if (typeof window !== 'undefined') {
					window.entityPreloadInProgress = false;
					window.entityPreloadComplete = true;
				}
			});
		}, 100);

		// Limpiar estados si el componente se desmonta durante la precarga
		return () => {
			if (typeof window !== 'undefined' && !window.entityPreloadComplete) {
				window.entityPreloadInProgress = false;
			}
		};
	}, [loadEntityData]);

	// Función para depurar los items recibidos sin errores de tipo
	const logItemInfo = (item: any) => {
		return {
			id: item.id,
			name: item.name,
			type: item.type,
			thumbnail: item.thumbnail ? 'Disponible' : 'No disponible',
			src: item.src || 'No disponible',
			path: item.path,
		};
	};

	// Función memoizada para mapear FileItem a ImageItem
	const mapFileItemToImageItem = useCallback((fileItem: FileItem): any => {
		try {
			// Crear una versión segura para acceder a propiedades que podrían no existir
			const safeItem = fileItem as any;

			// Verificar si estamos lidiando con un ReactPromise o un objeto Promise
			let processedItem = safeItem;
			if (
				fileItem &&
				// ReactPromise tiene 'value', 'status', etc.
				((typeof fileItem === 'object' && 'value' in fileItem && 'status' in fileItem) ||
					// Promise regular
					fileItem instanceof Promise ||
					// Promesas serializadas como objetos
					(typeof fileItem === 'object' &&
						fileItem !== null &&
						'then' in fileItem &&
						typeof fileItem.then === 'function'))
			) {
				try {
					gridLogger.warn('⚠️ Detectado ReactPromise como item, intentando extraer el valor:', fileItem);

					// Para ReactPromise podemos intentar obtener el valor directamente
					if ('value' in fileItem && typeof fileItem.value === 'string') {
						try {
							// Intentar parsear el valor como JSON
							const parsedItem = JSON.parse(fileItem.value);
							if (parsedItem && typeof parsedItem === 'object' && 'id' in parsedItem) {
								processedItem = parsedItem;
							}
						} catch (parseError) {
							gridLogger.error('❌ Error al parsear el valor del ReactPromise:', parseError);
						}
					}
				} catch (promiseError) {
					gridLogger.error('❌ Error al procesar Promise/ReactPromise:', promiseError);
				}
			}

			// Obtener el recurso en vivo desde el store directamente, usando getState().resources
			const resource = useImageResources.getState().resources.get(processedItem.id);

			// Extraer información de dimensiones del item o metadata de manera segura
			let width = processedItem.width;
			let height = processedItem.height;

			// Si no hay dimensiones en el item directamente, intentar extraerlas del metadata
			if ((!width || !height) && processedItem.metadata) {
				try {
					const metadataObj =
						typeof processedItem.metadata === 'string' ? JSON.parse(processedItem.metadata) : processedItem.metadata;

					if (metadataObj?.dimensions) {
						width = metadataObj.dimensions.width;
						height = metadataObj.dimensions.height;
					}
				} catch (error) {
					gridLogger.warn(`⚠️ Error al extraer dimensiones del metadata para ${processedItem.id}:`, error);
				}
			}

			// Usar dimensiones del resource si están disponibles y no se encontraron otras
			if ((!width || !height) && resource?.dimensions) {
				width = resource.dimensions.width;
				height = resource.dimensions.height;
			}

			// Determinar la mejor URL de miniatura disponible de manera segura
			let thumbnailUrl: string | null = null;

			// 1. Preferir miniatura del item si existe directamente
			if (processedItem.thumbnail && typeof processedItem.thumbnail === 'string') {
				thumbnailUrl = processedItem.thumbnail;
			}
			// 2. Intentar usar imageUrl si está disponible
			else if (processedItem.imageUrl && typeof processedItem.imageUrl === 'string') {
				thumbnailUrl = processedItem.imageUrl;
			}
			// 3. Intentar usar src si está disponible
			else if (processedItem.src && typeof processedItem.src === 'string') {
				thumbnailUrl = processedItem.src;
			}
			// 4. Usar recurso cargado desde el store
			else if (resource?.thumbnail) {
				thumbnailUrl = resource.thumbnail;
			}
			// 5. Como fallback final, construir URL basada en ID
			else if (processedItem.id) {
				thumbnailUrl = `/api/images/${processedItem.id}/thumbnail`;
			}

			// ✨ Log para depuración
			gridLogger.debug(
				`Mapped item: ${processedItem.id}, finalSrc: ${thumbnailUrl}, dimensions: ${width || 0}x${height || 0}`
			);

			// Crear un objeto ImageItem que incluya TODAS las propiedades requeridas
			// tanto por FileViewer como por useDetailsPanel
			return {
				// Propiedades básicas
				id: processedItem.id,
				name: processedItem.name,
				type: processedItem.type || 'image',
				path: processedItem.path,
				size: processedItem.size,

				// Dimensiones
				width: width || 0,
				height: height || 0,

				// Propiedades de formato
				mimeType: processedItem.mimeType,
				format: 'jpeg', // Valor por defecto necesario para la interfaz
				originalPath: processedItem.path, // Requerido por algunas interfaces

				// Datos para visualización
				metadata:
					typeof processedItem.metadata === 'string'
						? processedItem.metadata
						: JSON.stringify(processedItem.metadata || {}),
				thumbnail: thumbnailUrl,
				url: thumbnailUrl,
				src: thumbnailUrl,
				alt: processedItem.name || 'Image',

				// Propiedades adicionales que podrían ser requeridas
				hash: processedItem.hash || '',
				status: 'completed',
				quality: 'high',
				optimized: true,
				hasThumbnails: !!thumbnailUrl,
				isPublic: processedItem.isPublic || false,
				isFavorite: processedItem.isFavorite || false,
				uploadedAt: processedItem.createdAt || new Date(),
				createdAt: processedItem.createdAt || new Date(),
				updatedAt: processedItem.updatedAt || new Date(),

				// Metadatos procesados
				parsedMetadata: {
					dimensions: {
						width: width || 0,
						height: height || 0,
					},
				},
			};
		} catch (error) {
			// En caso de error, devolver un objeto mínimo pero válido
			gridLogger.error(`❌ Error al mapear FileItem a ImageItem para ${fileItem?.id || 'unknown'}:`, error);

			return {
				id: fileItem?.id || `error-${Date.now()}`,
				name: fileItem?.name || 'Error',
				type: 'image',
				path: fileItem?.path || '',
				size: fileItem?.size || 0,
				width: 0,
				height: 0,
				originalPath: fileItem?.path || '',
				format: 'jpeg',
				hash: '',
				metadata: '{}',
				status: 'completed',
				quality: 'high',
				optimized: false,
				hasThumbnails: false,
				isFavorite: false,
				isPublic: false,
				uploadedAt: new Date(),
				thumbnail: null,
				url: null,
				src: null,
				alt: 'Error',
				createdAt: new Date(),
				updatedAt: new Date(),
				parsedMetadata: { dimensions: { width: 0, height: 0 } },
			};
		}
	}, []);

	// Mantenemos una referencia al último array de processedItems para la estabilidad referencial de las dimensiones
	const processedItemsRef = useRef<ImageItem[]>([]);

	// Mapeamos los items de entrada para pasarlos al virtualizador y las vistas
	const processedItems = useMemo(
		() => items.map((item) => mapFileItemToImageItem(item)),
		[items, mapFileItemToImageItem] // ✨ processedItems se recalcula si los items de entrada o la función de mapeo cambian.
	);

	// Actualizar la referencia del último array de processedItems
	useEffect(() => {
		processedItemsRef.current = processedItems;
	}, [processedItems]);

	// Hook para manejar la visibilidad del panel de detalles y el item seleccionado
	useEffect(() => {
		// gridLogger.debug('Selected items changed:', selectedItems.length); // Comentado

		// Si hay uno o más ítems seleccionados, muestra el panel y actualiza los ítems seleccionados.
		if (selectedItems.length > 0) {
			setVisible(true);

			// Convertir los items seleccionados a ImageItems para satisfacer la interfaz
			const convertedItems = selectedItems.map((item) => {
				// Usar el mapeo existente para convertir FileItem a ImageItem
				return mapFileItemToImageItem(item);
			});

			setSelectedItems(convertedItems);
		} else {
			// gridLogger.debug('No items selected, hiding details panel.'); // Comentado
			setVisible(false);
			setSelectedItems([]);
		}
	}, [selectedItems, setVisible, setSelectedItems, mapFileItemToImageItem]);

	// Efecto para la carga de miniaturas cuando los items visibles cambian
	useEffect(() => {
		if (virtualizer.getVirtualItems().length === 0) {
			return;
		}

		// Obtener los ítems actualmente visibles del virtualizador, asegurándonos de que son `FileItem`
		const currentVisibleItems = virtualizer
			.getVirtualItems()
			.map((virtualItem) => items[virtualItem.index])
			.filter((item): item is FileItem => !!item); // Filtrar nulos/undefined y asegurar el tipo

		// Añadir log para depuración
		gridLogger.debug(`🔄 Cargando miniaturas para ${currentVisibleItems.length} items visibles`);

		// Llamar a la función de carga de miniaturas
		debouncedLoadThumbnails(currentVisibleItems); // Pasar los ítems visibles aquí
	}, [debouncedLoadThumbnails, virtualizer, items]); // Añadir `items` a las dependencias

	// Función para manejar el clic en un ítem (simple click)
	const handleItemClick = useCallback(
		(item: FileItem) => {
			if (selectedFileIds.length > 0 && !selectedFileIds.includes(item.id)) {
				deselectAllFiles();
			}
			selectFile(item.id);
			if (onItemClick) {
				onItemClick(item);
			}
		},
		[selectedFileIds, deselectAllFiles, selectFile, onItemClick]
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
				const filteredImages = processedItems.filter((img) => img.src?.startsWith('/api/images/')) as ImageItem[];
				setViewerImages(filteredImages);
				const initialIndex = filteredImages.findIndex((img) => img.id === item.id);
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
		(item: FileItem) => {
			if (!selectedFileIds.includes(item.id)) {
				deselectAllFiles();
				selectFile(item.id);
			}
		},
		[selectedFileIds, deselectAllFiles, selectFile]
	);

	const handleMenuAction = useCallback(
		(action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => {
			handleContextAction(action, item, data, handleItemDoubleClick, toggleSelectFile);
		},
		[handleItemDoubleClick, toggleSelectFile]
	);

	const ViewComponent = VIEW_COMPONENT_MAP[viewMode as keyof typeof VIEW_COMPONENT_MAP];

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
					className="relative w-full p-4"
					style={{
						height: virtualizer.getTotalSize(),
					}}
				>
					{virtualizer.getVirtualItems().map((virtualItem) => {
						const originalItem = items[virtualItem.index]; // Este es el FileItem original
						const processedItem = processedItems[virtualItem.index]; // Este es el ImageItem procesado

						// Asegúrate de que el item exista antes de intentar renderizarlo
						if (!originalItem || !processedItem) {
							// gridLogger.warn(`Skipping render for undefined item at index ${virtualItem.index}`); // Comentado
							return null;
						}

						const isSelected = selectedItems.some((selected) => selected.id === originalItem.id);
						const currentGap = GRID_CONFIG.gap[viewMode as keyof GridGaps];
						const xOffset = (virtualItem.index % columns) * (itemSize + currentGap);

						const commonProps = {
							item: processedItem, // Pasar ImageItem a la vista
							isSelected,
							onClick: () => handleItemClick(originalItem), // Pasar FileItem a los manejadores
							onDoubleClick: () => handleItemDoubleClick(originalItem),
							onContextMenu: () => handleContextMenu(originalItem),
							onContextAction: handleMenuAction,
							itemSize: itemSize, // Añadimos explícitamente itemSize que es requerido por GridViewProps
							style: {
								position: 'absolute' as const,
								top: 0,
								left: 0,
								transform: `translateX(${xOffset}px) translateY(${virtualItem.start}px)`,
								width: itemSize,
								height: virtualItem.size,
								// Aplicar altura calculada solo en modo masonry, pasando el FileItem
								...(viewMode === 'masonry' && {
									height: calculateMasonryHeight(originalItem as any, itemSize),
								}),
							},
						};

						return <ViewComponent key={processedItem.id} {...commonProps} />;
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
					isOpen={isViewerOpen}
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
