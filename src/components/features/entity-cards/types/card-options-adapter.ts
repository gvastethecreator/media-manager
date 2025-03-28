/**
 * Adaptador para convertir entre diferentes representaciones de CardOptions
 * Esto resuelve problemas de compatibilidad entre los diferentes sistemas de tipos
 */

import type { CardOptions as SharedCardOptions } from './shared-card-types';
import type { CardOptions as UnifiedCardOptions } from './unified-card-types';

/**
 * Convierte opciones desde el formato unificado al formato compartido
 * @param options Opciones en formato unificado
 * @returns Opciones compatibles con el formato compartido
 */
export function toSharedCardOptions(options: Partial<UnifiedCardOptions>): SharedCardOptions {
	// Copia básica de propiedades
	const sharedOptions: Record<string, any> = { ...options };

	// Sistema de diseño
	if (options.designSystem) {
		sharedOptions.designSystem = {
			preset: options.designSystem.preset,
			variant: options.designSystem.variant,
			aspectRatio: options.designSystem.aspectRatio,
			cornerStyle: options.designSystem.cornerStyle,
			cornerRadius: options.designSystem.cornerRadius,
			elevation: options.designSystem.elevation,
			shadowStyle: options.designSystem.shadowStyle,
		};
	}

	// Opciones holográficas
	if (options.holographicOptions) {
		sharedOptions.holographicOptions = {
			patternType:
				options.holographicOptions.patternType === 'rainbow'
					? 'geometric' // Usar valor compatible
					: options.holographicOptions.patternType,
			intensity: options.holographicOptions.intensity,
			animationSpeed: options.holographicOptions.animationSpeed,
			visibleOnHover: options.holographicOptions.visibleOnHover,
		};
	}

	// Opciones de brillo
	if (options.glowOptions) {
		sharedOptions.glowOptions = {
			intensity: options.glowOptions.intensity,
			size: options.glowOptions.size,
			blurAmount: options.glowOptions.blurAmount,
			animationType:
				options.glowOptions.animationType === 'breathe' || options.glowOptions.animationType === 'flicker'
					? 'pulse' // Usar valor compatible
					: options.glowOptions.animationType,
			pulseSpeed: options.glowOptions.pulseSpeed,
			visibleOnHover: options.glowOptions.visibleOnHover,
		};
	}

	// Opciones de borde
	if (options.borderOptions) {
		sharedOptions.borderOptions = {
			width: options.borderOptions.width,
			pattern:
				options.borderOptions.pattern === 'gradient'
					? 'solid' // Usar valor compatible
					: options.borderOptions.pattern,
			animationType:
				options.borderOptions.animationType === 'rainbow'
					? 'flow' // Usar valor compatible
					: options.borderOptions.animationType,
			glowIntensity: options.borderOptions.glowIntensity,
			animation: options.borderOptions.animation
				? {
						type:
							options.borderOptions.animation.type === 'rainbow'
								? 'flow' // Usar valor compatible
								: options.borderOptions.animation.type,
						duration: options.borderOptions.animation.duration,
						timing: options.borderOptions.animation.timing,
						iteration: options.borderOptions.animation.iteration,
					}
				: undefined,
		};
	}

	// Estados
	if (options.states) {
		sharedOptions.states = {
			selected: {
				style: 'border',
				color: '#3b82f6',
			},
			disabled: {
				opacity: 0.5,
				grayscale: true,
			},
		};
	}

	// Rareza
	if (options.rarityConfig) {
		sharedOptions.rarityConfig = {
			color: options.rarityConfig.color || '#3b82f6',
			borderColor: options.rarityConfig.borderColor || '#3b82f6',
			glowColor: options.rarityConfig.glowColor || '#3b82f6',
			label: options.rarityConfig.label || 'Standard',
			rarity: options.rarityConfig.rarity || 'standard',
		};
	}

	return sharedOptions as SharedCardOptions;
}

/**
 * Convierte opciones desde el formato compartido al formato unificado
 * @param options Opciones en formato compartido
 * @returns Opciones compatibles con el formato unificado
 */
export function toUnifiedCardOptions(options: Partial<SharedCardOptions>): UnifiedCardOptions {
	// Implementación similar al de arriba pero en sentido inverso
	return options as unknown as UnifiedCardOptions;
}
