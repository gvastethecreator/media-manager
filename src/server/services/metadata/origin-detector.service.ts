/**
 * Servicio para detectar el origen/engine de generación de imágenes y videos por IA
 * Analiza metadatos para identificar: Automatic1111, Forge, ComfyUI, SwarmUI, Midjourney, etc.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
    AIEngine,
    type OriginDetectionResult,
    type SupportedEngine
} from '@/types/metadata-origin.types';

const logger = serverLogger.withContext('OriginDetectorService');

/**
 * Patrones de detección para cada engine
 */
const ENGINE_PATTERNS = {
	[AIEngine.AUTOMATIC1111]: {
		// Patrones en metadatos (incluyendo PNG chunks)
		metadata_keys: ['parameters', 'Parameters', 'workflow', 'Software', 'png_parameters', 'png_Parameters'],
		metadata_patterns: [
			/Steps:\s*\d+/,
			/CFG scale:\s*[\d.]+/,
			/Sampler:\s*[^,\n]+/,
			/Seed:\s*\d+/,
			/Size:\s*\d+x\d+/,
			/Model:\s*[^,\n]+/,
			/Negative prompt:/
		],
		// Patrones en Software EXIF
		software_patterns: [
			/AUTOMATIC1111/i,
			/stable-diffusion-webui/i,
			/webui/i
		],
		// PNG text chunks específicos
		png_chunk_keys: ['parameters', 'Parameters', 'Comment', 'Description'],
		png_chunk_patterns: [
			/Steps:\s*\d+/,
			/CFG scale:/,
			/Negative prompt:/,
			/Model hash:/
		],
		// Combinaciones específicas
		specific_combinations: [
			['parameters', 'Steps:'],
			['Parameters', 'Steps:'],
			['parameters', 'CFG scale:'],
			['parameters', 'Negative prompt:'],
			['png_parameters', 'Steps:']
		]
	},

	[AIEngine.FORGE]: {
		metadata_keys: ['parameters', 'forge_version', 'forge_attention'],
		metadata_patterns: [
			/Forge/i,
			/forge_attention/i,
			/forge_memory/i
		],
		software_patterns: [
			/forge/i,
			/stable-diffusion-webui-forge/i
		],
		specific_combinations: [
			['parameters', 'Forge'],
			['forge_version'],
			['forge_attention']
		]
	},

	[AIEngine.COMFYUI]: {
		metadata_keys: ['prompt', 'Prompt', 'workflow', 'Workflow', 'ComfyUI', 'png_prompt', 'png_workflow'],
		metadata_patterns: [
			/ComfyUI/i,
			/"class_type"/,
			/"inputs"/,
			/"outputs"/,
			/"nodes"/,
			/"links"/,
			/"extra"/,
			/"version"/
		],
		software_patterns: [
			/ComfyUI/i,
			/comfy/i
		],
		// PNG text chunks específicos para ComfyUI
		png_chunk_keys: ['prompt', 'Prompt', 'workflow', 'Workflow', 'Comment'],
		png_chunk_patterns: [
			/"class_type":/,
			/"inputs":/,
			/"outputs":/,
			/ComfyUI/i,
			/{.*"nodes".*}/
		],
		specific_combinations: [
			['prompt', 'workflow'],
			['Prompt', 'Workflow'],
			['workflow', 'class_type'],
			['png_workflow', 'class_type'],
			['ComfyUI']
		]
	},

	[AIEngine.SWARMUI]: {
		metadata_keys: ['swarm_metadata', 'generation_time', 'prep_time'],
		metadata_patterns: [
			/SwarmUI/i,
			/generation_time/i,
			/prep_time/i
		],
		software_patterns: [
			/SwarmUI/i,
			/swarm/i
		],
		specific_combinations: [
			['generation_time', 'prep_time'],
			['swarm_metadata'],
			['SwarmUI']
		]
	},

	[AIEngine.MIDJOURNEY]: {
		metadata_keys: ['Description', 'Comment', 'job_id', 'author'],
		metadata_patterns: [
			/--v\s+\d+/,
			/--ar\s+[\d.:]+/,
			/--chaos\s+\d+/,
			/--stylize\s+\d+/,
			/--quality\s+\d+/,
			/Job ID:/i,
			/midjourney/i
		],
		software_patterns: [
			/Midjourney/i,
			/MJ/
		],
		specific_combinations: [
			['Description', '--v'],
			['Comment', '--ar'],
			['job_id'],
			['author', 'Job ID']
		]
	},

	[AIEngine.INVOKEAI]: {
		metadata_keys: ['invokeai_metadata', 'invoke_ai', 'InvokeAI'],
		metadata_patterns: [
			/InvokeAI/i,
			/invoke/i
		],
		software_patterns: [
			/InvokeAI/i,
			/invoke/i
		],
		specific_combinations: [
			['invokeai_metadata'],
			['invoke_ai'],
			['InvokeAI']
		]
	},

	[AIEngine.NOVELAI]: {
		metadata_keys: ['Description', 'Comment', 'NovelAI'],
		metadata_patterns: [
			/NovelAI/i,
			/Undesired content:/,
			/Quality tags:/,
			/novelai/i
		],
		software_patterns: [
			/NovelAI/i
		],
		specific_combinations: [
			['Description', 'Steps:'],
			['Description', 'Undesired content:'],
			['NovelAI']
		]
	},

	[AIEngine.IDEOGRAM]: {
		metadata_keys: ['Software', 'Description', 'ideogram'],
		metadata_patterns: [
			/ideogram/i,
			/Ideogram/
		],
		software_patterns: [
			/Ideogram/i
		],
		specific_combinations: [
			['Software', 'Ideogram'],
			['ideogram']
		]
	},

	[AIEngine.STABILITY_AI]: {
		metadata_keys: ['Description', 'Software', 'stability'],
		metadata_patterns: [
			/Stability AI/i,
			/stability/i,
			/stablediffusion/i
		],
		software_patterns: [
			/Stability AI/i,
			/DreamStudio/i
		],
		specific_combinations: [
			['Software', 'Stability'],
			['stability']
		]
	},

	[AIEngine.DALLE]: {
		metadata_keys: ['Description', 'Software', 'dalle', 'openai'],
		metadata_patterns: [
			/DALL·E/i,
			/dall-e/i,
			/OpenAI/i
		],
		software_patterns: [
			/DALL·E/i,
			/OpenAI/i
		],
		specific_combinations: [
			['Software', 'OpenAI'],
			['dalle'],
			['Description', 'DALL']
		]
	}
};

