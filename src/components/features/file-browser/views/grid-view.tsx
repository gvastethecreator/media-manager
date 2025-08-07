/**
 * @file Vista de grid optimizada con virtualización simple
 * @module components/features/file-browser/views/grid-view
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import { memo, useCallback, useMemo, useRef } from 'react';
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

export const GridView = memo<GridViewProps>(function GridView({
	items,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	const parentRef = useRef<HTMLDivElement>(null);
	const gridRef = useRef<HTMLDivElement>(null);

	// Configuración simplificada
	const { config, calculateLayout } = useGridViewConfig();

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
	const layout = useMemo(() => {
		return calculateLayout(containerWidth, derivedProps.itemCount);
	}, [calculateLayout, containerWidth, derivedProps.itemCount]);

	// OPTIMIZACIÓN: Crear Map estable con useRef para máximo rendimiento
	const itemsByIdRef = useRef(new Map<string, AnyEntityWithStats>());
	const selectedIdsSetRef = useRef(new Set<string>());

	// Actualizar refs solo cuando sea necesario
	useMemo(() => {
		const newMap = new Map<string, AnyEntityWithStats>();
		for (const item of items) {
			newMap.set(item.id, item);
		}
		itemsByIdRef.current = newMap;

		const newSet = new Set(selectedIds);
		selectedIdsSetRef.current = newSet;

		return { map: newMap, set: newSet };
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
			if (!gridRef.current) return;

			const focusedElement = document.activeElement as HTMLElement;
			if (!focusedElement?.closest('[data-item-id]')) return;

			const gridItems = Array.from(gridRef.current.querySelectorAll('[data-item-id]')) as HTMLElement[];
			const currentIndex = gridItems.findIndex((item) => item.contains(focusedElement));
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
		getScrollElement: () => parentRef.current,
		estimateSize: () => rowHeight,
		overscan: 2,
	});

	// Función para obtener items de una fila específica - Memoizada
	const getRowItems = useCallback(
		(rowIndex: number): AnyEntityWithStats[] => {
			const startIndex = rowIndex * layout.columns;
			const endIndex = Math.min(startIndex + layout.columns, items.length);
			return items.slice(startIndex, endIndex);
		},
		[items, layout.columns]
	);

	// OPTIMIZACIÓN AVANZADA: Handlers estables con useRef para máximo rendimiento
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

	// Actualizar handlers cuando cambien las dependencias
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

	// Handlers estables que no cambian entre renders
	const handleItemClickById = useCallback((itemId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		handlersRef.current.onItemClick(itemId, e);
	}, []);

	const handleItemDoubleClickById = useCallback((itemId: string) => {
		handlersRef.current.onItemDoubleClick(itemId);
	}, []);

	return (
		<div
			aria-label={`Vista de cuadrícula con ${items.length} elementos`}
			className="h-full w-full overflow-auto"
			data-testid="grid-view"
			data-view-type="grid"
			onClickCapture={handleEmptySpaceClick}
			ref={parentRef}
			role="grid"
		>
			<div
				className="relative"
				onKeyDown={handleKeyDown}
				ref={gridRef}
				role="presentation"
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: '100%',
				}}
			>
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

									return (
										<motion.div
											animate={{ opacity: 1, scale: 1 }}
											className={cn('relative cursor-pointer', isSelected && 'ring-2 ring-primary ring-offset-2')}
											data-item-id={item.id}
											data-selectable="true"
											initial={{ opacity: 0, scale: 0.8 }}
											key={item.id}
											style={{
												width: `${itemWidth}px`,
												height: `${itemHeight}px`,
											}}
											tabIndex={itemIndex === 0 ? 0 : -1}
											transition={{
												delay: itemIndex * 0.02,
												duration: 0.2,
											}}
										>
											<OptimizedEntityCard
												aria-label={`${item.name || 'Elemento'} - ${(item as any).entityType || 'archivo'}`}
												className="h-full w-full"
												compact={true}
												entity={item}
												isSelected={isSelected}
												itemId={item.id}
												onClickById={handleItemClickById}
												onDoubleClickById={handleItemDoubleClickById}
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
	);
});
