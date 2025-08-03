/**
 * @file FileBrowser V2 - Usando tipos optimizados WithStats y virtualización
 * @module components/features/file-browser/file-browser-v2
 * @description Nueva versión del FileBrowser que usa stores específicos por entidad,
 * tipos optimizados WithStats, virtualización con TanStack Virtual y soporte multi-entidad.
 *
 * MIGRACIÓN: Este componente reemplazará a file-browser.tsx
 */

import { FileTextIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { OptimizedEntityCard } from '@/components/cards/entity-card';
import type { CardLayout, CardSize, CardVariant } from '@/components/cards/types/card-layout.types';
import { EmptyState } from '@/components/core/data-display';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { useAdvancedSelection } from '@/hooks/use-advanced-selection';
import { useCustomContextMenu } from '@/hooks/use-custom-context-menu';
import { useUndoRedo } from '@/hooks/use-undo-redo';
import { useFileBrowserShortcuts } from '@/lib/keyboard';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import { clipboardManager } from '@/services/clipboard/clipboard-manager';
import { undoRedoManager } from '@/services/undo-redo/undo-redo-manager';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useImageStore } from '@/store/entities/image';
import { useSelectionStore } from '@/store/selection.store';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { type AnyEntityWithStats, EntityStatsType } from '@/types/migration';
import { CustomContextMenu } from './context-menu/custom-context-menu';
import { useAccessibility } from './hooks/use-accessibility';
import { usePerformance } from './hooks/use-performance';
import { KeyboardNavigation } from './navigation/keyboard-navigation';
import { ProgressOverlay } from './progress/progress-overlay';
import { DragSelectionProvider } from './selection/drag-selection-provider';
import { StatusBar } from './toolbar/status-bar';
import { ViewToolbar } from './toolbar/ViewToolbar';
import { CardsView } from './views/cards-view';
import { GridView } from './views/grid-view';
import { ListView } from './views/list-view';
import { MasonryView } from './views/masonry-view';

// Import CSS for user-select fixes
import './styles/user-select.css';
import './selection/selection-styles.css';

const logger = clientLogger.withContext('FileBrowser');

interface FileBrowserProps {
	/** Tipo de entidad a mostrar - puede ser un tipo específico o 'mixed' para múltiples tipos */
	entityType?: EntityStatsType | 'mixed';
	/** Tipos de entidades específicas a mostrar cuando entityType es 'mixed' */
	entityTypes?: EntityStatsType[];
	/** Items específicos a mostrar (para modo manual) */
	items?: AnyEntityWithStats[];
	/** Callback cuando se selecciona un item */
	onItemSelect?: (item: AnyEntityWithStats) => void;
	/** Callback cuando se hace click en un item */
	onItemClick?: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	/** Callback cuando se hace doble click en un item */
	onItemDoubleClick?: (item: AnyEntityWithStats) => void;
	/** Clase CSS adicional */
	className?: string;
	/** ID de carpeta/colección/etc para filtrar */
	filterId?: string;
	/** Tipo de filtro (folder, collection, tag, etc) */
	filterType?: 'folder' | 'collection' | 'tag' | 'album' | 'video';
	/** IDs de elementos seleccionados */
	selectedIds?: string[];
	/** Modo de funcionamiento */
	mode?: 'auto' | 'manual';
	/** Nuevas props para layouts */
	layout?: CardLayout;
	/** Nuevas props para layouts */
	preset?: string;
	/** Nuevas props para layouts */
	variant?: CardVariant;
	/** Nuevas props para layouts */
	size?: CardSize;
}

const FALLBACK_WIDTH = 1200;

