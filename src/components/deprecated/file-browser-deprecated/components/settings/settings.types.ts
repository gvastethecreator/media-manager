import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Props para el componente Section (header de sección colapsable)
 */
export interface SectionProps {
	icon: LucideIcon;
	title: string;
	color?: string;
	children: ReactNode;
}

/**
 * Props para el componente Row (layout de fila para settings)
 */
export interface RowProps {
	children: ReactNode;
}

/**
 * Props para el componente ColorPicker
 */
export interface ColorPickerProps {
	value: string;
	onChange: (value: string) => void;
}

/**
 * Item de modo de vista con ícono y color
 */
export interface ViewModeItem {
	value: string;
	label: string;
	icon: LucideIcon;
	color: string;
}

/**
 * Item de modo de renderizado con ícono y color
 */
export interface RenderingModeItem {
	value: string;
	label: string;
	icon: LucideIcon;
	color: string;
}
