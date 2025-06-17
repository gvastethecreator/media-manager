'use client';

import { AnimatePresence } from 'motion/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { EmptyState } from '@/components/core/data-display';
import { FileViewer, type ImageItem } from '@/components/features/file-viewer/file-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useImageResources } from '@/store/image-resources.store';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { FileItem } from '@/types/file-item';
import clsx from 'clsx';
import { FileTextIcon, Star } from 'lucide-react';
import { FileContextMenu } from './context-menu/context-menu';
import type { ContextMenuAction } from './context-menu/types';
import { useFilteredData } from './hooks/use-filtered-data';
import { ImageRenderer } from './image-renderer';
import { fileItemsToImageItems } from './utils/file-converters';
import { CardsView } from './views/cards-view';
import { GridView } from './views/grid-view';
import { ListView } from './views/list-view';
import { MasonryView } from './views/masonry-view';

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
	items: FileBrowserFileItem[];
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

const FALLBACK_WIDTH = 1200;
const ITEM_HEIGHT = 220;
const ITEM_WIDTH = 200;
const GAP = 16;

// Añadir una función interna para formatear tamaños de archivo
// ya que la importación está causando problemas
const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
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
	// 📊 Estados mínimos - Solo lo esencial
	const [containerWidth, setContainerWidth] = useState<number>(0);
	const [isViewerOpen, setIsViewerOpen] = useState(false);
	const [viewerImages, setViewerImages] = useState<ImageItem[]>([]);
	const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
	const [loadMoreVisible, setLoadMoreVisible] = useState(false);
	// Estado local para favoritos como solución temporal
	const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
	// ✅ Usar una ref para el seguimiento no causa re-renders
	const lastSelectedItemIndexRef = useRef<number | null>(null);

	// Estado para el menú contextual personalizado
	const [contextMenuFile, setContextMenuFile] = useState<FileItem | null>(null);
	const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

	// 🔍 Opciones de vista globales
	const viewMode = useViewOptionsStore((state) => state.viewMode);
	const itemSize = useViewOptionsStore((state) => state.itemSize);
	const { searchTerm, sortBy, sortDirection, filterFavorites } = useViewOptionsStore();

	// 📐 Refs para medición directa
	const containerRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const measurementAttemptsRef = useRef(0);

	// 🏪 Stores
	const { selectedIds, activeId, setActiveId, setSelectedIds, toggleSelectedId, clearSelection } = useSelectionStore();
	const { setVisible: setDetailsPanelVisible, setSelectedItems: setDetailsPanelItems } = useDetailsPanel();

	// Funciones para gestionar favoritos localmente
	const isFavorited = useCallback((id: string) => favoriteIds.has(id), [favoriteIds]);
	const toggleFavorite = useCallback((id: string) => {
		setFavoriteIds(prev => {
			const newFavorites = new Set(prev);
			if (newFavorites.has(id)) {
				newFavorites.delete(id);
			} else {
				newFavorites.add(id);
			}
			return newFavorites;
		});
	}, []);

	// Seleccionar solo la versión del store para forzar re-renders cuando las miniaturas cambien
	const imageResourcesVersion = useImageResources((state) => state.version);

	// 🔧 **Sistema de medición progresivo**
	// Estrategia: inmediato → RAF → timeout → fallback fijo
	const measureContainer = useCallback((element: HTMLDivElement) => {
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
				logger.warn(
					`[FileBrowser] ⚠️ Falló medición después de ${attempt} intentos, usando fallback: ${1200}px`
				);
				setContainerWidth(1200);
			}, 100);
		});
	}, []);

	// 📎 Callback ref para medición del contenedor
	const containerCallbackRef = useCallback(
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

	// 🔍 Manejador de selección de elementos - ESTABILIZADO con getState()
	// Esta es la clave: la función no se recrea cuando la selección cambia.
	const handleItemClick = useCallback((clickedItem: FileItem, e: React.MouseEvent) => {
		const { ctrlKey, metaKey, shiftKey } = e;
		const { selectedIds, setSelectedIds, toggleSelectedId, clearSelection } = useSelectionStore.getState();

		const currentIndex = filteredItems.findIndex(i => i.id === clickedItem.id);
		if (currentIndex === -1) return;

		// La lógica de selección permanece igual, pero ahora usa el estado más reciente del store
		if (shiftKey && lastSelectedItemIndexRef.current !== null) {
			const start = Math.min(lastSelectedItemIndexRef.current, currentIndex);
			const end = Math.max(lastSelectedItemIndexRef.current, currentIndex);
			const idsToSelect = filteredItems.slice(start, end + 1).map(i => i.id);
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
	}, [filteredItems, onItemSelect]); // Se eliminan las dependencias del store de selección

	// 🔍 Manejador de doble click (abrir visor) - ESTABILIZADO
	const handleItemDoubleClick = useCallback((item: FileItem) => {
		const images = fileItemsToImageItems(filteredItems);
		const index = filteredItems.findIndex(file => file.id === item.id);
		if (index !== -1) {
			setViewerImages(images);
			setViewerInitialIndex(index);
			setIsViewerOpen(true);
		}
		onItemDoubleClick?.(item);
	}, [filteredItems, onItemDoubleClick]);

	// 🔍 Manejador para el menú contextual
	const handleContextMenu = useCallback((file: FileItem, e?: React.MouseEvent) => {
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

	// 🔍 Manejador para cerrar el menú contextual
	const handleCloseContextMenu = useCallback(() => {
		// Deshabilitado temporalmente
		/*
		setContextMenuFile(null);
		setContextMenuPosition(null);
		*/
	}, []);

	// 🔍 Manejador de acciones del menú contextual
	const handleContextMenuAction = useCallback((action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => {
		// Deshabilitado temporalmente
		/*
		handleContextAction(action, item, data);
		handleCloseContextMenu(); // Cerrar el menú después de la acción
		*/
	}, [handleCloseContextMenu]);

	// 🔄 Actualizar el panel de detalles cuando cambie la selección
	useEffect(() => {
		// Asegurarse de que el panel siempre esté visible
		const detailsState = useDetailsPanel.getState();

		// Si hay elementos seleccionados
		if (selectedIds.length > 0) {
			const selectedItems = filteredItems.filter(item => selectedIds.includes(item.id));
			if (selectedItems.length > 0) {
				// Convertir a ImageItems para el panel de detalles
				const detailItems = fileItemsToImageItems(selectedItems);

				// Verificar si los elementos seleccionados han cambiado realmente
				const currentItems = detailsState.selectedItems;

				// Comparar IDs para determinar si realmente necesitamos actualizar
				const currentIds = new Set(currentItems.map(item => item.id));
				const newIds = new Set(detailItems.map(item => item.id));

				// Solo actualizar si los IDs han cambiado
				const needsUpdate =
					currentIds.size !== newIds.size ||
					![...currentIds].every(id => newIds.has(id));

				if (needsUpdate) {
					setDetailsPanelItems(detailItems);
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
					imageCount: items.filter(item => item.type?.startsWith('image/')).length,
					videoCount: items.filter(item => item.type?.startsWith('video/')).length,
					documentCount: items.filter(item => item.type?.startsWith('text/')).length,
					otherCount: items.filter(item => !item.type?.startsWith('image/') && !item.type?.startsWith('video/') && !item.type?.startsWith('text/')).length,
				}),
			};

			setDetailsPanelItems([folderStats as unknown as ImageItem]);
		}

		// Asegurarse de que el panel esté visible
		if (!detailsState.isVisible) {
			setDetailsPanelVisible(true);
		}
	}, [selectedIds, filteredItems, items, setDetailsPanelItems, setDetailsPanelVisible]);

	// Efecto para el scroll infinito
	useEffect(() => {
		if (!loadMoreItems || !loadMoreRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry.isIntersecting && !isLoading && !isReindexing) {
					loadMoreItems();
				}
				setLoadMoreVisible(entry.isIntersecting);
			},
			{ threshold: 0.5 }
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
					handleCloseContextMenu();
				}
			}
		};

		// Agregar manejador de eventos global
		document.addEventListener('click', handleGlobalClick);

		// Limpiar al desmontar
		return () => {
			document.removeEventListener('click', handleGlobalClick);
		};
	}, [contextMenuFile, handleCloseContextMenu]);

	// 🎨 Memoizamos el contenido renderizado para evitar re-cálculos
	const renderedContent = useMemo(() => {
		if (isLoading) {
			return <Skeleton className="w-full h-full" />;
		}

		if (!filteredItems || filteredItems.length === 0) {
			return (
				<EmptyState
					icon={FileTextIcon}
					title="No files found"
					description={
						filterFavorites
							? 'No favorite files match your search.'
							: 'No files match your current search or filter.'
					}
				/>
			);
		}

		const viewProps = {
			items: filteredItems,
			onItemClick: handleItemClick,
			onItemDoubleClick: handleItemDoubleClick,
			onContextMenu: handleContextMenu, // Pasamos el manejador de menú contextual
		};

		switch (viewMode) {
			case 'grid':
				return <GridView {...viewProps} />;
			case 'list':
				return <ListView {...viewProps} />;
			case 'masonry':
				return <MasonryView {...viewProps} />;
			case 'cards':
				return <CardsView {...viewProps} />;
			default:
				return <GridView {...viewProps} />;
		}
	}, [filteredItems, isLoading, viewMode, handleItemClick, handleItemDoubleClick, handleContextMenu, filterFavorites]);

	return (
		<div ref={containerCallbackRef} className={cn('relative h-full w-full', className)}>
			<AnimatePresence mode="wait">
				{renderedContent}
			</AnimatePresence>

			{isViewerOpen && (
				<FileViewer
					images={viewerImages}
					initialIndex={viewerInitialIndex}
					onClose={() => setIsViewerOpen(false)}
				/>
			)}

			{/* Menú contextual personalizado usando portal - Deshabilitado temporalmente */}
			{/*
			{contextMenuFile && contextMenuPosition && typeof window !== 'undefined' && createPortal(
				<div
					id="file-context-menu"
					className="fixed z-50 bg-popover text-popover-foreground rounded-md shadow-md border border-border overflow-hidden"
					style={{
						top: `${contextMenuPosition.y}px`,
						left: `${contextMenuPosition.x}px`,
						maxHeight: '80vh',
						overflowY: 'auto'
					}}
				>
					<FileContextMenu
						file={contextMenuFile}
						onAction={handleContextMenuAction}
					/>
				</div>,
				document.body
			)}
			*/}
		</div>
	);
});

