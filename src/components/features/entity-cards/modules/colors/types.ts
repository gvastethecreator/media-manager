/**
 * Tipos para el módulo de colores
 */

/**
 * Paleta de colores
 */
export interface ColorPalette {
	id: string;
	name: string;
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
 */
export const COLOR_PALETTES: ColorPalette[] = [
	{
		id: 'modern-blue',
		name: 'Azul Moderno',
		primaryColor: '59, 130, 246',
		secondaryColor: '37, 99, 235',
		accentColor: '245, 158, 11',
		backgroundStart: '249, 250, 251',
		backgroundEnd: '243, 244, 246',
		textColor: '31, 41, 55',
		borderColor: '209, 213, 219',
	},
	{
		id: 'dark-elegance',
		name: 'Elegancia Oscura',
		primaryColor: '75, 85, 99',
		secondaryColor: '55, 65, 81',
		accentColor: '220, 38, 38',
		backgroundStart: '31, 41, 55',
		backgroundEnd: '17, 24, 39',
		textColor: '243, 244, 246',
		borderColor: '75, 85, 99',
	},
	{
		id: 'nature-green',
		name: 'Verde Natural',
		primaryColor: '16, 185, 129',
		secondaryColor: '5, 150, 105',
		accentColor: '245, 158, 11',
		backgroundStart: '236, 253, 245',
		backgroundEnd: '209, 250, 229',
		textColor: '6, 95, 70',
		borderColor: '167, 243, 208',
	},
	{
		id: 'vibrant-purple',
		name: 'Púrpura Vibrante',
		primaryColor: '139, 92, 246',
		secondaryColor: '124, 58, 237',
		accentColor: '236, 72, 153',
		backgroundStart: '245, 243, 255',
		backgroundEnd: '237, 233, 254',
		textColor: '91, 33, 182',
		borderColor: '196, 181, 253',
	},
	{
		id: 'sunset-orange',
		name: 'Naranja Atardecer',
		primaryColor: '249, 115, 22',
		secondaryColor: '234, 88, 12',
		accentColor: '2, 132, 199',
		backgroundStart: '255, 247, 237',
		backgroundEnd: '254, 215, 170',
		textColor: '154, 52, 18',
		borderColor: '251, 146, 60',
	},
];
