/**
 * Opciones para los modos de mezcla (blend modes)
 * basados en las opciones de globalCompositeOperation de Canvas
 */
export const blendModeOptions = [
	{ value: 'normal', label: 'Normal' },
	{ value: 'multiply', label: 'Multiplicar' },
	{ value: 'screen', label: 'Pantalla' },
	{ value: 'overlay', label: 'Superponer' },
	{ value: 'darken', label: 'Oscurecer' },
	{ value: 'lighten', label: 'Aclarar' },
	{ value: 'color-dodge', label: 'Subexponer color' },
	{ value: 'color-burn', label: 'Sobreexponer color' },
	{ value: 'hard-light', label: 'Luz fuerte' },
	{ value: 'soft-light', label: 'Luz suave' },
	{ value: 'difference', label: 'Diferencia' },
	{ value: 'exclusion', label: 'Exclusión' },
	{ value: 'hue', label: 'Tono' },
	{ value: 'saturation', label: 'Saturación' },
	{ value: 'color', label: 'Color' },
	{ value: 'luminosity', label: 'Luminosidad' },
];

/**
 * Tipo para los modos de mezcla
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
