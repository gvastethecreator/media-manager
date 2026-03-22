/**
 * Servicio especializado para extraer metadatos de PNG text chunks
 * Maneja tEXt, zTXt, e iTXt chunks donde se almacenan metadatos de IA
 * Soporta Automatic1111, ComfyUI, SwarmUI, Midjourney y otros engines
 */

// Reemplazo mínimo: lector interno de chunks PNG para evitar dependencia rota de 'png-itxt'
function readPngChunks(buffer: Buffer): Array<{ type: string; data: Buffer }> {
	const chunks: Array<{ type: string; data: Buffer }> = [];
	try {
		const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
		if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
			return chunks;
		}

		let offset = 8; // después de la firma
		while (offset + 8 <= buffer.length) {
			const length = buffer.readUInt32BE(offset);
			offset += 4;
			const type = buffer.subarray(offset, offset + 4).toString('ascii');
			offset += 4;

			// Validación de límites
			if (length < 0 || offset + length + 4 > buffer.length) {
				break;
			}

			const data = buffer.subarray(offset, offset + length);
			offset += length;
			// CRC (4 bytes) – se ignora para lectura
			offset += 4;

			chunks.push({ type, data });

			if (type === 'IEND') {
				break;
			}
		}
	} catch {
		// En caso de error, retornar los chunks recolectados (posiblemente vacíos)
		return chunks;
	}
	return chunks;
}

import { serverLogger } from '@/lib/logger/server-logger';
import type {
	AIGenerationParameters,
	Automatic1111Metadata,
	ComfyUIMetadata,
	MidjourneyMetadata,
	SwarmUIMetadata,
} from '@/types/metadata-origin.types';
import { AIEngine } from '@/types/metadata-origin.types';

const logger = serverLogger.withContext('PNGParser');

// Union type para AIMetadata basado en los tipos existentes
type AIMetadata =
	| Automatic1111Metadata
	| ComfyUIMetadata
	| SwarmUIMetadata
	| MidjourneyMetadata
	| AIGenerationParameters;

// Interfaces para PNG chunks
interface PngTextChunk {
	keyword: string;
	language?: string;
	text: string;
	translatedKeyword?: string;
	type: 'tEXt' | 'zTXt' | 'iTXt';
}

interface PngChunksResult {
	rawChunks: any[];
	textChunks: PngTextChunk[];
}

// Keywords conocidos para metadatos de IA
const AI_KEYWORDS = {
	// Automatic1111/Forge
	parameters: ['parameters', 'Parameters'],
	// ComfyUI
	workflow: ['workflow', 'Workflow', 'prompt'],
	// SwarmUI
	swarmui: ['sui_image_params', 'swarmui'],
	// Midjourney
	midjourney: ['Description', 'description', 'Comment'],
	// Otros
	general: ['prompt', 'Prompt', 'generation_data', 'ai_data'],
};

/**
 * Extrae todos los text chunks de un archivo PNG
 */
export async function extractPngTextChunks(buffer: Buffer): Promise<PngChunksResult> {
	try {
		logger.info('🖼️ PNG PARSER: Iniciando extracción de text chunks', { bufferSize: buffer.length });

		// Usar png-itxt para extraer chunks
		const chunks = readPngChunks(buffer);
		const textChunks: PngTextChunk[] = [];

		// Procesar cada chunk
		for (const chunk of chunks) {
			if (chunk.type === 'tEXt' || chunk.type === 'zTXt' || chunk.type === 'iTXt') {
				try {
					const textChunk = parseTextChunk(chunk);
					if (textChunk) {
						textChunks.push(textChunk);
						logger.debug('📝 PNG PARSER: Text chunk encontrado', {
							type: textChunk.type,
							keyword: textChunk.keyword,
							textLength: textChunk.text.length,
						});
					}
				} catch (error) {
					logger.warn('⚠️ PNG PARSER: Error procesando chunk', {
						type: chunk.type,
						error: error instanceof Error ? error.message : 'Error desconocido',
					});
				}
			}
		}

		logger.info('✅ PNG PARSER: Text chunks extraídos', {
			totalChunks: chunks.length,
			textChunks: textChunks.length,
			keywords: textChunks.map((c) => c.keyword),
		});

		return {
			textChunks,
			rawChunks: chunks,
		};
	} catch (error) {
		logger.error('❌ PNG PARSER: Error extrayendo text chunks', {
			error: error instanceof Error ? error.message : 'Error desconocido',
			bufferSize: buffer.length,
		});
		throw error;
	}
}

