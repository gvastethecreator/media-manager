'use client';

import type { Concept } from '@/types/entities/concepts';
import { createCardAdapter } from '../adapters/card-adapter-factory';
import type { CardOptions } from '../types/unified-card-types';
import { ConceptCard as ConceptCardLayout } from './concept-card-layout';

// Interfaz para las propiedades del componente ConceptCard
export interface ConceptCardProps {
	concept: Concept;
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
 * Adaptador para el componente ConceptCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const ConceptCard = createCardAdapter(ConceptCardLayout, 'concept');
