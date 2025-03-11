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
const parserName = 'NovelAI';

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
	// Verificar si el formato coincide con NovelAI
	return !!(
		metadata.novelai ||
		metadata.software === 'NovelAI' ||
		(metadata.comment && typeof metadata.comment === 'string' && metadata.comment.includes('NovelAI'))
	);
}

/**
 * Extrae y convierte los metadatos al formato estándar de generación por IA
 */
export async function parse(metadata: Record<string, unknown>): Promise<AIGenerationMetadata | null> {
	try {
		const parserLogger = await getParserLogger();
		parserLogger.debug('Intentando extraer metadatos en formato NovelAI');

		// Determinar la fuente de datos de NovelAI
		let novelData: Record<string, unknown>;

		if (metadata.novelai && typeof metadata.novelai === 'object' && metadata.novelai !== null) {
			novelData = metadata.novelai as Record<string, unknown>;
		} else {
			// Usar el objeto metadata completo si no hay un objeto específico novelai
			novelData = metadata;
		}

		// Construir objeto de generación
		const generation: AIGenerationMetadata = {
			type: 'novel-ai',
		};

		// Campos de texto
		const textFields = ['prompt', 'negative_prompt', 'model', 'sampler'] as const;
		for (const field of textFields) {
			if (field in novelData && novelData[field] !== undefined) {
				if (typeof novelData[field] === 'string') {
					generation[field] = novelData[field] as string;
				}
			}
		}

		// NovelAI puede usar 'scale' en lugar de 'cfg_scale'
		if ('scale' in novelData && novelData.scale !== undefined) {
			const scaleValue = await convertToNumberAsync(novelData.scale);
			if (typeof scaleValue === 'number') {
				generation.cfg_scale = scaleValue;
			}
		}

		// Otros campos numéricos
		const numericFields = [
			{ source: 'steps', target: 'steps' as const },
			{ source: 'cfg_scale', target: 'cfg_scale' as const },
			{ source: 'seed', target: 'seed' as const },
		];

		for (const { source, target } of numericFields) {
			if (source in novelData && novelData[source] !== undefined) {
				const convertedValue = await convertToNumberAsync(novelData[source]);
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
			'scale',
			'steps',
			'cfg_scale',
			'seed',
			'type',
		];

		for (const [key, value] of Object.entries(novelData)) {
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

		parserLogger.debug('Extraída información de generación NovelAI:', generation);
		return generation;
	} catch (error) {
		const parserLogger = await getParserLogger();
		parserLogger.warn('Error extrayendo información de NovelAI:', error);
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
