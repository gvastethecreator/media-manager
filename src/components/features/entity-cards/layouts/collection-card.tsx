'use client';

import type { Collection } from '@/types/entities/collections';
import { createCardAdapter } from '../adapters/card-adapter-factory';
import type { CardOptions } from '../types/unified-card-types';
import { CollectionCard as CollectionCardLayout } from './collection-card-layout';

// Interfaz para las propiedades del componente CollectionCard
export interface CollectionCardProps {
	collection: Collection;
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
 * Adaptador para el componente CollectionCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const CollectionCard = createCardAdapter(CollectionCardLayout, 'collection');
