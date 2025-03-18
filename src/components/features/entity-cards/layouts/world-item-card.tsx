'use client';

import { type BaseCardAdapterProps, createCustomCardAdapter } from '../adapters/card-adapter-factory';
import type { WorldItem } from '../layouts/forms/entity-types';
import { WorldItemCard as WorldItemCardLayout } from './world-item-card-layout';

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
export const WorldItemCard = createCustomCardAdapter<WorldItem, any, 'worldItem'>(
	WorldItemCardLayout,
	'worldItem',
	(props: WorldItemCardAdapterProps) => {
		// Convertir las propiedades del adaptador a las propiedades esperadas por WorldItemCardLayout
		return {
			data: props.worldItem as any, // Usamos type assertion para evitar errores de tipo
			isPreview: false,
			onEdit: props.onEdit,
			onDelete: props.onDelete,
			onClick: props.onClick,
			className: props.className,
			showVisualizationConfig: props.showVisualConfig,
			options: props.options,
			rarity: null,
			texture: null,
		};
	}
);
