import type { NavigationData } from '@/components/navigation/actions/navigation.actions';
import type { ViewType } from '@/types/file-item';
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
