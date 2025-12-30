import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface SectionProps {
	icon: LucideIcon;
	title: string;
	color?: string;
	children: ReactNode;
}

export interface RowProps {
	children: ReactNode;
}

export interface ColorPickerProps {
	value: string;
	onChange: (value: string) => void;
}

export interface ViewModeItem {
	value: string;
	label: string;
	icon: LucideIcon;
	color: string;
}

export interface RenderingModeItem {
	value: string;
	label: string;
	icon: LucideIcon;
	color: string;
}
