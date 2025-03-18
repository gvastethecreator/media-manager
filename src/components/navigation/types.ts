import type { NavigationData } from '@/components/navigation/actions/navigation.actions';
import type { ViewType } from '@/types/file-item';
import type { LucideIcon } from 'lucide-react';

export interface NavPanelProps {
	initialData: NavigationData;
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
}

export interface CategoryItem {
	id: ViewType;
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
	_count?: {
		images: number;
		// Otros conteos posibles
		folders?: number;
		collections?: number;
		tags?: number;
	};
}
