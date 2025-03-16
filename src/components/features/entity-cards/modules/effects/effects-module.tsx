'use client';

import { deepMerge } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { EffectsPanel } from './effects-panel';
import { DEFAULT_EFFECTS_CONFIG, EffectsConfig, EffectsModuleProps } from './types';

/**
 * 🎨 Módulo de efectos para Entity Cards
 *
 * Este módulo proporciona configuraciones para efectos visuales y avanzados
 * que pueden ser aplicados a las tarjetas de entidad.
 */
export function EffectsModule({ initialConfig = {}, onChange, cardOptions, onCardOptionsChange }: EffectsModuleProps) {
	const [config, setConfig] = useState<EffectsConfig>(
		() => deepMerge(DEFAULT_EFFECTS_CONFIG, initialConfig) as EffectsConfig
	);

	// Actualizar la configuración cuando cambian las props
	useEffect(() => {
		setConfig((prevConfig) => deepMerge(prevConfig, initialConfig) as EffectsConfig);
	}, [initialConfig]);

	// Manejar cambios en la configuración
	const handleConfigChange = (newConfig: EffectsConfig) => {
		setConfig(newConfig);
		onChange?.(newConfig);

		// Si tenemos un manejador de cambios para cardOptions, actualizamos las opciones de la tarjeta
		if (onCardOptionsChange) {
			const updatedCardOptions = {
				holographicOptions: newConfig.visual.holographic,
				scanlinesOptions: newConfig.visual.scanlines,
				glowOptions: newConfig.visual.glow,
				grainOptions: newConfig.visual.grain,
				borderOptions: newConfig.visual.border,
			};

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
 * 🎨 Adaptador de cardOptions a EffectsConfig
 */
export function adaptCardOptionsToEffectsConfig(cardOptions?: Partial<any>): Partial<EffectsConfig> {
	if (!cardOptions) return {};

	return {
		visual: {
			holographic: cardOptions.holographicOptions || DEFAULT_EFFECTS_CONFIG.visual.holographic,
			scanlines: cardOptions.scanlinesOptions || DEFAULT_EFFECTS_CONFIG.visual.scanlines,
			glow: cardOptions.glowOptions || DEFAULT_EFFECTS_CONFIG.visual.glow,
			grain: cardOptions.grainOptions || DEFAULT_EFFECTS_CONFIG.visual.grain,
			border: cardOptions.borderOptions || DEFAULT_EFFECTS_CONFIG.visual.border,
		},
	};
}

/**
 * 🎨 Adaptador de EffectsConfig a cardOptions
 */
export function adaptEffectsConfigToCardOptions(config: EffectsConfig): any {
	return {
		holographicOptions: config.visual.holographic,
		scanlinesOptions: config.visual.scanlines,
		glowOptions: config.visual.glow,
		grainOptions: config.visual.grain,
		borderOptions: config.visual.border,
	};
}
