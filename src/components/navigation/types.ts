import type { LucideIcon } from 'lucide-react';
import type { NavigationData } from '@/components/navigation/actions/navigation.actions';

/**
 * Tipo para las categorías de navegación disponibles
 */
export type NavigationCategory = 'files' | 'library' | 'worldbuilding';

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
	label: string;
	icon?: LucideIcon;
}

// Tipo para vista de elementos en el panel de navegación
export type ViewMode = 'list' | 'grid';
