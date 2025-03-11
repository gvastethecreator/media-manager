'use server';

import { logger } from '@/lib/logger/logger';
import { type AIGenerationMetadata, type AIGenerationParserModule, getParserLogger } from './base-parser';

// Logger específico para el módulo
const moduleLogger = logger.withContext('AIGenerationParsers');

/**
 * Función asíncrona para obtener todos los parsers
 */
async function getParsers(): Promise<AIGenerationParserModule[]> {
	// Importar de forma dinámica para evitar problemas con 'use server'
	const a1111 = await import('./a1111-parser');
	const comfyui = await import('./comfyui-parser');
	const invokeai = await import('./invokeai-parser');
	const novelai = await import('./novelai-parser');
	const generic = await import('./generic-parser');

	// Construir la lista de parsers utilizando getParser()
	return [
		await a1111.getParser(),
		await comfyui.getParser(),
		await invokeai.getParser(),
		await novelai.getParser(),
		// El parser genérico siempre debe ser el último
		await generic.getParser(),
	];
}

/**
 * Extrae información de generación por IA de los metadatos
 * Prueba varios parsers en orden hasta encontrar uno que funcione
 */
export async function extractAIGenerationInfo(
	metadata: Record<string, unknown> | null
): Promise<AIGenerationMetadata | null> {
	if (!metadata) {
		return null;
	}

	moduleLogger.debug('Intentando extraer información de generación AI', {
		metadataKeys: Object.keys(metadata).slice(0, 10),
	});

	// 1. Caso simple: Si ya hay un objeto 'generation', usarlo directamente
	if (metadata.generation && typeof metadata.generation === 'object' && metadata.generation !== null) {
		moduleLogger.debug('Objeto generation encontrado directamente en los metadatos');
		return metadata.generation as AIGenerationMetadata;
	}

	// 2. Caso simple: Si hay un objeto 'ai', usarlo directamente como generation
	if (metadata.ai && typeof metadata.ai === 'object' && metadata.ai !== null) {
		moduleLogger.debug('Objeto ai encontrado directamente en los metadatos');
		return metadata.ai as AIGenerationMetadata;
	}

	// 3. Probar parsers específicos en orden
	const parsers = await getParsers();
	const parserLogger = await getParserLogger();

	for (const parser of parsers) {
		if (await parser.canParse(metadata)) {
			try {
				moduleLogger.debug(`Intentando parser: ${parser.name}`);
				const result = await parser.parse(metadata);

				if (result) {
					moduleLogger.info(`Información de generación AI extraída con parser ${parser.name}`, {
						type: result.type,
					});
					return result;
				}
			} catch (error) {
				parserLogger.warn(`Error en parser ${parser.name}:`, error);
				// Continuar con el siguiente parser
			}
		}
	}

	moduleLogger.debug('No se pudo extraer información de generación AI');
	return null;
}

// Re-exportar interfaces y tipos
export type { AIGenerationMetadata, AIGenerationParserModule };
