/**
 * Utilidades para manejar IDs de carpetas y otros recursos
 */

/**
 * Normaliza un ID para garantizar que tenga el formato correcto.
 * Esto ayuda a evitar inconsistencias entre diferentes partes del sistema.
 *
 * @param id El ID a normalizar
 * @returns El ID normalizado
 */
export function normalizeId(id: string): string {
	if (!id) {
		return id;
	}

	// Extraer solo los caracteres alfanuméricos para evitar problemas con caracteres especiales
	const cleanId = id.replace(/[^a-zA-Z0-9]/g, '');

	// Si contiene "msi9i5b0d1" u otro patrón similar, podemos estar ante un ID extendido
	// Asegurémonos de mantener estos patrones intactos
	if (cleanId.includes('msi9i5b0d1') || cleanId.includes('msi9i5b')) {
		// Para IDs que contienen este patrón específico, extraemos solo la parte numérica problemática
		// Ejemplo: cm82qn709000293msi9i5b0d1 -> extraemos "709000293"
		const matches = id.match(/cm82qn([0-9]+)msi9i5b/);

		if (matches?.[1]) {
			// Normalizar solo la parte numérica eliminando ceros consecutivos
			const numericPart = matches[1];
			const normalizedNumeric = numericPart.replace(/0{2,}/g, '0');

			// Reconstruir el ID con la parte numérica normalizada
			return id.replace(numericPart, normalizedNumeric);
		}
	}

	// Para otros IDs que siguen el patrón simple
	if (id.startsWith('cm8')) {
		const prefix = id.substring(0, 3); // "cm8"
		const rest = id.substring(3);
		// Eliminar 0s duplicados consecutivos
		const normalized = rest.replace(/0{2,}/g, '0');
		return prefix + normalized;
	}

	return id;
}

/**
 * Verifica si dos IDs son equivalentes, incluso si tienen diferencias
 * menores en su formato (como 0s extras)
 *
 * @param id1 Primer ID a comparar
 * @param id2 Segundo ID a comparar
 * @returns true si los IDs son equivalentes
 */
export function areIdsEquivalent(id1: string, id2: string): boolean {
	if (!(id1 && id2)) {
		return false;
	}
	return normalizeId(id1) === normalizeId(id2);
}

/**
 * Extrae un ID de carta desde una URL o string
 * Útil para obtener el ID desde URLs de navegación o referencias
 *
 * @param url URL o string que contiene el ID
 * @returns El ID extraído o el string original si no se encuentra un patrón específico
 */
export function getCardIdFromUrl(url: string): string {
	if (!url) {
		return url;
	}

	// Si parece ser ya un ID (comienza con cm8 o similar), retornarlo directamente
	if (/^cm8[a-z0-9]+$/i.test(url)) {
		return url;
	}

	// Intentar extraer ID desde URL tipo /characters/[id] o similar
	const urlMatch = url.match(/\/([^/]+)\/?$/);
	if (urlMatch?.[1]) {
		return urlMatch[1];
	}

	// Si no se encuentra un patrón específico, retornar el input
	return url;
}
