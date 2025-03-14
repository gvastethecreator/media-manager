'use client';

import type { Character } from '@/types/entities/characters';
import { createCardAdapter } from '../adapters/card-adapter-factory';
import type { CardOptions } from '../types/unified-card-types';
import { CharacterCard as CharacterCardLayout } from './character-card-layout';

// Interfaz para las propiedades del componente CharacterCard
export interface CharacterCardProps {
	character: Character;
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
 * Adaptador para el componente CharacterCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const CharacterCard = createCardAdapter(CharacterCardLayout, 'character');
