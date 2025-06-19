'use client';

import { EmptyState } from '@/components/core/data-display';
import { type ImageItem } from '@/components/features/file-viewer/file-viewer';
import { Spinner } from '@/components/ui/spinner';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useImageResources } from '@/store/image-resources.store';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { FileItem } from '@/types/files';
import { FileTextIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ContextMenuAction } from './context-menu/types';
import { useFilteredData } from './hooks/use-filtered-data';
import './styles/scrollbar.css';
import { StatusBar } from './toolbar/status-bar';
import { fileItemsToImageItems } from './utils/file-converters';
import { CardsView } from './views/cards-view';
import { ListView } from './views/list-view';
import { MasonryView } from './views/masonry-view';
import { SimpleGridView } from './views/simple-grid-view';

// Configuración del cache y carga secuencial
const BROWSER_CONFIG = {
	// Tamaño máximo del caché (cuántos elementos mantener en memoria)
	cacheSize: 1000,
	// Configuración para carga secuencial (DESHABILITADA - ahora usamos paginación del servidor)
	sequential: {
		initialBatchSize: 100, // Aumentado para mejor UX inicial
		additionalBatchSize: 50, // Cuántos elementos cargar en cada lote adicional
		loadThreshold: 0.8, // Porcentaje de scroll para cargar más (0-1)
		scrollLoadDelay: 100, // Tiempo de espera tras detener scroll antes de cargar más
	},
};

// 📊 Logger específico para FileBrowser
const logger = clientLogger.withContext('FileBrowser');

// 🎯 **FileBrowser: Versión Minimalista**
//
// **Objetivos:**
// - Resolver el problema de containerWidth = 0 de forma definitiva
// - Arquitectura simple sin hooks complejos interdependientes
// - Medición directa del contenedor con fallback inmediato
// - Virtualización simple y directa
//
// **Cambios principales:**
// - Sin useGridView hook (medición directa en el componente)
// - Sin estados complejos de medición (solo containerWidth)
// - Callback ref con estrategias progresivas de medición
// - Fallback inmediato a 1200px si falla la medición
// - GridItem simplificado sin dependencias pesadas

// 📝 Definición local del tipo FileItem para soportar miniaturas
// Este tipo se adapta a lo que recibe desde el Server Action getFolderImages
// Todos los campos son serializables para evitar errores de "Only plain objects..."
type FileBrowserFileItem = FileItem & {
	thumbnail?: string | null; // Siempre string o null, nunca Buffer/Uint8Array
	createdAt: string; // ISO string, no Date
	updatedAt: string; // ISO string, no Date
	modifiedAt: string; // ISO string, no Date
	accessedAt: string; // ISO string, no Date
};

interface FileBrowserProps {
	items: FileItem[];
	onItemSelect?: (item: FileItem) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	className?: string;
	/**
	 * Indica si la carpeta está cargando o reindexando
	 */
	isLoading?: boolean;
	/**
	 * Indica si la carpeta está siendo reindexada
	 */
	isReindexing?: boolean;
	/**
	 * Progreso de reindexado (0-100)
	 */
	reindexProgress?: number;
	/**
	 * Función para cargar más elementos (scroll infinito)
	 */
	loadMoreItems?: () => void;
}

const _FALLBACK_WIDTH = 1200;
const _ITEM_HEIGHT = 220;
const _ITEM_WIDTH = 200;
const _GAP = 16;

// Interfaz para el menú contextual
interface ContextMenuProps {
	open: boolean;
	[key: string]: any;
}

// Componente simple para el menú contextual
const ContextMenu = ({ open, ...props }: ContextMenuProps) => {
	if (!open) return null;
	return <div className="context-menu" {...props} />;
};