// 🧩 **GridItem con menú contextual**
interface GridItemProps {
	item: FileBrowserFileItem;
	isSelected: boolean;
	isFavorite: boolean;
	onClick: (e?: React.MouseEvent) => void;
	onDoubleClick: () => void;
	onContextMenu: () => void;
	onContextAction: (action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => void;
}

const GridItem = memo<GridItemProps>(function GridItem({
	item,
	isSelected,
	isFavorite,
	onClick,
	onDoubleClick,
	onContextMenu,
	onContextAction
}) {
	// Función para manejar las acciones del menú contextual
	const handleAction = useCallback(
		(action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => {
			onContextAction(action, file, data);
		},
		[onContextAction]
	);

	const thumbnailUrl = item.thumbnail || `/api/images/${item.id}/thumbnail`;

	return (
		<FileContextMenu file={item} onAction={handleAction}>
			<motion.div
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				className={clsx(
					'relative overflow-hidden rounded-md border transition-colors',
					isSelected
						? 'border-primary bg-primary/10 shadow-sm dark:bg-primary/20'
						: 'border-border/40 bg-card hover:border-border/80'
				)}
				onClick={(e) => {
					e.stopPropagation();
					onClick(e);
				}}
				onDoubleClick={(e) => {
					e.stopPropagation();
					onDoubleClick();
				}}
				onContextMenu={(e) => {
					e.stopPropagation();
					onContextMenu();
				}}
			>
				{/* Imagen */}
				<div className="aspect-[3/2] w-full overflow-hidden bg-muted">
					<ImageRenderer
						src={thumbnailUrl}
						alt={item.name}
						className="h-full w-full object-cover transition-transform"
						onError={() => { }}
					/>
				</div>

				{/* Información */}
				<div className="p-2 text-xs">
					<div className="truncate font-medium">{item.name}</div>
					<div className="text-muted-foreground">{formatFileSize(item.size)}</div>
				</div>

				{/* Indicadores */}
				{isFavorite && (
					<div className="absolute top-1 right-1 rounded-full bg-primary p-0.5 text-primary-foreground">
						<Star className="h-3 w-3" />
					</div>
				)}
			</motion.div>
		</FileContextMenu>
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
