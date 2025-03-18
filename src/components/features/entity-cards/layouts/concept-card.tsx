'use client';

import { type BaseCardAdapterProps, createCustomCardAdapter } from '../adapters/card-adapter-factory';
import type { Concept } from '../layouts/forms/entity-types';
import { ConceptCard as ConceptCardLayout, type ConceptCardProps } from './concept-card-layout';

// Interfaz para las propiedades del componente ConceptCard
export interface ConceptCardAdapterProps extends BaseCardAdapterProps {
	concept: Concept;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
}

/**
 * Adaptador para el componente ConceptCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const ConceptCard = createCustomCardAdapter<Concept, ConceptCardProps, 'concept'>(
	ConceptCardLayout,
	'concept',
	(props: ConceptCardAdapterProps) => {
		// Convertir las propiedades del adaptador a las propiedades esperadas por ConceptCardLayout
		return {
			data: props.concept,
			isPreview: false,
			onEdit: props.onEdit,
			onDelete: props.onDelete,
			onClick: props.onClick,
			className: props.className,
			showVisualizationConfig: props.showVisualConfig,
			options: props.options
		};
	}
);