/**
 * Parsea un chunk de texto individual
 */
function parseTextChunk(chunk: any): PngTextChunk | null {
	try {
		if (chunk.type === 'tEXt') {
			// tEXt: keyword\0text
			const data = chunk.data.toString('latin1');
			const nullIndex = data.indexOf('\0');
			if (nullIndex === -1) {
				return null;
			}

			return {
				type: 'tEXt',
				keyword: data.substring(0, nullIndex),
				text: data.substring(nullIndex + 1),
			};
		}

		if (chunk.type === 'zTXt') {
			// zTXt: keyword\0compression_method\0compressed_text
			const data = chunk.data;
			let offset = 0;

			// Encontrar keyword (hasta el primer null)
			const nullIndex = data.indexOf(0, offset);
			if (nullIndex === -1) {
				return null;
			}
			const keyword = data.subarray(offset, nullIndex).toString('latin1');
			offset = nullIndex + 1;

			// Compression method (1 byte)
			const compressionMethod = data[offset];
			offset += 1;

			// Compressed text
			const compressedText = data.subarray(offset);

			// Descomprimir usando zlib
			const zlib = require('zlib');
			const decompressed = zlib.inflateSync(compressedText);
			const text = decompressed.toString('utf8');

			return {
				type: 'zTXt',
				keyword,
				text,
			};
		}

		if (chunk.type === 'iTXt') {
			// iTXt: keyword\0compression_flag\0compression_method\0language_tag\0translated_keyword\0text
			const data = chunk.data;
			let offset = 0;

			// Keyword
			let nullIndex = data.indexOf(0, offset);
			if (nullIndex === -1) {
				return null;
			}
			const keyword = data.subarray(offset, nullIndex).toString('latin1');
			offset = nullIndex + 1;

			// Compression flag
			const compressionFlag = data[offset];
			offset += 1;

			// Compression method
			const compressionMethod = data[offset];
			offset += 1;

			// Language tag
			nullIndex = data.indexOf(0, offset);
			if (nullIndex === -1) {
				return null;
			}
			const language = data.subarray(offset, nullIndex).toString('latin1');
			offset = nullIndex + 1;

			// Translated keyword
			nullIndex = data.indexOf(0, offset);
			if (nullIndex === -1) {
				return null;
			}
			const translatedKeyword = data.subarray(offset, nullIndex).toString('utf8');
			offset = nullIndex + 1;

			// Text (puede estar comprimido)
			let text: string;
			if (compressionFlag === 1) {
				// Texto comprimido
				const zlib = require('zlib');
				const compressedText = data.subarray(offset);
				const decompressed = zlib.inflateSync(compressedText);
				text = decompressed.toString('utf8');
			} else {
				// Texto sin comprimir
				text = data.subarray(offset).toString('utf8');
			}

			return {
				type: 'iTXt',
				keyword,
				text,
				language: language || undefined,
				translatedKeyword: translatedKeyword || undefined,
			};
		}

		return null;
	} catch (error) {
		logger.warn('⚠️ PNG PARSER: Error parseando chunk individual', {
			type: chunk.type,
			error: error instanceof Error ? error.message : 'Error desconocido',
		});
		return null;
	}
}

/**
 * Extrae metadatos de IA de los text chunks
 */
