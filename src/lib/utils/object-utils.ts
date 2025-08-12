/**
 * Función para fusionar profundamente dos objetos
 * Útil para combinar configuraciones con opciones por defecto
 * @param target Objeto objetivo
 * @param source Objeto fuente cuyos valores se fusionarán
 * @returns Nuevo objeto con la combinación de ambos
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
	const output = { ...target };

	if (isObject(target) && isObject(source)) {
		for (const key of Object.keys(source)) {
			if (isObject(source[key])) {
				if (key in target) {
					(output as any)[key] = deepMerge((target as Record<string, any>)[key], (source as Record<string, any>)[key]);
				} else {
					Object.assign(output, { [key]: source[key] });
				}
			} else {
				Object.assign(output, { [key]: source[key] });
			}
		}
	}

	return output;
}

/**
 * Verifica si un valor es un objeto
 */
function isObject(item: unknown): item is Record<string, unknown> {
	return item !== null && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Obtiene un valor de un objeto por un path como 'a.b.c'
 */
export function getValueByPath<T = unknown>(obj: Record<string, any>, path: string): T | undefined {
	return path.split('.').reduce((prev, curr) => {
		return prev && typeof prev === 'object' ? prev[curr] : undefined;
	}, obj) as T | undefined;
}

/**
 * Establece un valor en un objeto por un path como 'a.b.c'
 */
export function setValueByPath<T extends Record<string, any>>(obj: T, path: string, value: any): T {
	const result = { ...obj };
	const parts = path.split('.');

	let current: Record<string, any> = result;
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		if (!current[part] || typeof current[part] !== 'object') {
			current[part] = {};
		}
		current = current[part];
	}

	current[parts.at(-1)] = value;
	return result;
}
