/**
 * @file Utilidades para el procesamiento de imágenes
 * @module utils/image-utils
 */

import type { Image } from '@/types/entities/image';

/**
 * Calcula la relación de aspecto de una imagen
 * @param width Ancho de la imagen
 * @param height Alto de la imagen
 * @returns Relación de aspecto como string en formato "16:9"
 */
export function calculateAspectRatio(width: number, height: number): string {
	if (!width || !height) return '1:1';

	// Encontrar el máximo común divisor (MCD)
	const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
	const divisor = gcd(width, height);

	// Calcular la relación de aspecto simplificada
	const aspectWidth = width / divisor;
	const aspectHeight = height / divisor;

	// Usar ratios comunes si están muy cerca
	if (Math.abs(aspectWidth / aspectHeight - 16 / 9) < 0.01) return '16:9';
	if (Math.abs(aspectWidth / aspectHeight - 4 / 3) < 0.01) return '4:3';
	if (Math.abs(aspectWidth / aspectHeight - 3 / 2) < 0.01) return '3:2';
	if (Math.abs(aspectWidth / aspectHeight - 1) < 0.01) return '1:1';

	// Devolver la relación calculada si no coincide con ninguna común
	return `${Math.round(aspectWidth)}:${Math.round(aspectHeight)}`;
}

/**
 * Calcula el color dominante de una imagen
 * @param image Objeto imagen que puede contener información de color dominante
 * @returns Color dominante en formato hex o undefined si no está disponible
 */
export function calculateDominantColor(image: Image): string | undefined {
	// Si ya tenemos el color dominante, devolverlo
	if (image.metadata?.dominantColor) {
		return image.metadata.dominantColor;
	}

	// Color por defecto para imágenes sin metadata
	return undefined;
}

/**
 * Genera una URL para la miniatura de una imagen
 * @param imageId ID de la imagen
 * @param width Ancho opcional de la miniatura
 * @param height Alto opcional de la miniatura
 * @returns URL para la miniatura
 */
export function generateThumbnailUrl(imageId: string, width?: number | string, height?: number): string {
	let url = `/api/images/${imageId}/thumbnail`;

	// Convertir ancho a número si es string
	const widthNum = typeof width === 'string' ? Number.parseInt(width, 10) : width;

	// Añadir parámetros de tamaño si se especifican
	if (widthNum || height) {
		const params = new URLSearchParams();
		if (widthNum) params.append('width', widthNum.toString());
		if (height) params.append('height', height.toString());
		url += `?${params.toString()}`;
	}

	return url;
}
