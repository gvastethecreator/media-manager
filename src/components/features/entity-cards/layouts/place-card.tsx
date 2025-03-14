'use client';

import type { Place } from '@/types/entities/places';
import { createCardAdapter } from '../adapters/card-adapter-factory';
import type { CardOptions } from '../types/unified-card-types';
import { PlaceCard as PlaceCardLayout } from './place-card-layout';

// Interfaz para las propiedades del componente PlaceCard
export interface PlaceCardProps {
	place: Place;
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
 * Adaptador para el componente PlaceCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const PlaceCard = createCardAdapter(PlaceCardLayout, 'place');
