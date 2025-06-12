'use client';

import { EmptyState } from '@/components/core/data-display';
import { FileViewer, type ImageItem } from '@/components/features/file-viewer/file-viewer';
import FlickeringGrid from '@/components/ui/flickering-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientLogger } from '@/lib/logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFileStoreBase } from '@/store/entities/file';
import { useImageResources } from '@/store/image-resources.store';
import type { FileItem } from '@/types/file-item';
import type { ViewMode } from '@/types/settings';
import { FileText as FileTextIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
 * Componente principal para la visualización y navegación de archivos - VERSIÓN CORREGIDA
 *
 * Características principales:
 * - Múltiples modos de visualización (grid, lista, masonry, tarjetas)
 * - Virtualización para rendimiento optimizado
 * - Carga diferida de miniaturas
 * - Panel de detalles interactivo y arrastrable
 * - Selección múltiple de archivos
 * - Integración con sistema de menú contextual
 * - SOLUCIÓN CONTAINERWIDTH: Sistema robusto de medición de contenedor
 */
const FileBrowserComponent = ({
	items,
	isResizing = false,
	onItemClick,
	onItemDoubleClick,
	loadMoreItems,
}: FileBrowserProps) => {
	// 📊 Función para depurar los items recibidos sin errores de tipo
	const logItemInfo = useCallback((item: any) => {
		if (!item) return 'Item nulo o indefinido';
		try {
			return {
				id: item.id || 'Sin ID',
				name: item.name || 'Sin nombre',
				type: item.type || 'Sin tipo',
				src: item.src ? 'Tiene src' : 'Sin src',
				thumbnail: item.thumbnail ? 'Tiene thumbnail' : 'Sin thumbnail',
			};
		} catch (error) {
			return `Error al analizar item: ${error}`;
		}
	}, []); // Debug: Mostrar detalles de los items recibidos
	useEffect(() => {
		gridLogger.info(`🔍 FileBrowser recibió ${items?.length || 0} items`);

		if (items && items.length > 0) {
			const firstItem = items[0];
			gridLogger.debug('📄 Primer item recibido:', logItemInfo(firstItem));
		} else {
			gridLogger.warn('⚠️ FileBrowser: No se recibieron items o el array está vacío');
		}
	}, [items, logItemInfo]);

	// 🏪 Stores
	const viewMode: ViewMode = useFileStoreBase((state) => state.viewMode as ViewMode);
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
	// Flag para evitar loguear múltiples veces el mismo error de containerWidth
	const hasLoggedWidthErrorRef = useRef(false);

	// 🔧 SOLUCIÓN PRINCIPAL: Usar los hooks para separar la lógica con manejo robusto
	const {
		parentRef,
		parentCallbackRef,
		loadMoreRef,
		containerWidth,
		isTransitioning,
		handleScroll,
		debouncedLoadThumbnails,
		forceRecalcWidth,
	} = useGridView({
		viewMode,
		isResizing,
		loadMoreItems,
	});

	// 🛡️ Sistema de medición robusta adicional para casos extremos
	const [isMeasuring, setIsMeasuring] = useState(true);
	const [forceRender, setForceRender] = useState(0);
	const measurementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const measurementAttemptsRef = useRef(0);
	const MAX_MEASUREMENT_ATTEMPTS = 10;
	const MEASUREMENT_DELAY_INCREMENT = 50;

	// Debug: Mostrar cambios en containerWidth e isMeasuring
	useEffect(() => {
		gridLogger.debug(`🔧 Estado actualizado - containerWidth: ${containerWidth}, isMeasuring: ${isMeasuring}`);
	}, [containerWidth, isMeasuring]);

	// 🎯 Función simplificada para medición del contenedor cuando el hook falla
	const emergencyMeasureContainer = useCallback((node: HTMLDivElement | null, strategy: string): boolean => {
		if (!node) {
			gridLogger.debug(`${strategy}: Nodo no disponible`);
			return false;
		}

		const offsetWidth = node.offsetWidth;
		const rect = node.getBoundingClientRect();

		gridLogger.debug(`${strategy}: offsetWidth=${offsetWidth}, boundingWidth=${rect.width}`);

		if (offsetWidth > 0) {
			gridLogger.info(`✅ ${strategy}: Medición exitosa - ${offsetWidth}px`);
			setIsMeasuring(false);
			setForceRender((prev) => prev + 1); // Forzar re-render
			return true;
		}

		return false;
	}, []);
	// 🔄 Sistema de intentos progresivos de emergencia
	const attemptEmergencyMeasurement = useCallback(
		(node: HTMLDivElement | null, attempt = 1) => {
			const maxAttempts = 10;
			const delayIncrement = 50;

			if (!node || attempt > maxAttempts) {
				gridLogger.warn(`⚠️ Máximo de intentos alcanzado (${maxAttempts})`);
				setIsMeasuring(false);
				return;
			}

			measurementAttemptsRef.current = attempt;

			if (emergencyMeasureContainer(node, `Intento-${attempt}`)) {
				return; // Éxito
			}

			// Programar siguiente intento con delay incremental
			const delay = delayIncrement * attempt;
			measurementTimeoutRef.current = setTimeout(() => {
				attemptEmergencyMeasurement(node, attempt + 1);
			}, delay);
		},
		[emergencyMeasureContainer]
	); // 🔧 useLayoutEffect para el sistema de emergencia cuando containerWidth sigue siendo 0
	useLayoutEffect(() => {
		gridLogger.debug(`🔧 useLayoutEffect ejecutado - containerWidth: ${containerWidth}, isMeasuring: ${isMeasuring}`);

		// Solo activar el sistema de emergencia si containerWidth sigue siendo 0 después de un tiempo
		const emergencyTimer = setTimeout(() => {
			gridLogger.warn(
				`⏰ Timer de emergencia activado - containerWidth: ${containerWidth}, parentRef.current: ${!!parentRef.current}`
			);

			if ((!containerWidth || containerWidth <= 0) && parentRef.current) {
				gridLogger.warn('🚨 Activando sistema de medición de emergencia');
				attemptEmergencyMeasurement(parentRef.current);
			} else {
				gridLogger.debug('✅ No se necesita sistema de emergencia');
			}
		}, 500); // Esperar 500ms antes de activar emergencia

		return () => {
			clearTimeout(emergencyTimer);
			if (measurementTimeoutRef.current) {
				clearTimeout(measurementTimeoutRef.current);
			}
		};
	}, [containerWidth, attemptEmergencyMeasurement, parentRef, isMeasuring]);

	// 🧹 Cleanup general del componente
	useEffect(() => {
		return () => {
			if (measurementTimeoutRef.current) {
				clearTimeout(measurementTimeoutRef.current);
			}
		};
	}, []);

	// Resetear el flag de error cuando el containerWidth se vuelve válido
	useEffect(() => {
		if (containerWidth > 0 && hasLoggedWidthErrorRef.current) {
			hasLoggedWidthErrorRef.current = false;
			gridLogger.info(`✅ containerWidth calculado correctamente: ${containerWidth}px`);
		}
	}, [containerWidth]);

	// Hook para virtualización - ahora parentRef es un RefObject real
	const { columns, itemSize, virtualizer, calculateMasonryHeight } = useGridVirtualizer({
		items,
		parentRef,
		viewMode,
		containerWidth: containerWidth || 1200, // 🛡️ Fallback para evitar 0
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
			gridLogger.debug('🔄 Precarga global ya completada, omitiendo precarga local');
			entitiesPreloadedRef.current = true;
			return;
		}

		// Verificar si hay una precarga en progreso
		if (typeof window !== 'undefined' && window.entityPreloadInProgress) {
			gridLogger.debug('🔄 Precarga global en progreso, omitiendo precarga local');
			return;
		}

		// Verificar si ha pasado demasiado tiempo desde el inicio de la precarga
		if (typeof window !== 'undefined' && window.entityPreloadStartTime) {
			const elapsed = Date.now() - window.entityPreloadStartTime;
			if (elapsed > 5000) {
				// 5 segundos
				gridLogger.warn('⚠️ Detectada precarga bloqueada por más de 5 segundos, liberando precarga');
				window.entityPreloadInProgress = false;
				window.entityPreloadStartTime = undefined;
			}
		}

		const preloadEntities = async () => {
			try {
				gridLogger.debug('🔄 Iniciando precarga de entidades desde FileBrowser');
				entitiesPreloadedRef.current = true;

				// Marcar precarga en progreso
				if (typeof window !== 'undefined') {
					window.entityPreloadInProgress = true;
					window.entityPreloadStartTime = Date.now();
				}

				await loadEntityData('tags');
				gridLogger.debug('✅ Precarga de entidades completada desde FileBrowser');

				// Marcar precarga como completa
				if (typeof window !== 'undefined') {
					window.entityPreloadComplete = true;
					window.entityPreloadInProgress = false;
					window.entityPreloadStartTime = undefined;
				}
			} catch (error) {
				gridLogger.error('❌ Error en precarga de entidades desde FileBrowser:', error);
				entitiesPreloadedRef.current = false;

				// Liberar flag de precarga en progreso
				if (typeof window !== 'undefined') {
					window.entityPreloadInProgress = false;
					window.entityPreloadStartTime = undefined;
				}
			}
		};

		preloadEntities();
	}, [loadEntityData]); // Función memoizada para mapear FileItem a ImageItem
	const mapFileItemToImageItem = useCallback((fileItem: FileItem): ImageItem => {
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

		// Usar dimensiones del resource si están disponibles y no se encontraron otras
		if ((!width || !height) && resource?.dimensions) {
			width = resource.dimensions.width;
			height = resource.dimensions.height;
		}

		// Determinar la URL de la miniatura en orden de prioridad
		let thumbnailUrl: string | null = null;

		// 1. Usar thumbnail del resource store si está disponible
		if (resource?.thumbnail && typeof resource.thumbnail === 'string') {
			thumbnailUrl = resource.thumbnail;
		}
		// 2. Usar imageUrl si está disponible (FileItem puede tener imageUrl)
		else if ('imageUrl' in fileItem && fileItem.imageUrl && typeof fileItem.imageUrl === 'string') {
			thumbnailUrl = fileItem.imageUrl;
		}
		// 3. Construir URL de API si tenemos el path
		else if (fileItem.path) {
			thumbnailUrl = `/api/images/${fileItem.id}`;
		}

		gridLogger.debug(
			`Mapped item: ${fileItem.id}, finalSrc: ${thumbnailUrl}, dimensions: ${width || 0}x${height || 0}`
		);

		// Crear un objeto ImageItem compatible con FileViewer
		return {
			id: fileItem.id,
			name: fileItem.name,
			src: thumbnailUrl,
			width: width || null,
			height: height || null,
			thumbnail: thumbnailUrl,
			type: fileItem.type || 'image',
			path: fileItem.path || '',
			size: fileItem.size || 0,
			url: thumbnailUrl || undefined,
			alt: fileItem.name,
			mimeType: fileItem.type,
			metadata: fileItem.metadata,
			parsedMetadata: fileItem.metadata
				? (() => {
						try {
							const parsed = typeof fileItem.metadata === 'string' ? JSON.parse(fileItem.metadata) : fileItem.metadata;
							return {
								dimensions: parsed?.dimensions || { width: width || 0, height: height || 0 },
								mimeType: fileItem.type,
								isLocal: true,
							};
						} catch {
							return {
								dimensions: { width: width || 0, height: height || 0 },
								mimeType: fileItem.type,
								isLocal: true,
							};
						}
					})()
				: undefined,
		} as ImageItem;
	}, []);

	// Mantenemos una referencia al último array de processedItems para la estabilidad referencial de las dimensiones
	const processedItemsRef = useRef<ImageItem[]>([]);
	// Mapeamos los items de entrada para pasarlos al virtualizador y las vistas
	const processedItems = useMemo(
		() => items.map((item) => mapFileItemToImageItem(item)),
		[items, mapFileItemToImageItem]
	);

	// Actualizar la referencia del último array de processedItems
	useEffect(() => {
		processedItemsRef.current = processedItems;
	}, [processedItems]); // Hook para manejar la visibilidad del panel de detalles y el item seleccionado
	useEffect(() => {
		if (selectedItems.length > 0) {
			setVisible(true);
			// Simplificar los items para el panel de detalles - solo usar las propiedades básicas
			const simplifiedItems = selectedItems.map((item) => ({
				id: item.id,
				name: item.name,
				type: item.type || 'image',
				path: item.path || '',
				size: item.size || 0,
				metadata: item.metadata,
			}));
			setSelectedItems(simplifiedItems as any); // Usar 'as any' temporalmente para evitar conflictos de tipos
		} else {
			setVisible(false);
			setSelectedItems([]);
		}
	}, [selectedItems, setVisible, setSelectedItems]);

	// Efecto para la carga de miniaturas cuando los items visibles cambian
	useEffect(() => {
		// Solo proceder si tenemos un virtualizer válido y containerWidth
		if (!virtualizer || !virtualizer.getVirtualItems || typeof containerWidth !== 'number') {
			gridLogger.error('❌ virtualizer no está inicializado o no tiene getVirtualItems.');
			return;
		}

		if (!containerWidth || containerWidth <= 0) {
			gridLogger.warn('⚠️ containerWidth inválido, omitiendo carga de miniaturas.');
			return;
		}

		const virtualItems = virtualizer.getVirtualItems();
		if (!Array.isArray(virtualItems) || virtualItems.length === 0) {
			gridLogger.warn('⚠️ virtualItems vacío o no es array, omitiendo carga de miniaturas.');
			return;
		}

		// Obtener los ítems actualmente visibles del virtualizador, asegurándonos de que son `FileItem`
		const currentVisibleItems = virtualItems
			.map((virtualItem) => items[virtualItem.index])
			.filter((item): item is FileItem => !!item); // Filtrar nulos/undefined y asegurar el tipo

		// Cargar miniaturas para los items visibles usando la función debounced
		if (currentVisibleItems.length > 0) {
			debouncedLoadThumbnails(currentVisibleItems);
		}
	}, [debouncedLoadThumbnails, virtualizer, items, containerWidth]);

	// Función para manejar el clic en un ítem (simple click)
	const handleItemClick = useCallback(
		(item: FileItem) => {
			if (selectedFileIds.includes(item.id)) {
				// Si ya está seleccionado, deseleccionar todo y seleccionar solo este
				deselectAllFiles();
				selectFile(item.id);
			} else {
				// Si no está seleccionado, deseleccionar todo y seleccionar este
				deselectAllFiles();
				selectFile(item.id);
			}

			// Llamar al callback externo si existe
			if (onItemClick) {
				onItemClick(item);
			}
		},
		[selectedFileIds, deselectAllFiles, selectFile, onItemClick]
	);

	// Función para manejar el doble clic en un ítem
	const handleItemDoubleClick = useCallback(
		(item: FileItem) => {
			// Llamar al callback externo si existe
			if (onItemDoubleClick) {
				onItemDoubleClick(item);
			} else {
				// Comportamiento por defecto: abrir en el visor de imágenes
				// gridLogger.debug('Abriendo visor de imágenes...'); // Comentado

				// Filtrar solo las imágenes válidas para el visor
				const filteredImages = processedItems.filter((img) => img.src?.startsWith('/api/images/')) as ImageItem[];
				const initialIndex = filteredImages.findIndex((img) => img.id === item.id);

				if (initialIndex !== -1) {
					setViewerImages(filteredImages);
					setViewerInitialIndex(initialIndex);
					setIsViewerOpen(true);
				}
			}
		},
		[onItemDoubleClick, processedItems]
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

	// Wrapper para toggleSelectFile que acepta un FileItem
	const handleToggleSelectFile = useCallback(
		(item: FileItem) => {
			toggleSelectFile(item.id);
		},
		[toggleSelectFile]
	);

	// Handler para las acciones del menú contextual
	const handleMenuAction = useCallback(
		(action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => {
			handleContextAction(action, item, data, handleItemDoubleClick, handleToggleSelectFile);
		},
		[handleItemDoubleClick, handleToggleSelectFile]
	);

	const ViewComponent = VIEW_COMPONENT_MAP[viewMode as keyof typeof VIEW_COMPONENT_MAP];

	// 🛡️ Validaciones de seguridad antes del render
	if (!items || items.length === 0 || !processedItems || processedItems.length === 0) {
		gridLogger.warn('⚠️ No hay items válidos para renderizar el grid.');
		return (
			<EmptyState
				icon={FileTextIcon}
				title="No hay archivos para mostrar"
				description="Parece que no hay archivos en esta ubicación o no se encontraron resultados para tu búsqueda."
			/>
		);
	}
	// 🛡️ Protección robusta: fallback visual y logs controlados para containerWidth inválido
	if (
		(isMeasuring && measurementAttemptsRef.current < MAX_MEASUREMENT_ATTEMPTS) ||
		!containerWidth ||
		Number.isNaN(containerWidth) ||
		containerWidth <= 0
	) {
		gridLogger.warn('🚨 DEBUGGING - Activando fallback visual:', {
			isMeasuring,
			measurementAttempts: measurementAttemptsRef.current,
			maxAttempts: MAX_MEASUREMENT_ATTEMPTS,
			containerWidth,
			isNaN: Number.isNaN(containerWidth),
		});

		// Diagnóstico detallado del contenedor padre
		const realWidth = parentRef && 'current' in parentRef && parentRef.current ? parentRef.current.offsetWidth : 'N/A';
		const realHeight =
			parentRef && 'current' in parentRef && parentRef.current ? parentRef.current.offsetHeight : 'N/A';
		const parentClasses =
			parentRef && 'current' in parentRef && parentRef.current ? parentRef.current.className : 'N/A';
		const hasParent = !!(parentRef && 'current' in parentRef && parentRef.current?.parentElement);
		const parentParentClasses =
			hasParent && parentRef && 'current' in parentRef && parentRef.current?.parentElement
				? parentRef.current.parentElement.className
				: 'N/A';

		if (!hasLoggedWidthErrorRef.current && !isMeasuring) {
			gridLogger.error(`❌ containerWidth inválido: ${containerWidth}`);
			gridLogger.error('📊 Diagnóstico detallado del contenedor:');
			gridLogger.error(`   - offsetWidth real: ${realWidth}px`);
			gridLogger.error(`   - offsetHeight real: ${realHeight}px`);
			gridLogger.error(`   - className del div: "${parentClasses}"`);
			gridLogger.error(`   - tiene padre: ${hasParent}`);
			gridLogger.error(`   - className del padre: "${parentParentClasses}"`);
			hasLoggedWidthErrorRef.current = true;
		}

		// Determinar el mensaje de estado
		const statusMessage = isMeasuring ? 'Midiendo contenedor...' : 'Calculando layout...';

		const detailMessage = isMeasuring
			? `Intento ${measurementAttemptsRef.current + 1}/${MAX_MEASUREMENT_ATTEMPTS}`
			: `containerWidth: ${containerWidth}`;

		// Mostrar Skeleton y FlickeringGrid como feedback visual mientras se calcula el ancho
		return (
			<div className="flex flex-col items-center justify-center h-full w-full gap-4">
				<div className="w-full max-w-5xl h-72 flex items-center justify-center relative">
					{/* Skeleton animado para simular el grid */}
					<Skeleton className="w-full h-full rounded-xl" />
					<div className="absolute inset-0 pointer-events-none opacity-80">
						<FlickeringGrid squareSize={16} gridGap={12} maxOpacity={0.18} />
					</div>
				</div>
				<div className="text-xs text-muted-foreground text-center">
					{statusMessage}
					<br />
					<code>{detailMessage}</code>
					<br />
					<code>ancho real del div padre: {realWidth}</code>
				</div>
				{!isMeasuring && (
					<button
						type="button"
						className="mt-2 px-3 py-1 rounded bg-muted text-xs hover:bg-accent border"
						onClick={() => {
							hasLoggedWidthErrorRef.current = false; // Permitir re-log si vuelve a fallar
							measurementAttemptsRef.current = 0; // Reiniciar contador
							setIsMeasuring(true); // Iniciar nuevo ciclo de medición
							forceRecalcWidth(); // Intentar recálculo desde useGridView
							if (parentRef.current) {
								attemptEmergencyMeasurement(parentRef.current); // Y también desde el sistema de emergencia
							}
						}}
					>
						Reintentar cálculo
					</button>
				)}
			</div>
		);
	}

	// Protección extra: si el virtualizer no está bien inicializado, evitar renderizar el grid
	if (
		!virtualizer ||
		typeof virtualizer.getTotalSize !== 'function' ||
		Number.isNaN(virtualizer.getTotalSize()) ||
		virtualizer.getTotalSize() < 0
	) {
		gridLogger.error('❌ Virtualizer no está correctamente inicializado o devuelve tamaño inválido.');
		return (
			<EmptyState
				icon={FileTextIcon}
				title="Error en la visualización"
				description="Ocurrió un error al inicializar la vista de archivos. Intenta recargar la página."
			/>
		);
	}

	// 🎯 RENDER PRINCIPAL - Aquí el containerWidth ya es válido
	return (
		<div
			ref={parentCallbackRef} // 🔧 Usar el callback ref del hook para configurar ResizeObserver
			className="h-full w-full min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden"
		>
			{' '}
			{/* Visor de imágenes */}
			{isViewerOpen && (
				<FileViewer
					isOpen={isViewerOpen}
					images={viewerImages}
					initialIndex={viewerInitialIndex}
					onClose={() => setIsViewerOpen(false)}
				/>
			)}
			<div onScroll={handleScroll} className="h-full overflow-y-auto scroll-smooth">
				<div
					style={{
						height: `${virtualizer.getTotalSize()}px`,
						width: '100%',
						position: 'relative',
					}}
				>
					{virtualizer.getVirtualItems().map((virtualItem) => {
						const originalItem = items[virtualItem.index];
						const processedItem = processedItems[virtualItem.index];

						if (!originalItem || !processedItem) {
							return null;
						}

						const isSelected = selectedFileIds.includes(originalItem.id);
						const currentGap = GRID_CONFIG.gap[viewMode as keyof GridGaps];
						const xOffset = (virtualItem.index % columns) * (itemSize + currentGap);
						const commonProps = {
							item: originalItem, // Usar FileItem directamente en lugar de ImageItem
							isSelected,
							onClick: () => handleItemClick(originalItem),
							onDoubleClick: () => handleItemDoubleClick(originalItem),
							onContextMenu: () => handleContextMenu(originalItem),
							onContextAction: handleMenuAction,
							itemSize: itemSize,
							style: {
								position: 'absolute' as const,
								top: 0,
								left: 0,
								transform: `translateX(${xOffset}px) translateY(${virtualItem.start}px)`,
								width: itemSize,
								height:
									viewMode === 'masonry' ? calculateMasonryHeight(originalItem as any, itemSize) : virtualItem.size,
							},
						};

						return <ViewComponent key={`${originalItem.id}-${virtualItem.index}`} {...commonProps} />;
					})}
				</div>

				{/* Elemento para scroll infinito */}
				{loadMoreItems && <div ref={loadMoreRef} className="h-4" />}
			</div>
		</div>
	);
};

// Exportar versión memoizada del componente
export const FileBrowser = memo(FileBrowserComponent);
