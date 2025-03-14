'use client';

import type { Note } from '@/types/entities/notes';
import { createCardAdapter } from '../adapters/card-adapter-factory';
import type { CardOptions } from '../types/unified-card-types';
import { NoteCard as NoteCardLayout } from './note-card-layout';

// Interfaz para las propiedades del componente NoteCard
export interface NoteCardProps {
	note: Note;
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
 * Adaptador para el componente NoteCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const NoteCard = createCardAdapter(NoteCardLayout, 'note');