/**
 * Analiza metadatos para detectar el engine de origen
 */
export async function detectOrigin(metadata: Record<string, unknown>): Promise<OriginDetectionResult> {
	logger.debug('Iniciando detección de origen', { metadataKeys: Object.keys(metadata) });

	const results: Array<{ engine: AIEngine; confidence: number; evidence: string[] }> = [];

	// Probar cada engine
	for (const [engineName, patterns] of Object.entries(ENGINE_PATTERNS)) {
		const engine = engineName as AIEngine;
		const detection = await analyzeEnginePatterns(metadata, engine, patterns);

		if (detection.confidence > 0) {
			results.push(detection);
		}
	}

	// Ordenar por confianza
	results.sort((a, b) => b.confidence - a.confidence);

	// Retornar el mejor resultado o desconocido
	if (results.length > 0 && results[0].confidence > 0.3) {
		const best = results[0];
		logger.info('Origen detectado', {
			engine: best.engine,
			confidence: best.confidence,
			evidenceCount: best.evidence.length
		});

		return {
			engine: best.engine,
			confidence: best.confidence,
			evidence: best.evidence,
			version: await detectEngineVersion(metadata, best.engine)
		};
	}

	logger.debug('No se pudo detectar origen específico');
	return {
		engine: AIEngine.UNKNOWN,
		confidence: 0,
		evidence: ['No se encontraron patrones reconocibles']
	};
}

/**
 * Analiza patrones específicos para un engine incluyendo PNG chunks
 */
async function analyzeEnginePatterns(
	metadata: Record<string, unknown>,
	engine: AIEngine,
	patterns: any
): Promise<{ engine: AIEngine; confidence: number; evidence: string[] }> {

	let confidence = 0;
	const evidence: string[] = [];

	// 1. Buscar claves de metadata específicas
	for (const key of patterns.metadata_keys) {
		if (key in metadata) {
			confidence += 0.2;
			evidence.push(`Clave encontrada: ${key}`);
		}
	}

	// 2. Buscar patrones en valores de metadata
	for (const [key, value] of Object.entries(metadata)) {
		if (typeof value === 'string') {
			for (const pattern of patterns.metadata_patterns) {
				if (pattern.test(value)) {
					confidence += 0.15;
					evidence.push(`Patrón encontrado en ${key}: ${pattern.source}`);
				}
			}
		}
	}

	// 2.5. Análisis específico de PNG chunks
	if (patterns.png_chunk_keys && patterns.png_chunk_patterns) {
		for (const pngKey of patterns.png_chunk_keys) {
			if (pngKey in metadata) {
				confidence += 0.25; // Mayor peso para PNG chunks
				evidence.push(`PNG chunk encontrado: ${pngKey}`);

				// Analizar patrones en PNG chunks
				const pngValue = metadata[pngKey];
				if (typeof pngValue === 'string') {
					for (const pngPattern of patterns.png_chunk_patterns) {
						if (pngPattern.test(pngValue)) {
							confidence += 0.2;
							evidence.push(`PNG chunk patrón en ${pngKey}: ${pngPattern.source}`);
						}
					}
				}
			}
		}

		// Buscar campos PNG prefijados (png_*)
		for (const [key, value] of Object.entries(metadata)) {
			if (key.startsWith('png_') && typeof value === 'string') {
				for (const pngPattern of patterns.png_chunk_patterns) {
					if (pngPattern.test(value)) {
						confidence += 0.18;
						evidence.push(`PNG prefijo patrón en ${key}: ${pngPattern.source}`);
					}
				}
			}
		}
	}

	// 3. Analizar Software EXIF específicamente
	if (metadata.Software && typeof metadata.Software === 'string') {
		for (const pattern of patterns.software_patterns || []) {
			if (pattern.test(metadata.Software)) {
				confidence += 0.3; // Mayor peso para Software EXIF
				evidence.push(`Software EXIF coincide: ${metadata.Software}`);
			}
		}
	}

	// 4. Buscar combinaciones específicas
	for (const combination of patterns.specific_combinations) {
		if (combination.length === 1) {
			// Buscar clave simple
			if (combination[0] in metadata) {
				confidence += 0.25;
				evidence.push(`Combinación encontrada: ${combination[0]}`);
			}
		} else if (combination.length === 2) {
			// Buscar clave + patrón
			const [key, pattern] = combination;
			if (key in metadata && typeof metadata[key] === 'string') {
				if (metadata[key].includes(pattern)) {
					confidence += 0.3;
					evidence.push(`Combinación encontrada: ${key} contiene "${pattern}"`);
				}
			}
		}
	}

	// 5. Bonificaciones por múltiple evidencia
	if (evidence.length >= 3) {
		confidence += 0.1;
		evidence.push('Múltiple evidencia encontrada');
	}

	// Limitar confianza a 1.0
	confidence = Math.min(confidence, 1.0);

	return { engine, confidence, evidence };
}

