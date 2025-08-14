// IMPLEMENTACION LIMPIA DEFINITIVA

import React, { memo, useCallback, useMemo } from 'react';
import { OptimizedEntityCard } from '@/components/cards/entity-card';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';

interface CardsViewProps {
	items: AnyEntityWithStats[];
	selectedIds: string[];
	containerWidth: number; // reservado futura responsividad
	onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: AnyEntityWithStats) => void;
	itemSize?: number; // nuevo: controla ancho base aproximado
	interfaceConfig?: any;
}

export const CardsView = memo(function CardsView({
	items,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
	itemSize = 160,
	interfaceConfig,
}: CardsViewProps) {
	const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

	const handleClick = useCallback(
		(item: AnyEntityWithStats) => (e: React.MouseEvent) => {
			e.stopPropagation();
			onItemClick(item, e);
		},
		[onItemClick]
	);

	const handleDouble = useCallback(
		(item: AnyEntityWithStats) => () => {
			onItemDoubleClick(item);
		},
		[onItemDoubleClick]
	);

	if (!items.length) {
		return (
			<div
				className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground text-sm"
				data-testid="cards-view-empty"
			>
				<div className="opacity-70">Sin elementos</div>
			</div>
		);
	}

	// Calcular columnas dinámicas según containerWidth e itemSize
	const effectiveItem = Math.max(120, Math.min(itemSize, 320));
	const gap = 8;
	const cols = Math.max(1, Math.floor((containerWidth - gap) / (effectiveItem + gap)));
	const gridStyle: React.CSSProperties = {
		gridTemplateColumns: `repeat(${cols}, minmax(${effectiveItem}px, 1fr))`,
	};

	return (
		<div
			className={cn('file-browser-view grid w-full gap-2 p-2')}
			data-testid="cards-view"
			data-view-type="cards"
			role="grid"
			style={{
				...gridStyle,
				fontFamily: 'var(--app-font-family)',
				fontSize: 'var(--app-font-size)',
			}}
		>
			{items.map((item) => {
				const isSelected = selectedSet.has(item.id);
				return (
					<button
						className={cn(
							'group relative cursor-pointer overflow-hidden border bg-background/40 p-0 text-left outline-none',
							interfaceConfig?.global?.animations && !interfaceConfig?.global?.ultra
								? 'transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary'
								: 'focus-visible:ring-2 focus-visible:ring-primary',
							isSelected && 'ring-2 ring-primary',
							interfaceConfig?.global?.ultra && 'hover:bg-accent/40'
						)}
						data-item-id={item.id}
						key={item.id}
						onClick={handleClick(item)}
						onDoubleClick={handleDouble(item)}
						style={{
							borderRadius: interfaceConfig?.global?.borderRadius?.card
								? `${interfaceConfig.global.borderRadius.card}px`
								: undefined,
						}}
						type="button"
					>
						<div
							className={cn('w-full', !interfaceConfig?.global?.respectAspect && 'aspect-square')}
							style={{ objectFit: interfaceConfig?.global?.respectAspect ? undefined : 'cover' }}
						>
							<OptimizedEntityCard
								className="h-full w-full"
								compact
								entity={item}
								isSelected={isSelected}
								onClick={() => {}}
								onDoubleClick={() => {}}
								thumbnailQuality={interfaceConfig?.performance?.thumbnailQuality}
							/>
						</div>
					</button>
				);
			})}
		</div>
	);
});

export default CardsView;
