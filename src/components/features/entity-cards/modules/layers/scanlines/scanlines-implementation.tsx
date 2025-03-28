import type { LayerImplementation } from '../types';
import { ScanlinesLayer } from './components/scanlines-layer';
import { ScanlinesSettings } from './components/scanlines-settings';
import { DEFAULT_CONFIG, PRESET_COLORS, type ScanlinesConfig } from './scanlines-config-types';

/**
 * 📺 Implementación de la capa de líneas de escaneo
 * @module ScanlinesLayer
 */
export const scanlinesImplementation: LayerImplementation<ScanlinesConfig> = {
	type: 'scanlines',
	name: 'Líneas de escaneo',
	description: 'Añade un efecto de líneas de escaneo retro',
	icon: '📺',
	defaultConfig: DEFAULT_CONFIG,
	render: ScanlinesLayer,
	settings: ScanlinesSettings,
	presets: [
		{
			name: 'TV Retro',
			description: 'Efecto de televisión antigua con líneas horizontales',
			config: {
				...DEFAULT_CONFIG,
				color: PRESET_COLORS.BLACK,
			},
		},
		{
			name: 'Monitor CRT',
			description: 'Efecto de monitor CRT con líneas verticales',
			config: {
				...DEFAULT_CONFIG,
				opacity: 0.2,
				lineWidth: 1.5,
				lineSpacing: 4,
				color: PRESET_COLORS.WHITE,
				blendMode: 'soft-light',
				direction: 'vertical',
			},
		},
		{
			name: 'Cyberpunk',
			description: 'Efecto futurista con líneas animadas',
			config: {
				...DEFAULT_CONFIG,
				opacity: 0.25,
				lineWidth: 2,
				lineSpacing: 6,
				speed: 2,
				color: PRESET_COLORS.CYAN,
				blendMode: 'screen',
				animated: true,
			},
		},
		{
			name: 'Matrix',
			description: 'Efecto Matrix con líneas verdes',
			config: {
				...DEFAULT_CONFIG,
				opacity: 0.2,
				lineWidth: 1,
				lineSpacing: 2,
				speed: 5,
				color: PRESET_COLORS.GREEN,
				blendMode: 'screen',
				direction: 'vertical',
				animated: true,
			},
		},
		{
			name: 'Glitch',
			description: 'Efecto de glitch con líneas rápidas',
			config: {
				...DEFAULT_CONFIG,
				opacity: 0.3,
				lineWidth: 3,
				lineSpacing: 8,
				speed: 8,
				color: PRESET_COLORS.MAGENTA,
				blendMode: 'exclusion',
				animated: true,
			},
		},
	],
};
