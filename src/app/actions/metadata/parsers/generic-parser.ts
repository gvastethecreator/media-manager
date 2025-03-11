'use server';

import {
	type AIGenerationMetadata,
	type AIGenerationParserModule,
	convertToNumberAsync,
	getParserLogger,
} from './base-parser';

/**
 * Nombre identificativo del parser
 */
const parserName = 'Generic AI Generation Parser';

/**
 * Devuelve el nombre del parser
 */
export async function getName(): Promise<string> {
	return parserName;
}

/**
 * Los campos que comúnmente indican información de generación por IA
 */
const aiRelevantFields = ['prompt', 'negative_prompt', 'model', 'sampler', 'steps', 'cfg_scale', 'cfg', 'seed'];

/**
 * Devuelve los campos relevantes para detección de AI
 */
export async function getRelevantFields(): Promise<string[]> {
	return [...aiRelevantFields];
}

/**
 * Verifica si los metadatos coinciden con el formato esperado por este parser
 * El parser genérico siempre devuelve true, pero solo se usa como último recurso
 */
export async function canParse(_metadata: Record<string, unknown>): Promise<boolean> {
	return true;
}

/**
 * Extrae y convierte los metadatos al formato estándar de generación por IA
 */
export async function parse(metadata: Record<string, unknown>): Promise<AIGenerationMetadata | null> {
	try {
		const parserLogger = await getParserLogger();
		parserLogger.debug('Intentando extraer metadatos con parser genérico');

		// 1. Búsqueda en el nivel raíz
		const foundFields = aiRelevantFields.filter((field) => field in metadata && metadata[field] !== undefined);

		// Si encontramos al menos 2 campos relevantes, probablemente sea información de generación
		if (foundFields.length >= 2) {
			parserLogger.debug('Encontrados múltiples campos relevantes en el nivel raíz:', foundFields);

			// Construir objeto de generación
			const generation: AIGenerationMetadata = {
				type: 'unknown',
				extra_params: {},
			};

			// Copiar campos de texto
			const textFields = ['prompt', 'negative_prompt', 'model', 'sampler'] as const;
			for (const field of textFields) {
				if (field in metadata && metadata[field] !== undefined) {
					if (typeof metadata[field] === 'string') {
						generation[field] = metadata[field] as string;
					}
				}
			}

			// Copiar y convertir campos numéricos
			const numericFields = [
				{ source: 'steps', target: 'steps' as const },
				{ source: 'cfg_scale', target: 'cfg_scale' as const },
				{ source: 'cfg', target: 'cfg' as const },
				{ source: 'seed', target: 'seed' as const },
			];

			for (const { source, target } of numericFields) {
				if (source in metadata && metadata[source] !== undefined) {
					const convertedValue = await convertToNumberAsync(metadata[source]);
					if (target === 'seed') {
						// Para seed, podemos asignar tanto string como number
						generation[target] = convertedValue;
					} else if (typeof convertedValue === 'number') {
						// Para los demás campos, solo asignamos si es número
						generation[target] = convertedValue;
					}
				}
			}

			parserLogger.debug('Extraída información de generación genérica del nivel raíz:', generation);
			return generation;
		}

		// 2. Búsqueda profunda en subobjetos (solo primer nivel)
		for (const [key, value] of Object.entries(metadata)) {
			if (value && typeof value === 'object' && value !== null) {
				const subObject = value as Record<string, unknown>;

				// Verificar si este subobjeto tiene múltiples campos relevantes
				const subFields = aiRelevantFields.filter((field) => field in subObject && subObject[field] !== undefined);

				if (subFields.length >= 2) {
					parserLogger.debug(`Encontrada posible información de generación en subobjeto '${key}'`);

					// Construir objeto de generación
					const generation: AIGenerationMetadata = {
						type: key, // Usar el nombre del subobjeto como tipo
						extra_params: {},
					};

					// Copiar campos de texto
					const textFields = ['prompt', 'negative_prompt', 'model', 'sampler'] as const;
					for (const field of textFields) {
						if (field in subObject && subObject[field] !== undefined) {
							if (typeof subObject[field] === 'string') {
								generation[field] = subObject[field] as string;
							}
						}
					}

					// Copiar y convertir campos numéricos
					const numericFields = [
						{ source: 'steps', target: 'steps' as const },
						{ source: 'cfg_scale', target: 'cfg_scale' as const },
						{ source: 'cfg', target: 'cfg' as const },
						{ source: 'seed', target: 'seed' as const },
					];

					for (const { source, target } of numericFields) {
						if (source in subObject && subObject[source] !== undefined) {
							const convertedValue = await convertToNumberAsync(subObject[source]);
							if (target === 'seed') {
								// Para seed, podemos asignar tanto string como number
								generation[target] = convertedValue;
							} else if (typeof convertedValue === 'number') {
								// Para los demás campos, solo asignamos si es número
								generation[target] = convertedValue;
							}
						}
					}

					parserLogger.debug(`Extraída información de generación del subobjeto '${key}':`, generation);
					return generation;
				}
			}
		}

		// No se encontró información de generación por IA
		parserLogger.debug('No se encontró información de generación AI con el parser genérico');
		return null;
	} catch (error) {
		const parserLogger = await getParserLogger();
		parserLogger.warn('Error en el parser genérico:', error);
		return null;
	}
}

/**
 * Devuelve el parser como un módulo completo (función async exportada)
 */
export async function getParser(): Promise<AIGenerationParserModule> {
	return {
		name: parserName,
		canParse,
		parse,
	};
}
