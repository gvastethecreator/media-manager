/**
 * @file Vista adaptativa del file browser que usa el nuevo sistema de layouts
 * @module components/features/file-browser/views/adaptive-file-browser-view
 * @description Vista que se adapta automáticamente según el viewMode y usa EntityCard con layouts
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import React, { memo, useMemo } from 'react';
import { EntityCard } from '@/components/cards/entity-card';
import type { CardLayout, CardSize, CardVariant } from '@/components/cards/types/card-layout.types';
import { cn } from '@/lib/utils';
import type { EntityWithStats } from '@/types/migration';

interface AdaptiveFileBrowserViewProps {
	items: EntityWithStats[];
	selectedIds: string[];
	containerWidth: number;
	containerHeight: number;
	viewMode: 'grid' | 'list' | 'cards' | 'masonry' | 'simple-grid';
	itemSize: number;
	onItemClick: (item: EntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: EntityWithStats) => void;
	className?: string;
}

export const AdaptiveFileBrowserView = memo<AdaptiveFileBrowserViewProps>(function AdaptiveFileBrowserView({
	items,
	selectedIds,
	containerWidth,
	viewMode,
	itemSize,
	onItemClick,
	onItemDoubleClick,
	className,
}) {
	// Configuración de layout basada en el viewMode
	const layoutConfig = useMemo(() => {
		const configs: Record<string, { layout: CardLayout; variant: CardVariant; size: CardSize; preset?: string }> = {
			grid: {
				layout: 'vertical',
				variant: 'default',
				size: 'md',
				preset: 'file-browser-grid',
			},
			list: {
				layout: 'horizontal',
				variant: 'minimal',
				size: 'sm',
				preset: 'file-browser-list',
			},
			cards: {
				layout: 'complete',
				variant: 'elevated',
				size: 'lg',
				preset: 'file-browser-cards',
			},
			masonry: {
				layout: 'masonry',
				variant: 'default',
				size: 'auto',
				preset: 'masonry',
			},
			'simple-grid': {
				layout: 'minimal',
				variant: 'minimal',
				size: 'xs',
				preset: 'file-browser-minimal',
			},
		};

		return configs[viewMode] || configs.grid;
	}, [viewMode]);

	// Configuración de virtualización basada en el layout
	const virtualizationConfig = useMemo(() => {
		switch (viewMode) {
			case 'list':
				return {
					type: 'list' as const,
					estimateSize: (): number => 60,
					columns: 1,
					gap: 4,
				};
			case 'cards':
				return {
					type: 'grid' as const,
					estimateSize: () => 320,
					columns: Math.max(1, Math.floor(containerWidth / 300)),
					gap: 16,
				};
			case 'simple-grid':
				return {
					type: 'grid' as const,
					estimateSize: () => 80,
					columns: Math.max(1, Math.floor(containerWidth / 80)),
					gap: 8,
				};
			case 'masonry':
				return {
					type: 'masonry' as const,
					estimateSize: () => 200 + Math.random() * 100, // Altura variable para masonry
					columns: Math.max(1, Math.floor(containerWidth / 250)),
					gap: 12,
				};
			default: {
				const minCellSize = itemSize || 200;
				const gap = 12;
				const padding = 16;
				const availableWidth = containerWidth - padding * 2;
				const cols = Math.max(1, Math.floor((availableWidth + gap) / (minCellSize + gap)));

				return {
					type: 'grid' as const,
					estimateSize: () => minCellSize + 40, // Altura base + padding para contenido
					columns: cols,
					gap,
				};
			}
		}
	}, [viewMode, containerWidth, itemSize]);

	// Renderizar vista de lista
	if (virtualizationConfig.type === 'list') {
		return (
			<ListVirtualizedView
				items={items}
				selectedIds={selectedIds}
				onItemClick={onItemClick}
				onItemDoubleClick={onItemDoubleClick}
				layoutConfig={layoutConfig}
				className={className}
			/>
		);
	}

	// Renderizar vista de grid
	if (virtualizationConfig.type === 'grid') {
		return (
			<GridVirtualizedView
				items={items}
				selectedIds={selectedIds}
				containerWidth={containerWidth}
				onItemClick={onItemClick}
				onItemDoubleClick={onItemDoubleClick}
				layoutConfig={layoutConfig}
				virtualizationConfig={virtualizationConfig}
				className={className}
			/>
		);
	}

	// Renderizar vista masonry (sin virtualización por ahora)
	return (
		<MasonryView
			items={items}
			selectedIds={selectedIds}
			onItemClick={onItemClick}
			onItemDoubleClick={onItemDoubleClick}
			layoutConfig={layoutConfig}
			columns={virtualizationConfig.columns}
			gap={virtualizationConfig.gap}
			className={className}
		/>
	);
});

// Componente para vista de lista virtualizada
interface ListVirtualizedViewProps {
	items: EntityWithStats[];
	selectedIds: string[];
	onItemClick: (item: EntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: EntityWithStats) => void;
	layoutConfig: { layout: CardLayout; variant: CardVariant; size: CardSize; preset?: string };
	className?: string;
}

const ListVirtualizedView = memo<ListVirtualizedViewProps>(function ListVirtualizedView({
	items,
	selectedIds,
	onItemClick,
	onItemDoubleClick,
	layoutConfig,
	className,
}) {
	const parentRef = React.useRef<HTMLDivElement>(null);

	const rowVirtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 60,
		overscan: 10,
	});

	return (
		<div ref={parentRef} className={cn('h-full w-full overflow-auto', className)}>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative',
				}}
			>
				{rowVirtualizer.getVirtualItems().map((virtualItem) => {
					const item = items[virtualItem.index];

					return (
						<motion.div
							key={item.id}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: Math.min(virtualItem.index * 0.01, 0.3), duration: 0.3 }}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: `${virtualItem.size}px`,
								transform: `translateY(${virtualItem.start}px)`,
							}}
						>
							<EntityCard
								entity={item}
								isSelected={selectedIds.includes(item.id)}
								onClick={(e) => onItemClick(item, e)}
								onDoubleClick={() => onItemDoubleClick(item)}
								{...layoutConfig}
								className="w-full h-full"
							/>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
});

// Componente para vista de grid virtualizada
interface GridVirtualizedViewProps {
	items: EntityWithStats[];
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: EntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: EntityWithStats) => void;
	layoutConfig: { layout: CardLayout; variant: CardVariant; size: CardSize; preset?: string };
	virtualizationConfig: { columns: number; gap: number; estimateSize: () => number };
	className?: string;
}

const GridVirtualizedView = memo<GridVirtualizedViewProps>(function GridVirtualizedView({
	items,
	selectedIds,
	// biome-ignore lint/correctness/noUnusedFunctionParameters: Parameter is used in the component's logic and rendering.
	containerWidth,
	onItemClick,
	onItemDoubleClick,
	layoutConfig,
	virtualizationConfig,
	className,
}) {
	const parentRef = React.useRef<HTMLDivElement>(null);
	const { columns, gap, estimateSize } = virtualizationConfig;

	// Calcular filas necesarias
	const rowCount = Math.ceil(items.length / columns);

	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => parentRef.current,
		estimateSize,
		overscan: 3,
	});

	// Función para obtener items de una fila específica
	const getRowItems = (rowIndex: number): EntityWithStats[] => {
		const startIndex = rowIndex * columns;
		const endIndex = Math.min(startIndex + columns, items.length);
		return items.slice(startIndex, endIndex);
	};

	return (
		<div ref={parentRef} className={cn('h-full w-full overflow-auto', className)}>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative',
				}}
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
								height: `${virtualRow.size}px`,
								transform: `translateY(${virtualRow.start}px)`,
								padding: `${gap / 2}px`,
							}}
						>
							<div
								className="grid h-full"
								style={{
									gridTemplateColumns: `repeat(${columns}, 1fr)`,
									gap: `${gap}px`,
								}}
							>
								{rowItems.map((item, columnIndex) => {
									const itemIndex = virtualRow.index * columns + columnIndex;

									return (
										<motion.div
											key={item.id}
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{
												delay: Math.min(itemIndex * 0.01, 0.2),
												duration: 0.2,
											}}
											className="h-full"
										>
											<EntityCard
												entity={item}
												isSelected={selectedIds.includes(item.id)}
												onClick={(e) => onItemClick(item, e)}
												onDoubleClick={() => onItemDoubleClick(item)}
												{...layoutConfig}
												className="w-full h-full"
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

// Componente para vista masonry (sin virtualización)
interface MasonryViewProps {
	items: EntityWithStats[];
	selectedIds: string[];
	onItemClick: (item: EntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: EntityWithStats) => void;
	layoutConfig: { layout: CardLayout; variant: CardVariant; size: CardSize; preset?: string };
	columns: number;
	gap: number;
	className?: string;
}

const MasonryView = memo<MasonryViewProps>(function MasonryView({
	items,
	selectedIds,
	onItemClick,
	onItemDoubleClick,
	layoutConfig,
	columns,
	gap,
	className,
}) {
	return (
		<div
			className={cn('w-full overflow-auto p-4', className)}
			style={{
				columns: columns,
				columnGap: `${gap}px`,
			}}
		>
			{items.map((item, index) => (
				<motion.div
					key={item.id}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: Math.min(index * 0.02, 0.5), duration: 0.3 }}
					className="break-inside-avoid"
					style={{ marginBottom: `${gap}px` }}
				>
					<EntityCard
						entity={item}
						isSelected={selectedIds.includes(item.id)}
						onClick={(e) => onItemClick(item, e)}
						onDoubleClick={() => onItemDoubleClick(item)}
						{...layoutConfig}
						className="w-full"
					/>
				</motion.div>
			))}
		</div>
	);
});
