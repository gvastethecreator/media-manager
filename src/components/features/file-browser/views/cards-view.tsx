/**
 * @file Vista de tarjetas para el explorador de archivos.
 * @module components/features/file-browser/views/cards-view
 * @description Este componente renderiza una cuadrícula de entidades utilizando el despachador EntityCard.
 */
'use client';

import { EntityCard } from '@/components/cards/entity-card';
import { useSelectionStore } from '@/store/ui/selection.slice';
import type { AnyEntity } from '@/types/entities';
import type { FC } from 'react';
import { memo, useCallback } from 'react';
import { VirtualizerWrapper } from './virtualizer-wrapper';

interface CardsViewProps {
	items: AnyEntity[];
	onItemClick?: (item: AnyEntity, e: React.MouseEvent) => void;
	onItemDoubleClick?: (item: AnyEntity) => void;
	onContextMenu?: (item: AnyEntity, e: React.MouseEvent) => void;
	className?: string;
}

export const CardsView: FC<CardsViewProps> = memo(function CardsView({
	items,
	onItemClick,
	onItemDoubleClick,
	onContextMenu,
	className,
}) {
	const { selectedIds, activeId } = useSelectionStore();

	const handleItemClick = useCallback(
		(item: AnyEntity) => (e: React.MouseEvent) => {
			onItemClick?.(item, e);
		},
		[onItemClick]
	);

	const handleItemDoubleClick = useCallback(
		(item: AnyEntity) => () => {
			onItemDoubleClick?.(item);
		},
		[onItemDoubleClick]
	);

	const handleContextMenu = useCallback(
		(item: AnyEntity) => (e: React.MouseEvent) => {
			onContextMenu?.(item, e);
		},
		[onContextMenu]
	);

	return (
		<VirtualizerWrapper
			items={items}
			className={className}
			renderItem={(item, { isScrolling, shouldLoad }) => {
				const isSelected = selectedIds.includes(item.id);
				const isActive = activeId === item.id;

				return (
					<EntityCard
						item={item}
						isSelected={isSelected}
						isActive={isActive}
						isScrolling={isScrolling}
						shouldLoad={shouldLoad}
						onClick={handleItemClick(item)}
						onDoubleClick={handleItemDoubleClick(item)}
						onContextMenu={handleContextMenu(item)}
					/>
				);
			}}
		/>
	);
});
