'use client';

import type { Folder } from '@/types/entities/folders';
import { createCardAdapter } from '../adapters/card-adapter-factory';
import type { CardOptions } from '../types/unified-card-types';
import { FolderCardLayout } from './folder-card-layout';

// Interfaz para las propiedades del componente FolderCard
export interface FolderCardProps {
	folder: Folder;
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
 * Adaptador para el componente FolderCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const FolderCard = createCardAdapter(FolderCardLayout, 'folder');
