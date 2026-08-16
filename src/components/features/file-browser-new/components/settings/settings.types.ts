import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface SectionProps {
	children: ReactNode;
	color?: string;
	icon: LucideIcon;
	title: string;
}

export interface RowProps {
	children: ReactNode;
}

export interface ColorPickerProps {
	onChange: (value: string) => void;
	value: string;
}

export interface ViewModeItem {
	color: string;
	icon: LucideIcon;
	label: string;
	value: string;
}

export interface RenderingModeItem {
	color: string;
	icon: LucideIcon;
	label: string;
	value: string;
}