export async function extractAIMetadataFromChunks(textChunks: PngTextChunk[]): Promise<{
	aiMetadata: Partial<AIGenerationParameters> & Record<string, unknown>;
	detectedEngine: AIEngine | null;
	confidence: number;
}> {
	logger.info('🤖 PNG PARSER: Iniciando extracción de metadatos IA', {
		totalChunks: textChunks.length,
		keywords: textChunks.map((c) => c.keyword),
	});

	const aiMetadata: Partial<AIGenerationParameters> & Record<string, unknown> = {};
	let detectedEngine: AIEngine | null = null;
	let confidence = 0;

	// Buscar chunks con metadatos de IA
	for (const chunk of textChunks) {
		const keyword = chunk.keyword.toLowerCase();
		const text = chunk.text;

		// Automatic1111/Forge - Parameters
		if (AI_KEYWORDS.parameters.some((k) => k.toLowerCase() === keyword)) {
			logger.info('🎯 PNG PARSER: Detectado chunk de Automatic1111/Forge', { keyword });
			const a1111Data = parseAutomatic1111Parameters(text);
			Object.assign(aiMetadata, a1111Data);
			detectedEngine = AIEngine.AUTOMATIC1111;
			confidence = Math.max(confidence, 0.9);
		}

		// ComfyUI - Workflow
		else if (AI_KEYWORDS.workflow.some((k) => k.toLowerCase() === keyword)) {
			logger.info('🎯 PNG PARSER: Detectado chunk de ComfyUI', { keyword });
			const comfyData = parseComfyUIWorkflow(text);
			Object.assign(aiMetadata, comfyData);
			detectedEngine = AIEngine.COMFYUI;
			confidence = Math.max(confidence, 0.9);
		}

		// SwarmUI
		else if (AI_KEYWORDS.swarmui.some((k) => k.toLowerCase() === keyword)) {
			logger.info('🎯 PNG PARSER: Detectado chunk de SwarmUI', { keyword });
			const swarmData = parseSwarmUIParameters(text);
			Object.assign(aiMetadata, swarmData);
			detectedEngine = AIEngine.SWARMUI;
			confidence = Math.max(confidence, 0.9);
		}

		// Midjourney
		else if (AI_KEYWORDS.midjourney.some((k) => k.toLowerCase() === keyword)) {
			logger.info('🎯 PNG PARSER: Detectado chunk de Midjourney', { keyword });
			const mjData = parseMidjourneyDescription(text);
			Object.assign(aiMetadata, mjData);
			detectedEngine = AIEngine.MIDJOURNEY;
			confidence = Math.max(confidence, 0.8);
		}

		// Otros engines generales
		else if (AI_KEYWORDS.general.some((k) => k.toLowerCase() === keyword)) {
			logger.info('🎯 PNG PARSER: Detectado chunk genérico de IA', { keyword });
			const genericData = parseGenericAIData(text);
			Object.assign(aiMetadata, genericData);
			if (!detectedEngine) {
				detectedEngine = AIEngine.UNKNOWN;
				confidence = Math.max(confidence, 0.5);
			}
		}
	}

	logger.info('✅ PNG PARSER: Metadatos IA extraídos', {
		detectedEngine,
		confidence,
		hasPrompt: !!aiMetadata.prompt,
		hasModel: !!aiMetadata.model,
		hasSteps: !!aiMetadata.steps,
	});

	return {
		aiMetadata,
		detectedEngine,
		confidence,
	};
}

/**
 * Parsea parámetros de Automatic1111/Forge
 */
function parseAutomatic1111Parameters(text: string): Partial<AIGenerationParameters> & Record<string, unknown> {
	try {
		const metadata: Partial<AIGenerationParameters> & Record<string, unknown> = {};

		// Buscar prompt (todo antes de "Negative prompt:")
		const negativeIndex = text.indexOf('Negative prompt:');
		if (negativeIndex > 0) {
			metadata.prompt = text.substring(0, negativeIndex).trim();

			// Buscar negative prompt
			const afterNegative = text.substring(negativeIndex + 16); // "Negative prompt:".length
			const stepsIndex = afterNegative.search(/\bSteps:/i);
			if (stepsIndex > 0) {
				metadata.negative_prompt = afterNegative.substring(0, stepsIndex).trim();
			}
		} else {
			// No hay negative prompt, buscar donde empiezan los parámetros
			const stepsIndex = text.search(/\bSteps:/i);
			if (stepsIndex > 0) {
				metadata.prompt = text.substring(0, stepsIndex).trim();
			}
		}

		// Extraer parámetros usando regex
		const params = {
			steps: /Steps:\s*(\d+)/i,
			sampler: /Sampler:\s*([^,\n]+)/i,
			cfgScale: /CFG scale:\s*([\d.]+)/i,
			seed: /Seed:\s*(\d+)/i,
			size: /Size:\s*(\d+x\d+)/i,
			model: /Model:\s*([^,\n]+)/i,
			modelHash: /Model hash:\s*([^,\n]+)/i,
			denoise: /Denoising strength:\s*([\d.]+)/i,
			clipSkip: /Clip skip:\s*(\d+)/i,
		};

		for (const [key, regex] of Object.entries(params)) {
			const match = text.match(regex);
			if (match) {
				switch (key) {
					case 'steps':
					case 'seed':
					case 'clipSkip':
						(metadata as any)[key] = Number.parseInt(match[1], 10);
						break;
					case 'cfgScale':
					case 'denoise':
						(metadata as any)[key] = Number.parseFloat(match[1]);
						break;
					default:
						(metadata as any)[key] = match[1].trim();
				}
			}
		}

		return metadata;
	} catch (error) {
		logger.warn('⚠️ PNG PARSER: Error parseando parámetros A1111', {
			error: error instanceof Error ? error.message : 'Error desconocido',
		});
		return {};
	}
}