/**
 * Intenta detectar la versión específica del engine
 */
async function detectEngineVersion(metadata: Record<string, unknown>, engine: AIEngine): Promise<string | undefined> {
	switch (engine) {
		case AIEngine.AUTOMATIC1111:
			// Buscar versión en Software o parámetros
			if (metadata.Software && typeof metadata.Software === 'string') {
				const versionMatch = metadata.Software.match(/v?(\d+\.\d+\.\d+)/);
				if (versionMatch) return versionMatch[1];
			}
			break;

		case AIEngine.COMFYUI:
			// ComfyUI a veces incluye versión en metadata
			if (metadata.ComfyUI && typeof metadata.ComfyUI === 'string') {
				const versionMatch = metadata.ComfyUI.match(/(\d+\.\d+)/);
				if (versionMatch) return versionMatch[1];
			}
			break;

		case AIEngine.MIDJOURNEY:
			// Versión en parámetros --v
			if (metadata.Description && typeof metadata.Description === 'string') {
				const versionMatch = metadata.Description.match(/--v\s+(\d+(?:\.\d+)?)/);
				if (versionMatch) return versionMatch[1];
			}
			break;

		case AIEngine.FORGE:
			// Forge version específica
			if (metadata.forge_version) return metadata.forge_version as string;
			break;
	}

	return undefined;
}

/**
 * Detecta si los metadatos contienen información de generación por IA
 */
export async function hasAIGenerationData(metadata: Record<string, unknown>): Promise<boolean> {
	const detection = await detectOrigin(metadata);
	return detection.engine !== AIEngine.UNKNOWN && detection.confidence > 0.5;
}

/**
 * Lista de engines soportados
 */
export function getSupportedEngines(): SupportedEngine[] {
	return [
		AIEngine.AUTOMATIC1111,
		AIEngine.FORGE,
		AIEngine.COMFYUI,
		AIEngine.SWARMUI,
		AIEngine.MIDJOURNEY,
		AIEngine.INVOKEAI,
		AIEngine.NOVELAI,
		AIEngine.IDEOGRAM
	];
}

/**
 * Obtiene información detallada sobre un engine
 */
export function getEngineInfo(engine: AIEngine): { name: string; description: string; patterns: number } {
	const patterns = ENGINE_PATTERNS[engine];

	const descriptions = {
		[AIEngine.AUTOMATIC1111]: 'Stable Diffusion WebUI - Interfaz web más popular',
		[AIEngine.FORGE]: 'Forge WebUI - Fork optimizado de Automatic1111',
		[AIEngine.COMFYUI]: 'ComfyUI - Interfaz basada en nodos',
		[AIEngine.SWARMUI]: 'SwarmUI - Interfaz moderna con batch processing',
		[AIEngine.MIDJOURNEY]: 'Midjourney - Servicio comercial de generación',
		[AIEngine.INVOKEAI]: 'InvokeAI - Interfaz profesional para Stable Diffusion',
		[AIEngine.NOVELAI]: 'NovelAI - Servicio de generación de imágenes anime',
		[AIEngine.IDEOGRAM]: 'Ideogram - Generación de imágenes con texto',
		[AIEngine.STABILITY_AI]: 'Stability AI - API oficial de Stable Diffusion',
		[AIEngine.DALLE]: 'DALL·E - Generador de OpenAI',
		[AIEngine.UNKNOWN]: 'Motor desconocido'
	};

	return {
		name: engine,
		description: descriptions[engine] || 'Descripción no disponible',
		patterns: patterns ? (
			patterns.metadata_keys.length +
			patterns.metadata_patterns.length +
			(patterns.software_patterns?.length || 0) +
			patterns.specific_combinations.length
		) : 0
	};
}
