/**
 * @file Vista de cuadrícula optimizada con virtualización simple
 * @module components/features/file-browser/views/grid-view
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { OptimizedEntityCard } from '@/components/cards/entity-card';
import { useGridViewConfig } from '@/hooks/use-grid-view-config';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';

interface GridViewProps {
	items: AnyEntityWithStats[];
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: AnyEntityWithStats) => void;
}

export const GridView = memo<GridViewProps>(function GridViewComponent({
	items,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	const parentRef = useRef<HTMLDivElement>(null);
	const gridRef = useRef<HTMLDivElement>(null);
	const hasMountedRef = useRef(false);

	// Configuración simplificada (omitimos 'config' no usado)
	const { calculateLayout } = useGridViewConfig();

	// OPTIMIZACIÓN AVANZADA: Memoización de props derivadas para evitar re-cálculos
	const derivedProps = useMemo(
		() => ({
			hasSelection: selectedIds.length > 0,
			itemCount: items.length,
			isVirtualized: items.length > 100,
		}),
		[selectedIds.length, items.length]
	);

	// Calcular layout de la grid - Optimizado con dependencias mínimas
	const layout = useMemo(
		() => calculateLayout(containerWidth, derivedProps.itemCount),
		[calculateLayout, containerWidth, derivedProps.itemCount]
	);

	// OPTIMIZACIÓN: Crear Map estable con useRef para máximo rendimiento
	const itemsByIdRef = useRef(new Map<string, AnyEntityWithStats>());
	const selectedIdsSetRef = useRef(new Set<string>());

	// Actualizar refs solo cuando sea necesario
	useEffect(() => {
		const newMap = new Map<string, AnyEntityWithStats>();
		for (const item of items) {
			newMap.set(item.id, item);
		}
		itemsByIdRef.current = newMap;
		selectedIdsSetRef.current = new Set(selectedIds);
	}, [items, selectedIds]);

	// Handler para clicks en espacio vacío
	const handleEmptySpaceClick = useCallback(
		(e: React.MouseEvent) => {
			const target = e.target as HTMLElement;
			const currentTarget = e.currentTarget as HTMLElement;
			const isEmptySpaceClick =
				target === currentTarget ||
				!(
					target.closest('.entity-card') ||
					target.closest('[data-entity-card]') ||
					target.closest('button') ||
					target.closest('[data-testid="file-browser-item"]')
				);
			if (isEmptySpaceClick && derivedProps.hasSelection) {
				// Visual feedback
				currentTarget.style.transition = 'background-color 0.15s ease';
				currentTarget.style.backgroundColor = 'rgba(var(--primary), 0.08)';
				setTimeout(() => {
					currentTarget.style.backgroundColor = '';
					currentTarget.style.transition = '';
				}, 150);
			}
		},
		[derivedProps.hasSelection]
	);

	// Navegación por teclado
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!gridRef.current) {
				return;
			}
			const focusedElement = document.activeElement as HTMLElement;
			if (!focusedElement?.closest('[data-item-id]')) {
				return;
			}
			const gridItems = Array.from(gridRef.current.querySelectorAll('[data-item-id]')) as HTMLElement[];
			const currentIndex = gridItems.findIndex((item) => item.contains(focusedElement));
			if (currentIndex === -1) {
				return;
			}
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
		},
		[layout.columns]
	);

	// Calcular dimensiones de items y filas para virtualización
	const itemWidth = layout.itemSize;
	const itemHeight = layout.itemHeight;
	const rowCount = Math.ceil(items.length / layout.columns);
	const rowHeight = itemHeight + layout.gap;

	// Configurar virtualizador para filas
	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => {
			const viewport = parentRef.current?.closest('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
			return viewport ?? parentRef.current;
		},
		estimateSize: () => rowHeight,
		overscan: derivedProps.isVirtualized ? 4 : 2,
	});

	// Función para obtener items de una fila específica - Memoizada
	const getRowItems = useCallback(
		(rowIndex: number): AnyEntityWithStats[] => {
			const startIndex = rowIndex * layout.columns;
			return items.slice(startIndex, Math.min(startIndex + layout.columns, items.length));
		},
		[items, layout.columns]
	);

	// Handlers estables
	const handlersRef = useRef({
		onItemClick: (itemId: string, e: React.MouseEvent) => {
			const item = itemsByIdRef.current.get(itemId);
			if (item) {
				onItemClick(item, e);
			}
		},
		onItemDoubleClick: (itemId: string) => {
			const item = itemsByIdRef.current.get(itemId);
			if (item) {
				onItemDoubleClick(item);
			}
		},
	});

	useMemo(() => {
		handlersRef.current.onItemClick = (itemId: string, e: React.MouseEvent) => {
			const item = itemsByIdRef.current.get(itemId);
			if (item) {
				onItemClick(item, e);
			}
		};
		handlersRef.current.onItemDoubleClick = (itemId: string) => {
			const item = itemsByIdRef.current.get(itemId);
			if (item) {
				onItemDoubleClick(item);
			}
		};
	}, [onItemClick, onItemDoubleClick]);

	const handleItemClickById = useCallback((itemId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		handlersRef.current.onItemClick(itemId, e);
	}, []);
	const handleItemDoubleClickById = useCallback((itemId: string) => {
		handlersRef.current.onItemDoubleClick(itemId);
	}, []);

	// Marcas de rendimiento y control de animación sólo montaje inicial
	useEffect(() => {
		if (!hasMountedRef.current) {
			try {
				performance.mark('grid-view-initial-render-start');
				// measure end en microtask
				queueMicrotask(() => {
					try {
						performance.mark('grid-view-initial-render-end');
						performance.measure(
							'grid-view-initial-render',
							'grid-view-initial-render-start',
							'grid-view-initial-render-end'
						);
					} catch (err) {
						/* noop */
					}
				});
			} catch (err) {
				/* noop */
			}
			hasMountedRef.current = true;
		}
	}, []);

	// Estilos base memoizados por tamaño (minimizan nuevas refs al map)
	const baseItemStyle = useMemo(
		() => ({ width: `${itemWidth}px`, height: `${itemHeight}px` }),
		[itemWidth, itemHeight]
	);

	return (
		<section
			aria-label={`Vista de cuadrícula con ${items.length} elementos`}
			className="h-full w-full"
			data-testid="grid-view"
			data-view-type="grid"
			ref={parentRef}
			style={{ position: 'relative' }}
		>
			<div
				className="h-full w-full cursor-default border-0 bg-transparent p-0 text-left"
				onClickCapture={handleEmptySpaceClick}
				role="application"
				style={{ display: 'block' }}
			>
				<div className="relative" ref={gridRef} style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%' }}>
					{rowVirtualizer.getVirtualItems().map((virtualRow) => {
						const rowItems = getRowItems(virtualRow.index);
						return (
							<div
								className="absolute top-0 left-0 w-full"
								key={virtualRow.key}
								style={{
									height: `${rowHeight}px`,
									transform: `translateY(${virtualRow.start}px)`,
									padding: `0 ${layout.padding}px`,
								}}
							>
								<div
									className="grid h-full"
									style={{
										gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
										gap: `${layout.gap}px`,
										height: `${itemHeight}px`,
									}}
								>
									{rowItems.map((item, columnIndex) => {
										const isSelected = selectedIdsSetRef.current.has(item.id);
										const itemIndex = virtualRow.index * layout.columns + columnIndex;
										const disableAnimation = hasMountedRef.current;
										const commonProps = {
											className: cn(
												'relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
												isSelected && 'ring-2 ring-primary ring-offset-2'
											),
											'aria-selected': isSelected || undefined,
											'aria-label': `${item.name || 'Elemento'} - ${(item as any).entityType || 'archivo'}`,
											role: 'gridcell' as const,
											'aria-colindex': columnIndex + 1,
											'aria-rowindex': virtualRow.index + 1,
											'data-item-id': item.id,
											'data-selectable': 'true',
											key: item.id,
											tabIndex: itemIndex === 0 ? 0 : -1,
											onClick: (e: React.MouseEvent) => {
												e.stopPropagation();
												const target = e.target as HTMLElement;
												if (target.closest('button,[role="button"],a,[data-no-select]')) {
													return;
												}
												handlersRef.current.onItemClick(item.id, e);
											},
											onKeyDown: handleKeyDown,
											onDoubleClick: () => handleItemDoubleClickById(item.id),
											style: baseItemStyle,
										};
										if (disableAnimation) {
											return (
												<div {...commonProps} key={item.id}>
													<OptimizedEntityCard
														className="h-full w-full"
														compact={true}
														entity={item}
														isSelected={isSelected}
													/>
												</div>
											);
										}
										return (
											<motion.div
												{...commonProps}
												animate={{ opacity: 1, scale: 1 }}
												initial={{ opacity: 0, scale: 0.85 }}
												key={item.id}
												transition={{ duration: 0.18 }}
											>
												<OptimizedEntityCard
													className="h-full w-full"
													compact={true}
													entity={item}
													isSelected={isSelected}
												/>
											</motion.div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
});
