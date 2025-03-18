'use client';

import { type BaseCardAdapterProps, createCustomCardAdapter } from '../adapters/card-adapter-factory';
import type { Prompt } from '../layouts/forms/entity-types';
import { PromptCard as PromptCardLayout, type PromptCardProps } from './prompt-card-layout';

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
export const PromptCard = createCustomCardAdapter<Prompt, PromptCardProps, 'prompt'>(
	PromptCardLayout,
	'prompt',
	(props: PromptCardAdapterProps) => {
		// Convertir las propiedades del adaptador a las propiedades esperadas por PromptCardLayout
		return {
			data: props.prompt,
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
