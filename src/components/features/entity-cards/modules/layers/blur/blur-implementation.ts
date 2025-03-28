import type { LayerImplementation } from '../types';

/**
 * 🌫️ Implementación de la capa de desenfoque
 */
export const blurImplementation: LayerImplementation = {
	type: 'blur',
	name: 'Desenfoque',
	description: 'Añade un efecto de desenfoque a la tarjeta',
	defaultConfig: {
		enabled: true,
		layerIndex: 1,
		intensity: 5,
		type: 'gaussian',
		area: 'full',
		opacity: 0.5,
	},
	render: () => null, // Stub implementation
	settings: () => null, // Stub implementation
	icon: 'blur',
};
