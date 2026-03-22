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
	color: string;
	icon: LucideIcon;
	id: ViewType;
	label: string;
}

/**
 * Representa un elemento hijo dentro de una categoría
 */
export interface CategoryChild {
	_count?: {
		images?: number;
		folders?: number;
		collections?: number;
		tags?: number;
	};
	color?: string;
	description?: string;
	emoji?: string;
	icon?: LucideIcon;
	id: string;
	itemCount?: number; // Conteo total de elementos
	label?: string;
	name: string;
	parentId?: string | null; // Para jerarquía de carpetas
	path?: string;
	title?: string; // Para notas que usan title en lugar de name
	totalFiles?: number;
	totalSize?: number;
}

/**
 * Props para el componente NavPanel
 */
export interface NavPanelProps {
	initialData: NavigationData;
	isAnimating?: boolean;
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
}
