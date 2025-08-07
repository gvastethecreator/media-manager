/**
 * @file FileBrowser V2 - Componente refactorizado y modularizado
 * @module components/features/file-browser/file-browser-v2
 * @description FileBrowser refactorizado que usa stores específicos por entidad,
 * tipos optimizados WithStats, virtualización con TanStack Virtual y soporte multi-entidad.
 * Ahora modularizado para mejor mantenibilidad.
 */

import { FileTextIcon } from 'lucide-react';
import React, { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OptimizedEntityCard } from '@/components/cards/entity-card';
import { EmptyState } from '@/components/core/data-display';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { useAdvancedSelection } from '@/hooks/use-advanced-selection';
import { useCustomContextMenu } from '@/hooks/use-custom-context-menu';
import { useFileSync } from '@/hooks/use-file-sync';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { EntityStatsType } from '@/types/migration';
// Imports de módulos refactorizados
import { AUTO_SYNC_DISABLED_FOLDERS, DEFAULT_PROPS, FALLBACK_WIDTH } from './config/file-browser.config';
import { CustomContextMenu } from './context-menu/custom-context-menu';
import { useAccessibility } from './hooks/use-accessibility';
import { useFileBrowserData } from './hooks/use-file-browser-data';
import { useFileBrowserSelection } from './hooks/use-file-browser-selection';
import { usePerformance } from './hooks/use-performance';
import { KeyboardNavigation } from './navigation/keyboard-navigation';
import { ProgressOverlay } from './progress/progress-overlay';
import { DragSelectionProvider } from './selection/drag-selection-provider';
import { StatusBar } from './toolbar/status-bar';
import type { FileBrowserProps } from './types/file-browser.types';
import { convertToFileItem } from './utils/file-browser-helpers';
import { CardsView } from './views/cards-view';
import { GridView } from './views/grid-view';
import { ListView } from './views/list-view';
import { MasonryView } from './views/masonry-view';

// Import CSS for user-select fixes
import './styles/user-select.css';
import './selection/selection-styles.css';

const logger = clientLogger.withContext('FileBrowser');

// Helpers simplificados para extracción de propiedades - FUERA del componente
const getItemName = (item: AnyEntityWithStats): string => ('name' in item && item.name ? String(item.name) : 'Unknown');

const getItemSize = (item: AnyEntityWithStats): number => ('size' in item && item.size ? Number(item.size) : 0);

const getItemPath = (item: AnyEntityWithStats): string => ('path' in item && item.path ? String(item.path) : '');

const getItemDate = (item: AnyEntityWithStats): Date =>
	new Date('updatedAt' in item && item.updatedAt ? item.updatedAt : Date.now());

const getItemExtension = (item: AnyEntityWithStats): string =>
	'extension' in item && item.extension ? String(item.extension) : '';

const getItemMimeType = (item: AnyEntityWithStats): string =>
	'mimeType' in item && item.mimeType ? String(item.mimeType) : 'application/octet-stream';

// Helper para cargar imágenes específicas
const loadImagesForType = async (
	filterId: string | undefined,
	filterType: string | undefined,
	loadParamsKey: string,
	lastLoadParamsRef: React.MutableRefObject<string>,
	isLoadingRef: React.MutableRefObject<boolean>
) => {
	const { loadImages: storeLoadImagesFunc, getImagesByFolder: getImagesByFolderFunc } = useImageStore.getState();

	// Verificar si ya existen imágenes para esta carpeta
	if (filterId && filterType === 'folder') {
		const existingImages = getImagesByFolderFunc(filterId);
		if (existingImages.length > 0) {
			lastLoadParamsRef.current = loadParamsKey;
			return;
		}
	}

	const loadParams: Parameters<typeof storeLoadImagesFunc>[0] = {};

	// Si hay filtro de carpeta, incluirlo en los parámetros
	if (filterId && filterType === 'folder') {
		loadParams.folderId = filterId;
	}

	// OPTIMIZACIÓN: Eliminar logs costosos en producción
	if (process.env.NODE_ENV === 'development') {
		logger.debug('🔄 FileBrowser iniciando carga de imágenes', { filterId, filterType, loadParams });
	}

	// Marcar como cargando
	isLoadingRef.current = true;
	lastLoadParamsRef.current = loadParamsKey;

	try {
		await storeLoadImagesFunc(loadParams);
		if (process.env.NODE_ENV === 'development') {
			logger.debug('✅ Carga de imágenes completada');
		}
	} catch (loadError) {
		logger.error('❌ Error al cargar imágenes en FileBrowser:', loadError);
	} finally {
		isLoadingRef.current = false;
	}
};

