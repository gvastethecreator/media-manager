import { serverLogger } from '@/lib/logger/server-logger';

/**
 * Tipo para los datos de generación por IA
 */
export interface AIGenerationMetadata {
	type: string;
	prompt?: string;
	negative_prompt?: string;
	model?: string;
	steps?: number;
	cfg_scale?: number;
	cfg?: number;
	seed?: number | string;
	sampler?: string;
	scheduler?: string;
	clip_skip?: number;
	workflow?: string;
	extra_params?: Record<string, string | number | boolean | null | undefined | string[]>;
}

/**
 * Tipo para las funciones de parseo
 */
export type ParserFunction = (metadata: Record<string, unknown>) => Promise<AIGenerationMetadata | null>;

/**
 * Interfaz para un parser
 */
export interface AIGenerationParserModule {
	/**
	 * Nombre identificativo del parser
	 */
	name: string;

	/**
	 * Función para determinar si este parser puede procesar los metadatos
	 */
	canParse: (metadata: Record<string, unknown>) => Promise<boolean>;

	/**
	 * Función para extraer y convertir los metadatos
	 */ parse: ParserFunction;
}

/**
 * Logger común para los parsers de generación por IA
 */
const parserLogger = serverLogger.withContext('AIGenerationParserService');

/**
 * Función para convertir valores numéricos almacenados como string
 */
function convertToNumber(value: unknown): number | string | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}

	if (typeof value === 'number') {
		return value;
	}

	if (typeof value === 'string') {
		const numValue = Number(value);
		return Number.isNaN(numValue) ? value : numValue;
	}

	return String(value);
}

/**
 * Función para extraer propiedades específicas de un objeto
 */
function extractProperties<T extends Record<string, unknown>>(
	source: Record<string, unknown>,
	properties: string[],
	transform?: (key: string, value: unknown) => unknown
): T {
	const result = {} as T;

	for (const prop of properties) {
		if (source[prop] !== undefined) {
			result[prop as keyof T] = transform
				? (transform(prop, source[prop]) as T[keyof T])
				: (source[prop] as T[keyof T]);
		}
	}

	return result;
}

// --- Parsers individuales (integrados aquí para simplificar) ---

// A1111 Parser
const a1111Parser: AIGenerationParserModule = {
	name: 'Automatic1111',
	canParse: async (metadata) => {
		return typeof metadata.parameters === 'string' && metadata.parameters.includes('Steps:');
	},
	parse: async (metadata) => {
		const params = metadata.parameters as string;
		const promptMatch = params.match(/^(.*?)(?:Negative prompt:|$)/s);
		const negativePromptMatch = params.match(/Negative prompt: (.*?)(?:Steps:|$)/s);
		const stepsMatch = params.match(/Steps: (\d+)/);
		const cfgScaleMatch = params.match(/CFG scale: ([\d.]+)/);
		const seedMatch = params.match(/Seed: (\d+)/);
		const samplerMatch = params.match(/Sampler: ([^,]+)/);
		const modelMatch = params.match(/Model: ([^,]+)/);

		return {
			type: 'Automatic1111',
			prompt: promptMatch ? promptMatch[1].trim() : undefined,
			negative_prompt: negativePromptMatch ? negativePromptMatch[1].trim() : undefined,
			steps: stepsMatch ? Number.parseInt(stepsMatch[1]) : undefined,
			cfg_scale: cfgScaleMatch ? Number.parseFloat(cfgScaleMatch[1]) : undefined,
			seed: seedMatch ? Number.parseInt(seedMatch[1]) : undefined,
			sampler: samplerMatch ? samplerMatch[1].trim() : undefined,
			model: modelMatch ? modelMatch[1].trim() : undefined,
		};
	},
};

// ComfyUI Parser
const comfyuiParser: AIGenerationParserModule = {
	name: 'ComfyUI',
	canParse: async (metadata) => {
		return typeof metadata.prompt === 'string' && typeof metadata.workflow === 'string';
	},
	parse: async (metadata) => {
		const promptData = JSON.parse(metadata.prompt as string);
		const workflowData = JSON.parse(metadata.workflow as string);

		// Simplificado: extraer prompt y negative_prompt de un nodo común (ej. CLIPTextEncode)
		let prompt: string | undefined;
		let negative_prompt: string | undefined;

		for (const nodeId in promptData) {
			const node = promptData[nodeId];
			if (node.class_type === 'CLIPTextEncode') {
				if (node.inputs.text) {
					if (!prompt)
						prompt = node.inputs.text; // Asume el primer prompt es el principal
					else negative_prompt = node.inputs.text; // Asume el segundo es el negativo
				}
			}
		}

		return {
			type: 'ComfyUI',
			prompt,
			negative_prompt,
			workflow: JSON.stringify(workflowData), // Guardar el workflow completo
		};
	},
};

