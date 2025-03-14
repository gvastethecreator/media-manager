'use client';

import type { CardOptions } from '../../types/card-settings-types';
import type { BacksideOptions } from './types';

/**
 * Convierte las opciones del formato antiguo al nuevo sistema de backside
 * @param options Opciones de carta en formato antiguo
 * @returns Opciones del sistema de backside
 */
export function legacyToBacksideSystem(options: CardOptions): { options: CardOptions; backside: BacksideOptions } {
	// Extraer las opciones de backside o crear un objeto vacío si no existen
	const backside = options.backside || {};

	// Devolver el formato esperado por el BacksidePanel
	return {
		options,
		backside: {
			enabled: backside.enabled ?? false,
			layoutType: backside.layoutType ?? 'standard',
			colorMode: backside.colorMode ?? 'inherit',
			customColor: backside.customColor ?? '',
			opacity: backside.opacity ?? 0.95,
			blurBackground: backside.blurBackground ?? true,
			blurAmount: backside.blurAmount ?? 10,
			showAttributes: backside.showAttributes ?? true,
			showDescription: backside.showDescription ?? true,
			showStats: backside.showStats ?? true,
			showMetadata: backside.showMetadata ?? true,
			showRelations: backside.showRelations ?? false,
			maxDescriptionLength: backside.maxDescriptionLength ?? 300,
			flipAnimation: backside.flipAnimation ?? 'rotate',
			flipDuration: backside.flipDuration ?? 600,
			enableAutoFlip: backside.enableAutoFlip ?? false,
			autoFlipDelay: backside.autoFlipDelay ?? 3000,
			flipTrigger: backside.flipTrigger ?? 'click',
			headingStyle: backside.headingStyle ?? 'default',
			infoStyle: backside.infoStyle ?? 'default',
			separatorStyle: backside.separatorStyle ?? 'line',
		},
	};
}

/**
 * Convierte las opciones del nuevo sistema de backside al formato antiguo
 * @param backsideSystem Opciones del sistema de backside
 * @returns Opciones de backside en formato antiguo
 */
export function backsideSystemToLegacy(backsideSystem: BacksideOptions): BacksideOptions {
	// Convertir al formato antiguo manteniendo todas las propiedades
	return {
		...backsideSystem,
	};
}
