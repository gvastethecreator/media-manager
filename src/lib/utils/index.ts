import { cn } from '../utils';

export * from './entity.utils';
export * from './format.utils';
export * from './id.utils';
export * from './object-utils';
export * from './text.utils';

export { cn };

/**
 * Extrae el ID de una tarjeta desde una URL o devuelve el ID tal cual si no es una URL
 * @param urlOrId URL o ID de la tarjeta
 * @returns ID extraído de la URL o el ID original
 */
export function getCardIdFromUrl(urlOrId: string): string {
	if (!urlOrId) return '';

	// Si es una URL, extraer el último segmento
	if (urlOrId.includes('/')) {
		const segments = urlOrId.split('/');
		return segments[segments.length - 1];
	}

	// Si no es una URL, devolver el ID tal cual
	return urlOrId;
}
