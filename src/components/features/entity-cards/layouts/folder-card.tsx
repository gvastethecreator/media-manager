'use client';

import type { Folder } from '@/types/entities/folders';
import { BaseCardAdapterProps, createCustomCardAdapter } from '../adapters/card-adapter-factory';
import { FolderCardLayout } from './folder-card-layout';

// Interfaz para las propiedades del componente FolderCard
export interface FolderCardAdapterProps extends BaseCardAdapterProps {
	folder: Folder;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
}

/**
 * Adaptador para el componente FolderCardLayout
 * Creado con la fábrica de adaptadores para simplificar la implementación
 */
export const FolderCard = createCustomCardAdapter<Folder, any, 'folder'>(
	FolderCardLayout,
	'folder',
	(props: FolderCardAdapterProps) => {
		// Convertir las propiedades del adaptador a las propiedades esperadas por FolderCardLayout
		return {
			data: props.folder as any, // Usamos type assertion para evitar errores de tipo
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
