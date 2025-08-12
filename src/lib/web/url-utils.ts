/**
 * @file Utilidades para manipular URLs y rutas
 * @module lib/url-utils
 */

/**
 * Convierte una ruta local de sistema de archivos a una URL
 * @param path Ruta de archivo en el sistema de archivos
 * @returns URL formateada para acceso web
 */
export function pathToUrl(path: string): string {
	if (!path) {
		return '';
	}

	// Normalizar separadores de ruta a formato web
	const normalizedPath = path.replace(/\\/g, '/');

	// Si la ruta ya es una URL, devolverla tal cual
	if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
		return normalizedPath;
	}

	// Eliminar rutas relativas al principio si existen
	const cleanPath = normalizedPath
		.replace(/^\.\//, '') // Eliminar ./ al principio
		.replace(/^\//, ''); // Eliminar / al principio si existe

	// Convertir rutas locales de archivos a URLs relativas
	// Para rutas que apuntan a archivos en el sistema de archivos local
	if (cleanPath.startsWith('public/')) {
		return `/${cleanPath.substring(7)}`; // Eliminar 'public/' y añadir /
	}

	// Si la ruta parece ser una ruta de archivo local pero no está en public
	if (cleanPath.includes('/') && !cleanPath.startsWith('/')) {
		return `/api/files/${encodeURIComponent(cleanPath)}`;
	}

	// Si la ruta ya parece una ruta web (comienza con /)
	if (cleanPath.startsWith('/')) {
		return cleanPath;
	}

	// En caso contrario, asumir que es un ID de archivo
	return `/api/files/${cleanPath}`;
}

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
