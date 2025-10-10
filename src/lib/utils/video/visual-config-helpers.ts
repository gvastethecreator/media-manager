/**
 * @file Helpers para configuración visual de video
 * @module utils/video/visual-config-helpers
 */

/**
 * Obtiene un objeto con los valores predeterminados para la configuración visual de un video
 * @returns Configuración visual con valores predeterminados
 */
export function getDefaultVideoVisualConfig(): Omit<Record<string, any>, 'id' | 'videoId'> {
	return {
		enable3DEffect: true,
		designSystem: 'default_design_system',
		enableHolographicEffect: true,
		enableGlowEffect: true,
		enableAnimatedBorder: true,
		enableLightHalo: true,
		layerSystem: '{"version":"1.0","layers":[]}',
		effects: '{"enabled":true,"list":[]}',
		performance: '{"mode":"balanced","cache":true,"preload":true}',
		states: '{"hover":true,"active":true,"focus":true}',
	};
}

/**
 * Verifica si hay cambios significativos entre dos configuraciones visuales
 * @param configA Primera configuración
 * @param configB Segunda configuración
 * @returns true si hay diferencias importantes
 */
export function hasVisualConfigChanged(
	configA?: Partial<Record<string, any>>,
	configB?: Partial<Record<string, any>>
): boolean {
	if (!(configA && configB)) {
		return true;
	}

	const keysToCompare = [
		'enable3DEffect',
		'enableHolographicEffect',
		'enableGlowEffect',
		'enableAnimatedBorder',
		'enableLightHalo',
		'designSystem',
		'layerSystem',
		'effects',
		'performance',
		'states',
	];

	for (const key of keysToCompare) {
		// Comparación especial para campos JSON almacenados como string
		if (['layerSystem', 'effects', 'performance', 'states'].includes(key)) {
			// Si alguno está definido como objeto y el otro como string, se consideran diferentes
			const typeA = typeof configA[key];
			const typeB = typeof configB[key];

			if (typeA !== typeB) {
				return true;
			}

			// Si ambos son string, comparar como JSON
			if (typeA === 'string' && typeB === 'string') {
				try {
					const objA = JSON.parse(configA[key] as string);
					const objB = JSON.parse(configB[key] as string);
					// Comparación simple de estructuras JSON
					if (JSON.stringify(objA) !== JSON.stringify(objB)) {
						return true;
					}
				} catch (_e) {
					// Si falla el parse, comparar como strings
					if (configA[key] !== configB[key]) {
						return true;
					}
				}
			}
			// Si son objetos, comparar directamente
			else if (configA[key] !== configB[key]) {
				return true;
			}
		}
		// Para campos simples, comparación directa
		else if (configA[key] !== configB[key]) {
			return true;
		}
	}

	return false;
}
