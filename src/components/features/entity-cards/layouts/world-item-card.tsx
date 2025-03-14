'use client';

import type { WorldItem } from '@/types/entities/worlditems';
import { createCardAdapter } from '../adapters/card-adapter-factory';
import type { CardOptions } from '../types/unified-card-types';
import { WorldItemCard as WorldItemCardLayout } from './world-item-card-layout';

// Interfaz para las propiedades del componente WorldItemCard
export interface WorldItemCardProps {
	worldItem: WorldItem;
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
 * Adaptador para el componente WorldItemCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const WorldItemCard = createCardAdapter(WorldItemCardLayout, 'worldItem');
