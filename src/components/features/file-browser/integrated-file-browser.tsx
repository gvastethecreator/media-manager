/**
 * @file IntegratedFileBrowser - Componente que integra FileBrowser con ViewToolbar
 * @module components/features/file-browser/integrated-file-browser
 * @description Proporciona una experiencia completa de navegación de archivos con toolbar integrado
 */

import { memo, useCallback, useMemo } from 'react';
import { ViewToolbar } from '@/components/toolbar/main-toolbar';
import { cn } from '@/lib/utils';
import { useImageStore } from '@/store/entities/image';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { EntityStatsType, EntityWithStats } from '@/types/migration';
import { FileBrowser } from './file-browser';

interface IntegratedFileBrowserProps {
	/** Tipo de entidad a mostrar - puede ser un tipo específico o 'mixed' para múltiples tipos */
	entityType: EntityStatsType | 'mixed';
	/** Tipos de entidades específicas a mostrar cuando entityType es 'mixed' */
	entityTypes?: EntityStatsType[];
	/** Items específicos a mostrar (para modo manual) */
	items?: EntityWithStats[];
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
	/** Modo de funcionamiento */
	mode?: 'auto' | 'manual';
	/** Mostrar toolbar */
	showToolbar?: boolean;
	/** Props adicionales para el toolbar */
	toolbarProps?: {
		isRightPanelCollapsed?: boolean;
		toggleRightPanelCollapse?: () => void;
		isRightPanelVisible?: boolean;
	};
}

export const IntegratedFileBrowser = memo<IntegratedFileBrowserProps>(function IntegratedFileBrowser({
	entityType,
	entityTypes = [],
	items: manualItems,
	onItemSelect,
	onItemDoubleClick,
	className,
	filterId,
	filterType,
	mode = 'auto',
	showToolbar = true,
	toolbarProps,
}) {
	// Estados para la integración con el toolbar
	const { selectedIds } = useSelectionStore();
	const searchQuery = useViewOptionsStore((state) => state.searchQuery);

	// Obtener datos según el tipo de entidad para calcular allItemIds
	const imageStore = useImageStore();

	// Obtener todos los IDs disponibles para el toolbar según entityType
	const allItemIds = useMemo(() => {
		// En modo manual, usar los items proporcionados
		if (mode === 'manual' && manualItems) {
			return manualItems.map((item) => item.id);
		}

		// En modo auto, obtener desde stores
		if (entityType === 'mixed') {
			// Modo mixto: combinar IDs de múltiples tipos
			const allIds: string[] = [];

			for (const type of entityTypes) {
				switch (type) {
					case 'image':
						if (filterId && filterType === 'folder') {
							allIds.push(...imageStore.getImagesByFolder(filterId).map((img: ImageWithStats) => img.id));
						} else {
							allIds.push(...imageStore.getSortedImages().map((img: ImageWithStats) => img.id));
						}
						break;
					// TODO: Añadir otros casos según se implementen otros stores
				}
			}

			return allIds;
		}

		// Modo específico
		switch (entityType) {
			case 'image':
				// Si hay filtro por carpeta, usar getImagesByFolder
				if (filterId && filterType === 'folder') {
					return imageStore.getImagesByFolder(filterId).map((img: ImageWithStats) => img.id);
				}
				// De lo contrario, usar todas las imágenes ordenadas
				return imageStore.getSortedImages().map((img: ImageWithStats) => img.id);
			// TODO: Añadir otros casos según se implementen otros stores
			default:
				return [];
		}
	}, [entityType, entityTypes, filterId, filterType, imageStore, mode, manualItems]);

	// Callback optimizado para selección de items
	const handleItemSelect = useCallback(
		(item: EntityWithStats) => {
			onItemSelect?.(item);
		},
		[onItemSelect]
	);

	// Callback optimizado para doble click
	const handleItemDoubleClick = useCallback(
		(item: EntityWithStats) => {
			onItemDoubleClick?.(item);
		},
		[onItemDoubleClick]
	);

	// Props memoizadas para el toolbar
	const toolbarPropsWithDefaults = useMemo(
		() => ({
			allItemIds,
			...toolbarProps,
		}),
		[allItemIds, toolbarProps]
	);

	return (
		<div className={cn('flex h-full w-full flex-col bg-background', className)}>
			{/* Toolbar integrado */}
			{showToolbar && (
				<div className="flex-shrink-0 border-b border-border">
					<ViewToolbar {...toolbarPropsWithDefaults} />
				</div>
			)}

			{/* FileBrowser principal */}
			<div className="flex-1 overflow-hidden">
				<FileBrowser
					entityType={entityType}
					entityTypes={entityTypes}
					items={manualItems}
					onItemSelect={handleItemSelect}
					onItemDoubleClick={handleItemDoubleClick}
					filterId={filterId}
					filterType={filterType}
					mode={mode}
					className="h-full"
				/>
			</div>
		</div>
	);
});

/**
 * Hook personalizado para facilitar el uso del IntegratedFileBrowser
 */
export function useIntegratedFileBrowser() {
	const selectedIds = useSelectionStore((state) => state.selectedIds);
	const clearSelection = useSelectionStore((state) => state.clearSelection);
	const viewMode = useViewOptionsStore((state) => state.viewMode);
	const searchQuery = useViewOptionsStore((state) => state.searchQuery);

	return {
		selectedIds,
		clearSelection,
		viewMode,
		searchQuery,
		hasSelection: selectedIds.length > 0,
		selectionCount: selectedIds.length,
	};
}

/**
 * 📝 Documentación de uso:
 *
 * Este componente combina FileBrowser con ViewToolbar para proporcionar
 * una experiencia completa de navegación de archivos.
 *
 * Características:
 * - Toolbar integrado con controles de vista, búsqueda y selección
 * - FileBrowser optimizado con virtualización
 * - Gestión de estado unificada con Zustand
 * - Props configurables para diferentes casos de uso
 *
 * Ejemplo de uso:
 * ```tsx
 * <IntegratedFileBrowser
 *   entityType="image"
 *   filterId={folderId}
 *   filterType="folder"
 *   onItemSelect={handleSelect}
 *   onItemDoubleClick={handleDoubleClick}
 *   showToolbar={true}
 *   toolbarProps={{
 *     isRightPanelVisible: true,
 *     toggleRightPanelCollapse: handleTogglePanel
 *   }}
 * />
 * ```
 */
