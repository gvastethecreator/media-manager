/**
 * Tipo para los modos de mezcla disponibles en canvas globalCompositeOperation
 */
export type BlendMode =
	| 'normal'
	| 'multiply'
	| 'screen'
	| 'overlay'
	| 'darken'
	| 'lighten'
	| 'color-dodge'
	| 'color-burn'
	| 'hard-light'
	| 'soft-light'
	| 'difference'
	| 'exclusion'
	| 'hue'
	| 'saturation'
	| 'color'
	| 'luminosity';

/**
 * Interfaz para las opciones de modos de mezcla
 */
export interface BlendModeOption {
	label: string;
	value: BlendMode;
}
