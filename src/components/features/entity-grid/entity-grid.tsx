/**
 * @file Grid de entidades con componentes especializados
 * @module components/features/entity-grid/entity-grid
 * @description Grid basado en React para mostrar entidades abstractas con
 *              componentes visuales especializados por tipo
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CharacterItem } from '../file-browser/views/canvas/items/character-item';
import { PlaceItem } from '../file-browser/views/canvas/items/place-item';
import { ConceptItem } from '../file-browser/views/canvas/items/concept-item';
import { WorldItemItem } from '../file-browser/views/canvas/items/world-item-item';
import { TagItem } from '../file-browser/views/canvas/items/tag-item';
import { CollectionItem } from '../file-browser/views/canvas/items/collection-item';
import { PromptItem } from '../file-browser/views/canvas/items/prompt-item';
import { NoteItem } from '../file-browser/views/canvas/items/note-item';
import { EntityItem } from '../file-browser/views/canvas/items/entity-item';
import type { AnyEntityWithStats } from '@/types/entities';

export interface EntityGridProps {
	/** Items a mostrar */
	items: AnyEntityWithStats[];
	/** Tamaño de cada item en px */
	itemSize?: number;
	/** Gap entre items en px */
	gap?: number;
	/** Modo compacto */
	compact?: boolean;
	/** Callback al hacer click en un item */
	onItemClick?: (item: AnyEntityWithStats) => void;
	/** Callback al hacer doble click */
	onItemDoubleClick?: (item: AnyEntityWithStats) => void;
	/** Clase CSS adicional */
	className?: string;
	/** Número mínimo de columnas */
	minColumns?: number;
	/** Número máximo de columnas */
	maxColumns?: number;
}

/**
 * Determina qué componente renderizar según el tipo de entidad
 */
function getEntityComponent(entityType: string) {
	switch (entityType) {
		case 'character':
			return CharacterItem;
		case 'place':
			return PlaceItem;
		case 'concept':
			return ConceptItem;
		case 'world-item':
			return WorldItemItem;
		case 'tag':
			return TagItem;
		case 'collection':
			return CollectionItem;
		case 'prompt':
			return PromptItem;
		case 'note':
			return NoteItem;
		default:
			return EntityItem;
	}
}

/**
 * Grid responsive para mostrar entidades con componentes especializados
 */
export function EntityGrid({
	items,
	itemSize = 200,
	gap = 16,
	compact = false,
	onItemClick,
	onItemDoubleClick,
	className,
	minColumns = 2,
	maxColumns = 6,
}: EntityGridProps) {
	// Calcular grid columns dinámicamente
	const gridStyle = useMemo(() => {
		return {
			display: 'grid',
			gridTemplateColumns: `repeat(auto-fill, minmax(${itemSize}px, 1fr))`,
			gap: `${gap}px`,
		};
	}, [itemSize, gap]);

	if (items.length === 0) {
		return (
			<div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
				<p>No hay entidades para mostrar</p>
			</div>
		);
	}

	return (
		<div className={cn('w-full p-4', className)} style={gridStyle}>
			{items.map((item) => {
				const ItemComponent = getEntityComponent(item.entityType);

				return (
					<div
						key={item.id}
						className="cursor-pointer transition-transform hover:scale-105"
						onClick={() => onItemClick?.(item)}
						onDoubleClick={() => onItemDoubleClick?.(item)}
					>
						<ItemComponent
							item={item as any}
							size={itemSize}
							compact={compact}
							onItemClick={() => onItemClick?.(item)}
							onItemDoubleClick={() => onItemDoubleClick?.(item)}
						/>
					</div>
				);
			})}
		</div>
	);
}
