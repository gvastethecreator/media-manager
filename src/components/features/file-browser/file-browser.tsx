'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { EmptyState } from '@/components/core/data-display';
import { FileViewer, type ImageItem } from '@/components/features/file-viewer/file-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFileStoreBase } from '@/store/entities/file';
import { useImageResources } from '@/store/image-resources.store';
import { FileItem } from '@/types/file-item';
import { FileText as FileTextIcon } from 'lucide-react';
import { handleContextAction } from './context-menu/context-action-handler';
import { FileContextMenu } from './context-menu/context-menu';
import type { ContextMenuAction } from './context-menu/types';

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
	viewMode?: 'grid' | 'list' | 'masonry' | 'cards';
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

export const FileBrowser = memo<FileBrowserProps>(function FileBrowser({
	items,
	viewMode = 'grid',
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

	// 📊 Cálculo del grid
	const itemsPerRow = containerWidth > 0 ? Math.floor((containerWidth + GAP) / (ITEM_WIDTH + GAP)) : 0;
	const totalRows = itemsPerRow > 0 ? Math.ceil(items.length / itemsPerRow) : 0;

	// 🎮 Virtualización simple
	const virtualizer = useVirtualizer({
		count: totalRows,
		getScrollElement: () => containerRef.current,
		estimateSize: () => ITEM_HEIGHT + GAP,
		overscan: 2,
	});

	// 🎯 Event handlers
	const handleItemClick = useCallback(
		(item: FileItem) => {
			// Si ya está seleccionado, deseleccionar todo y seleccionar solo este
			if (selectedFileIds.includes(item.id)) {
				deselectAllFiles();
				selectFile(item.id);
			} else {
				// Si no está seleccionado, deseleccionar todo y seleccionar este
				deselectAllFiles();
				selectFile(item.id);
			}

			// Llamar al callback externo si existe
			onItemSelect?.(item);
		},
		[selectedFileIds, deselectAllFiles, selectFile, onItemSelect]
	);

	// Función para manejar el doble clic en un ítem
	const handleItemDoubleClick = useCallback(
		(item: FileItem) => {
			// Llamar al callback externo si existe
			if (onItemDoubleClick) {
				onItemDoubleClick(item);
			} else {
				// Comportamiento por defecto: abrir en el visor de imágenes
				const mappedImages = items.map(mapFileItemToImageItem).filter((img) => img.src) as ImageItem[];
				const initialIndex = mappedImages.findIndex((img) => img.id === item.id);

				if (initialIndex !== -1) {
					setViewerImages(mappedImages);
					setViewerInitialIndex(initialIndex);
					setIsViewerOpen(true);
				}
			}
		},
		[onItemDoubleClick, items]
	);

	// Función para manejar el clic derecho y abrir el menú contextual
	const handleContextMenu = useCallback(
		(item: FileItem) => {
			// Asegurar que el item esté seleccionado para el menú contextual
			if (!selectedFileIds.includes(item.id)) {
				deselectAllFiles();
				selectFile(item.id);
			}
		},
		[selectedFileIds, deselectAllFiles, selectFile]
	);

	// Handler para las acciones del menú contextual
	const handleMenuAction = useCallback(
		(action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => {
			// Manejar acciones específicas localmente
			if (action === 'favorite-toggle') {
				toggleFavorite(item.id);
				return;
			}

			// Delegar el resto de acciones al handler general
			handleContextAction(action as any, item, data, handleItemDoubleClick, toggleSelectFile);
		},
		[handleItemDoubleClick, toggleSelectFile, toggleFavorite]
	);

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
		const selectedItems = items.filter(item => selectedFileIds.includes(item.id));

		if (selectedItems.length > 0) {
			setDetailsPanelVisible(true);

			// Simplificar los items para el panel de detalles - solo usar las propiedades básicas
			const simplifiedItems = selectedItems.map((item) => ({
				id: item.id,
				name: item.name,
				type: item.type || 'image',
				path: item.path || '',
				size: item.size || 0,
				metadata: item.metadata,
				url: item.thumbnail || `/api/images/${item.id}/thumbnail`,
				src: item.thumbnail || `/api/images/${item.id}/thumbnail`,
			}));

			setDetailsPanelItems(simplifiedItems as any);
		} else {
			setDetailsPanelVisible(false);
			setDetailsPanelItems([]);
		}
	}, [items, selectedFileIds, setDetailsPanelVisible, setDetailsPanelItems]);

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
	if (!items || items.length === 0) {
		return (
			<EmptyState
				icon={FileTextIcon}
				title="No hay archivos para mostrar"
				description="Parece que no hay archivos en esta ubicación o no se encontraron resultados para tu búsqueda."
			/>
		);
	}

	gridLogger.debug(
		`[FileBrowser] 🎯 Renderizando grid: ${itemsPerRow} items/fila, ${totalRows} filas, ${items.length} items`
	);

	return (
		<>
			{/* Visor de imágenes */}
			{isViewerOpen && (
				<FileViewer
					isOpen={isViewerOpen}
					images={viewerImages}
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
									const item = items[itemIndex];

									if (!item) return null;

									return (
										<GridItem
											key={item.id}
											item={item}
											isSelected={selectedFileIds.includes(item.id)}
											isFavorite={isFavorited(item.id)}
											onClick={() => handleItemClick(item)}
											onDoubleClick={() => handleItemDoubleClick(item)}
											onContextMenu={() => handleContextMenu(item)}
											onContextAction={handleMenuAction}
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
	onClick: () => void;
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
	// 🖼️ Estado para manejo de errores de imagen
	const [imageError, setImageError] = useState(false);

	const handleImageError = useCallback(() => {
		gridLogger.warn(`[FileBrowser] ❌ Error cargando thumbnail para imagen ${item.id}: ${item.name}`);
		setImageError(true);
	}, [item.id, item.name]);

	const handleImageLoad = useCallback(() => {
		gridLogger.debug(`[FileBrowser] ✅ Thumbnail cargado para imagen ${item.id}: ${item.name}`);
	}, [item.id, item.name]);

	// 🖼️ Compatibilidad: usar item.thumbnail si existe, si no fallback a /api/images/{item.id}/thumbnail
	// Nos aseguramos que el thumbnail sea string o undefined pero nunca null
	const thumbnailUrl =
		item.thumbnail && typeof item.thumbnail === 'string' ? item.thumbnail : `/api/images/${item.id}/thumbnail`;

	return (
		<FileContextMenu
			file={item}
			onAction={onContextAction}
		>
			<motion.div
				layout
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				className={clsx(
					'relative group cursor-pointer',
					'w-48 h-52 rounded-lg overflow-hidden',
					'border-2 transition-all duration-200',
					isSelected ? 'border-blue-500 shadow-lg' : 'border-transparent hover:border-gray-300'
				)}
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				onContextMenu={(e) => {
					e.preventDefault();
					onContextMenu();
				}}
			>
				{/* 🖼️ Miniatura */}
				<div className="w-full h-40 bg-gray-100 rounded-t-lg overflow-hidden">
					{item.type === 'image' ? (
						imageError ? (
							<div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500">
								<span className="text-2xl mb-1">⚠️</span>
								<span className="text-xs">Error</span>
							</div>
						) : (
							<img
								src={thumbnailUrl}
								alt={item.name}
								className="w-full h-full object-cover"
								loading="lazy"
								onError={handleImageError}
								onLoad={handleImageLoad}
							/>
						)
					) : (
						<div className="w-full h-full flex items-center justify-center bg-gray-200">
							<span className="text-4xl">📄</span>
						</div>
					)}
				</div>
				{/* 📝 Información del archivo */}
				<div className="p-3 bg-white">
					<h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
					<p className="text-xs text-gray-500 mt-1">{item.type.toUpperCase()}</p>
				</div>
				{/* ✨ Overlay de selección */}
				{isSelected && <div className="absolute inset-0 bg-blue-500 bg-opacity-10 pointer-events-none rounded-lg" />}
				{/* ❤️ Indicador de favorito */}
				{isFavorite && (
					<div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
						<span className="text-red-500 text-sm">❤️</span>
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
