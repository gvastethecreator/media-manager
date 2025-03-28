'use client';

import type { LayerImplementation } from '../types';

/**
 * 🎨 Implementación de la capa de imagen para entidades
 * Proporciona la funcionalidad básica para mostrar imágenes en tarjetas
 */
export const imageLayerImplementation: LayerImplementation = {
	type: 'image',
	name: 'Imagen',
	description: 'Muestra una imagen como capa de fondo',
	defaultConfig: {
		enabled: true,
		layerIndex: 0,
		imageUrl: '',
		fit: 'cover',
		position: 'center',
		opacity: 1,
		blendMode: 'normal',
	},
	render: () => null, // Stub implementation
	settings: () => null, // Stub implementation
	icon: 'image',
};

// Exportar tipos y componentes
export { useImageStore } from './actions/image-config.action';
export { ImageConfig } from './components/image-config';
export { ImageLayer } from './components/image-layer';
