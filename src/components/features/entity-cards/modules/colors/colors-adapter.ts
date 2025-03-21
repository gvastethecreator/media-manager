'use client';

import type { CardOptions } from '../../settingsold/types';
import type { ColorsOptions } from './types';

/**
 * Convierte las opciones de la tarjeta al formato de opciones de colores
 * @param cardOptions - Opciones de la tarjeta
 * @returns Opciones de colores
 */
export function cardToColorsOptions(cardOptions: CardOptions): ColorsOptions {
	return {
		useColorPalettes: cardOptions.useColorPalettes ?? true,
		colorPalette: cardOptions.colorPalette || 'modern-blue',
		primaryColor: cardOptions.primaryColor || '59, 130, 246',
		secondaryColor: cardOptions.secondaryColor || '37, 99, 235',
		accentColor: cardOptions.accentColor || '245, 158, 11',
		backgroundStartColor: cardOptions.backgroundStartColor || '249, 250, 251',
		backgroundEndColor: cardOptions.backgroundEndColor || '243, 244, 246',
		textColor: cardOptions.textColor || '31, 41, 55',
		borderColor: cardOptions.borderColor || '209, 213, 219',
	};
}

/**
 * Actualiza las opciones de la tarjeta con las nuevas opciones de colores
 * @param cardOptions - Opciones actuales de la tarjeta
 * @param colorsOptions - Nuevas opciones de colores
 * @returns Opciones actualizadas de la tarjeta
 */
export function updateCardWithColorsOptions(cardOptions: CardOptions, colorsOptions: ColorsOptions): CardOptions {
	return {
		...cardOptions,
		useColorPalettes: colorsOptions.useColorPalettes,
		colorPalette: colorsOptions.colorPalette,
		primaryColor: colorsOptions.primaryColor,
		secondaryColor: colorsOptions.secondaryColor,
		accentColor: colorsOptions.accentColor,
		backgroundStartColor: colorsOptions.backgroundStartColor,
		backgroundEndColor: colorsOptions.backgroundEndColor,
		textColor: colorsOptions.textColor,
		borderColor: colorsOptions.borderColor,
	};
}
