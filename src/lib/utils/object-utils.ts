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
		Object.keys(source).forEach((key) => {
			if (isObject(source[key])) {
				if (!(key in target)) {
					Object.assign(output, { [key]: source[key] });
				} else {
					output[key] = deepMerge(target[key], source[key]);
				}
			} else {
				Object.assign(output, { [key]: source[key] });
			}
		});
	}

	return output;
}

/**
 * Verifica si un valor es un objeto
 */
function isObject(item: any): item is Record<string, any> {
	return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Obtiene un valor de un objeto por un path como 'a.b.c'
 */
export function getValueByPath(obj: any, path: string): any {
	return path.split('.').reduce((prev, curr) => {
		return prev ? prev[curr] : undefined;
	}, obj);
}

/**
 * Establece un valor en un objeto por un path como 'a.b.c'
 */
export function setValueByPath(obj: any, path: string, value: any): any {
	const result = { ...obj };
	const parts = path.split('.');

	let current = result;
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		if (!current[part] || typeof current[part] !== 'object') {
			current[part] = {};
		}
		current = current[part];
	}

	current[parts[parts.length - 1]] = value;
	return result;
}
