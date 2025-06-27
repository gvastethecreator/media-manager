import { cn } from '../utils';

export * from './activity';
// Re-exportar utilidades de entidades específicas
export * from './album';
// Utilidades consolidadas desde src/utils
export * from './array.utils';
export * from './character';
export * from './collection';
export * from './concept';
// Utilidades principales
export * from './entity.utils';
export * from './errors';
// Utilidades por categoría
export * from './file';
export * from './folder';
export * from './format.utils';
export * from './id.utils';
export * from './image';
export * from './image-utils';
export * from './json';
export * from './note';
export * from './object-utils';
export * from './place';
export * from './prompt';
export * from './server-events.utils';
export * from './store';
export * from './store-selectors.utils';
export * from './string.utils';
export * from './tag';
export * from './text.utils';
export * from './transformers';
export * from './types';
export * from './video';
export * from './wildcard';
export * from './world-item';

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
