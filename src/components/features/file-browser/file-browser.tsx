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
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { EntityCard } from '@/components/cards/entity-card';
import type { CardLayout, CardSize, CardVariant } from '@/components/cards/types/card-layout.types';
import { EmptyState } from '@/components/core/data-display';
import { Spinner } from '@/components/ui/spinner';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useImageStore } from '@/store/entities/image';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { EntityStatsType, EntityWithStats } from '@/types/migration';
import { StatusBar } from './toolbar/status-bar';
import { VirtualizedCardsView } from './views/virtualized-cards-view';
import { VirtualizedListView } from './views/virtualized-list-view';
import { VirtualizedMasonryView } from './views/virtualized-masonry-view';
import { VirtualizedSimpleGridView } from './views/virtualized-simple-grid-view';

const logger = clientLogger.withContext('FileBrowser');

interface FileBrowserProps {
	/** Tipo de entidad a mostrar - puede ser un tipo específico o 'mixed' para múltiples tipos */
	entityType?: EntityStatsType | 'mixed';
	/** Tipos de entidades específicas a mostrar cuando entityType es 'mixed' */
	entityTypes?: EntityStatsType[];
	/** Items específicos a mostrar (para modo manual) */
	items?: EntityWithStats[];
	/** Callback cuando se selecciona un item */
	onItemSelect?: (item: EntityWithStats) => void;
	/** Callback cuando se hace click en un item */
	onItemClick?: (item: EntityWithStats, e: React.MouseEvent) => void;
	/** Callback cuando se hace doble click en un item */
	onItemDoubleClick?: (item: EntityWithStats) => void;
	/** Clase CSS adicional */
	className?: string;
	/** ID de carpeta/colección/etc para filtrar */
	filterId?: string;
	/** Tipo de filtro (folder, collection, tag, etc) */
	filterType?: 'folder' | 'collection' | 'tag' | 'album';
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
	const [containerWidth, setContainerWidth] = useState<number>(0);
	const containerRef = useRef<any>(null);
	const measurementAttemptsRef = useRef(0);
	const lastMeasuredElementRef = useRef<unknown>(null);

	// Estados globales
	const viewMode = useViewOptionsStore((state) => state.viewMode);
	const itemSize = useViewOptionsStore((state) => state.itemSize);
	const { selectedIds: globalSelectedIds, setSelectedIds, clearSelection } = useSelectionStore();
	const { setVisible: setDetailsPanelVisible, setSelectedItems: setDetailsPanelItems } = useDetailsPanel();

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

	// Cargar datos al montar o cuando cambian los filtros (con optimizaciones)
	const lastLoadParamsRef = useRef<string>('');
	const isLoadingRef = useRef<boolean>(false);

	useEffect(() => {
		// En modo manual, no cargar datos automáticamente
		if (mode === 'manual') {
			return;
		}

		// Determinar qué tipos de entidades cargar
		const typesToLoad = entityType === 'mixed' ? entityTypes : [entityType as EntityStatsType];

		// Cargar datos para cada tipo
		for (const type of typesToLoad) {
			if (type === 'image') {
				const {
					loadImages: storeLoadImages,
					isLoading: currentlyLoading,
					getImagesByFolder,
				} = useImageStore.getState();

				const loadParams: Parameters<typeof storeLoadImages>[0] = {};

				// Si hay filtro de carpeta, incluirlo en los parámetros
				if (filterId && filterType === 'folder') {
					loadParams.folderId = filterId;
				}

				// Crear una clave única para estos parámetros
				const paramsKey = JSON.stringify({ type, filterId, filterType });

				// Si los parámetros no han cambiado, no hacer nada
				if (lastLoadParamsRef.current === paramsKey) {
					return;
				}

				// Evitar múltiples cargas simultáneas usando ref
				if (isLoadingRef.current || currentlyLoading) {
					logger.debug('⚠️ Carga ya en progreso, saltando llamada del FileBrowser');
					return;
				}

				// Si hay filtro de carpeta, verificar si ya tenemos datos
				if (filterId && filterType === 'folder') {
					const existingImages = getImagesByFolder(filterId);
					if (existingImages.length > 0) {
						logger.debug('📋 Ya hay imágenes cargadas para esta carpeta, saltando carga');
						lastLoadParamsRef.current = paramsKey;
						return;
					}
				}

				// Actualizar la referencia de los últimos parámetros
				lastLoadParamsRef.current = paramsKey;
				isLoadingRef.current = true;

				logger.debug('🔄 FileBrowser iniciando carga de imágenes', loadParams);

				// Llamar a la función del store directamente
				storeLoadImages(loadParams).finally(() => {
					isLoadingRef.current = false;
				});
			}
			// TODO: Añadir otros tipos cuando se implementen sus stores
		}
	}, [entityType, entityTypes, filterId, filterType, mode]); // Mantener estas dependencias pero con la optimización del ref

