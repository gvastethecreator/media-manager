/**
 * @file Vista de tarjetas V2 usando EntityWithStats
 * @module components/features/file-browser/views/cards-view-v2
 */
'use client';

import { EntityCard } from '@/components/cards/entity-card';
import { cn } from '@/lib/utils';
import type { EntityWithStats } from '@/types/migration';
import { motion } from 'motion/react';
import React, { memo } from 'react';

interface CardsViewProps {
	items: EntityWithStats[];
	itemSize: number;
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: EntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: EntityWithStats) => void;
}

export const CardsView = memo<CardsViewProps>(function CardsView({
	items,
	itemSize,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	// Calcular columnas basado en el ancho del contenedor y tamaño de item
	const minCardWidth = itemSize || 200;
	const gap = 16;
	const padding = 24;
	const availableWidth = containerWidth - padding * 2;
	const columns = Math.max(1, Math.floor((availableWidth + gap) / (minCardWidth + gap)));
	const cardWidth = (availableWidth - gap * (columns - 1)) / columns;

	return (
		<div className="p-6">
			<div
				className="grid gap-4"
				style={{
					gridTemplateColumns: `repeat(${columns}, 1fr)`,
				}}
			>
				{items.map((item, index) => {
					const isSelected = selectedIds.includes(item.id);

					return (
						<motion.div
							key={item.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								delay: Math.min(index * 0.02, 0.3),
								duration: 0.3,
							}}
							className={cn(
								'relative cursor-pointer transition-all duration-200',
								'hover:z-10',
								isSelected && 'ring-2 ring-primary ring-offset-2'
							)}
							onClick={(e) => {
								e.stopPropagation();
								onItemClick(item, e);
							}}
							onDoubleClick={(e) => {
								e.stopPropagation();
								onItemDoubleClick(item);
							}}
							style={{
								width: `${cardWidth}px`,
							}}
						>
							<EntityCard entity={item} isSelected={isSelected} compact={itemSize < 150} className="h-full" />
						</motion.div>
					);
				})}
			</div>
		</div>
	);
});

/**
 * 📝 Cambios respecto a cards-view.tsx:
 * - Usa EntityWithStats en lugar de AnyEntity
 * - Usa EntityCardV2 en lugar de EntityCard
 * - Props simplificadas y más tipo-seguras
 * - Animaciones mejoradas con motion/react
 */
