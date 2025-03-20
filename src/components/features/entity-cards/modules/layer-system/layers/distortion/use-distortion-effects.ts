'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_DISTORTION_EFFECTS_SYSTEM } from './distortion-effects-module';
import type { DistortionEffectsSystem } from './types';

/**
 * Props para el hook useDistortionEffects
 */
interface UseDistortionEffectsProps {
	/** Estado inicial del sistema de efectos */
	initialEffects?: Partial<DistortionEffectsSystem>;
}

/**
 * Resultado del hook useDistortionEffects
 */
interface UseDistortionEffectsResult {
	/** Sistema de efectos actual */
	effectsSystem: DistortionEffectsSystem;

	/** Actualiza el sistema de efectos completo */
	setEffectsSystem: (effects: DistortionEffectsSystem) => void;

	/** Actualiza un efecto específico */
	updateEffect: (
		effectName: 'glitchEffect' | 'chromaticAberration' | 'pixelate',
		config: Partial<DistortionEffectsSystem[keyof DistortionEffectsSystem]>
	) => void;

	/** Habilita o deshabilita todos los efectos */
	toggleEffects: (enabled: boolean) => void;

	/** Habilita o deshabilita un efecto específico */
	toggleEffect: (effectName: 'glitchEffect' | 'chromaticAberration' | 'pixelate', enabled: boolean) => void;

	/** Restablece todos los efectos a los valores predeterminados */
	resetAllEffects: () => void;

	/** Comprueba si los efectos están habilitados */
	areEffectsEnabled: () => boolean;

	/** Genera clases CSS para los efectos */
	generateEffectClasses: (isHovered?: boolean) => string;
}

/**
 * Hook para gestionar los efectos de distorsión
 * @param props Props del hook
 * @returns Funciones y valores para gestionar efectos
 */
export function useDistortionEffects(props?: UseDistortionEffectsProps): UseDistortionEffectsResult {
	const initialEffects = props?.initialEffects || {};

	// Estado para almacenar la configuración de efectos
	const [effectsSystem, setEffectsSystem] = useState<DistortionEffectsSystem>({
		...DEFAULT_DISTORTION_EFFECTS_SYSTEM,
		...initialEffects,
	});

	// Actualiza un efecto específico
	const updateEffect = useCallback(
		(
			effectName: 'glitchEffect' | 'chromaticAberration' | 'pixelate',
			config: Partial<DistortionEffectsSystem[keyof DistortionEffectsSystem]>
		) => {
			setEffectsSystem((prev) => ({
				...prev,
				[effectName]: {
					...prev[effectName],
					...config,
				},
			}));
		},
		[]
	);

	// Habilita o deshabilita todos los efectos
	const toggleEffects = useCallback((enabled: boolean) => {
		setEffectsSystem((prev) => ({
			...prev,
			enabled,
		}));
	}, []);

	// Habilita o deshabilita un efecto específico
	const toggleEffect = useCallback(
		(effectName: 'glitchEffect' | 'chromaticAberration' | 'pixelate', enabled: boolean) => {
			setEffectsSystem((prev) => ({
				...prev,
				[effectName]: {
					...prev[effectName],
					enabled,
				},
			}));
		},
		[]
	);

	// Restablece todos los efectos a los valores predeterminados
	const resetAllEffects = useCallback(() => {
		setEffectsSystem(DEFAULT_DISTORTION_EFFECTS_SYSTEM);
	}, []);

	// Verifica si los efectos están habilitados
	const areEffectsEnabled = useCallback(() => {
		return effectsSystem.enabled;
	}, [effectsSystem.enabled]);

	// Genera clases CSS para los efectos de distorsión
	const generateEffectClasses = useCallback(
		(isHovered = false) => {
			const classes: string[] = [];

			// Solo generar clases si los efectos están habilitados globalmente
			if (effectsSystem.enabled) {
				// Aplicar efecto glitch si está habilitado y
				// (no está configurado para hover solamente, o está configurado para hover y el ratón está encima)
				if (
					effectsSystem.glitchEffect.enabled &&
					(!effectsSystem.glitchEffect.visibleOnHover || (effectsSystem.glitchEffect.visibleOnHover && isHovered))
				) {
					classes.push('effect-glitch');
					classes.push(`glitch-intensity-${Math.round(effectsSystem.glitchEffect.intensity * 10)}`);
					classes.push(`glitch-frequency-${Math.round(effectsSystem.glitchEffect.frequency * 10)}`);
				}

				// Aplicar efecto de aberración cromática con la misma lógica
				if (
					effectsSystem.chromaticAberration.enabled &&
					(!effectsSystem.chromaticAberration.visibleOnHover ||
						(effectsSystem.chromaticAberration.visibleOnHover && isHovered))
				) {
					classes.push('effect-chromatic');
					classes.push(`chromatic-intensity-${Math.round(effectsSystem.chromaticAberration.intensity * 10)}`);
					classes.push(`chromatic-offset-${Math.round(effectsSystem.chromaticAberration.offset)}`);
				}

				// Aplicar efecto de pixelado con la misma lógica
				if (
					effectsSystem.pixelate.enabled &&
					(!effectsSystem.pixelate.visibleOnHover || (effectsSystem.pixelate.visibleOnHover && isHovered))
				) {
					classes.push('effect-pixelate');
					classes.push(`pixelate-intensity-${Math.round(effectsSystem.pixelate.intensity * 10)}`);
					classes.push(`pixelate-size-${Math.round(effectsSystem.pixelate.blockSize)}`);
				}
			}

			return classes.join(' ');
		},
		[effectsSystem]
	);

	return {
		effectsSystem,
		setEffectsSystem,
		updateEffect,
		toggleEffects,
		toggleEffect,
		resetAllEffects,
		areEffectsEnabled,
		generateEffectClasses,
	};
}
