/**
 * @file Utilidades para el servicio de imágenes
 * @module services/image/image-utils
 * @description Funciones auxiliares reutilizables para manejo de imágenes
 */

/**
 * Genera un ID único compatible con Web Crypto API
 * Fallback a generador UUID v4 no-criptográfico si no está disponible
 *
 * @returns ID único en formato UUID v4
 */
export const randomId = (): string => {
	try {
		const g: any = globalThis as any;
		const rndUUID = g?.crypto?.randomUUID;
		if (typeof rndUUID === 'function') {
			return rndUUID.call(g.crypto);
		}
	} catch {
		// ignorar y usar fallback
	}
	// Fallback sin operaciones bitwise; generar 32 hex + guiones formateados
	const hex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
	// xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
	// Version (4) fija y variante simulada sin bitwise: tomar valor 0-15 => map a 8-11
	const variantSource = Number.parseInt(hex.slice(16, 17), 16) % 4; // 0..3
	const variantNibble = (8 + variantSource).toString(16); // 8..b
	return [
		hex.slice(0, 8),
		hex.slice(8, 12),
		`4${hex.slice(13, 16)}`,
		`${variantNibble}${hex.slice(17, 20)}`,
		hex.slice(20, 32),
	].join('-');
};

/**
 * Constantes del servicio de imágenes
 */
export const SERVICE_NAME = 'ImageService';

/**
 * Tamaño máximo del thumbnail en bytes (300KB)
 * Límite para almacenar en campo TEXT base64 con holgura
 */
export const MAX_THUMBNAIL_SIZE_BYTES = 300 * 1024;