/**
 * Parsea workflow de ComfyUI
 */
function parseComfyUIWorkflow(text: string): Partial<AIGenerationParameters> & Record<string, unknown> {
	try {
		const metadata: Partial<AIGenerationParameters> & Record<string, unknown> = {};

		// Intentar parsear como JSON
		let workflow: any;
		try {
			workflow = JSON.parse(text);
		} catch {
			// Si no es JSON válido, intentar extraer información como texto
			return parseGenericAIData(text);
		}

		// Extraer información del workflow
		if (workflow && typeof workflow === 'object') {
			// Buscar nodos de prompt
			for (const [nodeId, node] of Object.entries(workflow)) {
				if (typeof node === 'object' && node !== null) {
					const nodeObj = node as any;

					// CLIPTextEncode nodes para prompts
					if (nodeObj.class_type === 'CLIPTextEncode' && nodeObj.inputs?.text) {
						if (!metadata.prompt) {
							metadata.prompt = nodeObj.inputs.text;
						} else if (!metadata.negative_prompt && nodeObj.inputs.text.toLowerCase().includes('negative')) {
							metadata.negative_prompt = nodeObj.inputs.text;
						}
					}

					// KSampler nodes para parámetros
					if (nodeObj.class_type === 'KSampler' && nodeObj.inputs) {
						if (nodeObj.inputs.steps) {
							metadata.steps = Number.parseInt(nodeObj.inputs.steps, 10);
						}
						if (nodeObj.inputs.cfg) {
							metadata.cfg_scale = Number.parseFloat(nodeObj.inputs.cfg);
						}
						if (nodeObj.inputs.sampler_name) {
							metadata.sampler = nodeObj.inputs.sampler_name;
						}
						if (nodeObj.inputs.scheduler) {
							metadata.scheduler = nodeObj.inputs.scheduler;
						}
						if (nodeObj.inputs.seed) {
							metadata.seed = Number.parseInt(nodeObj.inputs.seed, 10);
						}
						if (nodeObj.inputs.denoise) {
							metadata.denoise = Number.parseFloat(nodeObj.inputs.denoise);
						}
					}

					// CheckpointLoaderSimple para modelo
					if (nodeObj.class_type === 'CheckpointLoaderSimple' && nodeObj.inputs?.ckpt_name) {
						metadata.model = nodeObj.inputs.ckpt_name;
					}
				}
			}

			// Información adicional del workflow
			metadata.workflowId = Object.keys(workflow).length.toString();
			metadata.nodeCount = Object.keys(workflow).length;
		}

		return metadata;
	} catch (error) {
		logger.warn('⚠️ PNG PARSER: Error parseando workflow ComfyUI', {
			error: error instanceof Error ? error.message : 'Error desconocido',
		});
		return {};
	}
}

/**
 * Parsea parámetros de SwarmUI
 */
function parseSwarmUIParameters(text: string): Partial<AIGenerationParameters> & Record<string, unknown> {
	try {
		const metadata: Partial<AIGenerationParameters> & Record<string, unknown> = {};

		// Intentar parsear como JSON
		let params: any;
		try {
			params = JSON.parse(text);
		} catch {
			return parseGenericAIData(text);
		}

		if (params && typeof params === 'object') {
			// Mapear campos de SwarmUI
			if (params.prompt) {
				metadata.prompt = params.prompt;
			}
			if (params.negative_prompt) {
				metadata.negative_prompt = params.negative_prompt;
			}
			if (params.steps) {
				metadata.steps = Number.parseInt(params.steps, 10);
			}
			if (params.cfg_scale) {
				metadata.cfg_scale = Number.parseFloat(params.cfg_scale);
			}
			if (params.sampler) {
				metadata.sampler = params.sampler;
			}
			if (params.scheduler) {
				metadata.scheduler = params.scheduler;
			}
			if (params.seed) {
				metadata.seed = Number.parseInt(params.seed, 10);
			}
			if (params.model) {
				metadata.model = params.model;
			}
			if (params.denoise) {
				metadata.denoise = Number.parseFloat(params.denoise);
			}

			// Timing específico de SwarmUI
			if (params.generation_time) {
				metadata.generation_time = Number.parseFloat(params.generation_time);
			}
			if (params.prep_time) {
				metadata.prep_time = Number.parseFloat(params.prep_time);
			}
		}

		return metadata;
	} catch (error) {
		logger.warn('⚠️ PNG PARSER: Error parseando parámetros SwarmUI', {
			error: error instanceof Error ? error.message : 'Error desconocido',
		});
		return {};
	}
}