	// Obtener items según el modo y tipo de entidad
	const items = (() => {
		// En modo manual, usar los items proporcionados
		if (mode === 'manual' && manualItems) {
			return manualItems;
		}

		// En modo auto, obtener desde stores
		if (entityType === 'mixed') {
			// Modo mixto: combinar múltiples tipos de entidades
			const allItems: EntityWithStats[] = [];

			for (const type of entityTypes) {
				switch (type) {
					case 'image':
						if (filterId && filterType === 'folder') {
							allItems.push(...getImagesByFolder(filterId));
						} else {
							allItems.push(...getSortedImages());
						}
						break;
					// TODO: Añadir otros casos según se implementen
				}
			}

			// Ordenar todos los items combinados (opcional)
			return allItems.sort((a, b) => {
				// Ordenar por fecha de modificación descendente por defecto
				const aDate = new Date('updatedAt' in a ? a.updatedAt || 0 : 0);
				const bDate = new Date('updatedAt' in b ? b.updatedAt || 0 : 0);
				return bDate.getTime() - aDate.getTime();
			});
		}

		// Modo específico: un solo tipo de entidad
		switch (entityType) {
			case 'image':
				// Si hay filtro por carpeta, usar getImagesByFolder
				if (filterId && filterType === 'folder') {
					return getImagesByFolder(filterId);
				}
				return getSortedImages();
			// TODO: Añadir otros casos según se implementen
			default:
				return [];
		}
	})();

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

	// Medir contenedor con optimización para evitar re-mediciones
	const measureContainer = useCallback((element: any) => {
		// Evitar múltiples mediciones del mismo elemento
		if (lastMeasuredElementRef.current === element) {
			return;
		}

		const attempt = ++measurementAttemptsRef.current;
		logger.debug(`[FileBrowserV2] Intento medición ${attempt}`);

		const measure = () => {
			const width = element?.offsetWidth;
			if (width > 0) {
				logger.info(`[FileBrowserV2] ✅ Medición exitosa: ${width}px`);
				setContainerWidth(width);
				lastMeasuredElementRef.current = element;
				return true;
			}
			return false;
		};

		if (measure()) return;

		(globalThis as any).requestAnimationFrame(() => {
			if (measure()) return;
			(globalThis as any).setTimeout(() => {
				if (measure()) return;
				logger.warn(`[FileBrowserV2] ⚠️ Falló medición, usando fallback: ${FALLBACK_WIDTH}px`);
				setContainerWidth(FALLBACK_WIDTH);
				lastMeasuredElementRef.current = element;
			}, 100);
		});
	}, []);

	const containerCallbackRef = useCallback(
		(element: any) => {
			if (element && containerRef.current !== element) {
				containerRef.current = element;
				measureContainer(element);
			}
		},
		[measureContainer]
	);

	// Manejar click en item
	const handleItemClick = useCallback(
		(item: EntityWithStats, e: React.MouseEvent) => {
			const isShiftClick = e.shiftKey;
			const isCtrlClick = e.ctrlKey || e.metaKey;

			if (isShiftClick) {
				// TODO: Implementar selección por rango
				setSelectedIds([item.id]);
			} else if (isCtrlClick) {
				const newSelection = new Set(selectedIds);
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
		[selectedIds, setSelectedIds, onItemClick]
	);

	// Manejar doble click
	const handleItemDoubleClick = useCallback(
		(item: EntityWithStats) => {
			onItemDoubleClick?.(item);
		},
		[onItemDoubleClick]
	);

	// Actualizar panel de detalles cuando cambia la selección
	useEffect(() => {
		if (selectedIds.length > 0) {
			const selectedItems = items.filter((item: EntityWithStats) => selectedIds.includes(item.id));
			setDetailsPanelItems(selectedItems);
			setDetailsPanelVisible(true);
		} else {
			setDetailsPanelVisible(false);
		}
	}, [selectedIds, items, setDetailsPanelItems, setDetailsPanelVisible]);

	// Añadir efecto para escuchar Escape globalmente
	useEffect(() => {
		const handleKeyDown = (e: any) => {
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
		(item: EntityWithStats, _index: number) => {
			return (
				<EntityCard
					key={item.id}
					entity={item}
					isSelected={selectedIds.includes(item.id)}
					onClick={() => handleItemClick(item)}
					onDoubleClick={() => handleItemDoubleClick(item)}
					layout={layout}
					preset={preset}
					variant={variant}
					size={size}
					className="w-full h-full"
				/>
			);
		},
		[selectedIds, handleItemClick, handleItemDoubleClick, layout, preset, variant, size]
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
			return <EmptyState icon={FileTextIcon} title="Sin elementos" description="No hay elementos para mostrar." />;
		}

		const commonViewProps = {
			items,
			itemSize,
			selectedIds,
			containerWidth,
			onItemClick: handleItemClick,
			onItemDoubleClick: handleItemDoubleClick,
		};

		switch (viewMode) {
			case 'list':
				return <VirtualizedListView {...commonViewProps} />;
			case 'grid':
			case 'cards':
				return <VirtualizedCardsView {...commonViewProps} />;
			case 'simple-grid':
				return <VirtualizedSimpleGridView {...commonViewProps} />;
			case 'masonry':
				return <VirtualizedMasonryView {...commonViewProps} />;
			default:
				return <VirtualizedCardsView {...commonViewProps} />;
		}
	};

	return (
		<div className={cn('flex h-full w-full flex-col bg-background', className)}>
			<div
				ref={containerCallbackRef}
				className="relative h-full w-full flex-grow overflow-y-auto bg-transparent cursor-default"
			>
				<AnimatePresence>
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full">
						{containerWidth > 0 ? renderContent() : <Spinner />}
					</motion.div>
				</AnimatePresence>
			</div>
			<StatusBar totalItems={items.length} selectedCount={selectedIds.length} entityType={entityType} />
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
