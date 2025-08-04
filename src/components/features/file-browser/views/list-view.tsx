/**
 * @file Vista de lista con columnas configurables usando TanStack Virtual
 * @module components/features/file-browser/views/list-view
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useListViewConfig } from '@/hooks/use-list-view-config';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';
import { ListViewHeader } from './list-view-header';
import { ListViewRow } from './list-view-row';

interface ListViewProps {
	items: AnyEntityWithStats[];
	selectedIds: string[];
	sortBy?: string;
	sortDirection?: 'asc' | 'desc';
	onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: AnyEntityWithStats) => void;
	onSort?: (columnKey: string, direction: 'asc' | 'desc') => void;
	entityType?: string;
	className?: string;
}

export const ListView = memo<ListViewProps>(function ListView({
	items,
	selectedIds,
	sortBy,
	sortDirection = 'asc',
	onItemClick,
	onItemDoubleClick,
	onSort,
	entityType = 'default',
	className = '',
}) {
	const parentRef = useRef<HTMLDivElement>(null);
	const tableRef = useRef<HTMLTableElement>(null);
	const [containerHeight, setContainerHeight] = useState<number>(600);

	// OPTIMIZACIÓN AVANZADA: Memoización de props derivadas para evitar re-cálculos
	const derivedProps = useMemo(
		() => ({
			hasSelection: selectedIds.length > 0,
			itemCount: items.length,
			isVirtualized: items.length > 50,
			hasSort: Boolean(sortBy),
			sortConfig: { field: sortBy, direction: sortDirection },
		}),
		[selectedIds.length, items.length, sortBy, sortDirection]
	);

	// OPTIMIZACIÓN: Referencias estables con useRef para máximo rendimiento
	const itemsByIdRef = useRef(new Map<string, AnyEntityWithStats>());
	const selectedIdsSetRef = useRef(new Set<string>());

	// Actualizar refs solo cuando sea necesario - Optimizado para evitar re-cálculos
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

	// Usar hook de configuración de ListView
	const { config, visibleColumns, updateColumn, reorderColumns, toggleColumnVisibility, getColumnsWithRenderers } =
		useListViewConfig();

	// Obtener columnas con renderers para el tipo de entidad actual - Memoizado
	const columnsWithRenderers = useMemo(() => {
		return getColumnsWithRenderers(entityType);
	}, [getColumnsWithRenderers, entityType]);

	// Handler para clicks en espacio vacío
	const handleEmptySpaceClick = useCallback(
		(e: React.MouseEvent) => {
			// Solo actuar si el click es directamente en el contenedor de la vista
			const target = e.target as HTMLElement;
			const currentTarget = e.currentTarget as HTMLElement;

			// Verificar si es un click en espacio vacío (no en elementos de la lista)
			const isEmptySpaceClick =
				target === currentTarget ||
				(!target.closest('[data-testid^="list-row-"]') &&
					!target.closest('th') &&
					!target.closest('button') &&
					!target.closest('[role="button"]') &&
					!target.closest('input') &&
					!target.closest('textarea') &&
					!target.closest('[data-radix-dropdown-menu-content]') &&
					!target.closest('[data-radix-dropdown-menu-trigger]'));

			if (isEmptySpaceClick && derivedProps.hasSelection) {
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
		},
		[derivedProps.hasSelection]
	);

	// Navegación por teclado para vista de lista
	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (!parentRef.current) return;

		const focusedElement = document.activeElement as HTMLElement;
		if (!focusedElement?.closest('[data-testid^="list-row-"]')) return;

		const rows = Array.from(parentRef.current.querySelectorAll('[data-testid^="list-row-"]')) as HTMLElement[];
		const currentIndex = rows.findIndex((row) => row.contains(focusedElement));
		if (currentIndex === -1) return;

		let nextIndex = currentIndex;

		switch (e.key) {
			case 'ArrowDown':
				nextIndex = Math.min(currentIndex + 1, rows.length - 1);
				break;
			case 'ArrowUp':
				nextIndex = Math.max(currentIndex - 1, 0);
				break;
			case 'Home':
				nextIndex = 0;
				break;
			case 'End':
				nextIndex = rows.length - 1;
				break;
			case 'PageDown':
				nextIndex = Math.min(currentIndex + 10, rows.length - 1);
				break;
			case 'PageUp':
				nextIndex = Math.max(currentIndex - 10, 0);
				break;
			default:
				return;
		}

		e.preventDefault();
		rows[nextIndex]?.focus();
		rows[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}, []);

	// Efecto para medir y establecer altura del contenedor
	useEffect(() => {
		if (parentRef.current) {
			const scrollAreaViewport = parentRef.current.closest('[data-radix-scroll-area-viewport]');
			if (scrollAreaViewport) {
				const observer = new ResizeObserver((entries) => {
					for (const entry of entries) {
						const height = entry.contentRect.height;
						if (height > 0) {
							setContainerHeight(height - 48); // Restar padding
						}
					}
				});
				observer.observe(scrollAreaViewport);
				return () => observer.disconnect();
			}
			// Fallback: usar el viewport más cercano
			const viewport = parentRef.current.closest('.flex-1, .h-full');
			if (viewport) {
				setContainerHeight(viewport.clientHeight - 48);
			}
		}
	}, []);

	// Configurar virtualizador
	const rowVirtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => config.rowHeight + config.rowGap,
		overscan: 5,
	});

	// Handlers para funcionalidades del header - Optimizados con memoización
	const headerHandlers = useMemo(
		() => ({
			onColumnResize: async (columnKey: string, width: number) => {
				await updateColumn(columnKey, { width });
			},
			onColumnReorder: async (fromIndex: number, toIndex: number) => {
				await reorderColumns(fromIndex, toIndex);
			},
			onColumnToggle: async (columnKey: string) => {
				await toggleColumnVisibility(columnKey);
			},
		}),
		[updateColumn, reorderColumns, toggleColumnVisibility]
	);

	// OPTIMIZACIÓN AVANZADA: Handlers estables con useRef para máximo rendimiento
	const handlersRef = useRef({
		onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => {
			onItemClick(item, e);
		},
		onItemDoubleClick: (item: AnyEntityWithStats) => {
			onItemDoubleClick(item);
		},
	});

	// Actualizar handlers cuando cambien las dependencias
	useMemo(() => {
		handlersRef.current.onItemClick = (item: AnyEntityWithStats, e: React.MouseEvent) => {
			onItemClick(item, e);
		};

		handlersRef.current.onItemDoubleClick = (item: AnyEntityWithStats) => {
			onItemDoubleClick(item);
		};
	}, [onItemClick, onItemDoubleClick]);

	// Handlers estables que no cambian entre renders
	const stableOnItemClick = useCallback((item: AnyEntityWithStats, e: React.MouseEvent) => {
		handlersRef.current.onItemClick(item, e);
	}, []);

	const stableOnItemDoubleClick = useCallback((item: AnyEntityWithStats) => {
		handlersRef.current.onItemDoubleClick(item);
	}, []);

	// Calcular altura de header
	const headerHeight = config.showHeader ? 40 : 0;

	return (
		<div
			className={cn('w-full overflow-hidden', className)}
			data-testid="listview-container"
			data-view-type="list"
			role="grid"
			aria-label={`Vista de lista con ${items.length} elementos`}
			aria-describedby="list-view-instructions"
			onKeyDown={handleKeyDown}
		>
			<div id="list-view-instructions" className="sr-only">
				Usa las flechas arriba y abajo para navegar, Home y End para ir al inicio o final, PageUp y PageDown para
				navegar rápidamente.
			</div>
			{/* Tabla con header fijo */}
			<table ref={tableRef} className="w-full table-fixed">
				{/* Header */}
				{config.showHeader && (
					<ListViewHeader
						columns={columnsWithRenderers}
						sortBy={sortBy}
						sortDirection={sortDirection}
						onSort={onSort}
						onColumnResize={headerHandlers.onColumnResize}
						onColumnReorder={headerHandlers.onColumnReorder}
						onColumnToggle={headerHandlers.onColumnToggle}
						showSettings={true}
					/>
				)}
			</table>

			{/* Contenedor virtualizado */}
			<div
				ref={parentRef}
				className="w-full overflow-auto"
				onClick={handleEmptySpaceClick}
				style={{
					height: `${containerHeight - headerHeight}px`,
					contain: 'strict',
				}}
				role="rowgroup"
				aria-live="polite"
				aria-busy={false}
			>
				<div
					style={{
						height: `${rowVirtualizer.getTotalSize()}px`,
						width: '100%',
						position: 'relative',
					}}
				>
					{rowVirtualizer.getVirtualItems().map((virtualItem) => {
						const item = items[virtualItem.index];
						const isSelected = selectedIdsSetRef.current.has(item.id);
						const isEven = virtualItem.index % 2 === 0;

						return (
							<motion.div
								key={item.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									delay: Math.min(virtualItem.index * 0.005, 0.2),
									duration: 0.2,
								}}
								style={{
									position: 'absolute',
									top: `${virtualItem.start}px`,
									left: 0,
									width: '100%',
									height: `${virtualItem.size}px`,
								}}
								role="row"
								aria-rowindex={virtualItem.index + 1}
								aria-setsize={items.length}
								tabIndex={virtualItem.index === 0 ? 0 : -1}
								data-item-id={item.id}
								data-selectable="true"
							>
								{/* Menú contextual deshabilitado para optimizar performance */}
								<table className="w-full table-fixed">
									<tbody>
										<ListViewRow
											item={item}
											columns={columnsWithRenderers}
											index={virtualItem.index}
											isSelected={isSelected}
											isEven={isEven}
											showZebraStripes={config.showZebraStripes}
											rowHeight={config.rowHeight}
											cellPadding={config.cellPadding}
											showThumbnails={config.showThumbnails}
											thumbnailSize={config.thumbnailSize === 'none' ? undefined : config.thumbnailSize}
											onClick={stableOnItemClick}
											onDoubleClick={stableOnItemDoubleClick}
										/>
									</tbody>
								</table>
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
});
