'use client';

import { type BaseCardAdapterProps, createCustomCardAdapter } from '../adapters/card-adapter-factory';
import type { WorldItem } from '../layouts/forms/entity-types';
import { WorldItemCard as WorldItemCardLayout, type WorldItemCardProps } from './world-item-card-layout';

// Interfaz para las propiedades del componente WorldItemCard
export interface WorldItemCardAdapterProps extends BaseCardAdapterProps {
	worldItem: WorldItem;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
}

/**
 * Adaptador para el componente WorldItemCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const WorldItemCard = createCustomCardAdapter<WorldItem, WorldItemCardProps, 'worldItem'>(
	WorldItemCardLayout,
	'worldItem',
	(props: WorldItemCardAdapterProps) => {
		// Convertir las propiedades del adaptador a las propiedades esperadas por WorldItemCardLayout
		return {
			worldItem: props.worldItem,
			onEdit: props.onEdit ? (item: WorldItem) => props.onEdit?.(item.id) : undefined,
			onDelete: props.onDelete,
			onClick: props.onClick,
			className: props.className,
			showVisualConfig: props.showVisualConfig,
			visualOptions: props.options,
			enableExplode: props.enableExplode,
		};
	}
);
