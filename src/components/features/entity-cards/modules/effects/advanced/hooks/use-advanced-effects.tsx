'use client';

import { useCallback, useState } from 'react';
import { type AdvancedEffectsOptions, DEFAULT_ADVANCED_EFFECTS } from '../types';

/**
 * 🪝 Hook para gestionar efectos avanzados
 *
 * Este hook maneja la lógica de estado para efectos visuales avanzados
 * como líneas de escaneo, efectos holográficos, distorsión, etc.
 *
 * @param initialOptions - Opciones iniciales para efectos avanzados
 * @returns Objeto con estado actual y funciones para manipularlo
 */
export function useAdvancedEffects(initialOptions?: Partial<AdvancedEffectsOptions>) {
	// Combinar opciones predeterminadas con las proporcionadas
	const [effects, setEffects] = useState<AdvancedEffectsOptions>({
		...DEFAULT_ADVANCED_EFFECTS,
		...initialOptions,
	});

	/**
	 * Actualiza una propiedad específica del estado de efectos
	 */
	const updateEffect = useCallback(
		<K extends keyof AdvancedEffectsOptions>(key: K, value: AdvancedEffectsOptions[K]) => {
			setEffects((prev) => ({
				...prev,
				[key]: value,
			}));
		},
		[]
	);

	/**
	 * Actualiza múltiples propiedades del estado de efectos
	 */
	const updateEffects = useCallback((newEffects: Partial<AdvancedEffectsOptions>) => {
		setEffects((prev) => ({
			...prev,
			...newEffects,
		}));
	}, []);

	/**
	 * Resetea todos los efectos a sus valores predeterminados
	 */
	const resetEffects = useCallback(() => {
		setEffects(DEFAULT_ADVANCED_EFFECTS);
	}, []);

	/**
	 * Comprueba si algún efecto está activo
	 */
	const hasActiveEffects = useCallback(() => {
		return (
			effects.scanlines ||
			effects.grain ||
			effects.noiseTexture ||
			effects.borderGlow ||
			effects.holographicEffect ||
			effects.chromaticAberration ||
			effects.glitchEffect ||
			effects.pixelate
		);
	}, [effects]);

	return {
		effects,
		updateEffect,
		updateEffects,
		resetEffects,
		hasActiveEffects,
	};
}
