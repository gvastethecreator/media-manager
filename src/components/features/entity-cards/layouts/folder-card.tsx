'use client';

import type { Folder } from '@/types/entities/folders';
import { type BaseCardAdapterProps, createCustomCardAdapter } from '../adapters/card-adapter-factory';
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
		// Verificar que la carpeta existe y tiene un id
		if (!props.folder || !props.folder.id) {
			console.error('Error: La carpeta es undefined o no tiene un id');
			return {
				data: null,
				isPreview: false,
				folder: null,
				onEdit: null,
				onDelete: null,
				onClick: null,
				className: props.className,
				showVisualConfig: false,
				options: {},
				rarity: null,
				texture: null,
			};
		}

		// Convertir las propiedades del adaptador a las propiedades esperadas por FolderCardLayout
		return {
			data: props.folder as any, // Usamos type assertion para evitar errores de tipo
			folder: props.folder, // Asegurarnos de pasar la carpeta al layout
			isPreview: false,
			onEdit: props.onEdit,
			onDelete: props.onDelete,
			onClick: props.onClick,
			className: props.className,
			showVisualConfig: props.showVisualConfig,
			options: props.options,
			rarity: null,
			texture: null,
		};
	}
);
