'use client';

import type { CardOptions } from '../../settings/types';
import type { PreviewOptions } from './types';

/**
 * Convierte las opciones de la tarjeta al formato de opciones de previsualización
 * @param cardOptions - Opciones de la tarjeta
 * @returns Opciones de previsualización
 */
export function cardToPreviewOptions(cardOptions: CardOptions): PreviewOptions {
	const preview = cardOptions.preview || {};

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
 * Actualiza las opciones de la tarjeta con las nuevas opciones de previsualización
 * @param cardOptions - Opciones actuales de la tarjeta
 * @param previewOptions - Nuevas opciones de previsualización
 * @returns Opciones actualizadas de la tarjeta
 */
export function updateCardWithPreviewOptions(cardOptions: CardOptions, previewOptions: PreviewOptions): CardOptions {
	return {
		...cardOptions,
		preview: {
			...cardOptions.preview,
			...previewOptions,
		},
	};
}
