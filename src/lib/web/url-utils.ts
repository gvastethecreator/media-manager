/**
 * @file Utilidades para manipular URLs y rutas
 * @module lib/url-utils
 */

/**
 * Verifica si un string es una URL válida
 * @param url String a verificar
 * @returns true si es una URL válida, false en caso contrario
 */
export function isValidUrl(url: string): boolean {
	if (!url) {
		return false;
	}

	try {
		new URL(url);
		return true;
	} catch (_error) {
		// Verificar si podría ser una URL relativa
		if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
			return true;
		}
		return false;
	}
}

/**
 * Construye una URL con parámetros de consulta
 * @param baseUrl URL base
 * @param params Objeto con parámetros de consulta
 * @returns URL completa con parámetros
 */
export function buildUrl(baseUrl: string, params?: Record<string, string | number | boolean | undefined>): string {
	if (!params || Object.keys(params).length === 0) {
		return baseUrl;
	}

	const url = new URL(baseUrl, 'http://localhost'); // Base temporal para URLs relativas

	// Añadir parámetros usando for...of en lugar de forEach
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) {
			url.searchParams.append(key, String(value));
		}
	}

	// Devolver solo el pathname y search para URLs relativas
	if (baseUrl.startsWith('/')) {
		return `${url.pathname}${url.search}`;
	}

	return url.toString();
}
