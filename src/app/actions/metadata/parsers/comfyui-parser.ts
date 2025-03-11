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
const parserName = 'ComfyUI';

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
	// Verificar si el formato coincide con ComfyUI
	return !!(
		metadata.workflow ||
		metadata.prompt_id ||
		(metadata.extra && typeof metadata.extra === 'object' && metadata.extra !== null && 'workflow' in metadata.extra)
	);
}

/**
 * Extrae y convierte los metadatos al formato estándar de generación por IA
 */
export async function parse(metadata: Record<string, unknown>): Promise<AIGenerationMetadata | null> {
	try {
		const parserLogger = await getParserLogger();
		parserLogger.debug('Intentando extraer metadatos en formato ComfyUI');

		const generation: AIGenerationMetadata = {
			type: 'comfyui',
			extra_params: {},
		};

		// Extraer workflow
		if (metadata.workflow) {
			generation.workflow =
				typeof metadata.workflow === 'string' ? metadata.workflow : JSON.stringify(metadata.workflow);
		} else if (
			metadata.extra &&
			typeof metadata.extra === 'object' &&
			metadata.extra !== null &&
			'workflow' in metadata.extra
		) {
			const extra = metadata.extra as Record<string, unknown>;
			generation.workflow = typeof extra.workflow === 'string' ? extra.workflow : JSON.stringify(extra.workflow);
		}

		// Extraer otros campos relevantes
		const comfyFields = ['prompt', 'negative_prompt', 'model'] as const;
		for (const field of comfyFields) {
			if (field in metadata && metadata[field] !== undefined) {
				if (typeof metadata[field] === 'string') {
					generation[field] = metadata[field] as string;
				}
			} else if (
				metadata.extra &&
				typeof metadata.extra === 'object' &&
				metadata.extra !== null &&
				field in metadata.extra
			) {
				const extra = metadata.extra as Record<string, unknown>;
				if (typeof extra[field] === 'string') {
					generation[field] = extra[field] as string;
				}
			}
		}

		// Extraer y convertir campos numéricos
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
			} else if (
				metadata.extra &&
				typeof metadata.extra === 'object' &&
				metadata.extra !== null &&
				source in metadata.extra
			) {
				const extra = metadata.extra as Record<string, unknown>;
				const convertedValue = await convertToNumberAsync(extra[source]);
				if (target === 'seed') {
					// Para seed, podemos asignar tanto string como number
					generation[target] = convertedValue;
				} else if (typeof convertedValue === 'number') {
					// Para los demás campos, solo asignamos si es número
					generation[target] = convertedValue;
				}
			}
		}

		// Función para copiar campos adicionales
		const copyExtraParams = (source: Record<string, unknown>): void => {
			const knownFields = [
				'workflow',
				'prompt',
				'negative_prompt',
				'steps',
				'cfg_scale',
				'cfg',
				'seed',
				'model',
				'type',
			];

			for (const [key, value] of Object.entries(source)) {
				if (!knownFields.includes(key) && value !== undefined && generation.extra_params) {
					if (typeof value === 'object' && value !== null) {
						generation.extra_params[key] = JSON.stringify(value);
					} else {
						generation.extra_params[key] = value as string | number | boolean;
					}
				}
			}
		};

		// Copiar parámetros extras de la raíz y del objeto extra
		copyExtraParams(metadata);
		if (metadata.extra && typeof metadata.extra === 'object' && metadata.extra !== null) {
			copyExtraParams(metadata.extra as Record<string, unknown>);
		}

		parserLogger.debug('Extraída información de generación ComfyUI:', generation);
		return generation;
	} catch (error) {
		const parserLogger = await getParserLogger();
		parserLogger.warn('Error extrayendo información de ComfyUI:', error);
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
