'use client';

import { type BaseCardAdapterProps, createCustomCardAdapter } from '../adapters/card-adapter-factory';
import type { Note } from '../layouts/forms/entity-types';
import { NoteCard as NoteCardLayout } from './note-card-layout';

// Interfaz para las propiedades del componente NoteCard
export interface NoteCardAdapterProps extends BaseCardAdapterProps {
	note: Note;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
}

/**
 * Adaptador para el componente NoteCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const NoteCard = createCustomCardAdapter<Note, any, 'note'>(
	NoteCardLayout,
	'note',
	(props: NoteCardAdapterProps) => {
		// Convertir las propiedades del adaptador a las propiedades esperadas por NoteCardLayout
		return {
			data: props.note as any, // Usamos type assertion para evitar errores de tipo
			isPreview: false,
			onEdit: props.onEdit,
			onDelete: props.onDelete,
			onClick: props.onClick,
			className: props.className,
			showVisualizationConfig: props.showVisualConfig,
			options: props.options,
			rarity: null,
			texture: null,
		};
	}
);
