/**
 * @file Tipos para los componentes de navegación
 * @module components/navigation/types
 */

import type { NavigationData } from '@/components/navigation/actions/navigation.actions';
import { ViewType } from '@/components/views/types';
import type { LucideIcon } from 'lucide-react';

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
	_count?: {
		images: number;
	};
}

/**
 * Props para el componente NavPanel
 */
export interface NavPanelProps {
	initialData: NavigationData;
}
