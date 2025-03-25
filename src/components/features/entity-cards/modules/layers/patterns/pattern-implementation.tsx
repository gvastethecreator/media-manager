'use client';

import type { LayerImplementation } from '../types';
import type { PatternConfig } from './actions/pattern-config.action';
import { defaultPatternConfig } from './actions/pattern-config.action';
import { deletePatternConfig, getPatternConfig, updatePatternConfig } from './actions/pattern-server-actions';

/**
 * 🔲 Implementación de la capa de patrones geométricos
 * Esta capa permite añadir patrones visuales a las tarjetas
 */
export const patternImplementation: LayerImplementation<PatternConfig> = {
	type: 'pattern',
	name: 'Pattern',
	description: 'Añade patrones geométricos a las tarjetas',
	icon: '🔲',
	defaultConfig: defaultPatternConfig,
	render: () => null, // Implementación provisional
	settings: () => null, // Pendiente de implementación
	serverActions: {
		getConfig: getPatternConfig,
		updateConfig: updatePatternConfig,
		deleteConfig: deletePatternConfig,
	},
	presets: [
		{
			name: 'Grid Clásico',
			description: 'Patrón de cuadrícula simple y elegante',
			config: {
				enabled: true,
				visibleOnHover: false,
				layerIndex: 2,
				opacity: 0.15,
				size: 5,
				spacing: 20,
				rotation: 0,
				color: '#ffffff',
				patternType: 'grid',
				animated: false,
				animationSpeed: 1,
				blendMode: 'overlay',
				density: 1,
				strokeWidth: 1,
			},
		},
		{
			name: 'Dots Minimalista',
			description: 'Patrón de puntos sutil y moderno',
			config: {
				enabled: true,
				visibleOnHover: false,
				layerIndex: 2,
				opacity: 0.2,
				size: 5,
				spacing: 25,
				rotation: 45,
				color: '#ffffff',
				patternType: 'dots',
				animated: false,
				animationSpeed: 1,
				blendMode: 'overlay',
				density: 1.2,
				strokeWidth: 2,
			},
		},
		{
			name: 'Hexágonos Futuristas',
			description: 'Patrón de hexágonos con estilo tecnológico',
			config: {
				enabled: true,
				visibleOnHover: false,
				layerIndex: 2,
				opacity: 0.25,
				size: 5,
				spacing: 30,
				rotation: 0,
				color: '#ffffff',
				patternType: 'hexagon',
				animated: false,
				animationSpeed: 1,
				blendMode: 'overlay',
				density: 0.8,
				strokeWidth: 1.5,
			},
		},
		{
			name: 'Líneas Diagonales',
			description: 'Patrón de líneas dinámico y energético',
			config: {
				enabled: true,
				visibleOnHover: false,
				layerIndex: 2,
				opacity: 0.2,
				size: 5,
				spacing: 15,
				rotation: -45,
				color: '#ffffff',
				patternType: 'lines',
				animated: false,
				animationSpeed: 1,
				blendMode: 'overlay',
				density: 1,
				strokeWidth: 1,
			},
		},
	],
};