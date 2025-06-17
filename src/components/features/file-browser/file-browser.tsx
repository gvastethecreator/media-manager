'use client';

import { AnimatePresence } from 'motion/react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { EmptyState } from '@/components/core/data-display';
import { FileViewer, type ImageItem } from '@/components/features/file-viewer/file-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useImageResources } from '@/store/image-resources.store';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { FileItem } from '@/types/file-item';
import { FileTextIcon, Star } from 'lucide-react';
import { handleContextAction } from './context-menu/context-action-handler';
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
	// Último elemento seleccionado para soportar selección con Shift
	const [lastSelectedItemIndex, setLastSelectedItemIndex] = useState<number | null>(null);

	// 🔍 Opciones de vista globales
	const viewMode = useViewOptionsStore((state) => state.viewMode);
	const itemSize = useViewOptionsStore((state) => state.itemSize);

	// 📐 Refs para medición directa
	const containerRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const measurementAttemptsRef = useRef(0);

	// 🏪 Stores
	const { selectedIds, setSelectedIds, toggleSelectedId, clearSelection } = useSelectionStore();
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
			if (element && element !== containerRef.current) {
				containerRef.current = element;
				logger.debug('[FileBrowser] 📎 Nuevo contenedor detectado, iniciando medición');
				measureContainer(element);
			}
		},
		[measureContainer]
	);

	// 🔄 Filtrar y ordenar los datos según las opciones de vista
	const filteredItems = useFilteredData(items);

	// 🔍 Manejador de selección de elementos
	const handleItemClick = useCallback((item: FileItem, e: React.MouseEvent) => {
		if (!item || !item.id) return;

		// Usar el evento para detectar teclas modificadoras
		const ctrlKey = e?.ctrlKey || e?.metaKey || false;
		const shiftKey = e?.shiftKey || false;

		// Opción 1: Selección múltiple con Ctrl/Cmd
		if (ctrlKey) {
			toggleSelectedId(item.id);
			setLastSelectedItemIndex(filteredItems.findIndex(i => i.id === item.id));
		}
		// Opción 2: Selección de rango con Shift
		else if (shiftKey && lastSelectedItemIndex !== null) {
			const currentIndex = filteredItems.findIndex(i => i.id === item.id);

			if (currentIndex !== -1) {
				const start = Math.min(lastSelectedItemIndex, currentIndex);
				const end = Math.max(lastSelectedItemIndex, currentIndex);

				const idsToSelect = filteredItems.slice(start, end + 1).map(i => i.id);
				setSelectedIds(idsToSelect);
			}
		}
		// Opción 3: Selección simple (reemplazar selección existente)
		else {
			// Si ya está seleccionado y es el único, deseleccionar
			if (selectedIds.length === 1 && selectedIds[0] === item.id) {
				clearSelection();
				setLastSelectedItemIndex(null);
			} else {
				// Deseleccionar todo primero y seleccionar solo este item
				setSelectedIds([item.id]);
				setLastSelectedItemIndex(filteredItems.findIndex(i => i.id === item.id));
			}
		}

		// Propagar el evento si es necesario
		onItemSelect?.(item);
	}, [filteredItems, selectedIds, toggleSelectedId, clearSelection, setSelectedIds, lastSelectedItemIndex, onItemSelect]);

	// 🔍 Manejador de doble click (abrir visor)
	const handleItemDoubleClick = useCallback((item: FileItem) => {
		if (!item || !item.id) return;

		// Convertir FileItems a ImageItems usando la utilidad
		const images = fileItemsToImageItems(filteredItems);

		// Encontrar el índice del elemento actual
		const index = filteredItems.findIndex(file => file.id === item.id);
		if (index !== -1) {
			setViewerImages(images);
			setViewerInitialIndex(index);
			setIsViewerOpen(true);
		}

		// Propagar el evento si es necesario
		onItemDoubleClick?.(item);
	}, [filteredItems, onItemDoubleClick]);

	// 🔍 Manejador de acciones del menú contextual
	const handleContextMenuAction = useCallback((action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => {
		handleContextAction(action, item, data);
	}, []);

	// 🔄 Actualizar el panel de detalles cuando cambie la selección
	useEffect(() => {
		if (selectedIds.length > 0) {
			const selectedItems = filteredItems.filter(item => selectedIds.includes(item.id));
			if (selectedItems.length > 0) {
				// Convertir a ImageItems para el panel de detalles
				const detailItems = fileItemsToImageItems(selectedItems);
				setDetailsPanelItems(detailItems);
				setDetailsPanelVisible(true);
			}
		} else {
			setDetailsPanelVisible(false);
		}
	}, [selectedIds, filteredItems, setDetailsPanelItems, setDetailsPanelVisible]);

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

	// 🔄 Renderizado condicional basado en el modo de vista
	const renderContent = () => {
		if (isLoading) {
			return (
				<div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
					{Array.from({ length: 12 }).map((_, index) => (
						<div key={index} className="aspect-square">
							<Skeleton className="h-full w-full" />
						</div>
					))}
				</div>
			);
		}

		if (filteredItems.length === 0) {
			return (
				<EmptyState
					title="No hay archivos"
					description="No se encontraron archivos que coincidan con los criterios de búsqueda."
					icon={FileTextIcon}
				/>
			);
		}

		const viewProps = {
			items: filteredItems,
			onItemClick: handleItemClick,
			onItemDoubleClick: handleItemDoubleClick,
			onContextAction: handleContextMenuAction,
			className: className,
		};

		return (
			<AnimatePresence mode="wait">
				{viewMode === 'grid' && <GridView key="grid-view" {...viewProps} />}
				{viewMode === 'list' && <ListView key="list-view" {...viewProps} />}
				{viewMode === 'cards' && <CardsView key="cards-view" {...viewProps} />}
				{viewMode === 'masonry' && <MasonryView key="masonry-view" {...viewProps} />}
			</AnimatePresence>
		);
	};

	// 🔄 Fallback durante medición o loading/reindex
	if (containerWidth === 0 || isLoading || isReindexing) {
		return (
			<div ref={containerCallbackRef} className={`flex-1 h-full w-full overflow-hidden relative ${className}`}>
				<div className="flex flex-col items-center justify-center h-full">
					<Skeleton className="w-full h-40 mb-4" />
					<div className="text-sm text-muted-foreground">
						{isReindexing ? (
							<>
								<span className="block mb-2">Reindexando carpeta...</span>
								<div className="w-full bg-muted h-2 rounded-full overflow-hidden">
									<div
										className="bg-primary h-full transition-all duration-300 ease-in-out"
										style={{ width: `${Math.round(reindexProgress)}%` }}
									/>
								</div>
								<span className="text-xs mt-2 text-muted-foreground">{Math.round(reindexProgress)}%</span>
							</>
						) : (
							'Calculando dimensiones del contenedor...'
						)}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="relative h-full w-full overflow-hidden" ref={containerCallbackRef}>
			{renderContent()}

			{isViewerOpen && (
				<FileViewer
					isOpen={isViewerOpen}
					images={viewerImages}
					initialIndex={viewerInitialIndex}
					onClose={() => setIsViewerOpen(false)}
				/>
			)}

			{isReindexing && (
				<div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2 flex items-center justify-between">
					<div className="text-sm font-medium">Reindexando archivos...</div>
					<div className="text-sm">{Math.round(reindexProgress)}%</div>
				</div>
			)}

			{loadMoreItems && loadMoreVisible && (
				<div
					ref={loadMoreRef}
					className="w-full py-4 flex items-center justify-center"
					onClick={loadMoreItems}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							loadMoreItems();
						}
					}}
					tabIndex={0}
					role="button"
				>
					<button
						type="button"
						className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
					>
						Cargar más
					</button>
				</div>
			)}
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
