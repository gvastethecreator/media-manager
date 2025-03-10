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
	if (!id) return id;

	// El problema actual es un carácter 0 extra en la posición 11
	// Asegurarnos de que siempre tenga el formato correcto
	// Formato deseado: cmXXXXXXXXXXXXXXXXX (sin 0s extras)

	// Eliminar cualquier 0 extra después del prefijo cm8
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
	if (!id1 || !id2) return false;
	return normalizeId(id1) === normalizeId(id2);
}
