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
const parserName = 'Stable Diffusion WebUI (A1111)';

/**
 * Devuelve el nombre del parser
 */
export async function getName(): Promise<string> {
	return parserName;
}

/**
 * Verifica si los metadatos coinciden con el formato esperado por este parser
 */
export async function canParse(metadata: Record<string, unknown>): Promise<boolean> {
	// Verificar si hay parámetros en formato A1111
	return !!(
		(metadata.prompt && typeof metadata.prompt === 'string') ||
		(metadata.parameters && typeof metadata.parameters === 'string')
	);
}

/**
 * Extrae los parámetros de un string en formato A1111
 */
async function extractParametersFromString(parameters: string): Promise<Record<string, string>> {
	const params: Record<string, string> = {};
	const pattern = /\s*([^:,]+):\s*([^,]+)(?:,|$)/g;
	let matchResult: RegExpExecArray | null;

	// Evitar la asignación en la expresión while
	matchResult = pattern.exec(parameters);
	while (matchResult !== null) {
		const key = matchResult[1].trim();
		const value = matchResult[2].trim().replace(/^"(.*)"$/, '$1'); // Quitar comillas
		params[key] = value;

		// Obtener el siguiente match
		matchResult = pattern.exec(parameters);
	}

	return params;
}

/**
 * Extrae y convierte los metadatos al formato estándar de generación por IA
 */
export async function parse(metadata: Record<string, unknown>): Promise<AIGenerationMetadata | null> {
	try {
		const parserLogger = await getParserLogger();
		parserLogger.debug('Intentando extraer metadatos en formato A1111');

		const promptText = (metadata.prompt as string) || '';
		let negativePrompt = '';
		let params: Record<string, string> = {};

		// Extraer parámetros si están presentes
		if (metadata.parameters && typeof metadata.parameters === 'string') {
			const parameters = metadata.parameters;

			// Separar prompt negativo si está presente
			const promptIndex = parameters.indexOf('Negative prompt:');
			if (promptIndex !== -1) {
				negativePrompt = parameters
					.substring(promptIndex + 'Negative prompt:'.length)
					.split('\n')[0]
					.trim();
			}

			// Extraer parámetros como Steps, CFG Scale, etc.
			params = await extractParametersFromString(parameters);
		}

		// Construir objeto de generación
		const generation: AIGenerationMetadata = {
			type: 'stable-diffusion',
			prompt: promptText || undefined,
			negative_prompt: negativePrompt || undefined,
		};

		// Mapear parámetros comunes
		const paramMapping: Record<string, keyof AIGenerationMetadata> = {
			Steps: 'steps',
			Sampler: 'sampler',
			'CFG scale': 'cfg_scale',
			Seed: 'seed',
			Model: 'model',
			'Clip skip': 'clip_skip',
		};

		// Aplicar el mapeo de parámetros
		for (const [sdKey, genKey] of Object.entries(paramMapping)) {
			if (params[sdKey] !== undefined) {
				const value = params[sdKey];

				// Usar tipado correcto para cada propiedad
				if (genKey === 'steps' || genKey === 'cfg_scale' || genKey === 'clip_skip') {
					// Convertir a número
					const numValue = await convertToNumberAsync(value);
					if (typeof numValue === 'number') {
						generation[genKey] = numValue;
					}
				} else if (genKey === 'seed') {
					generation[genKey] = await convertToNumberAsync(value);
				} else if (genKey === 'sampler' || genKey === 'model') {
					generation[genKey] = value;
				}
			}
		}

		// Añadir otros parámetros como extra_params
		generation.extra_params = {};
		for (const [key, value] of Object.entries(params)) {
			if (!Object.keys(paramMapping).includes(key)) {
				generation.extra_params[key] = value;
			}
		}

		parserLogger.debug('Extraída información de generación A1111:', generation);
		return generation;
	} catch (error) {
		const parserLogger = await getParserLogger();
		parserLogger.warn('Error extrayendo información de A1111:', error);
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
