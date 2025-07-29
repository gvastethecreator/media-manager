/**
 * @file Vista de grid con configuración avanzada usando TanStack Virtual
 * @module components/features/file-browser/views/grid-view
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import { memo, useCallback, useMemo, useState, useRef } from 'react';
import { EntityCard } from '@/components/cards/entity-card';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '@/components/ui/context-menu';
import { FileContextMenu } from '@/components/features/file-browser/context-menu/context-menu';
import { handleContextAction } from '@/components/features/file-browser/context-menu';
import { cn } from '@/lib/utils';
import { entityToFileItem } from '@/types/file-browser/file-item';
import { useViewConfiguration } from '../../../../hooks/use-view-configuration';
import { useGridViewConfig } from '@/hooks/use-grid-view-config';
import type { AnyEntityWithStats } from '@/types/migration';
import type { GridViewConfig } from '@/types/file-browser/grid-view-config';
import type { ContextMenuAction } from '@/components/features/file-browser/context-menu/types';
import { type BaseVirtualizedViewProps, useVirtualizedContainer, VirtualizedContainer } from './base-virtualized-view';

interface GridViewProps extends BaseVirtualizedViewProps<AnyEntityWithStats> {
	/** Tipo de entidad para configuración específica */
	entityType?: string;
	/** Handler para acciones del menú contextual */
	onContextAction?: (action: ContextMenuAction, item: AnyEntityWithStats, data?: Record<string, unknown>) => void;
}

