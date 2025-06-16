'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { EmptyState } from '@/components/core/data-display';
import { useToolbarActions } from '@/components/features/file-browser/toolbar-integration';
import { FileViewer, type ImageItem } from '@/components/features/file-viewer/file-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFileStoreBase } from '@/store/entities/file';
import { useImageResources } from '@/store/image-resources.store';
import { FileItem } from '@/types/file-item';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { useFilteredData } from './hooks/use-filtered-data';
import { FileText as FileTextIcon, Star } from 'lucide-react';
import { handleContextAction } from './context-menu/context-action-handler';
import { FileContextMenu } from './context-menu/context-menu';
import type { ContextMenuAction } from './context-menu/types';
import { ImageRenderer } from './image-renderer';

// 📊 Logger específico para FileBrowser
const gridLogger = clientLogger.withContext('FileBrowser');

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

	// 📐 Refs para medición directa
	const containerRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const measurementAttemptsRef = useRef(0);

	// 🏪 Stores
	const selectedFileIds = useFileStoreBase((state) => state.selectedFileIds);
	const selectFile = useFileStoreBase((state) => state.selectFile);
	const toggleSelectFile = useFileStoreBase((state) => state.toggleSelectFile);
	const deselectAllFiles = useFileStoreBase((state) => state.deselectAllFiles);
	const { setVisible: setDetailsPanelVisible, setSelectedItems: setDetailsPanelItems } = useDetailsPanel();

	// 🔄 Integración con la barra de herramientas
	const toolbarActions = useToolbarActions();

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
		gridLogger.debug(`[FileBrowser] Intento medición ${attempt}`);

		const measure = () => {
			const width = element.offsetWidth;
			gridLogger.debug(`[FileBrowser] offsetWidth = ${width}px`);

			if (width > 0) {
				gridLogger.info(`[FileBrowser] ✅ Medición exitosa: ${width}px`);
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
				gridLogger.warn(
					`[FileBrowser] ⚠️ Falló medición después de ${attempt} intentos, usando fallback: ${FALLBACK_WIDTH}px`
				);
				setContainerWidth(FALLBACK_WIDTH);
			}, 100);
		});
	}, []);

	// 📎 Callback ref para medición del contenedor
	const containerCallbackRef = useCallback(
		(element: HTMLDivElement | null) => {
			if (element && element !== containerRef.current) {
				containerRef.current = element;
				gridLogger.debug('[FileBrowser] 📎 Nuevo contenedor detectado, iniciando medición');
				measureContainer(element);
			}
		},
		[measureContainer]
	);

        const filteredItems = useFilteredData(items);

        // 📊 Cálculo del grid
        const itemsPerRow = containerWidth > 0 ? Math.floor((containerWidth + GAP) / (ITEM_WIDTH + GAP)) : 0;
        const totalRows = itemsPerRow > 0 ? Math.ceil(filteredItems.length / itemsPerRow) : 0;

	// 🎮 Virtualización simple
	const virtualizer = useVirtualizer({
		count: totalRows,
		getScrollElement: () => containerRef.current,
		estimateSize: () => ITEM_HEIGHT + GAP,
		overscan: 2,
	});

	// 🔍 Manejador de selección de elementos
	const handleSelectItem = useCallback((item: FileItem, index: number, e?: React.MouseEvent) => {
		if (!item || !item.id) return;

		// Usar el evento para detectar teclas modificadoras
		const ctrlKey = e?.ctrlKey || e?.metaKey || false;
		const shiftKey = e?.shiftKey || false;

		// Opción 1: Selección múltiple con Ctrl/Cmd
		if (ctrlKey) {
			toggleSelectFile(item.id);
			setLastSelectedItemIndex(index);
		}
		// Opción 2: Selección de rango con Shift
		else if (shiftKey && lastSelectedItemIndex !== null) {
			// Determinar el rango de selección
			const startIdx = Math.min(lastSelectedItemIndex, index);
			const endIdx = Math.max(lastSelectedItemIndex, index);

			// Seleccionar todos los elementos en el rango
                        for (let i = startIdx; i <= endIdx; i++) {
                                if (i < filteredItems.length && filteredItems[i].id) {
                                        selectFile(filteredItems[i].id);
                                }
                        }
		}
		// Opción 3: Selección simple (reemplazar selección existente)
		else {
			// Si ya está seleccionado y es el único, deseleccionar
			if (selectedFileIds.length === 1 && selectedFileIds[0] === item.id) {
				deselectAllFiles();
				setLastSelectedItemIndex(null);
			} else {
				// Deseleccionar todo primero
				deselectAllFiles();
				// Luego seleccionar el nuevo item
				selectFile(item.id);
				setLastSelectedItemIndex(index);
			}
		}

		// Actualizar panel de detalles
                const selectedItems = filteredItems
                        .filter((i) => i.id && selectedFileIds.includes(i.id))
                        .map((i) => ({
				id: i.id,
				name: i.name,
				path: i.path,
				type: i.type,
				size: i.size,
				mimeType: i.mimeType,
				metadata: i.metadata,
				thumbnail: i.thumbnail || null,
				src: `/api/images/${i.id}/content`,
				alt: i.name,
				width: null,
				height: null,
				parsedMetadata: undefined,
				url: `/api/images/${i.id}/content`,
			} as unknown as ImageItem));

		if (selectedItems.length > 0) {
			// @ts-ignore - Ignoring type mismatch between different ImageItem types
			setDetailsPanelItems(selectedItems);
			setDetailsPanelVisible(true);
		} else {
			setDetailsPanelVisible(false);
		}

		// Callback personalizado si existe
		onItemSelect?.(item);
        }, [selectedFileIds, toggleSelectFile, selectFile, deselectAllFiles, onItemSelect, setDetailsPanelItems, setDetailsPanelVisible, lastSelectedItemIndex, filteredItems]);

	// 🔍 Manejador de doble clic
	const handleDoubleClick = useCallback((item: FileItem) => {
		// Si es un directorio, no abrir el visor
		if ('isDirectory' in item && item.isDirectory === true) {
			onItemDoubleClick?.(item);
			return;
		}

		// Abrir el visor de imágenes
                const validItems = filteredItems.filter((i) =>
                        (i.type?.startsWith('image/') || i.mimeType?.startsWith('image/'))
                );
		const index = validItems.findIndex((i) => i.id === item.id);

		if (index !== -1) {
			const imageItems = validItems.map((i) => ({
				id: i.id,
				name: i.name,
				path: i.path,
				type: i.type,
				size: i.size,
				mimeType: i.mimeType,
				metadata: i.metadata,
				thumbnail: i.thumbnail || null,
				src: `/api/images/${i.id}/content`,
				alt: i.name,
				width: null,
				height: null,
				parsedMetadata: undefined,
				url: `/api/images/${i.id}/content`,
			} as unknown as ImageItem));

			// @ts-ignore - Ignoring type mismatch between different ImageItem types
			setViewerImages(imageItems);
			setViewerInitialIndex(index);
			setIsViewerOpen(true);
		}

		onItemDoubleClick?.(item);
        }, [filteredItems, onItemDoubleClick]);

	// 🖱️ Manejador de acciones de contexto
	const handleItemContextAction = useCallback(async (action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => {
		// Integrar con acciones de la barra de herramientas
		switch (action) {
			case 'delete':
				await toolbarActions.handleDeleteSelected();
				break;
			case 'download':
				await toolbarActions.handleDownloadSelected();
				break;
			case 'copy':
				await toolbarActions.handleCopySelected();
				break;
			default:
				// Para otras acciones, usar el handler existente
				await handleContextAction(action, item, data);
				break;
		}
	}, [toolbarActions]);

	// Función memoizada para mapear FileItem a ImageItem
	const mapFileItemToImageItem = useCallback((fileItem: FileBrowserFileItem): ImageItem => {
		// Obtener dimensiones del resource store si están disponibles
		const resource = useImageResources.getState().resources.get(fileItem.id);

		let width = resource?.dimensions?.width;
		let height = resource?.dimensions?.height;

		// Si no hay dimensiones en resource, intentar desde metadata
		if ((!width || !height) && fileItem.metadata) {
			try {
				const metadataObj = typeof fileItem.metadata === 'string' ? JSON.parse(fileItem.metadata) : fileItem.metadata;
				if (metadataObj?.dimensions) {
					width = metadataObj.dimensions.width;
					height = metadataObj.dimensions.height;
				}
			} catch (error) {
				// Ignorar errores de parsing de metadata
			}
		}

		// Determinar la URL de la miniatura en orden de prioridad
		let thumbnailUrl: string | null = null;

		// 1. Usar thumbnail del resource store si está disponible
		if (resource?.thumbnail && typeof resource.thumbnail === 'string') {
			thumbnailUrl = resource.thumbnail;
		}
		// 2. Usar thumbnail del item si está disponible
		else if (fileItem.thumbnail && typeof fileItem.thumbnail === 'string') {
			thumbnailUrl = fileItem.thumbnail;
		}
		// 3. Construir URL de API si tenemos el path
		else if (fileItem.path) {
			thumbnailUrl = `/api/images/${fileItem.id}/thumbnail`;
		}

		// Crear un objeto ImageItem compatible con FileViewer
		return {
			id: fileItem.id,
			name: fileItem.name,
			src: thumbnailUrl || `/api/images/${fileItem.id}/thumbnail`,
			width: width || 0,
			height: height || 0,
			thumbnail: thumbnailUrl,
			type: fileItem.type || 'image',
			path: fileItem.path || '',
			size: fileItem.size || 0,
			url: thumbnailUrl || undefined,
			alt: fileItem.name,
			mimeType: fileItem.mimeType,
			metadata: fileItem.metadata,
			parsedMetadata: fileItem.metadata
				? (() => {
					try {
						const parsed = typeof fileItem.metadata === 'string' ? JSON.parse(fileItem.metadata) : fileItem.metadata;
						return {
							dimensions: parsed?.dimensions || { width: width || 0, height: height || 0 },
							mimeType: fileItem.mimeType,
							isLocal: true,
						};
					} catch {
						return {
							dimensions: { width: width || 0, height: height || 0 },
							mimeType: fileItem.mimeType,
							isLocal: true,
						};
					}
				})()
				: undefined,
		} as ImageItem;
	}, []);

	// Efecto para actualizar el panel de detalles cuando cambian los items seleccionados
        useEffect(() => {
                const selectedItems = filteredItems.filter(item => selectedFileIds.includes(item.id));

		if (selectedItems.length > 0) {
			// Mostrar el panel de detalles
			setDetailsPanelVisible(true);

			// Convertir los items a objetos compatibles con ImageItem para el panel de detalles
			const detailsItems = selectedItems.map((item) => ({
				id: item.id,
				name: item.name,
				type: item.type || 'image',
				path: item.path || '',
				size: item.size || 0,
				width: null,
				height: null,
				url: item.thumbnail || `/api/images/${item.id}/thumbnail`,
				src: item.thumbnail || `/api/images/${item.id}/thumbnail`,
				alt: item.name,
				thumbnail: item.thumbnail || null,
				metadata: item.metadata,
				parsedMetadata: undefined,
				originalPath: item.path || '',
				format: '',
				mimeType: item.mimeType
			} as ImageItem));

			// Actualizar el panel de detalles con los items seleccionados
			setDetailsPanelItems(detailsItems as any);

			// Log para depuración
			gridLogger.debug(`[FileBrowser] 🔍 ${selectedItems.length} items seleccionados, panel de detalles actualizado`);
		} else {
			// Ocultar el panel de detalles si no hay selección
			setDetailsPanelVisible(false);
			setDetailsPanelItems([]);
		}
        }, [filteredItems, selectedFileIds, setDetailsPanelVisible, setDetailsPanelItems]);

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

	// Manejador de scroll para virtualización
	const handleScroll = useCallback(() => {
		// Implementación mínima para compatibilidad
	}, []);

	// 🔄 Fallback durante medición o loading/reindex
	if (containerWidth === 0 || isLoading || isReindexing) {
		return (
			<div ref={containerCallbackRef} className={clsx('flex-1 h-full w-full overflow-hidden relative', className)}>
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
				{/* Overlay visual si está reindexando */}
				{isReindexing && (
					<div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-10">
						<span className="text-blue-500 animate-spin text-3xl mb-2">🔄</span>
						<span className="text-xs text-blue-700">Reindexando carpeta...</span>
					</div>
				)}
			</div>
		);
	}

	// 🛡️ Validaciones de seguridad antes del render
        if (!filteredItems || filteredItems.length === 0) {
		return (
			<EmptyState
				icon={FileTextIcon}
				title="No hay archivos para mostrar"
				description="Parece que no hay archivos en esta ubicación o no se encontraron resultados para tu búsqueda."
			/>
		);
	}

        gridLogger.debug(
                `[FileBrowser] 🎯 Renderizando grid: ${itemsPerRow} items/fila, ${totalRows} filas, ${filteredItems.length} items`
        );

	return (
		<>
			{/* Visor de imágenes */}
			{isViewerOpen && (
				<FileViewer
					isOpen={isViewerOpen}
					images={viewerImages as any}
					initialIndex={viewerInitialIndex}
					onClose={() => setIsViewerOpen(false)}
				/>
			)}

			<div
				ref={containerCallbackRef}
				className={clsx('flex-1 h-full w-full overflow-auto', className)}
				onScroll={handleScroll}
			>
				<div
					style={{
						height: virtualizer.getTotalSize(),
						width: '100%',
						position: 'relative',
					}}
				>
					{virtualizer.getVirtualItems().map((virtualRow) => (
						<div
							key={virtualRow.index}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: virtualRow.size,
								transform: `translateY(${virtualRow.start}px)`,
							}}
						>
							<div
								className="flex flex-wrap gap-4 p-4"
								style={{
									justifyContent: 'flex-start',
								}}
							>
                                                                {Array.from({ length: itemsPerRow }, (_, colIndex) => {
                                                                        const itemIndex = virtualRow.index * itemsPerRow + colIndex;
                                                                        const item = filteredItems[itemIndex];

									if (!item) return null;

									return (
										<GridItem
											key={item.id}
											item={item}
											isSelected={selectedFileIds.includes(item.id)}
											isFavorite={isFavorited(item.id)}
											onClick={(e) => handleSelectItem(item, itemIndex, e)}
											onDoubleClick={() => handleDoubleClick(item)}
											onContextMenu={() => handleItemContextAction('preview', item)}
											onContextAction={handleItemContextAction}
										/>
									);
								})}
							</div>
						</div>
					))}
				</div>

				{/* Elemento para scroll infinito */}
				{loadMoreItems && <div ref={loadMoreRef} className="h-16 flex items-center justify-center">
					{loadMoreVisible && !isLoading && !isReindexing && (
						<div className="text-sm text-muted-foreground">Cargando más elementos...</div>
					)}
				</div>}
			</div>
		</>
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