export const FileBrowser = memo<FileBrowserProps>(function FileBrowser({
	items,
	onItemSelect,
	onItemDoubleClick,
	className,
	isLoading = false,
	isReindexing = false,
	reindexProgress = 0,
	loadMoreItems,
}) {
	// Log para debuggear los items
	console.log('[FileBrowser] Props recibidas:', {
		items: items?.length || 0,
		isLoading,
		isReindexing,
	});

	// 📊 Estados mínimos - Solo lo esencial
	const [_containerWidth, setContainerWidth] = useState<number>(0);
	const [_isViewerOpen, setIsViewerOpen] = useState(false);
	const [_viewerImages, setViewerImages] = useState<ImageItem[]>([]);
	const [_viewerInitialIndex, setViewerInitialIndex] = useState(0);
	const [_loadMoreVisible, setLoadMoreVisible] = useState(false);
	// Estado local para favoritos como solución temporal
	const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
	// ✅ Usar una ref para el seguimiento no causa re-renders
	const lastSelectedItemIndexRef = useRef<number | null>(null);
	// Control de carga progresiva (DESHABILITADO - ahora manejado por el store)
	const [visibleItemCount, setVisibleItemCount] = useState<number>(items.length);
	const _scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
	const loadingMoreRef = useRef<boolean>(false);

	// Estado para el menú contextual personalizado
	const [contextMenuFile, setContextMenuFile] = useState<FileItem | null>(null);
	const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

	// 🔍 Opciones de vista globales
	const _viewStore = useViewOptionsStore();
	const viewMode = useViewOptionsStore((state) => state.viewMode);
	const itemSize = useViewOptionsStore((state) => state.itemSize);
	const { searchQuery, sortOptions, filterOptions } = useViewOptionsStore();
	const _setSearchQuery = useViewOptionsStore((state) => state.setSearchQuery);

	// Asegurarnos de tener un valor para viewMode
	console.log('[FileBrowser] ViewStore:', {
		viewMode,
		itemSize,
		searchQuery,
		sortOptions,
		filterOptions,
	});

	// Acceso a más opciones de vista para EmptyState
	const viewOptions = useViewOptionsStore();
	const searchInput = viewOptions.searchQuery || '';

	// 📐 Refs para medición directa
	const containerRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const measurementAttemptsRef = useRef(0);

	// 🏪 Stores
	const { selectedIds, setSelectedIds, clearSelection } = useSelectionStore();
	const { setVisible: setDetailsPanelVisible, setSelectedItems: setDetailsPanelItems } = useDetailsPanel();

	// Funciones para gestionar favoritos localmente
	const _isFavorited = useCallback((id: string) => favoriteIds.has(id), [favoriteIds]);
	const _toggleFavorite = useCallback((id: string) => {
		setFavoriteIds((prev) => {
			const newFavorites = new Set(prev);
			if (newFavorites.has(id)) {
				newFavorites.delete(id);
			} else {
				newFavorites.add(id);
			}
			return newFavorites;
		});
	}, []);

	// 🔍 Manejador para el menú contextual
	const handleContextMenu = useCallback((_file: FileItem, _e?: React.MouseEvent) => {
		// Deshabilitado temporalmente
		/*
		if (e) {
			e.preventDefault();
			e.stopPropagation();
			setContextMenuPosition({ x: e.clientX, y: e.clientY });
		}
		setContextMenuFile(file);
		*/
	}, []);

	// Seleccionar solo la versión del store para forzar re-renders cuando las miniaturas cambien
	const _imageResourcesVersion = useImageResources((state) => state.version);
	// Cargar más elementos de forma controlada (DESHABILITADO - usamos loadMoreItems del store)
	const _loadMoreItemsSequentially = useCallback(() => {
		// Esta función ahora está deshabilitada, usamos loadMoreItems del store
		if (loadMoreItems && !isLoading) {
			logger.debug('[FileBrowser] Activando loadMoreItems del store');
			loadMoreItems();
		}
	}, [loadMoreItems, isLoading]);

	// 🔧 **Sistema de medición progresivo**
	// Estrategia: inmediato → RAF → timeout → fallback fijo
	const _measureContainer = useCallback((element: HTMLDivElement) => {
		const attempt = ++measurementAttemptsRef.current;
		logger.debug(`[FileBrowser] Intento medición ${attempt}`);

		const measure = () => {
			const width = element.offsetWidth;
			logger.debug(`[FileBrowser] offsetWidth = ${width}px`);

			if (width > 0) {
				logger.info(`[FileBrowser] ✅ Medición exitosa: ${width}px`);
				setContainerWidth(width);
				return true;
			}
			return false;
		};

		// Estrategia 1: Medición inmediata
		if (measure()) return;

		// Estrategia 2: requestAnimationFrame
		requestAnimationFrame(() => {
			if (measure()) return;

			// Estrategia 3: setTimeout como última oportunidad
			setTimeout(() => {
				if (measure()) return;

				// Estrategia 4: Fallback fijo (no más intentos)
				logger.warn(`[FileBrowser] ⚠️ Falló medición después de ${attempt} intentos, usando fallback: ${1200}px`);
				setContainerWidth(1200);
			}, 100);
		});
	}, []);

	// 📎 Callback ref para medición del contenedor
	const _containerCallbackRef = useCallback(
		(element: HTMLDivElement | null) => {
			if (element && containerRef.current !== element) {
				containerRef.current = element;
				// Lógica de medición (asumimos que ya está optimizada)
				const width = element.offsetWidth;
				if (width > 0) {
					setContainerWidth(width);
				} else {
					// Fallback
					setContainerWidth(1200);
				}
			}
		},
		[] // Sin dependencias
	);

	// 🔄 Filtrar y ordenar los datos según las opciones de vista
	// `useFilteredData` ya está memoizado internamente, por lo que `filteredItems` es estable
	// si `items` y las opciones de vista no cambian.
	const filteredItems = useFilteredData(items);

	// 🔄 Preprocesar los elementos para asegurar que tengan todos los campos necesarios
	const processedItems = useMemo(() => {
		return filteredItems.map((item) => {
			let metadata = null;
			try {
				if (item.metadata && typeof item.metadata === 'string') {
					metadata = JSON.parse(item.metadata);
				}
			} catch (_error) {
				logger.warn(`Error al parsear metadata para el item ${item.id}`);
			}

			// Extraer propiedades de las dimensiones desde metadata si existen
			const width = item.width || metadata?.dimensions?.width || metadata?.width || undefined;
			const height = item.height || metadata?.dimensions?.height || metadata?.height || undefined;

			// Asegurarse de que thumbnail sea una string válida
			const thumbnail =
				item.id === 'folder-stats'
					? undefined
					: typeof item.thumbnail === 'string'
						? item.thumbnail
						: typeof item.src === 'string'
							? item.src
							: `/api/images/${item.id}/thumbnail`;

			// Asegurarse de que src sea una string válida
			const src =
				item.id === 'folder-stats'
					? undefined
					: typeof item.src === 'string'
						? item.src
						: typeof item.thumbnail === 'string'
							? item.thumbnail
							: `/api/images/${item.id}`;

			// Retornar el ítem con las propiedades adicionales
			return {
				...item,
				width,
				height,
				thumbnail,
				src,
			};
		});
	}, [filteredItems]);
	// Limitar los elementos visibles para carga progresiva (DESHABILITADO - mostramos todos)
	const visibleItems = useMemo(() => {
		// Ahora mostramos todos los items del store, la paginación se maneja a nivel de servidor
		const result = processedItems;
		console.log('[FileBrowser] Datos:', {
			totalItems: items.length,
			processedItems: processedItems.length,
			visibleItems: result.length,
			viewMode,
			viewType: viewMode || 'grid',
		});
		return result;
	}, [processedItems, items.length, viewMode]);

	// Referencia a los elementos actuales para la vista (para selectionActions)
	const currentViewItems = visibleItems;
	// Resetear conteo visible cuando cambian los elementos (DESHABILITADO)
	useEffect(() => {
		// Ya no necesitamos resetear visibleItemCount porque mostramos todos los items
		loadingMoreRef.current = false;
	}, [items]);

	// Definir la función handleResetView para el EmptyState
	const _handleResetView = useCallback(() => {
		// Limpiar filtros y búsqueda
		useViewOptionsStore.setState({
			searchQuery: '',
			filterOptions: [],
			viewMode: 'grid', // resetear a la vista por defecto
		});
	}, []);

	// Definir el objeto contextMenu de forma más simple sin depender de handleCloseContextMenu
	const contextMenu = useMemo(
		() => ({
			open: !!contextMenuFile,
			file: contextMenuFile,
			position: contextMenuPosition,
			onClose: () => setContextMenuFile(null),
		}),
		[contextMenuFile, contextMenuPosition]
	);

	// 🔍 Manejador de selección de elementos - ESTABILIZADO con getState()
	// Esta es la clave: la función no se recrea cuando la selección cambia.
	const handleItemClick = useCallback(
		(clickedItem: FileItem, e: React.MouseEvent) => {
			const { ctrlKey, metaKey, shiftKey } = e;
			const { selectedIds, setSelectedIds, toggleSelectedId, clearSelection } = useSelectionStore.getState();

			const currentIndex = filteredItems.findIndex((i) => i.id === clickedItem.id);
			if (currentIndex === -1) return;

			// La lógica de selección permanece igual, pero ahora usa el estado más reciente del store
			if (shiftKey && lastSelectedItemIndexRef.current !== null) {
				const start = Math.min(lastSelectedItemIndexRef.current, currentIndex);
				const end = Math.max(lastSelectedItemIndexRef.current, currentIndex);
				const idsToSelect = filteredItems.slice(start, end + 1).map((i) => i.id);
				setSelectedIds(idsToSelect);
			} else if (ctrlKey || metaKey) {
				toggleSelectedId(clickedItem.id);
				lastSelectedItemIndexRef.current = currentIndex;
			} else {
				if (selectedIds.length === 1 && selectedIds[0] === clickedItem.id) {
					clearSelection();
					lastSelectedItemIndexRef.current = null;
				} else {
					setSelectedIds([clickedItem.id]);
					lastSelectedItemIndexRef.current = currentIndex;
				}
			}
			onItemSelect?.(clickedItem);
		},
		[filteredItems, onItemSelect]
	); // Se eliminan las dependencias del store de selección

	// 🔍 Manejador de doble click (abrir visor) - ESTABILIZADO
	const handleItemDoubleClick = useCallback(
		(item: FileItem) => {
			const images = fileItemsToImageItems(processedItems);
			const index = processedItems.findIndex((file) => file.id === item.id);
			if (index !== -1) {
				setViewerImages(images);
				setViewerInitialIndex(index);
				setIsViewerOpen(true);
			}
			onItemDoubleClick?.(item);
		},
		[processedItems, onItemDoubleClick]
	);

	// 🔍 Manejador de acciones del menú contextual
	const _handleContextMenuAction = useCallback(
		(_action: ContextMenuAction, _item: FileItem, _data?: Record<string, unknown>) => {
			// Deshabilitado temporalmente
			/*
		handleContextAction(action, item, data);
		// Cerrar el menú después de la acción
		setContextMenuFile(null);
		setContextMenuPosition(null);
		*/
		},
		[]
	);

	// 🔄 Actualizar el panel de detalles cuando cambie la selección
	useEffect(() => {
		// Asegurarse de que el panel siempre esté visible
		const detailsState = useDetailsPanel.getState();

		// Si hay elementos seleccionados
		if (selectedIds.length > 0) {
			const selectedItems = processedItems.filter((item) => selectedIds.includes(item.id));
			if (selectedItems.length > 0) {
				// Convertir a ImageItems para el panel de detalles
				const detailItems = fileItemsToImageItems(selectedItems);

				// Verificar si los elementos seleccionados han cambiado realmente
				const currentItems = detailsState.selectedItems;

				// Comparar IDs para determinar si realmente necesitamos actualizar
				const currentIds = new Set(currentItems.map((item) => item.id));
				const newIds = new Set(detailItems.map((item) => item.id));

				// Solo actualizar si los IDs han cambiado
				const needsUpdate = currentIds.size !== newIds.size || ![...currentIds].every((id) => newIds.has(id));

				if (needsUpdate) {
					// Usar type assertion para compatibilidad temporal
					setDetailsPanelItems(detailItems as any);
				}
			}
		} else {
			// Si no hay elementos seleccionados, mostrar estadísticas de la carpeta
			// Crear un elemento "stats" para mostrar información de la carpeta
			const folderStats = {
				id: 'folder-stats',
				name: 'Folder Statistics',
				src: null,
				size: items.reduce((total, item) => total + item.size, 0),
				width: 0,
				height: 0,
				type: 'folder/stats',
				metadata: JSON.stringify({
					totalItems: items.length,
					totalSize: items.reduce((total, item) => total + item.size, 0),
					imageCount: items.filter((item) => item.type?.startsWith('image/')).length,
					videoCount: items.filter((item) => item.type?.startsWith('video/')).length,
					documentCount: items.filter((item) => item.type?.startsWith('text/')).length,
					otherCount: items.filter(
						(item) =>
							!item.type?.startsWith('image/') && !item.type?.startsWith('video/') && !item.type?.startsWith('text/')
					).length,
				}),
			};

			setDetailsPanelItems([folderStats as any]);
		}

		// Asegurarse de que el panel esté visible
		if (!detailsState.isVisible) {
			setDetailsPanelVisible(true);
		}
	}, [selectedIds, processedItems, items, setDetailsPanelItems, setDetailsPanelVisible]);
	// Efecto para el scroll infinito mejorado
	useEffect(() => {
		if (!loadMoreItems || !loadMoreRef.current) return;

		let isRequesting = false;
		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry.isIntersecting && !isLoading && !isReindexing && !isRequesting) {
					logger.debug('[FileBrowser] 🔄 Trigger scroll infinito detectado');
					isRequesting = true;
					Promise.resolve(loadMoreItems()).finally(() => {
						isRequesting = false;
					});
				}
				setLoadMoreVisible(entry.isIntersecting);
			},
			{
				threshold: 0.1, // Trigger cuando el elemento está 10% visible
				rootMargin: '50px', // Trigger 50px antes de que sea completamente visible
			}
		);

		observer.observe(loadMoreRef.current);

		return () => {
			observer.disconnect();
		};
	}, [loadMoreItems, isLoading, isReindexing]);

	// Efecto para cerrar el menú contextual al hacer clic fuera de él
	useEffect(() => {
		const handleGlobalClick = (e: MouseEvent) => {
			if (contextMenuFile) {
				// Verificar si el clic fue fuera del menú contextual
				const contextMenuElement = document.getElementById('file-context-menu');
				if (contextMenuElement && !contextMenuElement.contains(e.target as Node)) {
					// Cerrar el menú
					setContextMenuFile(null);
					setContextMenuPosition(null);
				}
			}
		};

		// Agregar manejador de eventos global
		document.addEventListener('click', handleGlobalClick);

		// Limpiar al desmontar
		return () => {
			document.removeEventListener('click', handleGlobalClick);
		};
	}, [contextMenuFile]);

	// Eliminado el renderedContent memoizado - ahora se maneja directamente en el JSX principal

	// Referencia al contenedor principal para manejar el foco
	const mainRef = useRef<HTMLDivElement>(null);

	// Manejador de eventos de teclado para navegación
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			// Si el foco no está en este componente, no hacer nada
			if (!mainRef.current?.contains(document.activeElement)) return;

			switch (e.key) {
				case 'a':
					// Ctrl+A: Seleccionar todo
					if (e.ctrlKey || e.metaKey) {
						e.preventDefault();
						const allIds = processedItems.map((item) => item.id);
						setSelectedIds(allIds);
					}
					break;

				case 'Escape':
					// Escape: Deseleccionar todo
					e.preventDefault();
					clearSelection();
					break;

				case 'Delete':
					// Delete: Podría implementar funcionalidad para eliminar elementos seleccionados
					// (Comentado porque requeriría implementación adicional)
					// if (selectedIds.length > 0) {
					//   e.preventDefault();
					//   // handleDeleteSelected();
					// }
					break;

				// Puedes añadir más atajos de teclado según necesites
			}
		},
		[processedItems, setSelectedIds, clearSelection]
	);

	// 🔄 Usar items directamente con type assertion para compatibilidad
	const _transformedItems = items as FileBrowserFileItem[];

	return (
		<div
			className={cn('h-full w-full bg-background flex flex-col custom-scrollbar', className)}
			onKeyDown={handleKeyDown}
			role="application"
			aria-label="Explorador de archivos"
			ref={mainRef}
			style={{ userSelect: 'none' }}
		>
			<div className="relative flex-1 min-h-0 h-full">
				{/* Vista principal de archivos */}
				<div className="absolute inset-0">
					{isLoading && (
						<div className="h-full w-full flex items-center justify-center">
							<Spinner size="lg" className="text-primary" />
						</div>
					)}

					{!isLoading &&
						(currentViewItems.length === 0 ? (
							<EmptyState
								icon={FileTextIcon}
								title="No se encontraron archivos"
								description={
									searchInput ? `No hay archivos que coincidan con "${searchInput}"` : 'Esta carpeta está vacía'
								}
							/>
						) : (
							<AnimatePresence mode="wait">
								<motion.div
									key={viewMode}
									className="h-full w-full"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.2 }}
								>
									{viewMode === 'list' && (
										<ListView
											items={currentViewItems}
											onItemClick={handleItemClick}
											onItemDoubleClick={handleItemDoubleClick}
											onContextMenu={handleContextMenu}
										/>
									)}

									{viewMode === 'grid' && (
										<SimpleGridView
											items={currentViewItems}
											onItemClick={handleItemClick}
											onItemDoubleClick={handleItemDoubleClick}
											onContextMenu={handleContextMenu}
										/>
									)}

									{viewMode === 'masonry' && (
										<MasonryView
											items={currentViewItems}
											onItemClick={handleItemClick}
											onItemDoubleClick={handleItemDoubleClick}
											onContextMenu={handleContextMenu}
										/>
									)}

									{viewMode === 'cards' && (
										<CardsView
											items={currentViewItems}
											onItemClick={handleItemClick}
											onItemDoubleClick={handleItemDoubleClick}
											onContextMenu={handleContextMenu}
										/>
									)}

									{(!viewMode ||
										(viewMode !== 'list' && viewMode !== 'grid' && viewMode !== 'masonry' && viewMode !== 'cards')) && (
										<SimpleGridView
											items={currentViewItems}
											onItemClick={handleItemClick}
											onItemDoubleClick={handleItemDoubleClick}
											onContextMenu={handleContextMenu}
										/>
									)}
								</motion.div>
							</AnimatePresence>
						))}
				</div>
			</div>{' '}
			{/* Barra de estado */}
			<StatusBar items={currentViewItems} />
			{/* Elemento para scroll infinito - solo si hay función loadMoreItems */}
			{loadMoreItems && (
				<div ref={loadMoreRef} className="h-4 w-full flex items-center justify-center" style={{ minHeight: '16px' }}>
					{isLoading && <div className="text-sm text-muted-foreground">Cargando más elementos...</div>}
				</div>
			)}
			{/* Menú contextual */}
			{contextMenu.open && <ContextMenu {...contextMenu} />}
		</div>
	);
});

