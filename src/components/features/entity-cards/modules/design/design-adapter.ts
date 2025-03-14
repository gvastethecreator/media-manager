'use client';

import type { CardOptions } from '../../types/card-settings-types';
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
		preset: designSystem.preset || 'default',
		cornerStyle: designSystem.cornerStyle || 'rounded',
		cornerRadius: designSystem.cornerRadius || 8,
		shadowStyle: designSystem.shadowStyle || 'soft',
		elevation: designSystem.elevation || 1,
		backgroundColor: designSystem.backgroundColor || '#ffffff',
		textColor: designSystem.textColor || '#000000',
		accentColor: designSystem.accentColor || '#3b82f6',
		borderStyle: designSystem.borderStyle || 'solid',
		borderWidth: designSystem.borderWidth || 1,
		borderColor: designSystem.borderColor || '#e5e7eb',
		glassEffect: designSystem.glassEffect || false,
		contentPadding: designSystem.contentPadding || 'medium',
		layoutDensity: designSystem.layoutDensity || 'comfortable',
		fontFamily: designSystem.fontFamily || 'system',
		surfaceStyle: designSystem.surfaceStyle || 'regular',
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