/**
 * Parsea descripción de Midjourney
 */
function parseMidjourneyDescription(text: string): Partial<AIGenerationParameters> & Record<string, unknown> {
	try {
		const metadata: Partial<AIGenerationParameters> & Record<string, unknown> = {};

		// El texto completo es el prompt en Midjourney
		metadata.prompt = text.trim();

		// Extraer parámetros de Midjourney usando regex
		const params = {
			version: /--v\s+([\d.]+)/i,
			aspectRatio: /--ar\s+([\d:]+)/i,
			chaos: /--chaos\s+(\d+)/i,
			stylize: /--stylize\s+(\d+)/i,
			quality: /--quality\s+([\d.]+)/i,
			seed: /--seed\s+(\d+)/i,
		};

		for (const [key, regex] of Object.entries(params)) {
			const match = text.match(regex);
			if (match) {
				switch (key) {
					case 'chaos':
					case 'stylize':
					case 'seed':
						(metadata as any)[key] = Number.parseInt(match[1], 10);
						break;
					case 'quality':
						(metadata as any)[key] = Number.parseFloat(match[1]);
						break;
					default:
						(metadata as any)[key] = match[1].trim();
				}
			}
		}

		return metadata;
	} catch (error) {
		logger.warn('⚠️ PNG PARSER: Error parseando descripción Midjourney', {
			error: error instanceof Error ? error.message : 'Error desconocido',
		});
		return {};
	}
}

/**
 * Parsea datos genéricos de IA
 */
function parseGenericAIData(text: string): Partial<AIGenerationParameters> & Record<string, unknown> {
	try {
		const metadata: Partial<AIGenerationParameters> & Record<string, unknown> = {};

		// Intentar extraer información básica
		if (text.length > 10) {
			// Si parece un prompt (texto largo sin estructura), asignarlo como prompt
			if (!(text.includes(':') || text.includes('{')) && text.length > 50) {
				metadata.prompt = text.trim();
			} else {
				// Intentar extraer campos comunes
				const lines = text.split('\n');
				for (const line of lines) {
					const colonIndex = line.indexOf(':');
					if (colonIndex > 0) {
						const key = line.substring(0, colonIndex).trim().toLowerCase();
						const value = line.substring(colonIndex + 1).trim();

						if (key.includes('prompt') && !key.includes('negative')) {
							metadata.prompt = value;
						} else if (key.includes('negative')) {
							metadata.negative_prompt = value;
						} else if (key.includes('model')) {
							metadata.model = value;
						} else if (key.includes('steps')) {
							metadata.steps = Number.parseInt(value, 10) || undefined;
						} else if (key.includes('cfg') || key.includes('scale')) {
							metadata.cfg_scale = Number.parseFloat(value) || undefined;
						} else if (key.includes('seed')) {
							metadata.seed = Number.parseInt(value, 10) || undefined;
						} else if (key.includes('sampler')) {
							metadata.sampler = value;
						}
					}
				}
			}
		}

		return metadata;
	} catch (error) {
		logger.warn('⚠️ PNG PARSER: Error parseando datos genéricos', {
			error: error instanceof Error ? error.message : 'Error desconocido',
		});
		return {};
	}
}

/**
 * Función principal para extraer metadatos completos de PNG
 */
export async function extractPngMetadata(buffer: Buffer): Promise<{
	aiMetadata: Partial<AIGenerationParameters> & Record<string, unknown>;
	detectedEngine: AIEngine | null;
	confidence: number;
	textChunks: PngTextChunk[];
}> {
	logger.info('🚀 PNG PARSER: Iniciando extracción completa de metadatos PNG');

	try {
		// Extraer text chunks
		const { textChunks } = await extractPngTextChunks(buffer);

		// Extraer metadatos de IA
		const { aiMetadata, detectedEngine, confidence } = await extractAIMetadataFromChunks(textChunks);

		logger.info('✅ PNG PARSER: Extracción completa finalizada', {
			textChunks: textChunks.length,
			detectedEngine,
			confidence,
			hasAIMetadata: Object.keys(aiMetadata).length > 0,
		});

		return {
			aiMetadata,
			detectedEngine,
			confidence,
			textChunks,
		};
	} catch (error) {
		logger.error('❌ PNG PARSER: Error en extracción completa', {
			error: error instanceof Error ? error.message : 'Error desconocido',
		});
		throw error;
	}
}