export default FileBrowser;

/**
 * 📝 Documentación rápida:
 * - Props nuevas: isLoading, isReindexing, reindexProgress, loadMoreItems
 * - Si isReindexing=true, se muestra overlay de progreso y skeleton
 * - Si isLoading=true, se muestra skeleton de carga
 * - Si containerWidth=0, se muestra skeleton de medición
 * - El overlay es accesible y visible para todos los modos
 * - Integración con menú contextual, panel de detalles y visor de archivos
 * - Soporte para scroll infinito con loadMoreItems
 * - Soporte para favoritos con estado local
 * - Integración con selección múltiple de archivos
 *
 * Ejemplo de integración:
 * <FileBrowser
 *   items={items}
 *   isReindexing={folderStatus.isReindexing}
 *   reindexProgress={folderStatus.progress}
 *   isLoading={isLoading}
 *   loadMoreItems={handleLoadMore}
 * />
 *
 * Características principales:
 * 1. Menú contextual: Click derecho en cualquier archivo para acceder a acciones
 * 2. Panel de detalles: Se actualiza automáticamente al seleccionar archivos
 * 3. Visor de archivos: Doble click en una imagen para abrirla en el visor
 * 4. Favoritos: Toggle de favoritos desde el menú contextual
 * 5. Selección múltiple: Click para seleccionar/deseleccionar archivos
 * 6. Scroll infinito: Carga más elementos al hacer scroll
 */
