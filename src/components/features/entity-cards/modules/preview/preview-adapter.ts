'use client';

import type { CardOptions } from '../../types/card-settings-types';
import type { PreviewOptions } from './types';

// Extender el tipo CardOptions para incluir la propiedad preview
interface ExtendedCardOptions extends CardOptions {
	preview?: Partial<PreviewOptions>;
}

/**
 * Adapta las opciones de CardOptions a PreviewOptions
 * @param options - Opciones de tarjeta
 * @returns Opciones de vista previa
 */
export function adaptCardOptionsToPreviewOptions(options: CardOptions): PreviewOptions {
	// Extraer las opciones de preview o crear un objeto vacío si no existen
	const preview = (options as ExtendedCardOptions).preview || {};

	// Valores predeterminados para PreviewOptions
	return {
		size: preview.size || 'medium',
		customWidth: preview.customWidth || 300,
		customHeight: preview.customHeight || 400,
		showControls: preview.showControls ?? true,
		showInfo: preview.showInfo ?? true,
		showBorder: preview.showBorder ?? true,
		backgroundColor: preview.backgroundColor || 'transparent',
		enableInteraction: preview.enableInteraction ?? true,
		autoRotate: preview.autoRotate ?? false,
		rotationSpeed: preview.rotationSpeed || 1,
		zoomLevel: preview.zoomLevel || 1,
	};
}

/**
 * Adapta las opciones de PreviewOptions a CardOptions
 * @param previewOptions - Opciones de vista previa
 * @param existingOptions - Opciones de tarjeta existentes
 * @returns Opciones de tarjeta actualizadas
 */
export function adaptPreviewOptionsToCardOptions(
	previewOptions: PreviewOptions,
	existingOptions: CardOptions = {}
): CardOptions {
	return {
		...existingOptions,
		preview: {
			...(existingOptions as ExtendedCardOptions).preview,
			...previewOptions,
		},
	};
}

/**
 * Aplica una opción específica de vista previa a las opciones de tarjeta
 * @param options - Opciones de tarjeta
 * @param key - Clave de la opción
 * @param value - Valor de la opción
 * @returns Opciones de tarjeta actualizadas
 */
export function applyPreviewOptionToCardOptions<K extends keyof PreviewOptions>(
	options: CardOptions,
	key: K,
	value: PreviewOptions[K]
): CardOptions {
	return {
		...options,
		preview: {
			...(options as ExtendedCardOptions).preview,
			[key]: value,
		},
	};
}

/**
 * Obtiene el tamaño de la vista previa en píxeles
 * @param options - Opciones de vista previa
 * @returns Dimensiones en píxeles
 */
export function getPreviewDimensions(options: PreviewOptions): { width: number; height: number } {
	switch (options.size) {
		case 'small':
			return { width: 200, height: 300 };
		case 'medium':
			return { width: 300, height: 400 };
		case 'large':
			return { width: 400, height: 600 };
		case 'custom':
			return {
				width: options.customWidth || 300,
				height: options.customHeight || 400,
			};
		default:
			return { width: 300, height: 400 };
	}
}
