/**
 * @file Tipos para los componentes de navegación
 * @module components/navigation/types
 */

import type { LucideIcon } from 'lucide-react';
import { ViewType } from '@/components/views/types';
import type { NavigationData } from '@/lib/api/navigation';

/**
 * Tipo para las categorías de navegación disponibles
 */
export type NavigationCategory =
	| 'files'
	| 'library'
	| 'worldbuilding'
	| 'management'
	| 'folders'
	| 'collections'
	| 'tags'
	| 'albums'
	| 'characters'
	| 'places'
	| 'worldItems'
	| 'concepts'
	| 'prompts'
	| 'notes'
	| 'groups'
	| 'properties'
	| 'wildcards'
	| 'audios'
	| 'documents'
	| 'jsonFiles'
	| 'file3ds'
	| 'workflows'
	| 'videos';

/**
 * Representa un elemento de categoría en el panel de navegación
 */
export interface CategoryItem {
	id: ViewType;
	icon: LucideIcon;
	label: string;
	color: string;
}

/**
 * Representa un elemento hijo dentro de una categoría
 */
export interface CategoryChild {
	id: string;
	name: string;
	label?: string;
	title?: string; // Para notas que usan title en lugar de name
	emoji?: string;
	color?: string;
	path?: string;
	description?: string;
	icon?: LucideIcon;
	itemCount?: number; // Conteo total de elementos
	totalFiles?: number;
	totalSize?: number;
	parentId?: string | null; // Para jerarquía de carpetas
	_count?: {
		images?: number;
		folders?: number;
		collections?: number;
		tags?: number;
	};
}

/**
 * Props para el componente NavPanel
 */
export interface NavPanelProps {
	initialData: NavigationData;
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
	isAnimating?: boolean;
}
