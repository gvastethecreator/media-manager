import type { CommonLayerProps, LayerImplementation, LayerSettingsProps } from '../types';
import { type BlurConfig, defaultBlurConfig } from './blur-schema';
import { BlurLayer } from './components/blur-layer';
import { BlurSettings } from './components/blur-settings';

// Corregir para que coincida con la interfaz del sistema
interface BlurLayerProps extends CommonLayerProps {
	config: BlurConfig;
}

// Corregir para que coincida con la interfaz del sistema
interface BlurSettingsProps extends LayerSettingsProps<BlurConfig> {}

/**
 * 🌫️ Implementación de la capa de desenfoque
 */
export const blurImplementation: LayerImplementation<BlurConfig> = {
	type: 'blur',
	name: 'Desenfoque',
	description: 'Aplica efectos de desenfoque a la imagen',
	icon: 'Cloud', // Usar string en lugar de componente
	defaultConfig: defaultBlurConfig,
	render: BlurLayer as unknown as React.ComponentType<BlurLayerProps>,
	settings: BlurSettings as unknown as React.ComponentType<BlurSettingsProps>,
};

/**
 * Presets para la capa de desenfoque
 * Estos pueden ser utilizados por el sistema para ofrecer configuraciones predefinidas
 */
export const blurPresets = [
	{
		name: 'Desenfoque Suave',
		config: {
			...defaultBlurConfig,
			radius: 5,
			algorithm: 'gaussian',
			quality: 'high',
			preserveEdges: true,
			edgeThreshold: 30,
		},
	},
	{
		name: 'Desenfoque de Movimiento',
		config: {
			...defaultBlurConfig,
			radius: 15,
			algorithm: 'motion',
			motion: {
				angle: 45,
				distance: 20,
			},
			animated: true,
			animationSpeed: 1,
		},
	},
	{
		name: 'Desenfoque Radial',
		config: {
			...defaultBlurConfig,
			radius: 20,
			algorithm: 'radial',
			zone: {
				type: 'circle',
				center: { x: 0.5, y: 0.5 },
				radius: 0.3,
				feather: 0.1,
			},
		},
	},
	{
		name: 'Desenfoque de Zoom',
		config: {
			...defaultBlurConfig,
			radius: 25,
			algorithm: 'zoom',
			zone: {
				type: 'circle',
				center: { x: 0.5, y: 0.5 },
				radius: 0.4,
				feather: 0.15,
			},
			animated: true,
			animationSpeed: 0.5,
		},
	},
	{
		name: 'Desenfoque Selectivo',
		config: {
			...defaultBlurConfig,
			radius: 8,
			algorithm: 'box',
			zone: {
				type: 'rectangle',
				position: { x: 0.2, y: 0.2 },
				size: { width: 0.6, height: 0.6 },
				feather: 0.1,
			},
			preserveEdges: true,
			edgeThreshold: 40,
		},
	},
];
