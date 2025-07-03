import type { LucideIcon } from 'lucide-react';
import type { NavigationData } from '@/components/navigation/actions/navigation.actions';

/**
 * Tipo para las categorías de navegación disponibles
 */
export type NavigationCategory =
	| 'collections'
	| 'folders'
	| 'tags'
	| 'albums'
	| 'characters'
	| 'places'
	| 'world-items'
	| 'concepts'
	| 'prompts'
	| 'notes'
	| 'groups'
	| 'properties'
	| 'wildcards'
	// Nuevas entidades
	| 'audios'
	| 'documents'
	| 'json-files'
	| 'file-3ds'
	| 'workflows';

/**
 * @description Representa una entidad que puede tener un conteo de imágenes asociadas.
 *              Utilizado comúnmente por modelos de Prisma con relaciones _count.
 */
export type ItemWithImageCount = {
	_count?: { images?: number }; // 🖼️ El conteo de imágenes es opcional.
};

export interface NavPanelProps {
	initialData: NavigationData;
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
}

export interface CategoryItem {
	id: NavigationCategory;
	icon: LucideIcon;
	label: string;
	color: string;
}

export interface CategoryChild {
	id: string;
	name: string;
	title?: string; // Para notas que usan title en lugar de name
	emoji?: string;
	color?: string;
	path?: string;
	description?: string;
	totalFiles?: number;
	totalSize?: number;
	_count?: {
		images: number;
		// Otros conteos posibles
		folders?: number;
		collections?: number;
		tags?: number;
	};
}

// Tipo para vista de elementos en el panel de navegación
export type ViewMode = 'list' | 'grid';
