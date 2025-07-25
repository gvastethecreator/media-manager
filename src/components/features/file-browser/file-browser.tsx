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
import { EntityCard } from '@/components/cards/entity-card';
import type { CardLayout, CardSize, CardVariant } from '@/components/cards/types/card-layout.types';
import { EmptyState } from '@/components/core/data-display';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useImageStore } from '@/store/entities/image';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { type AnyEntityWithStats, EntityStatsType } from '@/types/migration';
import { StatusBar } from './toolbar/status-bar';
import { CardsView } from './views/cards-view';
import { GridView } from './views/grid-view';
import { ListView } from './views/list-view';
import { MasonryView } from './views/masonry-view';

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
	console.log('🔍 FileBrowser - Montando componente con:', { entityType, filterId, filterType, mode });
	const [containerWidth, setContainerWidth] = useState<number>(0);
	const containerRef = useRef<any>(null);
	const measurementAttemptsRef = useRef(0);
	const lastMeasuredElementRef = useRef<unknown>(null);
	// Referencias para evitar cargas duplicadas
	const lastLoadParamsRef = useRef<string>('');
	const isLoadingRef = useRef<boolean>(false);

	// Estados globales
	const viewMode = useViewOptionsStore((state) => state.viewMode);
	const itemSize = useViewOptionsStore((state) => state.itemSize);
	const searchQuery = useViewOptionsStore((state) => state.searchQuery);
	const sortOptions = useViewOptionsStore((state) => state.sortOptions);
	const { selectedIds: globalSelectedIds, setSelectedIds, clearSelection } = useSelectionStore();
	const { setVisible: setDetailsPanelVisible, setSelectedItems: setDetailsPanelItems } = useDetailsPanel();

	// Usar selectedIds globales en lugar de prop local
	const effectiveSelectedIds = globalSelectedIds.length > 0 ? globalSelectedIds : selectedIds;

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
	}, [entityType, entityTypes, filterId, filterType, mode, debouncedLoadData]);

	// Obtener items según el modo y tipo de entidad - Memoizado para mejorar rendimiento y asegurar re-render con sortOptions
	const items = useMemo(() => {
		console.log('🔍 FileBrowser - Calculando items con:', { entityType, filterId, filterType, mode });
		// En modo manual, usar los items proporcionados
		if (mode === 'manual' && manualItems) {
			return manualItems;
		}

		let rawItems: AnyEntityWithStats[] = [];

		// En modo auto, obtener desde stores
		if (entityType === 'mixed') {
			// Modo mixto: combinar múltiples tipos de entidades
			for (const type of entityTypes) {
				switch (type) {
					case 'image':
						if (filterId && filterType === 'folder') {
							rawItems.push(...getImagesByFolder(filterId));
						} else {
							rawItems.push(...getSortedImages());
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
						rawItems = getImagesByFolder(filterId);
						console.log('🔍 FileBrowser - Imágenes filtradas por carpeta:', rawItems.length, { filterId });
					} else {
						rawItems = getSortedImages();
						console.log('🔍 FileBrowser - Todas las imágenes ordenadas:', rawItems.length);
					}
					break;
				}
				// TODO: Añadir otros casos según se implementen
				default:
					console.log('🔍 FileBrowser - Retornando array vacío (entityType no coincide)');
					break;
			}
		}

		// Aplicar filtro de búsqueda si existe
		let filteredItems = rawItems;
		if (searchQuery && searchQuery.trim()) {
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
					let aValue: any, bValue: any;

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
		entityType,
		entityTypes,
		filterId,
		filterType,
		mode,
		manualItems,
		imagesRecord,
		getSortedImages,
		getImagesByFolder,
		searchQuery,
		sortOptions, // Dependencia crítica para re-render cuando cambie la ordenación
	]);

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

	// Manejar click en item
	const handleItemClick = useCallback(
		(item: AnyEntityWithStats, e: React.MouseEvent) => {
			console.log('🔍 FileBrowser - handleItemClick ejecutado:', {
				itemId: item.id,
				hasOnItemClick: !!onItemClick,
				hasOnItemSelect: !!onItemSelect,
			});

			const isShiftClick = e.shiftKey;
			const isCtrlClick = e.ctrlKey || e.metaKey;

			if (isShiftClick) {
				// TODO: Implementar selección por rango
				setSelectedIds([item.id]);
			} else if (isCtrlClick) {
				const newSelection = new Set(effectiveSelectedIds);
				if (newSelection.has(item.id)) {
					newSelection.delete(item.id);
				} else {
					newSelection.add(item.id);
				}
				setSelectedIds(Array.from(newSelection));
			} else {
				setSelectedIds([item.id]);
			}

			onItemSelect?.(item);
			onItemClick?.(item, e);
		},
		[effectiveSelectedIds, setSelectedIds, onItemClick, onItemSelect]
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

	// Añadir efecto para escuchar Escape globalmente
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e?.key === 'Escape') {
				clearSelection();
			}
		};

		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeyDown);
			return () => window.removeEventListener('keydown', handleKeyDown);
		}
	}, [clearSelection]);

	// Función para renderizar item usando EntityCard
	const renderItem = useCallback(
		(item: AnyEntityWithStats, _index: number) => {
			console.log('🔍 FileBrowser - NUEVO LOG - Renderizando item:', {
				id: item.id,
				entityType: 'entityType' in item ? item.entityType : 'unknown',
				timestamp: new Date().toISOString(),
			});

			console.log('🚨 FileBrowser - NUEVO LOG - Props disponibles:', {
				hasOnItemClick: !!onItemClick,
				hasOnItemDoubleClick: !!onItemDoubleClick,
				hasHandleItemClick: !!handleItemClick,
				hasHandleItemDoubleClick: !!handleItemDoubleClick,
				onItemClickType: typeof onItemClick,
				onItemDoubleClickType: typeof onItemDoubleClick,
			});

			const onClickHandler = (e: React.MouseEvent) => {
				console.log('🚨 FileBrowser - onClick handler ejecutado:', { itemId: item.id });
				handleItemClick(item, e);
			};

			const onDoubleClickHandler = () => {
				console.log('🚨 FileBrowser - onDoubleClick handler ejecutado:', { itemId: item.id });
				handleItemDoubleClick(item);
			};

			console.log('� FileBrowser - Handlers creados para EntityCard:', {
				onClickHandler: !!onClickHandler,
				onDoubleClickHandler: !!onDoubleClickHandler,
			});

			return (
				<EntityCard
					key={item.id}
					entity={item as AnyEntityWithStats}
					isSelected={effectiveSelectedIds.includes(item.id)}
					onClick={onClickHandler}
					onDoubleClick={onDoubleClickHandler}
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
			handleItemClick,
			handleItemDoubleClick,
			layout,
			preset,
			variant,
			size,
			onItemClick,
			onItemDoubleClick,
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
		};

		switch (viewMode) {
			case 'list':
				return <ListView {...commonViewProps} />;
			case 'grid':
				return <GridView {...commonViewProps} />;
			case 'cards':
				return <CardsView {...commonViewProps} />;
			case 'simple-grid':
				return <GridView {...commonViewProps} />;
			case 'masonry':
				return <MasonryView {...commonViewProps} />;
			default:
				return <CardsView {...commonViewProps} />;
		}
	};

	return (
		<div className={cn('flex h-full w-full flex-col bg-background overflow-hidden', className)}>
			<ScrollArea className="flex-1 min-h-0">
				<div ref={containerCallbackRef} className="relative h-full w-full bg-transparent cursor-default">
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
				</div>
			</ScrollArea>
			<StatusBar
				totalItems={items.length}
				selectedCount={effectiveSelectedIds.length}
				entityType={entityType === 'mixed' ? EntityStatsType.IMAGE : (entityType as EntityStatsType)}
			/>
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
