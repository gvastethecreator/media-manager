/**
 * Parser especializado para metadatos de Stable Diffusion
 * Maneja formatos específicos de A1111, Forge, ComfyUI y otros UIs de SD
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
    AIEngine,
    type AIGenerationParameters,
    type Automatic1111Metadata,
    type ComfyUIMetadata,
    type ParserResult,
    type SwarmUIMetadata,
} from '@/types/metadata-origin.types';

const logger = serverLogger.withContext('SDParserService');

/**
 * Parsea metadatos específicos de Automatic1111/WebUI
 */
export async function parseAutomatic1111Metadata(parametersText: string): Promise<ParserResult> {
	try {
		logger.debug('Parseando metadatos A1111', { textLength: parametersText.length });

		// Dividir en prompt y parámetros
		const lines = parametersText
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);

		if (lines.length === 0) {
			return { detected: false, confidence: 0 };
		}

		// El prompt positivo suele estar en las primeras líneas
		let promptEndIndex = 0;
		let negativePromptStart = -1;

		// Buscar "Negative prompt:" para dividir
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].startsWith('Negative prompt:')) {
				promptEndIndex = i;
				negativePromptStart = i;
				break;
			}
			// Si encontramos parámetros técnicos, el prompt termina antes
			if (lines[i].includes('Steps:') || lines[i].includes('Size:')) {
				promptEndIndex = i;
				break;
			}
		}

		// Extraer prompt positivo
		const prompt = lines.slice(0, promptEndIndex).join(' ').trim();

		// Extraer prompt negativo si existe
		let negative_prompt = '';
		if (negativePromptStart !== -1) {
			const negLine = lines[negativePromptStart];
			negative_prompt = negLine.replace('Negative prompt:', '').trim();
		}

		// Buscar línea de parámetros (usualmente la última)
		let parametersLine = '';
		for (let i = lines.length - 1; i >= 0; i--) {
			if (lines[i].includes('Steps:') || lines[i].includes('Size:')) {
				parametersLine = lines[i];
				break;
			}
		}

		// Parsear parámetros técnicos
		const params = parseA1111Parameters(parametersLine);

		const metadata: Automatic1111Metadata = {
			engine: AIEngine.AUTOMATIC1111,
			prompt,
			negative_prompt: negative_prompt || undefined,
			...params,
		};

		// Calcular confianza basada en parámetros encontrados
		const confidence = calculateA1111Confidence(metadata);

		logger.info('Metadatos A1111 parseados', {
			confidence,
			hasPrompt: !!prompt,
			hasNegative: !!negative_prompt,
			paramsCount: Object.keys(params).length,
		});

		return {
			detected: confidence > 0.3,
			confidence,
			data: metadata,
		};
	} catch (error) {
		logger.error('Error parseando metadatos A1111', { error });
		return {
			detected: false,
			confidence: 0,
			errors: [`Error parsing A1111: ${error}`],
		};
	}
}

/**
 * Parsea la línea de parámetros de A1111
 */
function parseA1111Parameters(parametersLine: string): Partial<Automatic1111Metadata> {
	const params: Partial<Automatic1111Metadata> = {};

	if (!parametersLine) return params;

	// Patrones de extracción para parámetros comunes
	const patterns = {
		steps: /Steps:\s*(\d+)/,
		cfg_scale: /CFG scale:\s*([\d.]+)/,
		sampler: /Sampler:\s*([^,\n]+?)(?:,|$)/,
		seed: /Seed:\s*(\d+)/,
		size: /Size:\s*(\d+)x(\d+)/,
		model: /Model:\s*([^,\n]+?)(?:,|$)/,
		clip_skip: /Clip skip:\s*(\d+)/,
		denoise: /Denoising strength:\s*([\d.]+)/,
		eta: /Eta:\s*([\d.]+)/,
		// A1111 específicos
		restore_faces: /Restore faces/,
		tiling: /Tiling/,
		hires_upscaler: /Hires upscaler:\s*([^,\n]+?)(?:,|$)/,
		hires_steps: /Hires steps:\s*(\d+)/,
		hires_denoising_strength: /Hires denoising strength:\s*([\d.]+)/,
		// Forge específicos
		forge_attention: /Forge attention:\s*([^,\n]+?)(?:,|$)/,
		forge_memory: /Forge memory:\s*([^,\n]+?)(?:,|$)/,
	};

	// Aplicar patrones
	for (const [key, pattern] of Object.entries(patterns)) {
		const match = parametersLine.match(pattern);

		if (match) {
			switch (key) {
				case 'steps':
				case 'clip_skip':
				case 'hires_steps':
					(params as any)[key] = Number.parseInt(match[1], 10);
					break;

				case 'cfg_scale':
				case 'denoise':
				case 'eta':
				case 'hires_denoising_strength':
					(params as any)[key] = Number.parseFloat(match[1]);
					break;

				case 'seed':
					params.seed = match[1]; // Mantener como string para seeds muy grandes
					break;

				case 'size':
					// Size viene como "512x768"
					params.extra_params = {
						...params.extra_params,
						width: Number.parseInt(match[1], 10),
						height: Number.parseInt(match[2], 10),
					};
					break;

				case 'restore_faces':
				case 'tiling':
					(params as any)[key] = true;
					break;

				default:
					// Para strings (sampler, model, etc.)
					(params as any)[key] = match[1]?.trim();
					break;
			}
		}
	}

	return params;
}

