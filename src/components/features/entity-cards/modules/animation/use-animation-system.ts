'use client';

import { useCallback, useState } from 'react';
import { DEFAULT_ANIMATION_SYSTEM } from './animation-module';
import { generateAnimationClasses, generateAnimationStyles, generateAnimationVariables } from './css-generator';
import type { AnimationSystem } from './types';

/**
 * Hook personalizado para gestionar el sistema de animación
 */
export function useAnimationSystem(initialSystem?: Partial<AnimationSystem>) {
	// Inicializar el estado con los valores predeterminados combinados con los proporcionados
	const [animationSystem, setAnimationSystem] = useState<AnimationSystem>({
		...DEFAULT_ANIMATION_SYSTEM,
		...initialSystem,
	});

	/**
	 * Actualizar el sistema de animación
	 */
	const updateAnimationSystem = useCallback((update: Partial<AnimationSystem>) => {
		setAnimationSystem((prev) => ({
			...prev,
			...update,
		}));
	}, []);

	/**
	 * Restablecer el sistema de animación a los valores iniciales
	 */
	const resetAnimationSystem = useCallback(() => {
		setAnimationSystem({
			...DEFAULT_ANIMATION_SYSTEM,
			...initialSystem,
		});
	}, [initialSystem]);

	/**
	 * Aplicar una función de temporización personalizada
	 */
	const applyCustomTimingFunction = useCallback(
		(x1: number, y1: number, x2: number, y2: number) => {
			const cubicBezier = `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
			updateAnimationSystem({ timingFunction: cubicBezier });
		},
		[updateAnimationSystem]
	);

	/**
	 * Generar clases CSS basadas en la configuración de animación
	 */
	const getAnimationClasses = useCallback(() => {
		return generateAnimationClasses(animationSystem);
	}, [animationSystem]);

	/**
	 * Generar variables CSS basadas en la configuración de animación
	 */
	const getAnimationVariables = useCallback(() => {
		return generateAnimationVariables(animationSystem);
	}, [animationSystem]);

	/**
	 * Generar estilos CSS en línea basados en la configuración de animación
	 */
	const getAnimationStyles = useCallback(() => {
		return generateAnimationStyles(animationSystem);
	}, [animationSystem]);

	return {
		animationSystem,
		updateAnimationSystem,
		resetAnimationSystem,
		applyCustomTimingFunction,
		getAnimationClasses,
		getAnimationVariables,
		getAnimationStyles,
	};
}