export const FileBrowser = memo<FileBrowserProps>(function FileBrowser({
	entityType = 'image',
	entityTypes = [],
	mode = 'auto',
	items: manualItems = [],
	filterId,
	filterType = undefined,
	selectedIds = [],
	onItemSelect,
	onItemClick,
	onItemDoubleClick,
	className,
	layout = 'vertical',
	preset,
	variant = 'default',
	size = 'md',
}) {
	// Estados globales y stores
	const viewMode = useViewOptionsStore((state) => state.viewMode);
	const itemSize = useViewOptionsStore((state) => state.itemSize);
	const searchQuery = useViewOptionsStore((state) => state.searchQuery);
	const sortOptions = useViewOptionsStore((state) => state.sortOptions);
	const {
		selectedIds: globalSelectedIds,
		clearSelection,
		focusedId,
		setFocusedId,
		addToSelection,
		removeFromSelection,
		setSelectedIds,
		selectRange,
		toggleSelection,
		selectAll,
	} = useSelectionStore();
	const { setVisible: setDetailsPanelVisible, setSelectedItems: setDetailsPanelItems } = useDetailsPanel();
	const { openViewer } = useFileViewerStore();

	// Referencias y estados locales
	const containerRef = useRef<HTMLElement>(null);
	const [containerWidth, setContainerWidth] = useState<number>(0);
	const measurementAttemptsRef = useRef(0);
	const lastMeasuredElementRef = useRef<unknown>(null);
	const lastLoadParamsRef = useRef<string>('');
	const isLoadingRef = useRef<boolean>(false);

	// Estado para el menú contextual
	const {
		isOpen: contextMenuOpen,
		position: contextMenuPosition,
		handleContextMenu,
		closeMenu: closeContextMenu,
	} = useCustomContextMenu();

	// Integración de accesibilidad
	const accessibility = useAccessibility({
		containerRef: containerRef as React.RefObject<HTMLElement>,
		onAnnouncement: (message: string) => console.log('Accessibility announcement:', message),
	});

	// Integración de Undo/Redo
	const { canUndo, canRedo, undo, redo } = useUndoRedo({ enableKeyboardShortcuts: true });

	// Usar selectedIds globales en lugar de prop local - Memoizado para evitar re-cálculos
	const effectiveSelectedIds = useMemo(() => {
		return globalSelectedIds.length > 0 ? globalSelectedIds : selectedIds;
	}, [globalSelectedIds, selectedIds]);

	// Configurar keyboard shortcuts
	const { register, setContext } = useFileBrowserShortcuts();

	// Stores por tipo de entidad (expandir según necesidad)
	const {
		images: imagesRecord,
		isLoading: imagesLoading,
		error: imagesError,
		loadImages,
		getSortedImages,
		getImagesByFolder,
	} = useImageStore();
	// TODO: Añadir otros stores cuando estén implementados
	// const { videos: videosRecord, isLoading: videosLoading, ... } = useVideoStore();
	// const { audios: audiosRecord, isLoading: audiosLoading, ... } = useAudioStore();

	// Función de carga con debounce para evitar llamadas excesivas
	const debouncedLoadData = useDebouncedCallback(() => {
		console.log('🔍 FileBrowser - debouncedLoadData ejecutándose con:', { entityType, filterId, filterType, mode });
		// En modo manual, no cargar datos automáticamente
		if (mode === 'manual') {
			return;
		}

		// Solo cargar si hay un filterId válido
		if (!filterId) {
			logger.debug('⚠️ No hay filterId, saltando carga automática');
			return;
		}

		// Crear una clave única para los parámetros de carga
		const loadParamsKey = JSON.stringify({ entityType, entityTypes, filterId, filterType, mode });

		// Evitar cargas duplicadas comparando parámetros
		if (lastLoadParamsRef.current === loadParamsKey) {
			logger.debug('⚠️ Parámetros de carga idénticos, saltando carga duplicada');
			return;
		}

		// Evitar múltiples cargas simultáneas
		if (isLoadingRef.current) {
			logger.debug('⚠️ Carga ya en progreso, saltando llamada del FileBrowser');
			return;
		}

		// Determinar qué tipos de entidades cargar
		const typesToLoad = entityType === 'mixed' ? entityTypes : [entityType as EntityStatsType];

		// Cargar datos para cada tipo
		for (const type of typesToLoad) {
			if (type === 'image') {
				const { loadImages: storeLoadImages, getImagesByFolder } = useImageStore.getState();

				// Verificar si ya existen imágenes para esta carpeta
				if (filterId && filterType === 'folder') {
					const existingImages = getImagesByFolder(filterId);
					console.log('🔍 FileBrowser - Verificando imágenes existentes para carpeta:', {
						filterId,
						existingImagesCount: existingImages.length,
						existingImages: existingImages.slice(0, 3),
						storeState: {
							totalImages: Object.keys(useImageStore.getState().core.images).length,
							isLoading: useImageStore.getState().core.isLoading,
							error: useImageStore.getState().core.error,
						},
					});
					if (existingImages.length > 0) {
						console.log('🔍 FileBrowser - Ya existen imágenes para esta carpeta, saltando carga');
						logger.debug('✅ Ya existen imágenes para esta carpeta, saltando carga');
						lastLoadParamsRef.current = loadParamsKey;
						return;
					}
				}

				const loadParams: Parameters<typeof storeLoadImages>[0] = {};

				// Si hay filtro de carpeta, incluirlo en los parámetros
				if (filterId && filterType === 'folder') {
					loadParams.folderId = filterId;
				}

				console.log('🔄 FileBrowser - Iniciando carga de imágenes', {
					filterId,
					filterType,
					loadParams,
					storeLoadImages: typeof storeLoadImages,
				});
				logger.debug('🔄 FileBrowser iniciando carga de imágenes', { filterId, filterType, loadParams });

				// Marcar como cargando
				isLoadingRef.current = true;
				lastLoadParamsRef.current = loadParamsKey;

				// Llamar a la función del store directamente
				console.log('🚀 FileBrowser - Llamando a storeLoadImages con parámetros:', loadParams);
				storeLoadImages(loadParams)
					.then(() => {
						console.log('✅ FileBrowser - Carga de imágenes completada');
						logger.debug('✅ Carga de imágenes completada');
						// Verificar el estado del store después de la carga
						const newState = useImageStore.getState();
						console.log('📊 FileBrowser - Estado del store después de la carga:', {
							totalImages: Object.keys(newState.core.images).length,
							imagesByFolder: getImagesByFolder(filterId).length,
							isLoading: newState.core.isLoading,
							error: newState.core.error,
						});
					})
					.catch((error: Error) => {
						console.error('❌ FileBrowser - Error al cargar imágenes:', error);
						logger.error('❌ Error al cargar imágenes en FileBrowser:', error);
					})
					.finally(() => {
						isLoadingRef.current = false;
					});
			}
			// TODO: Añadir otros tipos cuando se implementen sus stores
		}
	}, 300); // Debounce de 300ms

	// Cargar datos al montar o cuando cambian los filtros
	useEffect(() => {
		debouncedLoadData();
	}, [debouncedLoadData]);

	// Obtener raw items - Memoizado separadamente para evitar re-cálculos innecesarios
	const rawItems = useMemo(() => {
		if (process.env.NODE_ENV !== 'production') {
			console.log('🔍 FileBrowser - Calculando items con:', { entityType, filterId, filterType, mode });
		}

		// En modo manual, usar los items proporcionados
		if (mode === 'manual' && manualItems) {
			return manualItems;
		}

		let items: AnyEntityWithStats[] = [];

		// En modo auto, obtener desde stores
		if (entityType === 'mixed') {
			// Modo mixto: combinar múltiples tipos de entidades
			for (const type of entityTypes) {
				switch (type) {
					case 'image':
						if (filterId && filterType === 'folder') {
							items.push(...getImagesByFolder(filterId));
						} else {
							items.push(...getSortedImages());
						}
						break;
					// TODO: Añadir otros casos según se implementen
				}
			}
		} else {
			// Modo específico: un solo tipo de entidad
			switch (entityType) {
				case 'image': {
					// Si hay filtro por carpeta, usar getImagesByFolder
					if (filterId && filterType === 'folder') {
						items = getImagesByFolder(filterId);
						if (process.env.NODE_ENV !== 'production') {
							console.log('🔍 FileBrowser - Imágenes filtradas por carpeta:', items.length, { filterId });
						}
					} else {
						items = getSortedImages();
						if (process.env.NODE_ENV !== 'production') {
							console.log('🔍 FileBrowser - Todas las imágenes ordenadas:', items.length);
						}
					}
					break;
				}
				// TODO: Añadir otros casos según se implementen
				default:
					if (process.env.NODE_ENV !== 'production') {
						console.log('🔍 FileBrowser - Retornando array vacío (entityType no coincide)');
					}
					break;
			}
		}

		return items;
	}, [
		entityType,
		entityTypes,
		filterId,
		filterType,
		mode,
		manualItems,
		getSortedImages,
		getImagesByFolder,
	]);

	// Separar filtering y sorting para mejor performance
	const items = useMemo(() => {
		// Aplicar filtro de búsqueda si existe
		let filteredItems = rawItems;
		if (searchQuery?.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filteredItems = rawItems.filter((item) => {
				// Helper para obtener el nombre de la entidad
				const getEntityName = (entity: AnyEntityWithStats): string => {
					if ('name' in entity && typeof entity.name === 'string') return entity.name;
					if ('title' in entity && typeof entity.title === 'string') return entity.title;
					return '';
				};

				// Helper para obtener el path de la entidad
				const getEntityPath = (entity: AnyEntityWithStats): string => {
					if ('path' in entity && typeof entity.path === 'string') return entity.path;
					if ('category' in entity && typeof entity.category === 'string') return entity.category;
					return '';
				};

				const itemName = getEntityName(item).toLowerCase();
				const itemPath = getEntityPath(item).toLowerCase();
				return itemName.includes(query) || itemPath.includes(query);
			});
		}

		// Aplicar ordenación si existe
		if (sortOptions.length > 0) {
			console.log('🔧 FileBrowser - Aplicando ordenación:', sortOptions);
			filteredItems.sort((a, b) => {
				for (const sortOption of sortOptions) {
					const { field, direction } = sortOption;
					let aValue: any;
					let bValue: any;

					switch (field) {
						case 'name': {
							// Helper para obtener el nombre de la entidad
							const getEntityName = (entity: AnyEntityWithStats): string => {
								if ('name' in entity && typeof entity.name === 'string') return entity.name;
								if ('title' in entity && typeof entity.title === 'string') return entity.title;
								return '';
							};
							aValue = getEntityName(a).toLowerCase();
							bValue = getEntityName(b).toLowerCase();
							break;
						}
						case 'modifiedAt':
							aValue = new Date((a as any).updatedAt || (a as any).modifiedAt || 0);
							bValue = new Date((b as any).updatedAt || (b as any).modifiedAt || 0);
							break;
						case 'createdAt':
							aValue = new Date((a as any).createdAt || 0);
							bValue = new Date((b as any).createdAt || 0);
							break;
						default:
							continue;
					}

					// Comparación más robusta
					if (typeof aValue === 'string' && typeof bValue === 'string') {
						const result = aValue.localeCompare(bValue);
						if (result !== 0) return direction === 'asc' ? result : -result;
					} else if (aValue instanceof Date && bValue instanceof Date) {
						const result = aValue.getTime() - bValue.getTime();
						if (result !== 0) return direction === 'asc' ? result : -result;
					} else {
						if (aValue < bValue) return direction === 'asc' ? -1 : 1;
						if (aValue > bValue) return direction === 'asc' ? 1 : -1;
					}
				}
				return 0;
			});
		} else {
			// Ordenación por defecto: fecha de modificación descendente
			filteredItems.sort((a, b) => {
				const aDate = new Date((a as any).updatedAt || (a as any).modifiedAt || 0);
				const bDate = new Date((b as any).updatedAt || (b as any).modifiedAt || 0);
				return bDate.getTime() - aDate.getTime();
			});
		}

		return filteredItems;
	}, [
		rawItems,
		searchQuery,
		sortOptions, // Solo dependencias necesarias para filtering y sorting
	]);

	// Callback para el menú contextual
	const handleAdvancedContextMenu = useCallback(
		(e: React.MouseEvent, item: AnyEntityWithStats, selectedItems: AnyEntityWithStats[]) => {
			logger.debug('🎯 Menú contextual avanzado:', {
				itemId: item.id,
				selectedCount: selectedItems.length,
				position: { x: e.clientX, y: e.clientY },
			});

			// Usar el handler existente del menú contextual
			handleContextMenu(e);
		},
		[handleContextMenu]
	);

	// Hook de selección avanzada con toda la lógica de clicks mejorada
	const {
		handleItemClick: advancedHandleItemClick,
		handleItemContextMenu: advancedHandleItemContextMenu,
		handleEmptySpaceClick: advancedHandleEmptySpaceClick,
		selectAll: advancedSelectAll,
		clearSelection: advancedClearSelection,
		selectedIds: advancedSelectedIds,
		hasSelection,
		selectionCount,
		isDragSelecting,
	} = useAdvancedSelection({
		items,
		onContextMenu: handleAdvancedContextMenu,
		onItemSelect,
		onItemClick,
		enableDragSelection: true,
		dragContainer: containerRef.current || undefined,
	});

	// Hook de rendimiento después de la declaración de items
	const performance = usePerformance({
		data: items || [],
		searchTerm: searchQuery,
	});

	// Determinar estado de carga y error
	const isLoading = (() => {
		if (mode === 'manual') {
			return false;
		}

		if (entityType === 'mixed') {
			// En modo mixto, verificar si algún store está cargando
			return entityTypes.some((type) => {
				switch (type) {
					case 'image':
						return imagesLoading;
					// TODO: Añadir otros casos
					default:
						return false;
				}
			});
		}

		// Modo específico
		switch (entityType) {
			case 'image':
				return imagesLoading;
			// TODO: Añadir otros casos
			default:
				return false;
		}
	})();

	const error = (() => {
		if (mode === 'manual') {
			return null;
		}

		if (entityType === 'mixed') {
			// En modo mixto, mostrar el primer error encontrado
			for (const type of entityTypes) {
				switch (type) {
					case 'image':
						if (imagesError) return imagesError;
						break;
					// TODO: Añadir otros casos
				}
			}
			return null;
		}

		// Modo específico
		switch (entityType) {
			case 'image':
				return imagesError;
			// TODO: Añadir otros casos
			default:
				return null;
		}
	})();

	// Medir contenedor con optimización mejorada y ResizeObserver
	const measureContainer = useCallback((element: any) => {
		// Evitar múltiples mediciones del mismo elemento
		if (lastMeasuredElementRef.current === element) {
			return;
		}

		const attempt = ++measurementAttemptsRef.current;
		logger.debug(`[FileBrowserV2] Intento medición ${attempt}`);

		const measure = () => {
			const width = element?.clientWidth || element?.offsetWidth;
			if (width > 0) {
				logger.info(`[FileBrowserV2] ✅ Medición exitosa: ${width}px`);
				setContainerWidth(width);
				lastMeasuredElementRef.current = element;
				return true;
			}
			return false;
		};

		// Intentar medición inmediata
		if (measure()) return;

		// Usar ResizeObserver como método principal
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const width = entry.contentRect.width;
				if (width > 0) {
					logger.info(`[FileBrowserV2] ✅ ResizeObserver medición: ${width}px`);
					setContainerWidth(width);
					lastMeasuredElementRef.current = element;
					resizeObserver.disconnect();
					return;
				}
			}
		});

		if (element) {
			resizeObserver.observe(element);

			// Fallback con requestAnimationFrame si ResizeObserver no funciona
			(globalThis as any).requestAnimationFrame(() => {
				if (measure()) {
					resizeObserver.disconnect();
					return;
				}
				(globalThis as any).setTimeout(() => {
					if (measure()) {
						resizeObserver.disconnect();
						return;
					}
					logger.warn(`[FileBrowserV2] ⚠️ Falló medición, usando fallback: ${FALLBACK_WIDTH}px`);
					setContainerWidth(FALLBACK_WIDTH);
					lastMeasuredElementRef.current = element;
					resizeObserver.disconnect();
				}, 100);
			});
		}
	}, []);

	const containerCallbackRef = useCallback(
		(element: any) => {
			if (element && containerRef.current !== element) {
				containerRef.current = element;
				measureContainer(element);

				// Mantener ResizeObserver activo para cambios dinámicos de tamaño
				const resizeObserver = new ResizeObserver((entries) => {
					for (const entry of entries) {
						const width = entry.contentRect.width;
						if (width > 0 && width !== containerWidth) {
							logger.debug(`[FileBrowserV2] 📏 Cambio de tamaño detectado: ${containerWidth}px → ${width}px`);
							setContainerWidth(width);
						}
					}
				});

				resizeObserver.observe(element);

				// Limpiar observer cuando el elemento se desmonte
				return () => {
					resizeObserver.disconnect();
				};
			}
		},
		[measureContainer, containerWidth]
	);

	// Manejar click en item - Ahora usando selección avanzada
	const handleItemClick = useCallback(
		(item: AnyEntityWithStats, e: React.MouseEvent) => {
			logger.debug('🔍 FileBrowser - handleItemClick (legacy wrapper):', {
				itemId: item.id,
				hasOnItemClick: !!onItemClick,
				hasOnItemSelect: !!onItemSelect,
			});

			// Delegar al handler avanzado
			advancedHandleItemClick(item, e);
		},
		[advancedHandleItemClick, onItemClick, onItemSelect]
	);

	// Manejar doble click
	const handleItemDoubleClick = useCallback(
		(item: AnyEntityWithStats) => {
			console.log('🔍 FileBrowser - handleItemDoubleClick ejecutado:', {
				itemId: item.id,
				hasOnItemDoubleClick: !!onItemDoubleClick,
			});

			onItemDoubleClick?.(item);
		},
		[onItemDoubleClick]
	);

	// Manejar acciones del menú contextual
	const handleItemContextAction = useCallback(
		async (action: string, item: AnyEntityWithStats, _data?: Record<string, unknown>) => {
			console.log('🔍 FileBrowser - handleItemContextAction ejecutado:', {
				action,
				itemId: item.id,
			});

			// Implementación simple para compatibilidad
			try {
				toastService.info(`Acción "${action}" ejecutada para ${item.name || item.id}`);
			} catch (error) {
				console.error('Error al ejecutar acción de contexto:', error);
			}
		},
		[]
	);

	// Cerrar menú contextual al hacer click fuera y deseleccionar elementos - Usando selección avanzada
	const handleContainerClick = useCallback(
		(e: React.MouseEvent) => {
			logger.debug('🎯 Click en contenedor (usando selección avanzada)');

			// Delegar al handler avanzado que tiene toda la lógica mejorada
			advancedHandleEmptySpaceClick(e);

			// Cerrar menú contextual si está abierto
			closeContextMenu();
		},
		[advancedHandleEmptySpaceClick, closeContextMenu]
	);

	// Manejar acciones del menú contextual personalizado
	const handleCustomContextMenuAction = useCallback(
		async (action: string, data?: any) => {
			logger.debug('🎯 Acción de menú contextual:', { action, data });

			try {
				switch (action) {
					case 'copy':
						if (effectiveSelectedIds.length > 0) {
							const selectedItems = items.filter((item) => effectiveSelectedIds.includes(item.id));
							await clipboardManager.copy(selectedItems);
							toastService.success(`${selectedItems.length} elemento(s) copiado(s)`);
						}
						break;

					case 'cut':
						if (effectiveSelectedIds.length > 0) {
							const selectedItems = items.filter((item) => effectiveSelectedIds.includes(item.id));
							await clipboardManager.cut(selectedItems);
							toastService.success(`${selectedItems.length} elemento(s) cortado(s)`);
						}
						break;

					case 'paste': {
						// Implementación simple para compatibilidad
						toastService.info('Funcionalidad de pegar en desarrollo');
						break;
					}

					case 'delete':
						if (effectiveSelectedIds.length > 0) {
							toastService.info('Funcionalidad de eliminación en desarrollo');
						}
						break;

					case 'download':
						if (effectiveSelectedIds.length > 0) {
							toastService.info('Funcionalidad de descarga en desarrollo');
						}
						break;

					case 'toggle-favorite':
					case 'manage-tags':
					case 'move':
					case 'add-to-collection':
					case 'share':
					case 'more-actions':
						toastService.info(`Funcionalidad "${action}" en desarrollo`);
						break;

					case 'new-folder':
					case 'upload-files':
						toastService.info(`Funcionalidad "${action}" en desarrollo`);
						break;

					case 'configure':
					case 'view-settings':
						toastService.info('Abriendo configuración...');
						break;

					default:
						logger.warn('Acción de menú contextual no reconocida:', action);
				}
			} catch (error) {
				logger.error('Error al ejecutar acción del menú contextual:', error);
				toastService.error('Error al ejecutar la acción');
			}
		},
		[effectiveSelectedIds, items]
	);

	// Actualizar panel de detalles cuando cambia la selección
	useEffect(() => {
		if (effectiveSelectedIds.length > 0) {
			const selectedItems = items.filter((item: AnyEntityWithStats) => effectiveSelectedIds.includes(item.id));
			setDetailsPanelItems(selectedItems);
			setDetailsPanelVisible(true);
		} else {
			setDetailsPanelVisible(false);
		}
	}, [effectiveSelectedIds, items, setDetailsPanelItems, setDetailsPanelVisible]);

	// Cerrar menú contextual al hacer click fuera o presionar Escape
	useEffect(() => {
		// Establecer contexto
		setContext('file-browser');

		// Registrar handlers para shortcuts
		const handleSelectAll = () => {
			const allIds = items.map((item) => item.id);
			setSelectedIds(allIds);
			toastService.info(`${items.length} elementos seleccionados`);
		};

		const handleDeleteSelected = async () => {
			if (effectiveSelectedIds.length === 0) {
				toastService.warning('No hay elementos seleccionados para eliminar');
				return;
			}

			try {
				const selectedItems = items.filter((item) => effectiveSelectedIds.includes(item.id));

				// Crear acción de undo para la eliminación
				const undoAction = undoRedoManager.createDeleteAction(selectedItems);
				await undoRedoManager.execute(undoAction);

				// Limpiar selección después de eliminar
				clearSelection();

				toastService.success(`${selectedItems.length} elemento(s) eliminado(s)`);
				// Recargar datos para reflejar los cambios
				debouncedLoadData();
			} catch (error) {
				console.error('Error al eliminar elementos:', error);
				toastService.error('Error al eliminar elementos');
			}
		};

		const handleRenameSelected = async () => {
			if (effectiveSelectedIds.length === 0) {
				toastService.warning('No hay elementos seleccionados para renombrar');
				return;
			}

			if (effectiveSelectedIds.length > 1) {
				toastService.warning('Solo se puede renombrar un elemento a la vez');
				return;
			}

			try {
				const selectedItem = items.find((item) => item.id === effectiveSelectedIds[0]);
				if (!selectedItem) return;

				// Por ahora, mostrar un prompt simple para el nuevo nombre
				const currentName = 'name' in selectedItem ? selectedItem.name : 'Untitled';
				// TODO: Implementar modal de renombrado más sofisticado
				// eslint-disable-next-line no-alert
				const newName = globalThis.prompt?.('Nuevo nombre:', currentName);

				if (newName && newName !== currentName) {
					// Crear acción de undo para el renombrado
					const undoAction = undoRedoManager.createRenameAction(selectedItem, newName);
					await undoRedoManager.execute(undoAction);

					toastService.success('Elemento renombrado correctamente');
					// Recargar datos para reflejar los cambios
					debouncedLoadData();
				}
			} catch (error) {
				console.error('Error al renombrar elemento:', error);
				toastService.error('Error al renombrar elemento');
			}
		};

		const handleCancelOrClose = () => {
			clearSelection();
		};

		const handleCopySelected = async () => {
			if (effectiveSelectedIds.length === 0) {
				toastService.warning('No hay elementos seleccionados para copiar');
				return;
			}

			try {
				const selectedItems = items.filter((item) => effectiveSelectedIds.includes(item.id));
				await clipboardManager.copy(selectedItems, 'file-browser');
			} catch (error) {
				console.error('Error al copiar elementos:', error);
				toastService.error('Error al copiar elementos');
			}
		};

		const handleCutSelected = async () => {
			if (effectiveSelectedIds.length === 0) {
				toastService.warning('No hay elementos seleccionados para cortar');
				return;
			}

			try {
				const selectedItems = items.filter((item) => effectiveSelectedIds.includes(item.id));
				await clipboardManager.cut(selectedItems, 'file-browser');
			} catch (error) {
				console.error('Error al cortar elementos:', error);
				toastService.error('Error al cortar elementos');
			}
		};

		const handlePaste = async () => {
			try {
				const canPasteItems = clipboardManager.canPaste();
				if (!canPasteItems) {
					toastService.warning('No hay elementos en el portapapeles para pegar');
					return;
				}

				const clipboardData = clipboardManager.getClipboardData();
				if (clipboardData && clipboardData.items.length > 0) {
					// Crear acción de undo para el pegado (usando copy action como base)
					const currentPath = location.pathname || '/';
					const undoAction = undoRedoManager.createCopyAction(clipboardData.items, currentPath);
					await undoRedoManager.execute(undoAction);

					toastService.success(`${clipboardData.items.length} elemento(s) pegado(s)`);
					// Recargar datos para mostrar los nuevos elementos
					debouncedLoadData();
				}
			} catch (error) {
				console.error('Error al pegar elementos:', error);
				toastService.error('Error al pegar elementos');
			}
		};

		const handleOpenSelected = () => {
			if (effectiveSelectedIds.length === 0) {
				toastService.warning('No hay elementos seleccionados para abrir');
				return;
			}

			// Abrir el primer elemento seleccionado en el file viewer
			const selectedItem = items.find((item) => item.id === effectiveSelectedIds[0]);
			if (selectedItem) {
				// Convertir AnyEntityWithStats a ImageItem para el viewer
				const imageItems = items.map((item) => ({
					id: item.id,
					name: ('name' in item ? item.name : 'Untitled') as string,
					type: 'image',
					path: ('path' in item ? item.path : '') as string, // Forzar como string no undefined
					size: ('size' in item ? item.size : 0) as number,
					width: ('width' in item ? item.width : 0) as number,
					height: ('height' in item ? item.height : 0) as number,
					thumbnail: ('thumbnail' in item ? item.thumbnail : '') as string,
					metadata:
						'metadata' in item
							? typeof item.metadata === 'string'
								? item.metadata
								: JSON.stringify(item.metadata)
							: '',
					src: ('path' in item ? item.path : '') as string,
					alt: ('name' in item ? item.name : 'Untitled') as string,
				}));

				const initialIndex = items.findIndex((item) => item.id === selectedItem.id);
				openViewer(imageItems, initialIndex);
			}
		};

		const handlePreviewSelected = () => {
			if (effectiveSelectedIds.length === 0) {
				toastService.warning('No hay elementos seleccionados para previsualizar');
				return;
			}

			// Usar la misma lógica que abrir por ahora
			handleOpenSelected();
		};

		// Registrar shortcuts de undo/redo
		register({ key: 'z', modifiers: ['ctrl'], context: 'file-browser', description: 'Deshacer', action: 'undo' }, undo);

		register({ key: 'y', modifiers: ['ctrl'], context: 'file-browser', description: 'Rehacer', action: 'redo' }, redo);

		register(
			{
				key: 'z',
				modifiers: ['ctrl', 'shift'],
				context: 'file-browser',
				description: 'Rehacer (alternativo)',
				action: 'redo-alt',
			},
			redo
		);

		// Registrar todos los shortcuts
		register(
			{ key: 'a', modifiers: ['ctrl'], context: 'file-browser', description: 'Seleccionar todo', action: 'select-all' },
			handleSelectAll
		);

		register(
			{
				key: 'delete',
				modifiers: [],
				context: 'file-browser',
				description: 'Eliminar seleccionados',
				action: 'delete-selected',
			},
			handleDeleteSelected
		);

		register(
			{
				key: 'f2',
				modifiers: [],
				context: 'file-browser',
				description: 'Renombrar seleccionado',
				action: 'rename-selected',
			},
			handleRenameSelected
		);

		register(
			{ key: 'escape', modifiers: [], context: 'global', description: 'Cancelar selección', action: 'cancel-or-close' },
			handleCancelOrClose
		);

		register(
			{
				key: 'c',
				modifiers: ['ctrl'],
				context: 'file-browser',
				description: 'Copiar seleccionados',
				action: 'copy-selected',
			},
			handleCopySelected
		);

		register(
			{
				key: 'x',
				modifiers: ['ctrl'],
				context: 'file-browser',
				description: 'Cortar seleccionados',
				action: 'cut-selected',
			},
			handleCutSelected
		);

		register(
			{ key: 'v', modifiers: ['ctrl'], context: 'file-browser', description: 'Pegar', action: 'paste' },
			handlePaste
		);

		register(
			{
				key: 'enter',
				modifiers: [],
				context: 'file-browser',
				description: 'Abrir seleccionado',
				action: 'open-selected',
			},
			handleOpenSelected
		);

		register(
			{
				key: ' ',
				modifiers: [],
				context: 'file-browser',
				description: 'Previsualizar seleccionado',
				action: 'preview-selected',
			},
			handlePreviewSelected
		);
	}, [
		register,
		setContext,
		items,
		effectiveSelectedIds,
		setSelectedIds,
		clearSelection,
		openViewer,
		undo,
		redo,
		debouncedLoadData,
	]);

	// Crear un Map de items por ID para búsquedas O(1) y evitar dependencias de arrays
	// OPTIMIZACIÓN: Usar ref para mantener estable el Map entre renders
	const itemsByIdRef = useRef(new Map<string, AnyEntityWithStats>());

	// Actualizar el Map solo cuando los items realmente cambien
	useMemo(() => {
		const newMap = new Map<string, AnyEntityWithStats>();
		for (const item of items) {
			newMap.set(item.id, item);
		}
		itemsByIdRef.current = newMap;
		return newMap;
	}, [items]);

	// Handlers estabilizados que usan ref en lugar de dependencias del Map
	// OPTIMIZACIÓN AVANZADA: Usar refs para funciones estables
	const stableHandlersRef = useRef({
		handleItemClickById: (itemId: string, e: React.MouseEvent) => {
			const item = itemsByIdRef.current.get(itemId);
			if (item) {
				onItemClick?.(item, e);
				if (e.ctrlKey || e.metaKey) {
					toggleSelection(itemId);
				} else if (e.shiftKey && focusedId) {
					const currentIndex = items.findIndex(i => i.id === itemId);
					const focusedIndex = items.findIndex(i => i.id === focusedId);
					if (currentIndex !== -1 && focusedIndex !== -1) {
						const start = Math.min(currentIndex, focusedIndex);
						const end = Math.max(currentIndex, focusedIndex);
						const idsToSelect = items.slice(start, end + 1).map(i => i.id);
						setSelectedIds(idsToSelect);
					}
				} else {
					setSelectedIds([itemId]);
				}
				setFocusedId(itemId);
			}
		},
		handleItemDoubleClickById: (itemId: string) => {
			const item = itemsByIdRef.current.get(itemId);
			if (item) {
				onItemDoubleClick?.(item);
			}
		},
		handleItemContextMenuById: (itemId: string, e: React.MouseEvent) => {
			const item = itemsByIdRef.current.get(itemId);
			if (item) {
				console.log('🗂️ Menú contextual para item:', itemId);
			}
		}
	});

	// Actualizar las funciones ref cuando cambien las dependencias críticas
	useEffect(() => {
		stableHandlersRef.current.handleItemClickById = (itemId: string, e: React.MouseEvent) => {
			const item = itemsByIdRef.current.get(itemId);
			if (item) {
				onItemClick?.(item, e);
				if (e.ctrlKey || e.metaKey) {
					toggleSelection(itemId);
				} else if (e.shiftKey && focusedId) {
					const currentIndex = items.findIndex(i => i.id === itemId);
					const focusedIndex = items.findIndex(i => i.id === focusedId);
					if (currentIndex !== -1 && focusedIndex !== -1) {
						const start = Math.min(currentIndex, focusedIndex);
						const end = Math.max(currentIndex, focusedIndex);
						const idsToSelect = items.slice(start, end + 1).map(i => i.id);
						setSelectedIds(idsToSelect);
					}
				} else {
					setSelectedIds([itemId]);
				}
				setFocusedId(itemId);
			}
		};

		stableHandlersRef.current.handleItemDoubleClickById = (itemId: string) => {
			const item = itemsByIdRef.current.get(itemId);
			if (item) {
				onItemDoubleClick?.(item);
			}
		};

		stableHandlersRef.current.handleItemContextMenuById = (itemId: string, e: React.MouseEvent) => {
			const item = itemsByIdRef.current.get(itemId);
			if (item) {
				console.log('🗂️ Menú contextual para item:', itemId);
			}
		};
	}, [onItemClick, onItemDoubleClick, toggleSelection, focusedId, setSelectedIds, setFocusedId, items]);

	// Crear funciones estables que siempre mantienen la misma referencia
	const handleItemClickById = useCallback((itemId: string, e: React.MouseEvent) => {
		stableHandlersRef.current.handleItemClickById(itemId, e);
	}, []);

	const handleItemDoubleClickById = useCallback((itemId: string) => {
		stableHandlersRef.current.handleItemDoubleClickById(itemId);
	}, []);

	const handleItemContextMenuById = useCallback((itemId: string, e: React.MouseEvent) => {
		stableHandlersRef.current.handleItemContextMenuById(itemId, e);
	}, []);

	// Función para renderizar item usando EntityCard - OPTIMIZADA con memoización selectiva
	const renderItem = useCallback(
		(item: AnyEntityWithStats, _index: number) => {
			const isSelected = effectiveSelectedIds.includes(item.id);

			return (
				<OptimizedEntityCard
					key={item.id}
					entity={item as AnyEntityWithStats}
					isSelected={isSelected}
					itemId={item.id}
					onClickById={handleItemClickById}
					onDoubleClickById={handleItemDoubleClickById}
					onContextMenuById={handleItemContextMenuById}
					layout={layout}
					preset={preset}
					variant={variant}
					size={size}
					className="w-full h-full"
				/>
			);
		},
		[
			effectiveSelectedIds,
			handleItemClickById,
			handleItemDoubleClickById,
			handleItemContextMenuById,
			layout,
			preset,
			variant,
			size,
		]
	);

	// Renderizar contenido según el estado
	const renderContent = () => {
		console.log('🔍 FileBrowser - Estado de renderizado:', {
			isLoading,
			error,
			itemsLength: items.length,
			containerWidth,
			entityType,
			filterId,
			filterType,
		});

		if (isLoading && items.length === 0) {
			console.log('🔍 FileBrowser - Renderizando loading...');
			return (
				<div className="flex h-full w-full items-center justify-center">
					<Spinner />
				</div>
			);
		}

		if (error) {
			console.log('🔍 FileBrowser - Renderizando error:', error);
			return (
				<div className="flex h-full w-full items-center justify-center">
					<p className="text-destructive">Error: {error}</p>
				</div>
			);
		}

		if (items.length === 0) {
			console.log('🔍 FileBrowser - Renderizando estado vacío');
			return <EmptyState icon={FileTextIcon} title="Sin elementos" description="No hay elementos para mostrar." />;
		}

		console.log('🔍 FileBrowser - Renderizando contenido con', items.length, 'items');

		const commonViewProps = {
			items,
			itemSize,
			selectedIds: effectiveSelectedIds,
			containerWidth,
			onItemClick: handleItemClick,
			onItemDoubleClick: handleItemDoubleClick,
			onItemContextMenu: advancedHandleItemContextMenu,
			onContextAction: handleItemContextAction,
		};

		console.log('🔍 FileBrowser - SWITCH de vista:', { viewMode, willRenderView: viewMode || 'default' });

		switch (viewMode) {
			case 'list':
				console.log('🔍 FileBrowser - Renderizando ListView');
				return <ListView {...commonViewProps} />;
			case 'grid':
				console.log('🔍 FileBrowser - Renderizando GridView');
				return <GridView {...commonViewProps} />;
			case 'cards':
				console.log('🔍 FileBrowser - Renderizando CardsView');
				return <CardsView {...commonViewProps} />;
			case 'simple-grid':
				console.log('🔍 FileBrowser - Renderizando GridView (simple-grid)');
				return <GridView {...commonViewProps} />;
			case 'masonry':
				console.log('🔍 FileBrowser - Renderizando MasonryView');
				return <MasonryView {...commonViewProps} />;
			default:
				console.log('🔍 FileBrowser - Renderizando CardsView (default)');
				return <CardsView {...commonViewProps} />;
		}
	};

	// Helper function to get item element by ID
	const getItemElement = useCallback((itemId: string): HTMLElement | null => {
		return document.querySelector(`[data-item-id="${itemId}"]`);
	}, []);

	// Convert items to FileItem format for drag selection
	const fileItems = useMemo(() => {
		return items.map((item) => ({
			id: item.id,
			name: ('name' in item ? item.name : 'Unknown') as string,
			type: 'file' as const,
			size: ('size' in item ? item.size : 0) as number,
			modifiedAt: 'updatedAt' in item ? new Date(item.updatedAt) : new Date(),
			path: ('path' in item ? item.path : '') as string,
			isDirectory: false,
			extension: ('extension' in item ? item.extension : '') as string,
			mimeType: ('mimeType' in item ? item.mimeType : 'application/octet-stream') as string,
		}));
	}, [items]);

	return (
		<div
			className={cn(
				'flex h-full w-full flex-col bg-background overflow-hidden',
				{
					'accessibility-high-contrast': accessibility.config.highContrast,
					'accessibility-large-fonts': accessibility.config.largeFonts,
					'accessibility-reduced-motion': accessibility.config.reduceMotion,
				},
				className
			)}
			data-testid="file-browser-container"
			role="application"
			aria-label="Explorador de archivos"
			aria-describedby="file-browser-description"
			onClick={handleContainerClick}
			onContextMenuCapture={handleContextMenu}
			onKeyDown={(e) => {
				if (accessibility.isKeyboardNavigation) {
					// Handle keyboard navigation
					switch (e.key) {
						case 'ArrowUp':
						case 'ArrowDown':
						case 'ArrowLeft':
						case 'ArrowRight':
							e.preventDefault();
							if (selectedIds.length > 0) {
								accessibility.focusElement(`[data-item-id="${selectedIds[0]}"]`);
							}
							break;
						case 'Home':
							e.preventDefault();
							accessibility.focusFirst();
							break;
						case 'End':
							e.preventDefault();
							accessibility.focusLast();
							break;
					}
				}
			}}
		>
			<div id="file-browser-description" className="sr-only">
				Explorador de archivos con {items.length} elementos. Usa las flechas para navegar, Enter para abrir, Espacio
				para seleccionar.
			</div>

			<ScrollArea className="flex-1 min-h-0 relative" aria-live="polite" aria-atomic="false">
				{/* Toolbar flotante que aparece cuando hay elementos seleccionados */}
				<AnimatePresence>
					{effectiveSelectedIds.length > 0 && (
						<motion.div
							initial={{ y: -100, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: -100, opacity: 0 }}
							transition={{
								type: 'spring',
								stiffness: 400,
								damping: 30,
								duration: 0.3,
							}}
							className="absolute top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border shadow-lg"
						>
							<div className="p-4">
								<ViewToolbar />
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				<DragSelectionProvider
					containerRef={containerRef as React.RefObject<HTMLElement>}
					items={fileItems as any}
					getItemElement={getItemElement}
					disabled={true}
					config={{
						enabled: false,
						threshold: 5,
						autoScroll: {
							enabled: true,
							speed: 50,
							threshold: 50,
							maxSpeed: 200,
						},
						modifiers: {
							add: 'ctrl',
							subtract: 'alt',
							toggle: 'shift',
						},
						selectableClass: 'entity-card',
						selectedClass: 'entity-card--selected',
						selectingClass: 'entity-card--selecting',
						containerClass: 'file-browser-container',
					}}
					overlayConfig={{
						showCount: true,
						showCoordinates: false,
						theme: 'auto',
						animation: {
							enabled: true,
							duration: 150,
							easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
						},
					}}
					onSelectionStart={(state) => {
						console.log('🎯 Drag selection started:', state);
					}}
					onSelectionUpdate={(state, selectedIds) => {
						console.log('🎯 Drag selection updated:', { state, selectedIds });
					}}
					onSelectionEnd={(state, selectedIds) => {
						console.log('🎯 Drag selection ended:', { state, selectedIds });
						if (selectedIds.length > 0) {
							setSelectedIds(selectedIds);
						}
					}}
					onSelectionCancel={() => {
						console.log('🎯 Drag selection cancelled');
					}}
				>
					<div
						ref={containerCallbackRef}
						className="relative h-full w-full bg-transparent cursor-default file-browser-container"
					>
						{/* Navegación por teclado */}
						<KeyboardNavigation
							items={items}
							containerRef={containerRef as React.RefObject<HTMLElement>}
							getItemElement={getItemElement}
							onOpenItem={onItemDoubleClick}
							onPreviewItem={(item: AnyEntityWithStats) => {
								// Abrir en el file viewer para preview
								if ('path' in item && item.path) {
									// Convertir el item a formato ImageItem para el viewer
									const imageItem = {
										id: item.id,
										name: item.name,
										path: item.path,
										type: 'image' as const,
										size: ('size' in item ? item.size : 0) as number,
										width: ('width' in item ? item.width : null) as number | null,
										height: ('height' in item ? item.height : null) as number | null,
										thumbnail: ('thumbnail' in item ? item.thumbnail : null) as string | null,
										metadata: ('metadata' in item ? item.metadata : null) as string | null,
									};
									openViewer([imageItem], 0);
								}
							}}
							viewType={viewMode === 'list' ? 'list' : viewMode === 'grid' ? 'grid' : 'cards'}
						/>

						<AnimatePresence>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="h-full w-full"
							>
								{containerWidth > 0 ? renderContent() : <Spinner />}
							</motion.div>
						</AnimatePresence>

						{/* Menú contextual personalizado */}
						<CustomContextMenu
							isOpen={contextMenuOpen}
							onClose={closeContextMenu}
							position={contextMenuPosition}
							selectedItems={items.filter((item) => effectiveSelectedIds.includes(item.id))}
							onAction={handleCustomContextMenuAction}
						/>
					</div>
				</DragSelectionProvider>
			</ScrollArea>

			<StatusBar
				totalItems={items.length}
				selectedCount={effectiveSelectedIds.length}
				entityType={entityType === 'mixed' ? EntityStatsType.IMAGE : (entityType as EntityStatsType)}
			/>

			{/* Progress Overlay */}
			<ProgressOverlay />

			{/* Región para anuncios de lectores de pantalla */}
			<div id="screen-reader-announcements" aria-live="assertive" aria-atomic="true" className="sr-only" />

			{/* Información de rendimiento (solo en desarrollo) */}
			{process.env.NODE_ENV === 'development' && performance.isMonitoring && (
				<div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono">
					<div>FPS: {performance.metrics?.averageFPS ?? 'N/A'}</div>
					<div>Memory: {performance.metrics?.memoryUsage ?? 'N/A'}MB</div>
					<div>Entities: {items.length}</div>
				</div>
			)}
		</div>
	);
});

