'use client';

import { create } from 'zustand';
import type { ShaderConfig } from '../shader-config-schema';

// Tipos de shaders disponibles
export type ShaderType = 'distortion' | 'hologram' | 'wave' | 'particle';

// Configuración base para todos los shaders
interface BaseShaderConfig {
	enabled: boolean;
	type: ShaderType;
	opacity: number;
	blendMode: string;
}

// Configuraciones específicas por tipo de shader
interface DistortionConfig extends BaseShaderConfig {
	type: 'distortion';
	intensity: number;
}

interface HologramConfig extends BaseShaderConfig {
	type: 'hologram';
	color: [number, number, number];
	scanlineIntensity: number;
}

interface WaveConfig extends BaseShaderConfig {
	type: 'wave';
	amplitude: number;
	frequency: number;
}

interface ParticleConfig extends BaseShaderConfig {
	type: 'particle';
	particleSize: number;
	particleDensity: number;
}

// Tipo unión para todas las configuraciones posibles
export type ShaderConfig = DistortionConfig | HologramConfig | WaveConfig | ParticleConfig;

// Configuraciones por defecto
export const defaultShaders = {
	distortion: {
		enabled: true,
		type: 'distortion' as const,
		opacity: 0.5,
		blendMode: 'overlay',
		intensity: 0.5,
	},
	hologram: {
		enabled: true,
		type: 'hologram' as const,
		opacity: 0.7,
		blendMode: 'screen',
		color: [0, 0.5, 1] as [number, number, number],
		scanlineIntensity: 0.5,
	},
	wave: {
		enabled: true,
		type: 'wave' as const,
		opacity: 0.6,
		blendMode: 'normal',
		amplitude: 0.5,
		frequency: 0.5,
	},
	particle: {
		enabled: true,
		type: 'particle' as const,
		opacity: 0.8,
		blendMode: 'lighten',
		particleSize: 0.5,
		particleDensity: 0.5,
	},
};

// Estado para el store de shaders
interface ShaderState {
	activeType: string | null;
	configs: Record<string, ShaderConfig>;
	setActiveType: (type: string | null) => void;
	updateConfig: (type: string, config: Partial<ShaderConfig>) => void;
}

// Store para manejar el estado de los shaders
export const useShaderStore = create<ShaderState>((set) => ({
	activeType: null,
	configs: {},
	setActiveType: (type) => set({ activeType: type }),
	updateConfig: (type, config) =>
		set((state) => ({
			configs: {
				...state.configs,
				[type]: {
					...state.configs[type],
					...config,
				},
			},
		})),
}));

// Tipos exportados
export type { ShaderState };

/**
 * Obtiene la configuración de shader para una entidad
 */
export async function getShaderConfig(entityType: string, entityId?: string) {
	try {
		// Aquí se implementaría la consulta a la base de datos
		// Por ahora, retornamos una respuesta simulada para pruebas
		return {
			success: true,
			data: {
				enabled: true,
				layerIndex: 5,
				type: 'wave',
				intensity: 0.5,
				speed: 1.0,
				color: '#00aaff',
				blendMode: 'screen',
				visibleOnHover: false,
				animated: true,
			} as ShaderConfig,
		};
	} catch (error) {
		console.error('Error al obtener la configuración de shader:', error);
		return {
			success: false,
			error: 'Error al obtener la configuración de shader',
		};
	}
}

/**
 * Actualiza la configuración de shader para una entidad
 */
export async function updateShaderConfig(config: ShaderConfig, entityType: string, entityId?: string) {
	try {
		// Aquí se implementaría la actualización en la base de datos
		// Por ahora, retornamos una respuesta simulada para pruebas
		console.log('Actualizando configuración de shader:', { config, entityType, entityId });

		return {
			success: true,
			data: config,
		};
	} catch (error) {
		console.error('Error al actualizar la configuración de shader:', error);
		return {
			success: false,
			error: 'Error al actualizar la configuración de shader',
		};
	}
}

/**
 * Elimina la configuración de shader para una entidad
 */
export async function deleteShaderConfig(entityType: string, entityId?: string) {
	try {
		// Aquí se implementaría la eliminación en la base de datos
		// Por ahora, retornamos una respuesta simulada para pruebas
		console.log('Eliminando configuración de shader:', { entityType, entityId });

		return {
			success: true,
		};
	} catch (error) {
		console.error('Error al eliminar la configuración de shader:', error);
		return {
			success: false,
			error: 'Error al eliminar la configuración de shader',
		};
	}
}
