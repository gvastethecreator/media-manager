'use client';

import type { Album } from '@/types/entities/albums';
import { createCardAdapter } from '../adapters/card-adapter-factory';
import type { CardOptions } from '../types/unified-card-types';
import { AlbumCard as AlbumCardLayout } from './album-card-layout';

// Interfaz para las propiedades del componente AlbumCard
export interface AlbumCardProps {
	album: Album;
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
 * Adaptador para el componente AlbumCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const AlbumCard = createCardAdapter(AlbumCardLayout, 'album');
