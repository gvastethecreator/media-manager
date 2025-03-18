'use client';

import { type BaseCardAdapterProps, createCustomCardAdapter } from '../adapters/card-adapter-factory';
import type { Collection } from '../layouts/forms/entity-types';
import { CollectionCard as CollectionCardLayout } from './collection-card-layout';

// Interfaz para las propiedades del componente CollectionCard
export interface CollectionCardAdapterProps extends BaseCardAdapterProps {
	collection: Collection;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
}

/**
 * Adaptador para el componente CollectionCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const CollectionCard = createCustomCardAdapter<Collection, any, 'collection'>(
	CollectionCardLayout,
	'collection',
	(props: CollectionCardAdapterProps) => {
		// Convertir las propiedades del adaptador a las propiedades esperadas por CollectionCardLayout
		return {
			data: props.collection as any, // Usamos type assertion para evitar errores de tipo
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