/**
 * Calcula la confianza del parsing de A1111
 */
function calculateA1111Confidence(metadata: Automatic1111Metadata): number {
	let confidence = 0;

	// Presencia de elementos clave
	if (metadata.prompt) confidence += 0.2;
	if (metadata.steps) confidence += 0.2;
	if (metadata.cfg_scale) confidence += 0.2;
	if (metadata.sampler) confidence += 0.15;
	if (metadata.seed) confidence += 0.1;
	if (metadata.model) confidence += 0.1;

	// Bonificación por parámetros A1111 específicos
	if (metadata.restore_faces || metadata.tiling) confidence += 0.1;
	if (metadata.hires_upscaler) confidence += 0.1;

	// Bonificación por parámetros Forge
	if (metadata.forge_attention || metadata.forge_memory) confidence += 0.15;

	return Math.min(confidence, 1.0);
}

/**
 * Parsea metadatos de ComfyUI (workflow JSON)
 */
export async function parseComfyUIMetadata(workflowData: string | Record<string, unknown>): Promise<ParserResult> {
	try {
		logger.debug('Parseando metadatos ComfyUI');

		let workflow: Record<string, unknown>;

		if (typeof workflowData === 'string') {
			workflow = JSON.parse(workflowData);
		} else {
			workflow = workflowData;
		}

		// Extraer información del workflow
		const metadata: ComfyUIMetadata = {
			engine: AIEngine.COMFYUI,
			workflow: typeof workflowData === 'string' ? workflowData : JSON.stringify(workflowData),
			workflow_json: workflow,
		};

		// Buscar nodos específicos en el workflow
		if (workflow.nodes && Array.isArray(workflow.nodes)) {
			const nodes = workflow.nodes;

			// Buscar prompts en nodos de texto
			const textNodes = nodes.filter(
				(node: any) =>
					node.type === 'CLIPTextEncode' || node.type === 'TextInput' || node.outputs?.includes('CONDITIONING')
			);

			if (textNodes.length > 0) {
				// Primer nodo texto suele ser prompt positivo
				const firstText = textNodes[0];
				if (firstText.widgets_values?.[0]) {
					metadata.prompt = firstText.widgets_values[0];
				}

				// Segundo nodo texto suele ser prompt negativo
				if (textNodes.length > 1) {
					const secondText = textNodes[1];
					if (secondText.widgets_values?.[0]) {
						metadata.negative_prompt = secondText.widgets_values[0];
					}
				}
			}

			// Buscar sampler/scheduler
			const samplerNode = nodes.find((node: any) => node.type === 'KSampler' || node.type === 'KSamplerAdvanced');

			if (samplerNode?.widgets_values) {
				const values = samplerNode.widgets_values;
				metadata.seed = values[0]; // seed
				metadata.steps = values[1]; // steps
				metadata.cfg_scale = values[2]; // cfg
				metadata.sampler = values[3]; // sampler_name
				metadata.scheduler = values[4]; // scheduler
			}

			// Buscar checkpoint loader
			const checkpointNode = nodes.find(
				(node: any) => node.type === 'CheckpointLoaderSimple' || node.type === 'CheckpointLoader'
			);

			if (checkpointNode?.widgets_values) {
				metadata.model = checkpointNode.widgets_values[0];
			}
		}

		const confidence = calculateComfyUIConfidence(metadata);

		logger.info('Metadatos ComfyUI parseados', {
			confidence,
			hasNodes: !!workflow.nodes,
			nodesCount: Array.isArray(workflow.nodes) ? workflow.nodes.length : 0,
		});

		return {
			detected: confidence > 0.3,
			confidence,
			data: metadata,
		};
	} catch (error) {
		logger.error('Error parseando metadatos ComfyUI', { error });
		return {
			detected: false,
			confidence: 0,
			errors: [`Error parsing ComfyUI: ${error}`],
		};
	}
}

