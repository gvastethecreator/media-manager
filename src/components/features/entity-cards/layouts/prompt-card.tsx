'use client';

import { BaseCardAdapterProps, createCustomCardAdapter } from '../adapters/card-adapter-factory';
import type { Prompt } from '../layouts/forms/entity-types';
import { PromptCard as PromptCardLayout } from './prompt-card-layout';

// Interfaz para las propiedades del componente PromptCard
export interface PromptCardAdapterProps extends BaseCardAdapterProps {
	prompt: Prompt;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
}

/**
 * Adaptador para el componente PromptCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const PromptCard = createCustomCardAdapter<Prompt, any, 'prompt'>(
	PromptCardLayout,
	'prompt',
	(props: PromptCardAdapterProps) => {
		// Convertir las propiedades del adaptador a las propiedades esperadas por PromptCardLayout
		return {
			data: props.prompt as any, // Usamos type assertion para evitar errores de tipo
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
