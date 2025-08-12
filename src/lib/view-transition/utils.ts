/**
 * @file Utilidades para ViewTransition API
 * @module lib/view-transition
 * @description Funciones auxiliares para trabajar con ViewTransition
 */

import { type ViewTransitionEasing, type ViewTransitionPolyfill } from '@/types/view-transition';

/**
 * Verificar si ViewTransition está soportado nativamente
 */
export function isViewTransitionSupported(): boolean {
	// Verificar soporte nativo del browser
	if (typeof window === 'undefined') {
		return false;
	}

	// ViewTransition API nativo del browser
	if ('startViewTransition' in document) {
		return true;
	}

	// React experimental ViewTransition
	try {
		// Intentar importar dinámicamente React experimental
		const React = require('react');
		return 'unstable_ViewTransition' in React;
	} catch {
		return false;
	}
}

/**
 * Crear un polyfill para ViewTransition usando CSS transitions
 */
export function createViewTransitionPolyfill(): ViewTransitionPolyfill {
	return {
		isNative: false,
		async startViewTransition(callback: () => void): Promise<void> {
			// Capturar estado inicial
			const beforeSnapshot = capturePageSnapshot();

			// Ejecutar callback que modifica el DOM
			callback();

			// Esperar siguiente frame para que el DOM se actualice
			await new Promise((resolve) => requestAnimationFrame(resolve));

			// Capturar estado final
			const afterSnapshot = capturePageSnapshot();

			// Animar diferencias usando CSS
			return animateWithCSS(beforeSnapshot, afterSnapshot);
		},
		addTransitionType(type: string): void {
			// Agregar clase CSS para el tipo
			document.documentElement.classList.add(`transition-type-${type}`);
		},
	};
}

/**
 * Capturar snapshot de la página para animación manual
 */
function capturePageSnapshot() {
	// Implementación simplificada - en una versión completa
	// capturaríamos posiciones y estilos de elementos
	return {
		timestamp: Date.now(),
		scrollY: window.scrollY,
		scrollX: window.scrollX,
		// TODO: Capturar elementos con [data-view-transition-name]
	};
}

/**
 * Animar usando CSS transitions como fallback
 */
async function animateWithCSS(_before: any, _after: any): Promise<void> {
	// Implementación simplificada de animación CSS
	const transitionElement = document.createElement('div');
	transitionElement.className = 'view-transition-fallback';
	transitionElement.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 9999;
		background: linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.1) 50%, transparent 52%);
		opacity: 0;
		transition: opacity 0.3s ease-out;
	`;

	document.body.appendChild(transitionElement);

	// Animar
	requestAnimationFrame(() => {
		transitionElement.style.opacity = '1';
		setTimeout(() => {
			transitionElement.style.opacity = '0';
			setTimeout(() => {
				document.body.removeChild(transitionElement);
			}, 300);
		}, 100);
	});

	return new Promise((resolve) => setTimeout(resolve, 400));
}

/**
 * Obtener configuración de CSS para ViewTransition
 */
export function getViewTransitionCSS(duration: number, easing: ViewTransitionEasing): string {
	const easingMap: Record<ViewTransitionEasing, string> = {
		linear: 'linear',
		ease: 'ease',
		'ease-in': 'ease-in',
		'ease-out': 'ease-out',
		'ease-in-out': 'ease-in-out',
		'cubic-bezier': 'cubic-bezier(0.4, 0, 0.2, 1)',
	};

	return `
		::view-transition-old(root),
		::view-transition-new(root) {
			animation-duration: ${duration}ms;
			animation-timing-function: ${easingMap[easing]};
		}
	`;
}

/**
 * Crear nombre único para ViewTransition
 */
export function createTransitionName(prefix: string, id?: string): string {
	const uniqueId = id || Math.random().toString(36).substr(2, 9);
	return `${prefix}-${uniqueId}`;
}

/**
 * Aplicar nombre de transición a elemento
 */
export function applyTransitionName(element: HTMLElement, name: string): void {
	element.style.viewTransitionName = name;
}

/**
 * Remover nombre de transición de elemento
 */
export function removeTransitionName(element: HTMLElement): void {
	element.style.viewTransitionName = '';
}

/**
 * Verificar si debe reducir movimiento basado en preferencias del usuario
 */
export function shouldReduceMotion(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}

	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Aplicar configuración de reducción de movimiento
 */
export function applyReducedMotionConfig(config: { duration: number; easing: ViewTransitionEasing }) {
	if (shouldReduceMotion()) {
		return {
			duration: Math.min(config.duration, 150), // Máximo 150ms
			easing: 'ease-out' as ViewTransitionEasing,
		};
	}
	return config;
}

/**
 * Generar CSS dinámico para ViewTransition
 */
export function generateViewTransitionCSS(config: {
	duration: number;
	easing: ViewTransitionEasing;
	className?: string;
}): string {
	const { duration, easing, className } = config;
	const selector = className ? `.${className}` : 'root';

	return `
		::view-transition-old(${selector}),
		::view-transition-new(${selector}) {
			animation-duration: ${duration}ms;
			animation-timing-function: ${easing};
		}

		::view-transition-group(${selector}) {
			animation-duration: ${duration}ms;
			animation-timing-function: ${easing};
		}
	`;
}

/**
 * Inyectar estilos CSS en el documento
 */
export function injectViewTransitionStyles(css: string, id = 'view-transition-styles'): void {
	// Remover estilos existentes
	const existingStyle = document.getElementById(id);
	if (existingStyle) {
		existingStyle.remove();
	}

	// Crear nuevo elemento style
	const styleElement = document.createElement('style');
	styleElement.id = id;
	styleElement.textContent = css;
	document.head.appendChild(styleElement);
}

/**
 * Configuración de debugging para ViewTransition
 */
export function enableViewTransitionDebug(): void {
	if (typeof window === 'undefined') {
		return;
	}

	// Agregar clase de debug al document
	document.documentElement.classList.add('view-transition-debug');

	// Log de transiciones en la consola
	if ('startViewTransition' in document) {
		const originalStartViewTransition = (document as any).startViewTransition;
		(document as any).startViewTransition = function (callback: () => void) {
			console.log('🎬 ViewTransition iniciada:', { timestamp: Date.now() });

			const transition = originalStartViewTransition.call(this, callback);

			transition.ready.then(() => {
				console.log('🎬 ViewTransition lista');
			});

			transition.finished
				.then(() => {
					console.log('🎬 ViewTransition completada');
				})
				.catch((error: Error) => {
					console.warn('🎬 ViewTransition falló:', error);
				});

			return transition;
		};
	}
}

/**
 * Utilidad para wrappear funciones con ViewTransition
 */
export function withViewTransition<T extends any[], R>(
	fn: (...args: T) => R,
	_options: { duration?: number; easing?: ViewTransitionEasing } = {}
) {
	return async (...args: T): Promise<R> => {
		const polyfill = createViewTransitionPolyfill();

		let result: R | undefined;
		await polyfill.startViewTransition(() => {
			result = fn(...args);
		});

		if (result === undefined) {
			throw new Error('ViewTransition callback returned undefined');
		}

		return result;
	};
}
