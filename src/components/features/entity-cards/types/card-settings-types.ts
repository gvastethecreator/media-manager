/**
 * 🎴 Tipos para la configuración de tarjetas
 */

/**
 * Opciones de configuración de tarjeta
 */
export interface CardOptions {
	// Propiedades básicas
	width?: number;
	height?: number;
	layout?: string;
	borderRadius?: number;
	borderWidth?: number;
	borderColor?: string;
	backgroundColor?: string;
	backgroundImage?: string;
	backgroundGradient?: string;
	shadow?: string;

	// Propiedades para texto
	titleFont?: string;
	titleSize?: number;
	titleColor?: string;
	descriptionFont?: string;
	descriptionSize?: number;
	descriptionColor?: string;

	// Propiedades para capas
	layerOrder?: string[];
	explodeView?: boolean;
	explodeDistance?: number;
	layerBlending?: string;
	layerSpacing?: number;

	// Propiedades para estado
	hoverEffect?: string;
	activeEffect?: string;

	// Cualquier otra propiedad
	[key: string]: any;
}
