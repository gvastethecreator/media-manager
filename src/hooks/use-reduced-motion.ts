/**
 * @file useReducedMotion Hook
 * @module hooks/use-reduced-motion
 * @description Detecta preferencias de movimiento reducido del usuario
 * A11y: WCAG 2.3.3 - Animation from Interactions, Respect prefers-reduced-motion
 */

import { useEffect, useState } from 'react';

const REDUCED_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Hook para detectar si el usuario prefiere animaciones reducidas
 * @returns boolean - true si el usuario prefiere movimiento reducido
 *
 * @example
 * const prefersReducedMotion = useReducedMotion();
 *
 * // En componente:
 * <motion.div
 *   animate={prefersReducedMotion ? {} : { opacity: 1 }}
 *   transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
 * />
 */
export function useReducedMotion(): boolean {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		// Verificar si estamos en el cliente
		if (typeof window === 'undefined') return;

		const mediaQuery = window.matchMedia(REDUCED_MEDIA_QUERY);
		setPrefersReducedMotion(mediaQuery.matches);

		// Handler para cambios
		const handleChange = (event: MediaQueryListEvent) => {
			setPrefersReducedMotion(event.matches);
		};

		// Usar el método correcto según soporte del navegador
		if (mediaQuery.addEventListener) {
			mediaQuery.addEventListener('change', handleChange);
		} else {
			// Fallback para navegadores antiguos
			mediaQuery.addListener(handleChange);
		}

		return () => {
			if (mediaQuery.removeEventListener) {
				mediaQuery.removeEventListener('change', handleChange);
			} else {
				mediaQuery.removeListener(handleChange);
			}
		};
	}, []);

	return prefersReducedMotion;
}

/**
 * Hook para obtener configuración de animación respetando preferencias
 * @param duration - Duración normal de la animación
 * @param delay - Delay normal
 * @returns Configuración de animación adaptada
 *
 * @example
 * const animationConfig = useAnimationConfig(300, 100);
 * // Retorna { duration: 0, delay: 0 } si reduced motion
 * // Retorna { duration: 300, delay: 100 } si no
 */
export function useAnimationConfig(
	duration: number = 300,
	delay: number = 0
): { duration: number; delay: number; shouldAnimate: boolean } {
	const prefersReducedMotion = useReducedMotion();

	if (prefersReducedMotion) {
		return { duration: 0, delay: 0, shouldAnimate: false };
	}

	return { duration, delay, shouldAnimate: true };
}

/**
 * Utilidad para crear estilos de transición respetando preferencias
 * @param properties - Propiedades CSS a animar
 * @param duration - Duración en ms
 * @returns Objeto de estilos CSS
 */
export function useTransitionStyles(properties: string[] = ['all'], duration: number = 300): { transition: string } {
	const prefersReducedMotion = useReducedMotion();

	if (prefersReducedMotion) {
		return { transition: 'none' };
	}

	return {
		transition: properties.map((prop) => `${prop} ${duration}ms ease`).join(', '),
	};
}

export default useReducedMotion;
