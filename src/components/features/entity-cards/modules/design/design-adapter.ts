'use client';

import type { CardOptions } from '../../types/unified-card-types';
import type { DesignSystem } from './types';

/**
 * Convierte las opciones del formato antiguo al nuevo sistema de diseño
 * @param options Opciones de carta en formato antiguo
 * @returns Opciones del sistema de diseño
 */
export function legacyToDesignSystem(options: CardOptions): DesignSystem {
	// Extraer las opciones de diseño o crear un objeto vacío si no existen
	const designSystem = options.designSystem || {};

	return {
		// Propiedades base requeridas
		borderRadius: designSystem.cornerRadius || 8,
		padding: designSystem.padding || 16,
		aspectRatio: designSystem.aspectRatio || '1/1',
		maxWidth: designSystem.maxWidth || 400,
		elevation: designSystem.elevation || 1,
		shadowColor: designSystem.shadowColor || 'rgba(0, 0, 0, 0.25)',
		backgroundColor: designSystem.backgroundColor || '#ffffff',
		backgroundOpacity: designSystem.backgroundOpacity || 1,
		backdropFilter: designSystem.backdropFilter || 'none',
		backdropBlurAmount: designSystem.backdropBlurAmount || 0,
		borderWidth: designSystem.borderWidth || 1,
		borderStyle: designSystem.borderStyle || 'solid',
		borderColor: designSystem.borderColor || '#e5e7eb',
		customCssClasses: designSystem.customCssClasses || [],
		customCssVariables: designSystem.customCssVariables || {},

		// Propiedades adicionales para compatibilidad
		preset: designSystem.preset || 'default',
		variant: designSystem.variant || 'default',
		cornerStyle: designSystem.cornerStyle || 'rounded',
		cornerRadius: designSystem.cornerRadius || 8,
		shadowStyle: designSystem.shadowStyle || 'soft',
		colorScheme: designSystem.colorScheme || 'auto',
		fontFamily: designSystem.fontFamily || 'system',
		surfaceStyle: designSystem.surfaceStyle || 'regular',
		layoutDensity: designSystem.layoutDensity || 'comfortable',
		contentPadding: designSystem.contentPadding || 'medium',
		glassEffect: designSystem.glassEffect || false,
		accentColor: designSystem.accentColor || '#3b82f6',
		textColor: designSystem.textColor || '#000000',
	};
}

/**
 * Convierte las opciones del nuevo sistema de diseño al formato antiguo
 * @param designSystem Opciones del sistema de diseño
 * @returns Opciones de diseño en formato antiguo
 */
export function designSystemToLegacy(designSystem: DesignSystem): Record<string, unknown> {
	return {
		...designSystem,
	};
}
