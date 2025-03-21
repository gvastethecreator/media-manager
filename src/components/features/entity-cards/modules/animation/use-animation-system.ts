'use client';

import { useCallback, useState } from 'react';
import { DEFAULT_ANIMATION_SYSTEM } from './animation-module';
import { generateAnimationClasses, generateAnimationVariables } from './css-generator';
import type { AnimationSystem } from './types';

/**
 * Hook personalizado para gestionar el sistema de animación
 */
export function useAnimationSystem(options: AnimationOptions = {}): AnimationSystemResult {
	const {
		enabled = true,
		hoverEffect = true,
		clickEffect = true,
		entranceAnimation = 'none',
		exitAnimation = 'none',
		transitionDuration = 300,
		timingFunction = 'ease',
		hoverScale = 1.05,
		hoverRotation = true,
		liftHeight = 5,
		maxRotation = 10,
		disableAnimations = false,
	} = options;

	// Inicializar el estado con los valores predeterminados combinados con los proporcionados
	const [animationSystem, setAnimationSystem] = useState<AnimationSystem>({
		...DEFAULT_ANIMATION_SYSTEM,
		...options,
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
			...options,
		});
	}, [options]);

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
		if (!enabled || disableAnimations) {
			return {};
		}

		const styles: Record<string, any> = {
			transition: `transform ${transitionDuration}ms ${timingFunction},
        box-shadow ${transitionDuration}ms ${timingFunction}`,
		};

		if (entranceAnimation !== 'none') {
			styles.animation = `${entranceAnimation} ${transitionDuration}ms ${timingFunction}`;
		}

		return styles;
	}, [
		disableAnimations,
		enabled,
		entranceAnimation,
		transitionDuration,
		timingFunction,
	]);

	/**
	 * Generar estilos de hover
	 */
	const getHoverStyles = useCallback(
		(isHovered: boolean) => {
			if (!enabled || !hoverEffect || disableAnimations) {
				return {};
			}

			const hoverStyles: Record<string, any> = {};

			if (isHovered) {
				if (hoverScale !== 1) {
					hoverStyles.transform = `scale(${hoverScale})`;
				}

				if (liftHeight > 0) {
					hoverStyles.transform = hoverStyles.transform
						? `${hoverStyles.transform} translateY(-${liftHeight}px)`
						: `translateY(-${liftHeight}px)`;
					hoverStyles.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
				}
			}

			return hoverStyles;
		},
		[enabled, hoverEffect, hoverScale, liftHeight, disableAnimations]
	);

	return {
		animationSystem,
		updateAnimationSystem,
		resetAnimationSystem,
		applyCustomTimingFunction,
		getAnimationClasses,
		getAnimationVariables,
		getAnimationStyles,
		getHoverStyles,
	};
}