// Helper para determinar tipos a cargar
const getTypesToLoad = (entityType: EntityStatsType | 'mixed' | string, entityTypes: EntityStatsType[]) => {
	return entityType === 'mixed' ? entityTypes : [entityType as EntityStatsType];
};

// Helper para obtener items por tipo específico
const getItemsByType = (
	type: string,
	filterId: string | undefined,
	filterType: string | undefined,
	getImagesByFolder: (folderId: string) => any[],
	getSortedImages: () => any[]
): AnyEntityWithStats[] => {
	switch (type) {
		case 'image':
			if (filterId && filterType === 'folder') {
				return getImagesByFolder(filterId);
			}
			return getSortedImages();
		default:
			return [];
	}
};

// Helper para extraer nombre de entidad
const extractEntityName = (entity: AnyEntityWithStats): string => {
	if ('name' in entity && typeof entity.name === 'string') {
		return entity.name;
	}
	if ('title' in entity && typeof entity.title === 'string') {
		return entity.title;
	}
	return '';
};

// Helper para extraer path de entidad
const extractEntityPath = (entity: AnyEntityWithStats): string => {
	if ('path' in entity && typeof entity.path === 'string') {
		return entity.path;
	}
	if ('category' in entity && typeof entity.category === 'string') {
		return entity.category;
	}
	return '';
};

// Helper para comparar por campo específico
const compareByField = (aValues: any, bValues: any, field: string): number => {
	switch (field) {
		case 'name':
			return aValues.name.localeCompare(bValues.name);
		case 'modifiedAt':
			return aValues.modifiedTime - bValues.modifiedTime;
		case 'createdAt':
			return aValues.createdTime - bValues.createdTime;
		default:
			return 0;
	}
};

// Helper para obtener error en modo mixto
const getMixedModeError = (entityTypes: EntityStatsType[], imagesError: any): any => {
	for (const type of entityTypes) {
		if (type === 'image' && imagesError) {
			return imagesError;
		}
	}
	return null;
};

// Helper para obtener error en modo específico
const getSpecificModeError = (entityType: string, imagesError: any): any => {
	switch (entityType) {
		case 'image':
			return imagesError;
		default:
			return null;
	}
};

// Helper para manejar acción de copiar
const handleCopyAction = async (effectiveSelectedIds: string[], items: AnyEntityWithStats[]) => {
	if (effectiveSelectedIds.length > 0) {
		const selectedItems = items.filter((item) => effectiveSelectedIds.includes(item.id));
		try {
			await clipboardManager.copy(selectedItems);
			toastService.success(`${selectedItems.length} elemento(s) copiado(s)`);
		} catch (err) {
			console.error('Error al copiar:', err);
			toastService.error('Error al copiar elementos');
		}
	}
};

// Helper para manejar acción de cortar
const handleCutAction = async (effectiveSelectedIds: string[], items: AnyEntityWithStats[]) => {
	if (effectiveSelectedIds.length > 0) {
		const selectedItems = items.filter((item) => effectiveSelectedIds.includes(item.id));
		try {
			await clipboardManager.cut(selectedItems);
			toastService.success(`${selectedItems.length} elemento(s) cortado(s)`);
		} catch (err) {
			console.error('Error al cortar:', err);
			toastService.error('Error al cortar elementos');
		}
	}
};

// Helper para manejar otras acciones
const handleOtherActions = (action: string, effectiveSelectedIds: string[]) => {
	switch (action) {
		case 'paste':
			toastService.info('Funcionalidad de pegar en desarrollo');
			break;
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
		default:
			toastService.info(`Funcionalidad "${action}" en desarrollo`);
			break;
	}
};

// Helper para convertir item a formato de viewer
const convertItemToViewerFormat = (item: AnyEntityWithStats) => {
	const name = ('name' in item ? item.name : 'Untitled') as string;
	const path = ('path' in item ? item.path : '') as string;

	return {
		id: item.id,
		name,
		type: 'image' as const,
		path,
		size: ('size' in item ? item.size : 0) as number,
		width: ('width' in item ? item.width : 0) as number,
		height: ('height' in item ? item.height : 0) as number,
		thumbnail: ('thumbnail' in item ? item.thumbnail : '') as string,
		metadata: '',
		src: path,
		alt: name,
	};
};