export const GridView = memo<GridViewProps>(function GridView({
	items,
	itemSize,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
	entityType = 'default',
	onContextAction,
}) {
	const [parentRef, { containerHeight, containerWidth: actualWidth, isReady }] = useVirtualizedContainer({
		paddingTop: 20,
		paddingBottom: 20,
	});
	const gridRef = useRef<HTMLDivElement>(null);

	// Usar hook de configuración unificada
	const { getViewSpecificConfig } = useViewConfiguration('grid');
	const viewConfig = getViewSpecificConfig<GridViewConfig>();

	// Usar hook de configuración específica (legacy support)
	const {
		config,
		calculateLayout,
		calculateItemDimensions,
		getHoverOverlayConfig,
		getLabelConfig,
		shouldShowAnimation,
		getAnimationDelay,
		getAnimationDuration
	} = useGridViewConfig();

	// Combinar configuraciones: la nueva configuración tiene prioridad
	const effectiveConfig = {
		...config,
		// Use default values for now since viewConfig structure is different
		showThumbnails: true,
		showMetadata: false,
		showTags: false,
		showStats: false,
		enableAnimations: true,
		animationDuration: 200,
		enableHoverEffects: true,
	};

	// Estado para hover
	const [hoveredItem, setHoveredItem] = useState<string | null>(null);

	// Crear función handler para el menú contextual
	const createHandleContextMenuAction = useCallback((item: AnyEntityWithStats) => {
		return async (action: ContextMenuAction, data?: Record<string, unknown>) => {
			if (onContextAction) {
				onContextAction(action, item, data);
			} else {
				// Fallback al handler por defecto - convertir item a FileItem
				const fileItem = entityToFileItem(item);
				await handleContextAction(
					action,
					fileItem,
					undefined, // items array no se usa aquí
					undefined, // toggleSelection no disponible en view component
					undefined  // refreshView no disponible en view component
				);
			}
		};
	}, [onContextAction]);

	// Usar el ancho real del contenedor en lugar del prop
	const effectiveWidth = actualWidth || containerWidth;

	// Handler para clicks en espacio vacío
	const handleEmptySpaceClick = useCallback((e: React.MouseEvent) => {
		// Solo actuar si el click es directamente en el contenedor de la vista
		const target = e.target as HTMLElement;
		const currentTarget = e.currentTarget as HTMLElement;

		// Verificar si es un click en espacio vacío (no en elementos de la grid)
		const isEmptySpaceClick = target === currentTarget ||
			(!target.closest('.entity-card') &&
				!target.closest('[data-entity-card]') &&
				!target.closest('button') &&
				!target.closest('[role="button"]') &&
				!target.closest('input') &&
				!target.closest('textarea') &&
				!target.closest('[data-testid="file-browser-item"]') &&
				!target.closest('.grid > div') && // Evitar clicks en elementos de la grid
				!target.closest('[style*="position: absolute"]') &&
				!target.closest('[data-virtualized-item="true"]'));

		if (isEmptySpaceClick && selectedIds.length > 0) {
			// Feedback visual para la deselección
			currentTarget.style.transition = 'background-color 0.15s ease';
			currentTarget.style.backgroundColor = 'rgba(var(--primary), 0.08)';

			setTimeout(() => {
				currentTarget.style.backgroundColor = '';
				currentTarget.style.transition = '';
			}, 150);
		}

		// Propagar el evento hacia arriba para que FileBrowser lo maneje
		// No hacer e.stopPropagation() aquí para permitir que el evento burbujee
	}, [selectedIds.length]);

	// Calcular configuración de la grid usando la nueva configuración
	const layout = useMemo(() => {
		return calculateLayout(effectiveWidth, items.length);
	}, [calculateLayout, effectiveWidth, items.length]);

	// Navegación por teclado mejorada
	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (!gridRef.current) return;

		const focusedElement = document.activeElement as HTMLElement;
		if (!focusedElement?.closest('[data-item-id]')) return;

		const gridItems = Array.from(gridRef.current.querySelectorAll('[data-item-id]')) as HTMLElement[];
		const currentIndex = gridItems.findIndex(item => item.contains(focusedElement));
		if (currentIndex === -1) return;

		let nextIndex = currentIndex;

		switch (e.key) {
			case 'ArrowRight':
				nextIndex = Math.min(currentIndex + 1, gridItems.length - 1);
				break;
			case 'ArrowLeft':
				nextIndex = Math.max(currentIndex - 1, 0);
				break;
			case 'ArrowDown':
				nextIndex = Math.min(currentIndex + layout.columns, gridItems.length - 1);
				break;
			case 'ArrowUp':
				nextIndex = Math.max(currentIndex - layout.columns, 0);
				break;
			case 'Home':
				nextIndex = 0;
				break;
			case 'End':
				nextIndex = gridItems.length - 1;
				break;
			default:
				return;
		}

		e.preventDefault();
		gridItems[nextIndex]?.focus();
	}, [layout.columns]);

	// Calcular dimensiones de items basado en configuración
	const itemDimensions = useMemo(() => {
		return {
			width: layout.itemSize,
			height: layout.itemHeight,
		};
	}, [layout.itemSize, layout.itemHeight]);

	// Configuraciones de overlay y label
	const hoverOverlayConfig = getHoverOverlayConfig();
	const labelConfig = getLabelConfig();

	// Calcular filas necesarias
	const rowCount = Math.ceil(items.length / layout.columns);
	const rowHeight = itemDimensions.height + layout.gap;

	// Configurar virtualizador para filas
	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => parentRef.current,
		estimateSize: () => rowHeight,
		overscan: 3,
	});

	// Función para obtener items de una fila específica
	const getRowItems = (rowIndex: number): AnyEntityWithStats[] => {
		const startIndex = rowIndex * layout.columns;
		const endIndex = Math.min(startIndex + layout.columns, items.length);
		return items.slice(startIndex, endIndex);
	};

	// Handlers para evitar recreación en cada render
	const createHandleClick = useCallback(
		(item: AnyEntityWithStats) => (e: React.MouseEvent) => {
			e.stopPropagation();
			onItemClick(item, e);
		},
		[onItemClick]
	);

	const createHandleDoubleClick = useCallback(
		(item: AnyEntityWithStats) => () => {
			onItemDoubleClick(item);
		},
		[onItemDoubleClick]
	);

	return (
		<VirtualizedContainer
			ref={parentRef}
			height={containerHeight}
			width={effectiveWidth}
			padding={layout.padding}
			isReady={isReady}
			className="overflow-auto"
			onClick={handleEmptySpaceClick}
		>
			<div
				ref={gridRef}
				role="grid"
				aria-label={`Vista de cuadrícula con ${items.length} elementos`}
				aria-rowcount={rowCount}
				aria-colcount={layout.columns}
				tabIndex={0}
				onKeyDown={handleKeyDown}
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative',
				}}
				data-testid="grid-view"
				data-view-type="grid"
			>
				{rowVirtualizer.getVirtualItems().map((virtualRow) => {
					const rowItems = getRowItems(virtualRow.index);

					return (
						<div
							key={virtualRow.key}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: `${rowHeight}px`,
								transform: `translateY(${virtualRow.start}px)`,
							}}
						>
							<div
								className="grid"
								style={{
									gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
									gap: `${layout.gap}px`,
									height: `${itemDimensions.height}px`,
								}}
							>
								{rowItems.map((item, columnIndex) => {
									const isSelected = selectedIds.includes(item.id);
									const itemIndex = virtualRow.index * layout.columns + columnIndex;
									const isHovered = hoveredItem === item.id;
									const showAnimation = effectiveConfig.enableAnimations && shouldShowAnimation(itemIndex);
									const row = virtualRow.index + 1;
									const col = columnIndex + 1;

									return (
										<motion.div
											key={item.id}
											initial={showAnimation ? { opacity: 0, scale: 0.8 } : false}
											animate={showAnimation ? { opacity: 1, scale: 1 } : {}}
											transition={showAnimation ? {
												delay: getAnimationDelay(itemIndex),
												duration: getAnimationDuration(),
											} : {}}
											className={cn(
												'relative cursor-pointer',
												effectiveConfig.enableHoverEffects && 'hover:z-10',
												isSelected && effectiveConfig.showSelectionIndicators && 'ring-2 ring-primary ring-offset-2'
											)}
											style={{
												width: `${itemDimensions.width}px`,
												height: `${itemDimensions.height}px`,
												transition: effectiveConfig.enableAnimations ? `all ${effectiveConfig.animationDuration}ms ease` : 'none',
											}}
											onMouseEnter={() => setHoveredItem(item.id)}
											onMouseLeave={() => setHoveredItem(null)}
											role="gridcell"
											aria-rowindex={row}
											aria-colindex={col}
											aria-setsize={items.length}
											aria-posinset={itemIndex + 1}
											data-item-id={item.id}
											tabIndex={itemIndex === 0 ? 0 : -1}
										>
											<ContextMenu>
												<ContextMenuTrigger asChild>
													<EntityCard
														entity={item}
														isSelected={isSelected}
														compact={true}
														className="h-full w-full"
														onClick={createHandleClick(item)}
														onDoubleClick={createHandleDoubleClick(item)}
														aria-label={`${item.name || 'Elemento'} - ${(item as any).entityType || 'archivo'}`}
													/>
												</ContextMenuTrigger>
												<ContextMenuContent>
													<FileContextMenu
														file={entityToFileItem(item)}
														onAction={(action, file, data) => createHandleContextMenuAction(item)(action, data)}
													/>
												</ContextMenuContent>
											</ContextMenu>

											{/* Hover overlay */}
											{/* TODO: Fix type incompatibility between HoverOverlayConfig and GridHoverOverlay */}
											{/* {hoverOverlayConfig && (
												<GridItemOverlay
													entity={item}
													config={hoverOverlayConfig}
													isVisible={isHovered}
												/>
											)} */}

											{/* Label */}
											{/* TODO: Fix type incompatibility between LabelConfig and GridLabelConfig */}
											{/* {labelConfig.position !== 'none' && (
												<GridItemLabel
													entity={item}
													config={labelConfig}
												/>
											)} */}
										</motion.div>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>
		</VirtualizedContainer>
	);
});
