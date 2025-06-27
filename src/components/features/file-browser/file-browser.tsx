/**
 * @file FileBrowser V2 - Usando tipos optimizados WithStats
 * @module components/features/file-browser/file-browser-v2
 * @description Nueva versión del FileBrowser que usa stores específicos por entidad
 * y tipos optimizados WithStats en lugar de FileItem legacy.
 *
 * MIGRACIÓN: Este componente reemplazará a file-browser.tsx
 */
'use client';

import { EmptyState } from '@/components/core/data-display';
import { Spinner } from '@/components/ui/spinner';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useImageStore } from '@/store/entities/image';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { EntityStatsType, EntityWithStats } from '@/types/migration';
import { FileTextIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar } from './toolbar/status-bar';
import { CardsView } from './views/cards-view';
import { ListView } from './views/list-view';
import { MasonryView } from './views/masonry-view';
import { SimpleGridView } from './views/simple-grid-view';

const logger = clientLogger.withContext('FileBrowser');

interface FileBrowserProps {
	/** Tipo de entidad a mostrar */
	entityType: EntityStatsType;
	/** Callback cuando se selecciona un item */
	onItemSelect?: (item: EntityWithStats) => void;
	/** Callback cuando se hace doble click en un item */
	onItemDoubleClick?: (item: EntityWithStats) => void;
	/** Clase CSS adicional */
	className?: string;
	/** ID de carpeta/colección/etc para filtrar */
	filterId?: string;
	/** Tipo de filtro (folder, collection, tag, etc) */
	filterType?: 'folder' | 'collection' | 'tag' | 'album';
}

const FALLBACK_WIDTH = 1200;

export const FileBrowser = memo<FileBrowserProps>(function FileBrowser({
	entityType,
	onItemSelect,
	onItemDoubleClick,
	className,
	filterId,
	filterType,
}) {
	const [containerWidth, setContainerWidth] = useState<number>(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const measurementAttemptsRef = useRef(0);

	// Estados globales
	const viewMode = useViewOptionsStore((state) => state.viewMode);
	const itemSize = useViewOptionsStore((state) => state.itemSize);
	const { selectedIds, setSelectedIds, clearSelection } = useSelectionStore();
	const { setVisible: setDetailsPanelVisible, setSelectedItems: setDetailsPanelItems } = useDetailsPanel();

	// Por ahora solo soportamos imágenes, expandir según necesidad
	const { images: imagesRecord, isLoading, error, loadImages, getSortedImages } = useImageStore();

	// Cargar datos al montar o cuando cambian los filtros
	useEffect(() => {
		if (entityType === 'image') {
			loadImages();
		}
		// TODO: Añadir otros tipos cuando se implementen sus stores
	}, [entityType, filterId, filterType, loadImages]);

	// Obtener items según el tipo de entidad
	const items = (() => {
		switch (entityType) {
			case 'image':
				return getSortedImages();
			// TODO: Añadir otros casos según se implementen
			default:
				return [];
		}
	})();

	// Medir contenedor
	const measureContainer = useCallback((element: HTMLDivElement) => {
		const attempt = ++measurementAttemptsRef.current;
		logger.debug(`[FileBrowserV2] Intento medición ${attempt}`);

		const measure = () => {
			const width = element.offsetWidth;
			if (width > 0) {
				logger.info(`[FileBrowserV2] ✅ Medición exitosa: ${width}px`);
				setContainerWidth(width);
				return true;
			}
			return false;
		};

		if (measure()) return;

		requestAnimationFrame(() => {
			if (measure()) return;
			setTimeout(() => {
				if (measure()) return;
				logger.warn(`[FileBrowserV2] ⚠️ Falló medición, usando fallback: ${FALLBACK_WIDTH}px`);
				setContainerWidth(FALLBACK_WIDTH);
			}, 100);
		});
	}, []);

	const containerCallbackRef = useCallback(
		(element: HTMLDivElement | null) => {
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
		},
		[selectedIds, setSelectedIds, onItemSelect]
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
			const selectedItems = items.filter((item) => selectedIds.includes(item.id));
			setDetailsPanelItems(selectedItems);
			setDetailsPanelVisible(true);
		} else {
			setDetailsPanelVisible(false);
		}
	}, [selectedIds, items, setDetailsPanelItems, setDetailsPanelVisible]);

	// Añadir efecto para escuchar Escape globalmente
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				clearSelection();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [clearSelection]);

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
			return <EmptyState icon={<FileTextIcon />} title="Sin elementos" description="No hay elementos para mostrar." />;
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
				return <ListView {...commonViewProps} />;
			case 'grid':
			case 'cards':
				return <CardsView {...commonViewProps} />;
			case 'simple-grid':
				return <SimpleGridView {...commonViewProps} />;
			case 'masonry':
				return <MasonryView {...commonViewProps} />;
			default:
				return <CardsView {...commonViewProps} />;
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
 * 📝 Documentación de migración:
 *
 * Cambios principales respecto a file-browser.tsx:
 * 1. Usa EntityWithStats en lugar de FileItem
 * 2. Usa stores específicos por entidad (useImageStore, etc)
 * 3. Props simplificadas - recibe entityType en lugar de items
 * 4. Gestión de datos interna usando stores Zustand
 * 5. Sin conversiones de tipos - usa tipos nativos WithStats
 *
 * Para migrar:
 * 1. Cambiar import de FileBrowser a FileBrowserV2
 * 2. Pasar entityType en lugar de items
 * 3. Los datos se cargan automáticamente desde los stores
 */
