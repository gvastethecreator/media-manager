'use client';

import type { Prompt } from '@/types/entities/prompts';
import { createCardAdapter } from '../adapters/card-adapter-factory';
import type { CardOptions } from '../types/unified-card-types';
import { PromptCard as PromptCardLayout } from './prompt-card-layout';

// Interfaz para las propiedades del componente PromptCard
export interface PromptCardProps {
	prompt: Prompt;
	options?: Partial<CardOptions>;
	onClick?: () => void;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	enableExplode?: boolean;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
	className?: string;
}

/**
 * Adaptador para el componente PromptCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const PromptCard = createCardAdapter(PromptCardLayout, 'prompt');
