'use client';

import { deepMerge } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { EffectsPanel } from './effects-panel';
import { DEFAULT_EFFECTS_CONFIG, type EffectsConfig, type EffectsModuleProps, type DistortionOptions, type FilterOptions, type ShadowOptions, type VisualEffectsOptions, type AdvancedEffectsOptions } from './types';
import type { CardOptions } from '../../types/unified-card-types';

/**
 * 🎨 Módulo de efectos para Entity Cards
 *
 * Este módulo proporciona configuraciones para efectos visuales y avanzados
 * que pueden ser aplicados a las tarjetas de entidad.
 */
export function EffectsModule({ initialConfig = {}, onChange, cardOptions, onCardOptionsChange }: EffectsModuleProps) {
	const [config, setConfig] = useState<EffectsConfig>(() => {
		// Crear una copia profunda para evitar mutaciones
		const defaultConfig = JSON.parse(JSON.stringify(DEFAULT_EFFECTS_CONFIG)) as EffectsConfig;
		// Fusionar con las opciones iniciales
		return deepMerge<Record<string, unknown>>(defaultConfig as Record<string, unknown>, initialConfig as Record<string, unknown>) as EffectsConfig;
	});

	// Actualizar la configuración cuando cambian las props
	useEffect(() => {
		setConfig((prevConfig) => {
			// Crear una copia para evitar mutaciones
			const currentConfig = JSON.parse(JSON.stringify(prevConfig)) as EffectsConfig;
			// Fusionar con las nuevas opciones
			return deepMerge<Record<string, unknown>>(currentConfig as Record<string, unknown>, initialConfig as Record<string, unknown>) as EffectsConfig;
		});
	}, [initialConfig]);

	// Manejar cambios en la configuración
	const handleConfigChange = (newConfig: EffectsConfig) => {
		setConfig(newConfig);
		onChange?.(newConfig);

		// Si tenemos un manejador de cambios para cardOptions, actualizamos las opciones de la tarjeta
		if (onCardOptionsChange) {
			const updatedCardOptions = adaptEffectsConfigToCardOptions(newConfig);
			onCardOptionsChange(updatedCardOptions);
		}
	};

	return (
		<div className="space-y-4">
			<EffectsPanel
				config={config}
				onChange={handleConfigChange}
				cardOptions={cardOptions}
				onCardOptionsChange={onCardOptionsChange}
			/>
		</div>
	);
}

/**
 * Adapta las opciones de tarjeta a la configuración de efectos
 * @param cardOptions Opciones de tarjeta
 * @returns Configuración de efectos parcial
 */
export function adaptCardOptionsToEffectsConfig(cardOptions?: Partial<CardOptions>): EffectsConfig {
	if (!cardOptions) {
		return DEFAULT_EFFECTS_CONFIG;
	}

	const {
		holographicOptions,
		scanlinesOptions,
		glowOptions,
		grainOptions,
		borderOptions,
		distortionOptions,
		filterOptions,
		shadowOptions
	} = cardOptions;

	const visual: VisualEffectsOptions = {
		holographic: holographicOptions ?? DEFAULT_EFFECTS_CONFIG.visual.holographic,
		scanlines: scanlinesOptions ?? DEFAULT_EFFECTS_CONFIG.visual.scanlines,
		glow: glowOptions ?? DEFAULT_EFFECTS_CONFIG.visual.glow,
		grain: grainOptions ?? DEFAULT_EFFECTS_CONFIG.visual.grain,
		border: borderOptions ?? DEFAULT_EFFECTS_CONFIG.visual.border
	};

	const advanced: AdvancedEffectsOptions = {
		distortion: distortionOptions as DistortionOptions ?? DEFAULT_EFFECTS_CONFIG.advanced.distortion,
		filter: filterOptions as FilterOptions ?? DEFAULT_EFFECTS_CONFIG.advanced.filter,
		shadow: shadowOptions as ShadowOptions ?? DEFAULT_EFFECTS_CONFIG.advanced.shadow
	};

	return {
		visual,
		advanced
	};
}

/**
 * Adapta la configuración de efectos a opciones de tarjeta
 * @param config Configuración de efectos
 * @returns Opciones de tarjeta parciales
 */
export function adaptEffectsConfigToCardOptions(config?: Partial<EffectsConfig>): Partial<CardOptions> {
	if (!config) return {};

	const result: Partial<CardOptions> = {};

	// Extraer valores de visual si existe
	if (config.visual) {
		if (config.visual.holographic) result.holographicOptions = config.visual.holographic;
		if (config.visual.scanlines) result.scanlinesOptions = config.visual.scanlines;
		if (config.visual.glow) result.glowOptions = config.visual.glow;
		if (config.visual.grain) result.grainOptions = config.visual.grain;
		if (config.visual.border) result.borderOptions = config.visual.border;
	}

	// Extraer valores de advanced si existe
	if (config.advanced) {
		if (config.advanced.distortion) result.distortionOptions = config.advanced.distortion;
		if (config.advanced.filter) result.filterOptions = config.advanced.filter;
		if (config.advanced.shadow) result.shadowOptions = config.advanced.shadow;
	}

	return result;
}
