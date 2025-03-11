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
const parserName = 'InvokeAI';

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
	// Verificar si el formato coincide con InvokeAI
	return !!(
		metadata.invokeai ||
		(metadata.stability_ai &&
			typeof metadata.stability_ai === 'object' &&
			metadata.stability_ai !== null &&
			'invokeai' in metadata.stability_ai) ||
		metadata.app === 'InvokeAI'
	);
}

/**
 * Extrae y convierte los metadatos al formato estándar de generación por IA
 */
export async function parse(metadata: Record<string, unknown>): Promise<AIGenerationMetadata | null> {
	try {
		const parserLogger = await getParserLogger();
		parserLogger.debug('Intentando extraer metadatos en formato InvokeAI');

		// Determinar la fuente de datos de InvokeAI
		let invokeData: Record<string, unknown>;

		if (metadata.invokeai && typeof metadata.invokeai === 'object' && metadata.invokeai !== null) {
			invokeData = metadata.invokeai as Record<string, unknown>;
		} else if (
			metadata.stability_ai &&
			typeof metadata.stability_ai === 'object' &&
			metadata.stability_ai !== null &&
			'invokeai' in metadata.stability_ai &&
			typeof metadata.stability_ai.invokeai === 'object' &&
			metadata.stability_ai.invokeai !== null
		) {
			invokeData = metadata.stability_ai.invokeai as Record<string, unknown>;
		} else {
			// Usar el objeto metadata completo si no hay campos específicos
			invokeData = metadata;
		}

		// Construir objeto de generación
		const generation: AIGenerationMetadata = {
			type: 'invoke-ai',
		};

		// Campos comunes de InvokeAI
		const textFields = ['prompt', 'negative_prompt', 'model', 'sampler', 'scheduler'] as const;

		for (const field of textFields) {
			if (field in invokeData && invokeData[field] !== undefined) {
				if (typeof invokeData[field] === 'string') {
					generation[field] = invokeData[field] as string;
				}
			}
		}

		// Campos numéricos
		const numericFields = [
			{ source: 'steps', target: 'steps' as const },
			{ source: 'cfg_scale', target: 'cfg_scale' as const },
			{ source: 'seed', target: 'seed' as const },
			{ source: 'clip_skip', target: 'clip_skip' as const },
		];

		for (const { source, target } of numericFields) {
			if (source in invokeData && invokeData[source] !== undefined) {
				const convertedValue = await convertToNumberAsync(invokeData[source]);
				if (target === 'seed') {
					// Para seed, podemos asignar tanto string como number
					generation[target] = convertedValue;
				} else if (typeof convertedValue === 'number') {
					// Para los demás campos, solo asignamos si es número
					generation[target] = convertedValue;
				}
			}
		}

		// Añadir información adicional como extra_params
		generation.extra_params = {};
		const knownFields = [
			'prompt',
			'negative_prompt',
			'model',
			'sampler',
			'scheduler',
			'steps',
			'cfg_scale',
			'seed',
			'clip_skip',
			'type',
		];

		for (const [key, value] of Object.entries(invokeData)) {
			if (!knownFields.includes(key) && value !== undefined) {
				if (generation.extra_params) {
					if (typeof value === 'object' && value !== null) {
						generation.extra_params[key] = JSON.stringify(value);
					} else {
						generation.extra_params[key] = value as string | number | boolean;
					}
				}
			}
		}

		parserLogger.debug('Extraída información de generación InvokeAI:', generation);
		return generation;
	} catch (error) {
		const parserLogger = await getParserLogger();
		parserLogger.warn('Error extrayendo información de InvokeAI:', error);
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
