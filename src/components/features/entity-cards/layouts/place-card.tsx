'use client';

import type { Place } from '../layouts/forms/entity-types';
import { type BaseCardAdapterProps, createCustomCardAdapter } from '../adapters/card-adapter-factory';
import type { CardOptions } from '../types/unified-card-types';
import { PlaceCard as PlaceCardLayout } from './place-card-layout';

// Interfaz para las propiedades del componente PlaceCard
export interface PlaceCardAdapterProps extends BaseCardAdapterProps {
	place: Place;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
}

/**
 * Adaptador para el componente PlaceCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const PlaceCard = createCustomCardAdapter<Place, any, 'place'>(
	PlaceCardLayout,
	'place',
	(props: PlaceCardAdapterProps) => {
		// Convertir las propiedades del adaptador a las propiedades esperadas por PlaceCardLayout
		return {
			data: props.place as any, // Usamos type assertion para evitar errores de tipo
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