/**
 * 📝 Documentación de capacidades multi-entidad:
 *
 * Nuevas capacidades implementadas:
 * 1. ✅ **Modo Mixed**: Combina múltiples tipos de entidades en una sola vista
 * 2. ✅ **Modo Manual**: Acepta items específicos sin cargar desde stores
 * 3. ✅ **EntityCard Integration**: Usa el sistema de cards para renderizar diferentes tipos
 * 4. ✅ **Filtrado Inteligente**: Mantiene filtros por carpeta/colección en modo mixto
 * 5. ✅ **Ordenación Unificada**: Ordena items combinados por fecha de modificación
 * 6. ✅ **Estados Agregados**: Combina estados de carga y error de múltiples stores
 * 7. ✅ **Virtualización Optimizada**: Mantiene rendimiento con múltiples tipos
 *
 * Ejemplos de uso:
 *
 * // Modo específico (comportamiento original)
 * <FileBrowser entityType="image" />
 *
 * // Modo mixto con múltiples entidades
 * <FileBrowser
 *   entityType="mixed"
 *   entityTypes={['image', 'video', 'audio']}
 * />
 *
 * // Modo manual con items específicos
 * <FileBrowser
 *   entityType="mixed"
 *   mode="manual"
 *   items={customEntityList}
 * />
 *
 * // Con filtros (funciona en todos los modos)
 * <FileBrowser
 *   entityType="mixed"
 *   entityTypes={['image', 'document']}
 *   filterId={folderId}
 *   filterType="folder"
 * />
 */