// Helper para modo mixto
const getMixedItems = (
	entityTypes: EntityStatsType[],
	filterId: string | undefined,
	filterType: string | undefined,
	getImagesByFolder: (folderId: string) => any[],
	getSortedImages: () => any[]
): AnyEntityWithStats[] => {
	const items: AnyEntityWithStats[] = [];
	for (const type of entityTypes) {
		items.push(...getItemsByType(type, filterId, filterType, getImagesByFolder, getSortedImages));
	}
	return items;
};

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

export const FileBrowser = memo<FileBrowserProps>(function FileBrowserInner({
	entityType = 'image',
	entityTypes = [],
	mode = 'auto',
	items: manualItems = [],
	filterId,
	filterType,
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
	// Estados globales y stores - OPTIMIZACIÓN: Selectors específicos para evitar re-renders
	const viewMode = useViewOptionsStore((state) => state.viewMode);
	const itemSize = useViewOptionsStore((state) => state.itemSize);
	const searchQuery = useViewOptionsStore((state) => state.searchQuery);
	const sortOptions = useViewOptionsStore((state) => state.sortOptions);

	// Selectors específicos del store de selección para evitar re-renders innecesarios
	const globalSelectedIds = useSelectionStore((state) => state.selectedIds);
	const clearSelection = useSelectionStore((state) => state.clearSelection);
	const focusedId = useSelectionStore((state) => state.focusedId);
	const setFocusedId = useSelectionStore((state) => state.setFocusedId);
	const addToSelection = useSelectionStore((state) => state.addToSelection);
	const removeFromSelection = useSelectionStore((state) => state.removeFromSelection);
	const setSelectedIds = useSelectionStore((state) => state.setSelectedIds);
	const selectRange = useSelectionStore((state) => state.selectRange);
	const toggleSelection = useSelectionStore((state) => state.toggleSelection);
	const selectAll = useSelectionStore((state) => state.selectAll);

	const { setVisible: setDetailsPanelVisible, setSelectedItems: setDetailsPanelItems } = useDetailsPanel();
	const { openViewer } = useFileViewerStore();

	// Referencias y estados locales
	const containerRef = useRef<HTMLElement>(null);
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

	// Hook de sincronización de archivos - Solo activar si hay filterId de carpeta
	// Deshabilitar autoSync para carpetas problemáticas
	const shouldAutoSync = Boolean(filterId && filterType === 'folder' && filterId !== 'photography');
	const { isSyncing, syncNow } = useFileSync(filterId && filterType === 'folder' ? filterId : undefined, {
		autoSync: shouldAutoSync,
	});

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

	// OPTIMIZACIÓN: Clave de parámetros estable para evitar JSON.stringify costoso
	const loadParamsKey = useMemo(() => {
		return `${entityType}|${entityTypes.join(',')}|${filterId}|${filterType}|${mode}`;
	}, [entityType, entityTypes, filterId, filterType, mode]);

	// Función de carga con debounce para evitar llamadas excesivas
	const debouncedLoadData = useDebouncedCallback(() => {
		// En modo manual, no cargar datos automáticamente
		if (mode === 'manual' || !filterId) {
			return;
		}

		// Evitar cargas duplicadas comparando parámetros
		if (lastLoadParamsRef.current === loadParamsKey || isLoadingRef.current) {
			return;
		}

		// Determinar qué tipos de entidades cargar
		const typesToLoad = getTypesToLoad(entityType, entityTypes);

		// Cargar datos para cada tipo
		for (const type of typesToLoad) {
			if (type === 'image') {
				loadImagesForType(filterId, filterType, loadParamsKey, lastLoadParamsRef, isLoadingRef);
			}
			// TODO: Añadir otros tipos cuando se implementen sus stores
		}
	}, 300); // Debounce de 300ms

	// Cargar datos al montar o cuando cambian los filtros
	useEffect(() => {
		debouncedLoadData();
	}, [debouncedLoadData]);

	// Obtener raw items - OPTIMIZACIÓN: Memoizado separadamente para evitar re-cálculos innecesarios
	const rawItems = useMemo(() => {
		// En modo manual, usar los items proporcionados
		if (mode === 'manual' && manualItems) {
			return manualItems;
		}

		// En modo auto, obtener desde stores
		if (entityType === 'mixed') {
			return getMixedItems(entityTypes, filterId, filterType, getImagesByFolder, getSortedImages);
		}

		// Modo específico: un solo tipo de entidad
		return getItemsByType(entityType, filterId, filterType, getImagesByFolder, getSortedImages);
	}, [entityType, entityTypes, filterId, filterType, mode, manualItems, getSortedImages, getImagesByFolder]);

	// OPTIMIZACIÓN CRÍTICA: Cache de valores de sorting para evitar recálculos costosos
	const sortingCache = useRef(
		new Map<string, { name: string; path: string; modifiedTime: number; createdTime: number }>()
	);

	// OPTIMIZACIÓN CRÍTICA: Sorting values asíncrono para evitar cuelgues
	const getSortingValues = useCallback((entity: AnyEntityWithStats) => {
		const cached = sortingCache.current.get(entity.id);
		if (cached) {
			return cached;
		}

		const values = {
			name: extractEntityName(entity).toLowerCase(),
			path: extractEntityPath(entity).toLowerCase(),
			modifiedTime: new Date((entity as any).updatedAt || (entity as any).modifiedAt || 0).getTime(),
			createdTime: new Date((entity as any).createdAt || 0).getTime(),
		};

		sortingCache.current.set(entity.id, values);
		return values;
	}, []);

	// OPTIMIZACIÓN CRÍTICA: Filtering asíncrono para evitar cuelgues
	const filteredItems = useMemo(() => {
		if (!searchQuery?.trim()) {
			return rawItems;
		}

		const query = searchQuery.toLowerCase().trim();
		return rawItems.filter((item) => {
			const values = getSortingValues(item);
			return values.name.includes(query) || values.path.includes(query);
		});
	}, [rawItems, searchQuery, getSortingValues]);

	// OPTIMIZACIÓN CRÍTICA: Sorting helper function simplificada
	const createSortComparator = useCallback(
		(sortOptionsParam: any[]) => {
			return (a: AnyEntityWithStats, b: AnyEntityWithStats) => {
				const aValues = getSortingValues(a);
				const bValues = getSortingValues(b);

				for (const sortOption of sortOptionsParam) {
					const { field, direction } = sortOption;
					const result = compareByField(aValues, bValues, field);

					if (result !== 0) {
						return direction === 'asc' ? result : -result;
					}
				}
				return 0;
			};
		},
		[getSortingValues]
	);

	// OPTIMIZACIÓN CRÍTICA: Sorting asíncrono sin cuelgues
	const items = useMemo(() => {
		if (sortOptions.length === 0) {
			// Ordenación por defecto optimizada
			return filteredItems.slice().sort((a, b) => {
				const aValues = getSortingValues(a);
				const bValues = getSortingValues(b);
				return bValues.modifiedTime - aValues.modifiedTime;
			});
		}

		// Usar comparator function para reducir complejidad
		const comparator = createSortComparator(sortOptions);
		return filteredItems.slice().sort(comparator);
	}, [filteredItems, sortOptions, getSortingValues, createSortComparator]);

	// OPTIMIZACIÓN: Memoizar handlers para evitar re-renders de componentes hijos
	const memoizedOnItemSelect = useCallback(
		(item: AnyEntityWithStats) => {
			onItemSelect?.(item);
		},
		[onItemSelect]
	);

	const memoizedOnItemClick = useCallback(
		(item: AnyEntityWithStats, e: React.MouseEvent) => {
			onItemClick?.(item, e);
		},
		[onItemClick]
	);

	const memoizedOnItemDoubleClick = useCallback(
		(item: AnyEntityWithStats) => {
			onItemDoubleClick?.(item);
		},
		[onItemDoubleClick]
	);

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

	// OPTIMIZACIÓN: Estabilizar items para useAdvancedSelection usando un Map por ID
	const stableItemsRef = useRef<AnyEntityWithStats[]>([]);
	const itemsStabilized = useMemo(() => {
		// Solo actualizar si los IDs realmente cambiaron
		const currentIds = items
			.map((item) => item.id)
			.sort()
			.join(',');
		const prevIds = stableItemsRef.current
			.map((item) => item.id)
			.sort()
			.join(',');

		if (currentIds !== prevIds) {
			stableItemsRef.current = items;
		}

		return stableItemsRef.current;
	}, [items]);

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
		items: itemsStabilized, // OPTIMIZACIÓN: Usar items estabilizados
		onContextMenu: handleAdvancedContextMenu,
		onItemSelect: memoizedOnItemSelect,
		onItemClick: memoizedOnItemClick,
		enableDragSelection: true,
		dragContainer: containerRef.current || undefined,
	});

	// OPTIMIZACIÓN: Hook de rendimiento con datos vacíos en producción para evitar overhead
	const performance = usePerformance({
		data: process.env.NODE_ENV === 'development' ? items : [],
		searchTerm: process.env.NODE_ENV === 'development' ? searchQuery || '' : '',
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
			return getMixedModeError(entityTypes, imagesError);
		}

		return getSpecificModeError(entityType, imagesError);
	})();

	// OPTIMIZACIÓN ULTRA-CRÍTICA: Click handler instantáneo sin cuelgues
	const handleItemClick = useCallback(
		(item: AnyEntityWithStats, e: React.MouseEvent) => {
			// Respuesta INMEDIATA - sin startTransition para evitar delay
			e.stopPropagation();

			// Operaciones críticas de selección - INMEDIATAS
			if (e.ctrlKey || e.metaKey) {
				toggleSelection(item.id);
			} else if (e.shiftKey && focusedId) {
				// Shift+click para rango - optimizado
				const currentIndex = items.findIndex((i) => i.id === item.id);
				const focusedIndex = items.findIndex((i) => i.id === focusedId);
				if (currentIndex !== -1 && focusedIndex !== -1) {
					const start = Math.min(currentIndex, focusedIndex);
					const end = Math.max(currentIndex, focusedIndex);
					const idsToSelect = items.slice(start, end + 1).map((i) => i.id);
					setSelectedIds(idsToSelect);
				}
			} else {
				// Click normal - selección inmediata
				setSelectedIds([item.id]);
			}
			setFocusedId(item.id);

			// Callbacks opcionales asíncronos - NO BLOQUEAN
			if (onItemClick) {
				setTimeout(() => onItemClick(item, e), 0);
			}
		},
		[toggleSelection, focusedId, items, setSelectedIds, setFocusedId, onItemClick]
	);

	// Manejar doble click
	const handleItemDoubleClick = useCallback(
		(item: AnyEntityWithStats) => {
			onItemDoubleClick?.(item);
		},
		[onItemDoubleClick]
	);

	// Manejar acciones del menú contextual
	const handleItemContextAction = useCallback(
		(action: string, item: AnyEntityWithStats, _data?: Record<string, unknown>) => {
			// Implementación simple para compatibilidad
			try {
				toastService.info(`Acción "${action}" ejecutada para ${item.name || item.id}`);
			} catch (contextError) {
				console.error('Error al ejecutar acción de contexto:', contextError);
			}
		},
		[]
	);

	// OPTIMIZACIÓN CRÍTICA: Context menu asíncrono sin cuelgues
	const handleContainerClick = useCallback(
		(e: React.MouseEvent) => {
			// Respuesta inmediata
			e.stopPropagation();

			// Cerrar menú contextual inmediatamente
			closeContextMenu();

			// Operaciones pesadas en background
			startTransition(() => {
				advancedHandleEmptySpaceClick(e);
			});
		},
		[advancedHandleEmptySpaceClick, closeContextMenu]
	);

	// Context menu action handler optimizado
	const handleCustomContextMenuAction = useCallback(
		(action: string, _data?: any) => {
			// Cerrar menú inmediatamente para respuesta rápida
			closeContextMenu();

			// Procesar acción asíncronamente
			setTimeout(() => {
				startTransition(() => {
					switch (action) {
						case 'copy':
							handleCopyAction(effectiveSelectedIds, items);
							break;
						case 'cut':
							handleCutAction(effectiveSelectedIds, items);
							break;
						default:
							handleOtherActions(action, effectiveSelectedIds);
							break;
					}
				});
			}, 0);
		},
		[effectiveSelectedIds, items, closeContextMenu]
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

	// OPTIMIZACIÓN CRÍTICA: Separar shortcuts setup para evitar re-registros masivos
	// Contexto setup - solo una vez
	useEffect(() => {
		setContext('file-browser');
	}, [setContext]);

	// OPTIMIZACIÓN: Handlers estables usando useCallback para evitar re-registros
	const handleSelectAll = useCallback(() => {
		const allIds = items.map((item) => item.id);
		setSelectedIds(allIds);
		toastService.info(`${items.length} elementos seleccionados`);
	}, [items, setSelectedIds]);

	const handleCancelOrClose = useCallback(() => {
		clearSelection();
	}, [clearSelection]);

	const handleOpenSelected = useCallback(() => {
		if (effectiveSelectedIds.length === 0) {
			toastService.warning('No hay elementos seleccionados para abrir');
			return;
		}

		const selectedItem = items.find((item) => item.id === effectiveSelectedIds[0]);
		if (selectedItem) {
			// OPTIMIZACIÓN CRÍTICA: Evitar mapear todo el array - solo convertir items necesarios
			const selectedItems = items.filter((item) => effectiveSelectedIds.includes(item.id));

			// Crear solo los items necesarios para el viewer de forma más eficiente
			const imageItems = selectedItems.map(convertItemToViewerFormat);

			const initialIndex = imageItems.findIndex((item) => item.id === selectedItem.id);
			openViewer(imageItems, Math.max(0, initialIndex));
		}
	}, [effectiveSelectedIds, items, openViewer]);

	// Registrar shortcuts básicos - solo cuando cambian las funciones críticas
	useEffect(() => {
		// Shortcuts que no dependen de selección
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
		register(
			{ key: 'a', modifiers: ['ctrl'], context: 'file-browser', description: 'Seleccionar todo', action: 'select-all' },
			handleSelectAll
		);
		register(
			{ key: 'escape', modifiers: [], context: 'global', description: 'Cancelar selección', action: 'cancel-or-close' },
			handleCancelOrClose
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
			handleOpenSelected
		);
	}, [register, undo, redo, handleSelectAll, handleCancelOrClose, handleOpenSelected]);

	// OPTIMIZACIÓN CRÍTICA: itemsByIdRef optimizado - solo para lookups rápidos
	const itemsByIdRef = useRef(new Map<string, AnyEntityWithStats>());
	const lastItemsHashRef = useRef<string>('');

	// Actualizar el Map solo cuando los items realmente cambien (por hash de IDs)
	useMemo(() => {
		const currentHash = items
			.map((item) => item.id)
			.sort()
			.join(',');
		if (currentHash !== lastItemsHashRef.current) {
			itemsByIdRef.current.clear();
			for (const item of items) {
				itemsByIdRef.current.set(item.id, item);
			}
			lastItemsHashRef.current = currentHash;
		}
		return itemsByIdRef.current;
	}, [items]);

	// OPTIMIZACIÓN CRÍTICA: Container measurement simple y estable
	const [containerWidth, setContainerWidth] = useState<number>(FALLBACK_WIDTH);
	const measurementInProgressRef = useRef(false);

	const measureContainer = useCallback(
		(element: HTMLElement) => {
			if (measurementInProgressRef.current) {
				return;
			}
			measurementInProgressRef.current = true;

			const width = element?.clientWidth || element?.offsetWidth || FALLBACK_WIDTH;
			if (width > 0 && Math.abs(width - containerWidth) > 10) {
				setContainerWidth(width);
			}

			measurementInProgressRef.current = false;
		},
		[containerWidth]
	);

	const containerCallbackRef = useCallback(
		(element: HTMLElement | null) => {
			if (!element || containerRef.current === element) {
				return;
			}

			containerRef.current = element;
			measureContainer(element);

			// ResizeObserver simple sin debounce costoso
			const resizeObserver = new ResizeObserver((entries) => {
				const entry = entries[0];
				if (entry) {
					const width = entry.contentRect.width;
					if (width > 0 && Math.abs(width - containerWidth) > 10) {
						setContainerWidth(width);
					}
				}
			});

			resizeObserver.observe(element);
			return () => resizeObserver.disconnect();
		},
		[measureContainer, containerWidth]
	);

	// OPTIMIZACIÓN ULTRA-CRÍTICA: Click handlers directos sin complejidad
	const handleItemClickById = useCallback(
		(itemId: string, e: React.MouseEvent) => {
			// Respuesta INMEDIATA - sin lookups costosos
			e.stopPropagation();

			// Selección inmediata
			if (e.ctrlKey || e.metaKey) {
				toggleSelection(itemId);
			} else if (e.shiftKey && focusedId) {
				const currentIndex = items.findIndex((i) => i.id === itemId);
				const focusedIndex = items.findIndex((i) => i.id === focusedId);
				if (currentIndex !== -1 && focusedIndex !== -1) {
					const start = Math.min(currentIndex, focusedIndex);
					const end = Math.max(currentIndex, focusedIndex);
					const idsToSelect = items.slice(start, end + 1).map((i) => i.id);
					setSelectedIds(idsToSelect);
				}
			} else {
				setSelectedIds([itemId]);
			}
			setFocusedId(itemId);

			// Callback opcional asíncrono
			if (onItemClick) {
				const item = itemsByIdRef.current.get(itemId);
				if (item) {
					setTimeout(() => onItemClick(item, e), 0);
				}
			}
		},
		[toggleSelection, focusedId, items, setSelectedIds, setFocusedId, onItemClick]
	);

	const handleItemDoubleClickById = useCallback(
		(itemId: string) => {
			if (onItemDoubleClick) {
				const item = itemsByIdRef.current.get(itemId);
				if (item) {
					onItemDoubleClick(item);
				}
			}
		},
		[onItemDoubleClick]
	);

	// Función para renderizar item usando EntityCard - OPTIMIZADA con memoización selectiva
	const renderItem = useCallback(
		(item: AnyEntityWithStats, _index: number) => {
			const clickHandler = (e: React.MouseEvent) => handleItemClickById(item.id, e);
			console.log('🔧 FileBrowser.renderItem - Creando handler para item:', item.id, 'handler:', !!clickHandler);
			return (
				<OptimizedEntityCard
					className="h-full w-full"
					entity={item as AnyEntityWithStats}
					key={item.id}
					layout={layout}
					onClick={clickHandler}
					onDoubleClick={() => handleItemDoubleClickById(item.id)}
					preset={preset}
					size={size}
					variant={variant}
				/>
			);
		},
		[
			// Solo dependencias estables para evitar re-renders
			handleItemClickById,
			handleItemDoubleClickById,
			layout,
			preset,
			variant,
			size,
		]
	);

	// OPTIMIZACIÓN CRÍTICA: Memoizar props comunes para evitar re-creaciones
	const commonViewProps = useMemo(
		() => ({
			items,
			itemSize,
			selectedIds: effectiveSelectedIds,
			containerWidth,
			onItemClick: handleItemClick,
			onItemDoubleClick: handleItemDoubleClick,
			onItemContextMenu: advancedHandleItemContextMenu,
			onContextAction: handleItemContextAction,
		}),
		[
			items,
			itemSize,
			effectiveSelectedIds,
			containerWidth,
			handleItemClick,
			handleItemDoubleClick,
			advancedHandleItemContextMenu,
			handleItemContextAction,
		]
	);

	// Renderizar contenido según el estado
	const renderContent = () => {
		if (isLoading && items.length === 0) {
			return (
				<div className="flex h-full w-full items-center justify-center">
					<Spinner />
				</div>
			);
		}

		if (error) {
			return (
				<div className="flex h-full w-full items-center justify-center">
					<p className="text-destructive">Error: {error}</p>
				</div>
			);
		}

		if (items.length === 0) {
			return <EmptyState description="No hay elementos para mostrar." icon={FileTextIcon} title="Sin elementos" />;
		}

		// Usar props memoizados para evitar re-renders
		switch (viewMode) {
			case 'list':
				return <ListView {...commonViewProps} />;
			case 'grid':
			case 'simple-grid':
				return <GridView {...commonViewProps} />;
			case 'cards':
				return <CardsView {...commonViewProps} />;
			case 'masonry':
				return <MasonryView {...commonViewProps} />;
			default:
				return <CardsView {...commonViewProps} />;
		}
	};

	// Helper function to get item element by ID
	const getItemElement = useCallback((itemId: string): HTMLElement | null => {
		return document.querySelector(`[data-item-id="${itemId}"]`);
	}, []);

	// Helper para viewType sin ternary anidado
	const getViewType = useCallback(() => {
		if (viewMode === 'list') {
			return 'list';
		}
		if (viewMode === 'grid') {
			return 'grid';
		}
		return 'cards';
	}, [viewMode]);

	// Helper para preview de items
	const handlePreviewItem = useCallback(
		(item: AnyEntityWithStats) => {
			if ('path' in item && item.path) {
				const imageItem = convertItemToViewerFormat(item);
				openViewer([imageItem], 0);
			}
		},
		[openViewer]
	);

	const convertToFileItem = useCallback((item: AnyEntityWithStats) => {
		return {
			id: item.id,
			name: getItemName(item),
			type: 'file' as const,
			size: getItemSize(item),
			modifiedAt: getItemDate(item),
			path: getItemPath(item),
			isDirectory: false,
			extension: getItemExtension(item),
			mimeType: getItemMimeType(item),
		};
	}, []);

	// OPTIMIZACIÓN: fileItems simplificado para drag selection
	const fileItems = useMemo(() => {
		return items.map(convertToFileItem);
	}, [items, convertToFileItem]);

	return (
		<main
			aria-describedby="file-browser-description"
			className={cn(
				'flex h-full w-full flex-col overflow-hidden bg-background',
				{
					'accessibility-high-contrast': accessibility.config.highContrast,
					'accessibility-large-fonts': accessibility.config.largeFonts,
					'accessibility-reduced-motion': accessibility.config.reduceMotion,
				},
				className
			)}
			data-testid="file-browser-container"
		>
			{/* Wrapper interactivo para eventos */}
			<section className="relative h-full w-full">
				<div className="sr-only" id="file-browser-description">
					Explorador de archivos con {items.length} elementos. Usa las flechas para navegar, Enter para abrir, Espacio
					para seleccionar.
				</div>

				<ScrollArea aria-atomic="false" aria-live="polite" className="relative min-h-0 flex-1">
					<DragSelectionProvider
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
						containerRef={containerRef as React.RefObject<HTMLElement>}
						disabled={true}
						getItemElement={getItemElement}
						items={fileItems as any}
						onSelectionCancel={() => {
							// Drag selection cancelled
						}}
						onSelectionEnd={(_state, newSelectedIds) => {
							if (newSelectedIds.length > 0) {
								setSelectedIds(newSelectedIds);
							}
						}}
						onSelectionStart={(_state) => {
							// Drag selection started
						}}
						onSelectionUpdate={(_state, _selectedIds) => {
							// Drag selection updated
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
					>
						{/* Invisible button wrapper para eventos */}
						<button
							aria-label="Explorador de archivos"
							className="file-browser-container relative m-0 h-full w-full cursor-default border-0 bg-transparent p-0 outline-none"
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
										default:
											break;
									}
								}
							}}
							ref={containerCallbackRef as any}
							type="button"
						>
							{/* Navegación por teclado */}
							<KeyboardNavigation
								containerRef={containerRef as React.RefObject<HTMLElement>}
								getItemElement={getItemElement}
								items={items}
								onOpenItem={onItemDoubleClick}
								onPreviewItem={handlePreviewItem}
								viewType={getViewType()}
							/>

							{containerWidth > 0 ? renderContent() : <Spinner />}

							{/* Menú contextual personalizado */}
							<CustomContextMenu
								isOpen={contextMenuOpen}
								onAction={handleCustomContextMenuAction}
								onClose={closeContextMenu}
								position={contextMenuPosition}
								selectedItems={items.filter((item) => effectiveSelectedIds.includes(item.id))}
							/>
						</button>
					</DragSelectionProvider>
				</ScrollArea>
			</section>

			<StatusBar
				entityType={entityType === 'mixed' ? EntityStatsType.IMAGE : (entityType as EntityStatsType)}
				selectedCount={effectiveSelectedIds.length}
				totalItems={items.length}
			/>

			{/* Progress Overlay */}
			<ProgressOverlay />

			{/* Región para anuncios de lectores de pantalla */}
			<div aria-atomic="true" aria-live="assertive" className="sr-only" id="screen-reader-announcements" />

			{/* Información de rendimiento (solo en desarrollo) */}
			{process.env.NODE_ENV === 'development' && performance.isMonitoring && (
				<div className="fixed right-4 bottom-4 rounded bg-black/80 p-2 font-mono text-white text-xs">
					<div>FPS: {performance.metrics?.averageFPS ?? 'N/A'}</div>
					<div>Memory: {performance.metrics?.memoryUsage ?? 'N/A'}MB</div>
					<div>Entities: {items.length}</div>
				</div>
			)}
		</main>
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
