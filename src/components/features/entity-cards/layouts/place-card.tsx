'use client';

import { type BaseCardAdapterProps, createCustomCardAdapter } from '../adapters/card-adapter-factory';
import type { Place } from '../layouts/forms/entity-types';
import type { CardOptions } from '../types/unified-card-types';
import { PlaceCard as PlaceCardLayout, type PlaceCardProps } from './place-card-layout';

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
export const PlaceCard = createCustomCardAdapter<Place, PlaceCardProps, 'place'>(
	PlaceCardLayout,
	'place',
	(props: PlaceCardAdapterProps) => {
		// Convertir las propiedades del adaptador a las propiedades esperadas por PlaceCardLayout
		return {
			place: props.place,
			isPreview: false,
			onEdit: props.onEdit,
			onDelete: props.onDelete,
			onClick: props.onClick,
			className: props.className,
			showVisualConfig: props.showVisualConfig,
			visualOptions: props.options as Partial<CardOptions>,
			enableExplode: props.enableExplode
		};
	}
);
