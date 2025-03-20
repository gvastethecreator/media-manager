/**
 * Tipos para el módulo de colores
 */

import { DEFAULT_COLOR_PALETTES } from './color-palette';

/**
 * Paleta de colores
 */
export interface ColorPalette {
	id: string;
	name: string;
	description?: string;
	primaryColor: string;
	secondaryColor: string;
	accentColor: string;
	backgroundStart: string;
	backgroundEnd: string;
	textColor: string;
	borderColor: string;
}

/**
 * Opciones de configuración de colores
 */
export interface ColorsOptions {
	useColorPalettes: boolean;
	colorPalette: string;
	primaryColor: string;
	secondaryColor: string;
	accentColor: string;
	backgroundStartColor: string;
	backgroundEndColor: string;
	textColor: string;
	borderColor: string;
}

/**
 * Opciones predeterminadas de colores
 */
export const DEFAULT_COLORS_OPTIONS: ColorsOptions = {
	useColorPalettes: true,
	colorPalette: 'modern-blue',
	primaryColor: '59, 130, 246', // Blue-500
	secondaryColor: '37, 99, 235', // Blue-600
	accentColor: '245, 158, 11', // Amber-500
	backgroundStartColor: '249, 250, 251', // Gray-50
	backgroundEndColor: '243, 244, 246', // Gray-100
	textColor: '31, 41, 55', // Gray-800
	borderColor: '209, 213, 219', // Gray-300
};

/**
 * Props para el módulo de colores
 */
export interface ColorsModuleProps {
	initialOptions?: Partial<ColorsOptions>;
	onChange?: (options: ColorsOptions) => void;
	disabled?: boolean;
	className?: string;
}

/**
 * Paletas de colores predefinidas
 * @deprecated Usar DEFAULT_COLOR_PALETTES de color-palette.tsx
 */
export const COLOR_PALETTES = DEFAULT_COLOR_PALETTES;
