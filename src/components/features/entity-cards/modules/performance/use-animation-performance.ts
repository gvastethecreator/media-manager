'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PerformanceOptions } from './types';

/**
 * Tipos de elementos animados
 */
export type AnimatedElement = 'card' | 'layer' | 'content' | 'effect';

/**
 * Configuración para animaciones
 */
export interface AnimationConfig {
	duration: number;
	maxFPS: number;
	useRAF: boolean;
	reducedMotion: boolean;
	timingFunction: string;
	delay: number;
}

/**
 * Props para el hook useAnimationPerformance
 */
export interface UseAnimationPerformanceProps {
	options: PerformanceOptions;
	elementType?: AnimatedElement;
	enabled?: boolean;
}

/**
 * Hook especializado para optimizar animaciones en Entity Cards
 *
 * Este hook proporciona utilidades para:
 * - Controlar la duración y calidad de las animaciones
 * - Aplicar throttling para limitar la tasa de frames
 * - Respetar preferencias de reducción de movimiento
 * - Optimizar animaciones según el rendimiento del dispositivo
 *
 * @param props - Propiedades para el hook
 * @returns Funciones y valores para controlar animaciones
 */
export function useAnimationPerformance({
	options,
	elementType = 'card',
	enabled = true,
}: UseAnimationPerformanceProps) {
	// Referencias para animaciones
	const rafIdRef = useRef<number | null>(null);
	const lastFrameTimeRef = useRef<number>(0);

	// Estados locales
	const [isAnimating, setIsAnimating] = useState(false);

	// Configuración de animación derivada de las opciones de rendimiento
	const animationConfig = useMemo<AnimationConfig>(
		() => ({
			duration: options.animationDuration ?? 300,
			maxFPS: options.animationMaxFPS ?? 60,
			useRAF: options.useRAF ?? true,
			reducedMotion: options.reducedMotion ?? false,
			timingFunction: 'ease-out', // Valor por defecto
			delay: options.transitionDelay ?? 0,
		}),
		[options.animationDuration, options.animationMaxFPS, options.useRAF, options.reducedMotion, options.transitionDelay]
	);

	// Calcular el intervalo mínimo entre frames basado en maxFPS
	const frameInterval = useMemo(() => {
		// Si maxFPS es 60, el intervalo es aproximadamente 16.67ms
		return 1000 / (animationConfig.maxFPS || 60);
	}, [animationConfig.maxFPS]);

	/**
	 * Aplicar animación con limitación de FPS usando rAF
	 */
	const animateWithRAF = useCallback(
		(
			callback: (progress: number, timestamp: number) => void,
			duration: number = animationConfig.duration,
			onComplete?: () => void
		) => {
			if (!enabled || animationConfig.reducedMotion) {
				// Si está deshabilitado o se prefiere reducción de movimiento, ejecutar inmediatamente al 100%
				callback(1, performance.now());
				onComplete?.();
				return () => {};
			}

			const startTime = performance.now();
			setIsAnimating(true);

			// Función de animación que se ejecutará en cada frame
			const animate = (timestamp: number) => {
				// Verificar si ha pasado suficiente tiempo desde el último frame
				const elapsed = timestamp - lastFrameTimeRef.current;

				if (elapsed < frameInterval) {
					// No ha pasado suficiente tiempo, programar el siguiente frame
					rafIdRef.current = requestAnimationFrame(animate);
					return;
				}

				// Actualizar tiempo del último frame
				lastFrameTimeRef.current = timestamp;

				// Calcular progreso (0 a 1)
				const elapsedTime = timestamp - startTime;
				const progress = Math.min(elapsedTime / duration, 1);

				// Ejecutar callback con el progreso actual
				callback(progress, timestamp);

				if (progress < 1) {
					// Continuar animación
					rafIdRef.current = requestAnimationFrame(animate);
				} else {
					// Animación completada
					setIsAnimating(false);
					onComplete?.();
				}
			};

			// Iniciar la animación
			rafIdRef.current = requestAnimationFrame(animate);

			// Retornar función para cancelar animación
			return () => {
				if (rafIdRef.current !== null) {
					cancelAnimationFrame(rafIdRef.current);
					rafIdRef.current = null;
					setIsAnimating(false);
				}
			};
		},
		[enabled, animationConfig.reducedMotion, animationConfig.duration, frameInterval]
	);

	/**
	 * Aplicar animación con CSS Transitions
	 */
	const getCssTransition = useCallback(
		(properties: string | string[] = 'all', customConfig?: Partial<AnimationConfig>) => {
			const config = { ...animationConfig, ...customConfig };

			// Si reducedMotion está habilitado, usar duración 0
			const duration = config.reducedMotion ? 0 : config.duration;

			// Convertir propiedades a string si es un array
			const props = Array.isArray(properties) ? properties.join(', ') : properties;

			return `${props} ${duration}ms ${config.timingFunction} ${config.delay}ms`;
		},
		[animationConfig]
	);

	/**
	 * Aplicar animación basada en setTimeout para casos donde rAF no es adecuado
	 */
	const animateWithTimeout = useCallback(
		(callback: (progress: number) => void, duration: number = animationConfig.duration, onComplete?: () => void) => {
			if (!enabled || animationConfig.reducedMotion) {
				// Si está deshabilitado o se prefiere reducción de movimiento, ejecutar inmediatamente al 100%
				callback(1);
				onComplete?.();
				return () => {};
			}

			const startTime = Date.now();
			setIsAnimating(true);

			// Array para almacenar IDs de timeouts
			const timeoutIds: number[] = [];

			// Calcular número de pasos basado en duración y frameInterval
			const steps = Math.max(2, Math.floor(duration / frameInterval));
			const stepTime = duration / steps;

			// Crear un timeout para cada paso
			for (let i = 1; i <= steps; i++) {
				const progress = i / steps;
				const delay = i * stepTime;

				const timeoutId = window.setTimeout(() => {
					callback(progress);

					// Si es el último paso, ejecutar onComplete
					if (i === steps) {
						setIsAnimating(false);
						onComplete?.();
					}
				}, delay);

				timeoutIds.push(timeoutId);
			}

			// Retornar función para cancelar animación
			return () => {
				timeoutIds.forEach((id) => clearTimeout(id));
				setIsAnimating(false);
			};
		},
		[enabled, animationConfig.reducedMotion, animationConfig.duration, frameInterval]
	);

	/**
	 * Obtener estilo CSS para reducción de movimiento
	 */
	const getReducedMotionStyle = useCallback(() => {
		if (animationConfig.reducedMotion) {
			return {
				'--animation-duration': '0ms',
				'--transition-duration': '0ms',
				'--effect-duration': '0ms',
				'--hover-time': '0ms',
				transition: 'none',
				animation: 'none',
			};
		}

		return {
			'--animation-duration': `${animationConfig.duration}ms`,
			'--transition-duration': `${animationConfig.duration}ms`,
			'--effect-duration': `${animationConfig.duration}ms`,
			'--hover-time': `${animationConfig.duration}ms`,
		};
	}, [animationConfig.reducedMotion, animationConfig.duration]);

	/**
	 * Obtener clases CSS de animación optimizadas
	 */
	const getOptimizedAnimationClasses = useCallback(() => {
		const classes = ['animate-optimized'];

		// Añadir clases según el tipo de elemento
		if (elementType) {
			classes.push(`animate-${elementType}`);
		}

		// Añadir clases según la configuración
		if (animationConfig.reducedMotion) {
			classes.push('reduced-motion');
		}

		// Añadir clases para hardware acceleration si está habilitado
		if (options.enableHardwareAcceleration) {
			classes.push('hardware-accelerated');
		}

		return classes.join(' ');
	}, [elementType, animationConfig.reducedMotion, options.enableHardwareAcceleration]);

	// Limpiar recursos al desmontar
	useEffect(() => {
		return () => {
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current);
			}
		};
	}, []);

	return {
		// Estado
		isAnimating,
		animationConfig,

		// Funciones para animación
		animateWithRAF,
		animateWithTimeout,
		getCssTransition,

		// Estilos y clases
		getReducedMotionStyle,
		getOptimizedAnimationClasses,
	};
}
