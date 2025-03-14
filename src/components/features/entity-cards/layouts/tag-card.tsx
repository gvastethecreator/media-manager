'use client';

import type { Tag } from '@/types/entities/tags';
import { createCardAdapter } from '../adapters/card-adapter-factory';
import type { CardOptions } from '../types/unified-card-types';
import { TagCard as TagCardLayout } from './tag-card-layout';

// Interfaz para las propiedades del componente TagCard
export interface TagCardProps {
	tag: Tag;
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
 * Adaptador para el componente TagCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const TagCard = createCardAdapter(TagCardLayout, 'tag');