/**
 * Calcula la confianza del parsing de ComfyUI
 */
function calculateComfyUIConfidence(metadata: ComfyUIMetadata): number {
	let confidence = 0;

	// Presencia de workflow
	if (metadata.workflow) confidence += 0.3;
	if (metadata.workflow_json) confidence += 0.2;

	// Parámetros extraídos
	if (metadata.prompt) confidence += 0.2;
	if (metadata.steps) confidence += 0.1;
	if (metadata.cfg_scale) confidence += 0.1;
	if (metadata.sampler) confidence += 0.1;

	return Math.min(confidence, 1.0);
}

/**
 * Parsea metadatos de SwarmUI
 */
export async function parseSwarmUIMetadata(metadata: Record<string, unknown>): Promise<ParserResult> {
	try {
		logger.debug('Parseando metadatos SwarmUI');

		const swarmMetadata: SwarmUIMetadata = {
			engine: AIEngine.SWARMUI,
		};

		// Mapear campos conocidos de SwarmUI
		const fieldMapping = {
			prompt: 'prompt',
			negative_prompt: 'negative_prompt',
			steps: 'steps',
			cfg_scale: 'cfg_scale',
			sampler: 'sampler',
			seed: 'seed',
			model: 'model',
			generation_time: 'generation_time',
			prep_time: 'prep_time',
			aspect_ratio: 'aspect_ratio',
			total_time: 'total_time',
			gpu_memory: 'gpu_memory',
			batch_size: 'batch_size',
			batch_count: 'batch_count',
		};

		for (const [sourceKey, targetKey] of Object.entries(fieldMapping)) {
			if (sourceKey in metadata) {
				(swarmMetadata as any)[targetKey] = metadata[sourceKey];
			}
		}

		const confidence = calculateSwarmUIConfidence(swarmMetadata);

		logger.info('Metadatos SwarmUI parseados', {
			confidence,
			fieldsFound: Object.keys(swarmMetadata).length - 1, // -1 para engine
		});

		return {
			detected: confidence > 0.3,
			confidence,
			data: swarmMetadata,
		};
	} catch (error) {
		logger.error('Error parseando metadatos SwarmUI', { error });
		return {
			detected: false,
			confidence: 0,
			errors: [`Error parsing SwarmUI: ${error}`],
		};
	}
}

/**
 * Calcula la confianza del parsing de SwarmUI
 */
function calculateSwarmUIConfidence(metadata: SwarmUIMetadata): number {
	let confidence = 0;

	// Campos específicos de SwarmUI
	if (metadata.generation_time) confidence += 0.3;
	if (metadata.prep_time) confidence += 0.2;
	if (metadata.aspect_ratio) confidence += 0.2;

	// Campos comunes
	if (metadata.prompt) confidence += 0.15;
	if (metadata.steps) confidence += 0.1;
	if (metadata.cfg_scale) confidence += 0.05;

	return Math.min(confidence, 1.0);
}

/**
 * Extrae parámetros comunes de generación IA desde metadatos genéricos
 */
export async function extractCommonAIParameters(metadata: Record<string, unknown>): Promise<AIGenerationParameters> {
	const params: AIGenerationParameters = {};

	// Mapeo de nombres de campos comunes
	const commonFields = [
		'prompt',
		'negative_prompt',
		'steps',
		'cfg_scale',
		'cfg',
		'sampler',
		'scheduler',
		'seed',
		'model',
		'checkpoint',
		'width',
		'height',
		'denoise',
		'clip_skip',
		'eta',
	];

	for (const field of commonFields) {
		if (field in metadata) {
			(params as any)[field] = metadata[field];
		}
	}

	// Normalizar cfg_scale vs cfg
	if (params.cfg && !params.cfg_scale) {
		params.cfg_scale = params.cfg;
	}

	return params;
}
