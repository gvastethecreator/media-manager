/**
 * @file Utilidades para arrays
 * @module utils/array
 * @description Funciones auxiliares para manipulación de arrays
 */

/**
 * Agrupa elementos de un array por una propiedad específica
 * @param array Array de elementos a agrupar
 * @param key Propiedad por la que agrupar (string) o función que devuelve la clave
 * @returns Objeto con elementos agrupados por la clave
 */
export function groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
	return array.reduce(
		(groups, item) => {
			// Obtener la clave de agrupación
			const groupKey = typeof key === 'function' ? key(item) : String(item[key]);

			// Inicializar el grupo si no existe
			if (!groups[groupKey]) {
				groups[groupKey] = [];
			}

			// Agregar el elemento al grupo
			groups[groupKey].push(item);

			return groups;
		},
		{} as Record<string, T[]>
	);
}

/**
 * Convierte un array en un mapa usando una propiedad como clave
 * @param array Array de elementos
 * @param key Propiedad que será la clave del mapa
 * @returns Mapa con elementos indexados por la clave
 */
export function keyBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T> {
	return array.reduce(
		(map, item) => {
			const mapKey = typeof key === 'function' ? key(item) : String(item[key]);
			map[mapKey] = item;
			return map;
		},
		{} as Record<string, T>
	);
}

/**
 * Elimina elementos duplicados de un array
 * @param array Array con posibles duplicados
 * @param key Propiedad opcional para comparar unicidad
 * @returns Array sin duplicados
 */
export function unique<T>(array: T[], key?: keyof T | ((item: T) => any)): T[] {
	if (!key) {
		return [...new Set(array)];
	}

	const seen = new Set();
	return array.filter((item) => {
		const uniqueKey = typeof key === 'function' ? key(item) : item[key];
		if (seen.has(uniqueKey)) {
			return false;
		}
		seen.add(uniqueKey);
		return true;
	});
}

/**
 * Divide un array en chunks de tamaño específico
 * @param array Array a dividir
 * @param size Tamaño de cada chunk
 * @returns Array de chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
}

/**
 * Intercala elementos de múltiples arrays
 * @param arrays Arrays a intercalar
 * @returns Array con elementos intercalados
 */
export function interleave<T>(...arrays: T[][]): T[] {
	const result: T[] = [];
	const maxLength = Math.max(...arrays.map((arr) => arr.length));

	for (let i = 0; i < maxLength; i++) {
		for (const array of arrays) {
			if (i < array.length) {
				result.push(array[i]);
			}
		}
	}

	return result;
}

/**
 * Encuentra diferencias entre dos arrays
 * @param array1 Primer array
 * @param array2 Segundo array
 * @param key Propiedad opcional para comparar elementos
 * @returns Objeto con elementos añadidos, eliminados y comunes
 */
export function diff<T>(
	array1: T[],
	array2: T[],
	key?: keyof T | ((item: T) => any)
): {
	added: T[];
	removed: T[];
	common: T[];
} {
	const getKey = (item: T) => (key ? (typeof key === 'function' ? key(item) : item[key]) : item);

	const keys1 = new Set(array1.map(getKey));
	const keys2 = new Set(array2.map(getKey));

	const added = array2.filter((item) => !keys1.has(getKey(item)));
	const removed = array1.filter((item) => !keys2.has(getKey(item)));
	const common = array1.filter((item) => keys2.has(getKey(item)));

	return { added, removed, common };
}
