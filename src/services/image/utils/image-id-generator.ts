/**
 * @file Generador de IDs para imágenes
 * @module services/image/utils
 */

/**
 * Genera un ID único usando Web Crypto API o fallback
 * Evita import directo de 'crypto' (Node) para compatibilidad en bundle frontend
 */
export const generateImageId = (): string => {
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
