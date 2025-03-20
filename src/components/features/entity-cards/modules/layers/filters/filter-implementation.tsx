import type { LayerImplementation } from '@/types/entity-card';
import { SlidersHorizontal } from 'lucide-react';
import { FilterLayer } from './components/filter-layer';
import { FilterSettings } from './components/filter-settings';
import { createDefaultFilterConfig, type FilterConfig } from './filter-schema';

/**
 * 🎨 Implementación de la capa de filtros
 */
export const filterImplementation: LayerImplementation<FilterConfig> = {
	type: 'filter',
	name: 'Filtros',
	description: 'Aplica efectos visuales y filtros a la imagen',
	icon: SlidersHorizontal,
	defaultConfig: createDefaultFilterConfig(),
	render: FilterLayer,
	settings: FilterSettings,
	presets: [
		{
			name: 'Vintage',
			config: {
				...createDefaultFilterConfig(),
				filterType: 'basic',
				basic: {
					brightness: 110,
					contrast: 85,
					saturation: 80,
					hueRotate: 15,
					blur: 0,
					opacity: 100,
				},
				blendMode: 'overlay',
			},
		},
		{
			name: 'Dramático',
			config: {
				...createDefaultFilterConfig(),
				filterType: 'basic',
				basic: {
					brightness: 120,
					contrast: 150,
					saturation: 90,
					hueRotate: 0,
					blur: 0,
					opacity: 100,
				},
				shadow: {
					enabled: true,
					color: 'rgba(0, 0, 0, 0.5)',
					blur: 20,
					offsetX: 0,
					offsetY: 10,
					inset: false,
				},
				blendMode: 'hard-light',
			},
		},
		{
			name: 'Suave',
			config: {
				...createDefaultFilterConfig(),
				filterType: 'basic',
				basic: {
					brightness: 105,
					contrast: 90,
					saturation: 95,
					hueRotate: 0,
					blur: 2,
					opacity: 100,
				},
				glow: {
					enabled: true,
					color: 'rgba(255, 255, 255, 0.3)',
					radius: 15,
					intensity: 0.3,
					spread: 5,
				},
				blendMode: 'soft-light',
			},
		},
		{
			name: 'Neón',
			config: {
				...createDefaultFilterConfig(),
				filterType: 'glow',
				basic: {
					brightness: 110,
					contrast: 120,
					saturation: 130,
					hueRotate: 0,
					blur: 0,
					opacity: 100,
				},
				glow: {
					enabled: true,
					color: 'rgba(0, 255, 255, 0.4)',
					radius: 25,
					intensity: 0.7,
					spread: 10,
				},
				blendMode: 'screen',
			},
		},
		{
			name: 'Cyberpunk',
			config: {
				...createDefaultFilterConfig(),
				filterType: 'distortion',
				basic: {
					brightness: 115,
					contrast: 130,
					saturation: 140,
					hueRotate: -15,
					blur: 0,
					opacity: 100,
				},
				distortion: {
					enabled: true,
					type: 'wave',
					amount: 15,
					speed: 2,
					animated: true,
				},
				glow: {
					enabled: true,
					color: 'rgba(255, 0, 255, 0.3)',
					radius: 20,
					intensity: 0.5,
					spread: 8,
				},
				blendMode: 'color-dodge',
			},
		},
		{
			name: 'Noir',
			config: {
				...createDefaultFilterConfig(),
				filterType: 'basic',
				basic: {
					brightness: 90,
					contrast: 140,
					saturation: 20,
					hueRotate: 0,
					blur: 0,
					opacity: 100,
				},
				shadow: {
					enabled: true,
					color: 'rgba(0, 0, 0, 0.6)',
					blur: 15,
					offsetX: 8,
					offsetY: 8,
					inset: false,
				},
				blendMode: 'luminosity',
			},
		},
	],
};

export default filterImplementation;