'use client';

import { BaseCardAdapterProps, createCustomCardAdapter } from '../adapters/card-adapter-factory';
import type { Tag } from '../layouts/forms/entity-types';
import { TagCard as TagCardLayout } from './tag-card-layout';

// Interfaz para las propiedades del componente TagCard
export interface TagCardAdapterProps extends BaseCardAdapterProps {
	tag: Tag;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
}

/**
 * Adaptador para el componente TagCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const TagCard = createCustomCardAdapter<Tag, any, 'tag'>(TagCardLayout, 'tag', (props: TagCardAdapterProps) => {
	// Convertir las propiedades del adaptador a las propiedades esperadas por TagCardLayout
	return {
		data: props.tag as any, // Usamos type assertion para evitar errores de tipo
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
});
