'use client';

import { type BaseCardAdapterProps, createCustomCardAdapter } from '../adapters/card-adapter-factory';
import type { Album } from '../layouts/forms/entity-types';
import { AlbumCard as AlbumCardLayout, type AlbumCardProps, type CardData } from './album-card-layout';

// Interfaz para las propiedades del componente AlbumCard que extiende las propiedades base
export interface AlbumCardAdapterProps extends BaseCardAdapterProps {
	album: Album;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
}

/**
 * Adaptador para el componente AlbumCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const AlbumCard = createCustomCardAdapter<Album, AlbumCardProps, 'album'>(
	AlbumCardLayout,
	'album',
	(props: AlbumCardAdapterProps) => {
		// Convertir las propiedades del adaptador a las propiedades esperadas por AlbumCardLayout
		return {
			data: props.album as CardData, // Usamos un type assertion explícito al tipo esperado
			isPreview: false,
			onEdit: props.onEdit,
			onDelete: props.onDelete,
			onClick: props.onClick,
			className: props.className,
			showVisualizationConfig: props.showVisualConfig,
			options: props.options,
			rarity: null,
			texture: null,
		} as AlbumCardProps;
	}
);
