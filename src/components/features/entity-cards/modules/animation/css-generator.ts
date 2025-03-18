import { cn } from '@/lib/utils';
import type { AnimationSystem } from './types';

/**
 * Genera clases CSS basadas en la configuración de animación
 * @param animationSystem Configuración del sistema de animación
 * @returns String con las clases CSS generadas
 */
export function generateAnimationClasses(animationSystem: AnimationSystem): string {
	// Si las animaciones están deshabilitadas, no generamos clases
	if (!animationSystem.enabled) {
		return '';
	}

	const classes = [];

	// Clases para la duración y función de temporización
	classes.push(`transition-all duration-${animationSystem.transitionDuration}`);

	// Diferentes funciones de temporización
	if (animationSystem.timingFunction === 'ease') {
		classes.push('ease');
	} else if (animationSystem.timingFunction === 'ease-in') {
		classes.push('ease-in');
	} else if (animationSystem.timingFunction === 'ease-out') {
		classes.push('ease-out');
	} else if (animationSystem.timingFunction === 'ease-in-out') {
		classes.push('ease-in-out');
	} else if (animationSystem.timingFunction === 'linear') {
		classes.push('linear');
	} else if (animationSystem.timingFunction.startsWith('cubic-bezier')) {
		// Para cubic-bezier personalizados, agregamos una clase especial
		classes.push('timing-function-custom');
	}

	// Clases para animaciones de entrada
	if (animationSystem.entranceAnimation && animationSystem.entranceAnimation !== 'none') {
		classes.push(`animate-${animationSystem.entranceAnimation}`);

		if (animationSystem.entranceDelay > 0) {
			classes.push(`delay-${animationSystem.entranceDelay}`);
		}
	}

	// Clases para animaciones en bucle
	if (animationSystem.loopAnimations) {
		classes.push('animate-loop');
	}

	return cn(...classes);
}

/**
 * Genera variables CSS basadas en la configuración de animación
 * @param animationSystem Configuración del sistema de animación
 * @returns Objeto con las variables CSS generadas
 */
export function generateAnimationVariables(animationSystem: AnimationSystem): Record<string, string> {
	const variables: Record<string, string> = {};

	// Si las animaciones están deshabilitadas, no generamos variables
	if (!animationSystem.enabled) {
		return variables;
	}

	// Variables para la duración y función de temporización
	variables['--animation-duration'] = `${animationSystem.transitionDuration}ms`;
	variables['--animation-timing-function'] = animationSystem.timingFunction;
	variables['--animation-delay'] = `${animationSystem.entranceDelay}ms`;

	// Variables para efectos de hover
	variables['--hover-scale'] = animationSystem.hoverScale.toString();
	variables['--hover-lift-height'] = `${animationSystem.liftHeight}px`;
	variables['--hover-max-rotation'] = `${animationSystem.maxRotation}deg`;

	// Variables para efectos de click
	variables['--active-scale'] = animationSystem.activeScale.toString();
	variables['--active-brightness'] = animationSystem.activeBrightness.toString();

	return variables;
}

/**
 * Genera estilos CSS en línea basados en la configuración de animación
 * @param animationSystem Configuración del sistema de animación
 * @returns Objeto con los estilos CSS generados
 */
export function generateAnimationStyles(animationSystem: AnimationSystem): React.CSSProperties {
	const styles: React.CSSProperties = {};
	const variables = generateAnimationVariables(animationSystem);

	// Convertir variables a estilos en línea
	for (const [key, value] of Object.entries(variables)) {
		// Usar una aserción de tipo más segura que 'any'
		styles[key as keyof React.CSSProperties] = value;
	}

	// Agregar transición personalizada si es necesario
	if (animationSystem.enabled) {
		styles.transition = `all ${animationSystem.transitionDuration}ms ${animationSystem.timingFunction}`;

		// Si es una función cubic-bezier personalizada, aplicarla directamente
		if (animationSystem.timingFunction.startsWith('cubic-bezier')) {
			styles.transitionTimingFunction = animationSystem.timingFunction;
		}
	}

	return styles;
}
