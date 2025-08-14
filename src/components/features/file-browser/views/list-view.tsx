/**
 * @file Vista de lista con columnas configurables usando TanStack Virtual
 * @module components/features/file-browser/views/list-view
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { useListViewConfig } from '@/hooks/use-list-view-config';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';
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
	/** Tamaño global de ítems desde la toolbar; se mapea a altura de fila/thumbnail */
	itemSize?: number;
	interfaceConfig?: any;
}

export const ListView = memo<ListViewProps>(function ListViewComponent({
	items,
	selectedIds,
	sortBy,
	sortDirection = 'asc',
	onItemClick,
	onItemDoubleClick,
	onSort,
	entityType = 'default',
	className = '',
	itemSize,
	interfaceConfig,
}) {
	const parentRef = useRef<HTMLTableElement>(null);
	const tableRef = useRef<HTMLTableElement>(null);

	// OPTIMIZACIÓN AVANZADA: Memoización de props derivadas para evitar re-cálculos
	const derivedProps = useMemo(
		() => ({
			hasSelection: selectedIds.length > 0,
			itemCount: items.length,
			isVirtualized: items.length > 20,
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

	// Derivar altura de fila y tamaño de thumbnail a partir de itemSize (toolbar)
	const derivedSizing = useMemo(() => {
		const MIN_ROW = 40;
		const MAX_ROW = 120;
		if (!itemSize || Number.isNaN(itemSize)) {
			// Usar rowHeight actual y un thumbnailSize válido (nunca 'none')
			const fallbackThumb: 'small' | 'medium' | 'large' =
				config.thumbnailSize === 'small' || config.thumbnailSize === 'medium' || config.thumbnailSize === 'large'
					? config.thumbnailSize
					: 'medium';
			return {
				rowHeight: config.rowHeight,
				thumbSize: fallbackThumb,
			} as const;
		}
		const clamped = Math.max(50, Math.min(300, Math.round(itemSize)));
		const t = (clamped - 50) / (300 - 50);
		const rowHeight = Math.round(MIN_ROW + t * (MAX_ROW - MIN_ROW));
		let thumbSize: 'small' | 'medium' | 'large';
		if (clamped < 110) {
			thumbSize = 'small';
		} else if (clamped < 200) {
			thumbSize = 'medium';
		} else {
			thumbSize = 'large';
		}
		return { rowHeight, thumbSize } as const;
	}, [itemSize, config.rowHeight, config.thumbnailSize]);

	// Handler para clicks en espacio vacío
	const handleEmptySpaceClick = useCallback(
		(e: React.MouseEvent) => {
			// Solo actuar si el click es directamente en el contenedor de la vista
			const target = e.target as HTMLElement;
			const currentTarget = e.currentTarget as HTMLElement;

			// Verificar si es un click en espacio vacío (no en elementos de la lista)
			const isEmptySpaceClick =
				target === currentTarget ||
				!(
					target.closest('[data-testid^="list-row-"]') ||
					target.closest('th') ||
					target.closest('button') ||
					target.closest('[role="button"]') ||
					target.closest('input') ||
					target.closest('textarea') ||
					target.closest('[data-radix-dropdown-menu-content]') ||
					target.closest('[data-radix-dropdown-menu-trigger]')
				);

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

	// Manejo de teclado en espacio vacío
	const handleEmptySpaceKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Escape' && derivedProps.hasSelection) {
				e.preventDefault();
				// Propagar hacia FileBrowser
			}
		},
		[derivedProps.hasSelection]
	);

	// Navegación por teclado para vista de lista
	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (!parentRef.current) {
			return;
		}

		const focusedElement = document.activeElement as HTMLElement;
		if (!focusedElement?.closest('[data-testid^="list-row-"]')) {
			return;
		}

		const rows = Array.from(parentRef.current.querySelectorAll('[data-testid^="list-row-"]')) as HTMLElement[];
		const currentIndex = rows.findIndex((row) => row.contains(focusedElement));
		if (currentIndex === -1) {
			return;
		}

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

	// 🚀 Optimización: Virtualización mejorada con configuraciones optimizadas
	const getScrollElement = useCallback(() => {
		const viewport = parentRef.current?.closest('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
		return viewport ?? parentRef.current;
	}, []);

	const estimateSize = useCallback(
		() => derivedSizing.rowHeight + config.rowGap,
		[derivedSizing.rowHeight, config.rowGap]
	);

	const virtualizationEnabled = interfaceConfig?.performance?.virtualization !== false;
	const overscan = interfaceConfig?.performance?.overscan ?? 5;
	const rowVirtualizer = useVirtualizer({
		count: items.length,
		getScrollElement,
		estimateSize,
		enabled: virtualizationEnabled,
		overscan,
	});

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

	return (
		<div
			className={cn('min-h-0 w-full', className)}
			data-testid="listview-container"
			data-view-type="list"
			style={{ fontFamily: 'var(--app-font-family)', fontSize: 'var(--app-font-size)' }}
		>
			{/* Contenedor virtualizado */}
			<table
				aria-busy={false}
				aria-live="polite"
				className="h-full w-full table-fixed"
				onKeyDown={handleEmptySpaceKeyDown}
				ref={parentRef}
			>
				<tbody
					style={{
						height: `${rowVirtualizer.getTotalSize()}px`,
						width: '100%',
						position: 'relative',
					}}
				>
					{(virtualizationEnabled
						? rowVirtualizer.getVirtualItems()
						: items.map(
								(_, i) =>
									({
										index: i,
										key: items[i].id,
										start: i * (derivedSizing.rowHeight + config.rowGap),
										size: derivedSizing.rowHeight + config.rowGap,
									}) as any
							)
					).map((virtualItem: any) => {
						const item = items[virtualItem.index];
						const isSelected = selectedIdsSetRef.current.has(item.id);
						const isEven = virtualItem.index % 2 === 0;

						return (
							<ListViewRow
								ariaRowIndex={virtualItem.index + 1}
								ariaSetSize={items.length}
								cellPadding={config.cellPadding}
								columns={columnsWithRenderers}
								dataItemId={item.id}
								dataSelectable
								index={virtualItem.index}
								isEven={isEven}
								isSelected={isSelected}
								item={item}
								key={item.id}
								onClick={stableOnItemClick}
								onDoubleClick={stableOnItemDoubleClick}
								rowHeight={derivedSizing.rowHeight}
								showThumbnails={config.showThumbnails}
								showZebraStripes={config.showZebraStripes}
								tabIndexOverride={virtualItem.index === 0 ? 0 : -1}
								thumbnailSize={derivedSizing.thumbSize}
								virtualStyle={{
									position: 'absolute',
									top: `${virtualItem.start}px`,
									left: 0,
									width: '100%',
									height: `${virtualItem.size}px`,
								}}
							/>
						);
					})}
				</tbody>
			</table>
		</div>
	);
});