// InvokeAI Parser
const invokeaiParser: AIGenerationParserModule = {
	name: 'InvokeAI',
	canParse: async (metadata) => {
		return typeof metadata.invokeai_metadata === 'object' && metadata.invokeai_metadata !== null;
	},
	parse: async (metadata) => {
		const invokeMetadata = metadata.invokeai_metadata as Record<string, unknown>;
		return {
			type: 'InvokeAI',
			prompt: invokeMetadata.prompt as string,
			negative_prompt: invokeMetadata.negative_prompt as string,
			model: invokeMetadata.model as string,
			steps: convertToNumber(invokeMetadata.steps) as number,
			cfg_scale: convertToNumber(invokeMetadata.cfg_scale) as number,
			seed: convertToNumber(invokeMetadata.seed) as number | string,
			sampler: invokeMetadata.sampler as string,
		};
	},
};

// NovelAI Parser
const novelaiParser: AIGenerationParserModule = {
	name: 'NovelAI',
	canParse: async (metadata) => {
		return typeof metadata.Description === 'string' && metadata.Description.includes('Steps:');
	},
	parse: async (metadata) => {
		const description = metadata.Description as string;
		const promptMatch = description.match(/^(.*?)(?:\nUndesired content:|$)/s);
		const negativePromptMatch = description.match(/Undesired content: (.*?)(?:\nSteps:|$)/s);
		const stepsMatch = description.match(/Steps: (\d+)/);
		const scaleMatch = description.match(/Scale: ([\d.]+)/);
		const seedMatch = description.match(/Seed: (\d+)/);
		const samplerMatch = description.match(/Sampler: ([^,]+)/);

		return {
			type: 'NovelAI',
			prompt: promptMatch ? promptMatch[1].trim() : undefined,
			negative_prompt: negativePromptMatch ? negativePromptMatch[1].trim() : undefined,
			steps: stepsMatch ? Number.parseInt(stepsMatch[1]) : undefined,
			cfg_scale: scaleMatch ? Number.parseFloat(scaleMatch[1]) : undefined,
			seed: seedMatch ? Number.parseInt(seedMatch[1]) : undefined,
			sampler: samplerMatch ? samplerMatch[1].trim() : undefined,
		};
	},
};

// Generic Parser (siempre el último)
const genericParser: AIGenerationParserModule = {
	name: 'Generic',
	canParse: async (metadata) => {
		// Siempre puede intentar parsear, pero devolverá null si no encuentra nada
		return true;
	},
	parse: async (metadata) => {
		const prompt = (metadata.prompt || metadata.description || metadata.comment) as string | undefined;
		const negative_prompt = (metadata.negative_prompt || metadata.undesired_content) as string | undefined;

		if (prompt) {
			return {
				type: 'Generic',
				prompt,
				negative_prompt,
				model: metadata.model as string,
				steps: convertToNumber(metadata.steps) as number,
				cfg_scale: convertToNumber(metadata.cfg_scale || metadata.scale) as number,
				seed: convertToNumber(metadata.seed) as number | string,
				sampler: metadata.sampler as string,
			};
		}
		return null;
	},
};

/**
 * Función asíncrona para obtener todos los parsers
 */
async function getParsers(): Promise<AIGenerationParserModule[]> {
	return [
		a1111Parser,
		comfyuiParser,
		invokeaiParser,
		novelaiParser,
		genericParser, // El parser genérico siempre debe ser el último
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

	parserLogger.debug('Intentando extraer información de generación AI', {
		metadataKeys: Object.keys(metadata).slice(0, 10),
	});

	// 1. Caso simple: Si ya hay un objeto 'generation', usarlo directamente
	if (metadata.generation && typeof metadata.generation === 'object' && metadata.generation !== null) {
		parserLogger.debug('Objeto generation encontrado directamente en los metadatos');
		return metadata.generation as AIGenerationMetadata;
	}

	// 2. Caso simple: Si hay un objeto 'ai', usarlo directamente como generation
	if (metadata.ai && typeof metadata.ai === 'object' && metadata.ai !== null) {
		parserLogger.debug('Objeto ai encontrado directamente en los metadatos');
		return metadata.ai as AIGenerationMetadata;
	}

	// 3. Probar parsers específicos en orden
	const parsers = await getParsers();

	for (const parser of parsers) {
		if (await parser.canParse(metadata)) {
			try {
				parserLogger.debug(`Intentando parser: ${parser.name}`);
				const result = await parser.parse(metadata);

				if (result) {
					parserLogger.info(`Información de generación AI extraída con parser ${parser.name}`, {
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

	parserLogger.debug('No se pudo extraer información de generación AI');
	return null;
}
