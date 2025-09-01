/**
 * Servicio unificado para extracción completa de metadatos
 * Orquesta todos los parsers especializados para proporcionar un resultado integral
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
	AIEngine,
	type BaseMetadata,
	type MetadataExtractionOptions,
	type MetadataExtractionResult,
	type TechnicalMetadata,
} from '@/types/metadata-origin.types';
import { runParsers } from './engine-parsers/engine-parser-registry';
// Servicios especializados
import { extractMetadata as extractExifMetadata } from './exifr-parser.service';
import { detectOrigin, hasAIGenerationData } from './origin-detector.service';
import { extractPngTextChunks } from './png-parser.service';
import { extractCommonAIParameters } from './sd-parser.service';

const logger = serverLogger.withContext('UnifiedParserService');

/**
 * Opciones por defecto para extracción de metadatos
 */
const DEFAULT_OPTIONS: MetadataExtractionOptions = {
	extract_exif: true,
	extract_iptc: true,
	extract_xmp: true,
	extract_c2pa: true,
	extract_ai_metadata: true,
	extract_video_metadata: true,
	timeout: 30_000,
	max_file_size: 100 * 1024 * 1024, // 100MB
	debug: false,
	include_raw_data: false,
};

/**
 * Extrae todos los metadatos de un archivo (imagen o video)
 */
export async function extractAllMetadata(
	buffer: Buffer,
	filename: string,
	options: Partial<MetadataExtractionOptions> = {},
	fullPath?: string // Ruta completa para videos
): Promise<MetadataExtractionResult> {
	const startTime = Date.now();
	const opts = { ...DEFAULT_OPTIONS, ...options };
	const result: MetadataExtractionResult = {
		success: false,
		base: await extractBaseMetadata(buffer, filename),
		errors: [],
		warnings: [],
	};

	logger.info('Iniciando extracción completa de metadatos', {
		filename,
		bufferSize: buffer.length,
		options: opts,
	});

	try {
		// 1. Verificar tamaño del archivo
		if (opts.max_file_size && buffer.length > opts.max_file_size) {
			throw new Error(`Archivo demasiado grande: ${buffer.length} bytes (máximo: ${opts.max_file_size})`);
		}

		// 2. Extraer metadatos técnicos (EXIF/IPTC/XMP)
		if (opts.extract_exif || opts.extract_iptc || opts.extract_xmp) {
			logger.info('🔧 UNIFIED PARSER: Iniciando extracción de metadatos técnicos...');
			const technicalMetadata = await extractTechnicalMetadata(buffer, opts);
			logger.info('🔧 UNIFIED PARSER: Metadatos técnicos extraídos', {
				hasResult: !!technicalMetadata,
				hasExif: !!technicalMetadata?.exif,
				hasIptc: !!technicalMetadata?.iptc,
				hasXmp: !!technicalMetadata?.xmp,
			});

			if (technicalMetadata) {
				result.exif = technicalMetadata.exif as any;
				result.iptc = technicalMetadata.iptc as any;
				result.xmp = technicalMetadata.xmp as any;
				// Propagar rawTags (incluye pngTextChunks) para que createCombinedMetadata pueda integrarlos
				if ((technicalMetadata as any).rawTags) {
					(result as any).rawTags = (technicalMetadata as any).rawTags;
				}

				logger.info('🔧 UNIFIED PARSER: Asignando metadatos al resultado', {
					resultHasExif: !!result.exif,
					resultHasIptc: !!result.iptc,
					resultHasXmp: !!result.xmp,
				});

				if (opts.include_raw_data) {
					(result as any).raw_exif_tags = technicalMetadata.rawTags;
				}
			}
		}

		// 3. Crear metadata combinado para análisis de IA
		const combinedMetadata = createCombinedMetadata(result);

		// 4. Detectar origen de generación IA
		if (opts.extract_ai_metadata) {
			const originResult = await detectOrigin(combinedMetadata);
			result.origin = originResult;

			// 5. Si es contenido generado por IA, extraer metadatos específicos
			if (await hasAIGenerationData(combinedMetadata)) {
				const aiMetadata = await extractAIMetadata(combinedMetadata, originResult.engine);
				if (aiMetadata) {
					result.ai_metadata = aiMetadata;
				}
			}
		}

		// 6. C2PA (Content Credentials) si está habilitado
		if (opts.extract_c2pa) {
			try {
				const { extractC2PAData } = await import('./c2pa-parser.service');
				const c2paData = await extractC2PAData(buffer, filename);
				if (c2paData) {
					result.c2pa = c2paData as any;
				}
			} catch (error) {
				result.warnings.push(`Error C2PA: ${error}`);
			}
		}

		// 7. Video metadata si es aplicable
		if (opts.extract_video_metadata && isVideoFileExtension(filename)) {
			try {
				const { extractVideoMetadata } = await import('./mediabunny-parser.service');
				const videoPath = fullPath || filename; // Usar ruta completa si está disponible
				const videoMetadata = await extractVideoMetadata(videoPath);
				if (videoMetadata) {
					result.video_metadata = videoMetadata;
				}
			} catch (error) {
				result.warnings.push(`Error video metadata: ${error}`);
			}
		}

		result.success = true;
		result.processing_time = Date.now() - startTime;
		result.parser_used = 'unified-parser';

		logger.info('Extracción completa exitosa', {
			filename,
			processingTime: result.processing_time,
			hasAI: !!result.ai_metadata,
			engine: result.origin?.engine,
			confidence: result.origin?.confidence,
		});
	} catch (error) {
		result.errors.push(`Error general: ${error}`);
		result.processing_time = Date.now() - startTime;

		logger.error('Error en extracción de metadatos', {
			filename,
			error,
			processingTime: result.processing_time,
		});
	}

	return result;
}

/**
 * Extrae metadatos base del archivo (dimensiones, formato, etc.)
 */
async function extractBaseMetadata(buffer: Buffer, filename: string): Promise<BaseMetadata> {
	const base: BaseMetadata = {
		file: {
			size: buffer.length,
			format: getFileFormat(filename),
			mimeType: getMimeType(filename),
			filename,
		},
	};

	// Para imágenes, usar Sharp para obtener dimensiones básicas
	if (isImageFile(filename)) {
		try {
			// Importar Sharp dinámicamente
			const sharp = await import('sharp');
			const metadata = await sharp.default(buffer).metadata();

			base.dimensions = {
				width: metadata.width || 0,
				height: metadata.height || 0,
				megapixels:
					metadata.width && metadata.height
						? Number.parseFloat(((metadata.width * metadata.height) / 1_000_000).toFixed(2))
						: undefined,
				aspectRatio:
					metadata.width && metadata.height ? calculateAspectRatio(metadata.width, metadata.height) : undefined,
			};

			base.color = {
				colorType: metadata.channels ? `${metadata.channels} channels` : undefined,
				bitDepth: typeof metadata.depth === 'string' ? undefined : (metadata.depth as number),
				compression: metadata.compression as string,
				hasAlpha: metadata.hasAlpha,
			};

			if (metadata.format === 'png') {
				base.png = {
					// Sharp no expone estos detalles PNG específicos
					interlacing: false, // placeholder
				};
			}
		} catch (error) {
			logger.warn('Error extrayendo metadatos base con Sharp', { error });
		}
	}

	return base;
}

/**
 * Extrae metadatos técnicos usando ExifReader y PNG parser
 */
async function extractTechnicalMetadata(
	buffer: Buffer,
	options: MetadataExtractionOptions
): Promise<TechnicalMetadata | null> {
	try {
		logger.info('🔧 UNIFIED PARSER: extractTechnicalMetadata iniciado', {
			extract_exif: options.extract_exif,
			extract_iptc: options.extract_iptc,
			extract_xmp: options.extract_xmp,
		});

		if (!(options.extract_exif || options.extract_iptc || options.extract_xmp)) {
			logger.info('🔧 UNIFIED PARSER: No extraction options enabled - retornando null');
			return null;
		}

		// Extraer metadatos EXIF/IPTC/XMP
		logger.info('🔧 UNIFIED PARSER: Llamando extractExifMetadata...');
		const result = await extractExifMetadata(buffer);
		logger.info('🔧 UNIFIED PARSER: extractExifMetadata completado', {
			hasResult: !!result,
			resultType: typeof result,
			hasExif: result?.exif ? 'yes' : 'no',
			hasIptc: result?.iptc ? 'yes' : 'no',
			hasXmp: result?.xmp ? 'yes' : 'no',
		});

		// Extraer PNG text chunks si es un archivo PNG
		if (isPNGFile(buffer)) {
			logger.info('🔧 UNIFIED PARSER: Detectado archivo PNG, extrayendo text chunks...');
			try {
				const { textChunks } = await extractPngTextChunks(buffer);
				logger.info('🔧 UNIFIED PARSER: PNG text chunks extraídos', {
					hasMetadata: textChunks.length > 0,
					chunksCount: textChunks.length,
				});

				// Combinar metadatos PNG con los existentes
				if (textChunks.length > 0 && result) {
					// Exponer chunks como rawTags y dejar AI para pipeline específico
					result.rawTags = { ...(result.rawTags || {}), pngTextChunks: textChunks } as any;
				} else if (textChunks.length > 0 && !result) {
					return {
						rawTags: { pngTextChunks: textChunks } as any,
					} as TechnicalMetadata;
				}
			} catch (pngError) {
				logger.warn('🔧 UNIFIED PARSER: Error extrayendo PNG text chunks', { error: pngError });
			}
		}

		return result;
	} catch (error) {
		logger.error('🔧 UNIFIED PARSER: Error extrayendo metadatos técnicos', { error });
		return null;
	}
}

/**
 * Combina metadatos de diferentes fuentes para análisis
 */
function createCombinedMetadata(result: MetadataExtractionResult): Record<string, unknown> {
	const combined: Record<string, unknown> = {};

	// Agregar EXIF
	if (result.exif) {
		Object.assign(combined, result.exif);
	}

	// Agregar IPTC
	if (result.iptc) {
		Object.assign(combined, result.iptc);
		// Mapear campos IPTC comunes
		if (result.iptc.description) {
			combined.Description = result.iptc.description;
		}
		if (result.iptc.title) {
			combined.Title = result.iptc.title;
		}
		if (result.iptc.keywords) {
			combined.Keywords = result.iptc.keywords;
		}
	}

	// Agregar XMP
	if (result.xmp) {
		Object.assign(combined, result.xmp);
		// Mapear campos XMP comunes
		if (result.xmp.description) {
			combined.Description = result.xmp.description;
		}
		if (result.xmp.title) {
			combined.Title = result.xmp.title;
		}
	}

	// Buscar en campos comunes donde suelen estar los metadatos de IA
	const commonFields = ['parameters', 'prompt', 'workflow', 'Software', 'Comment'];
	for (const field of commonFields) {
		if (field in combined) {
			// Campo ya está en combined, no hace falta reasignar
		}
	}

	// Incluir PNG text chunks (parameters, workflow, etc.) si existen en rawTags
	try {
		const rawTags: any = (result as any).raw_exif_tags || (result as any).rawTags;
		const pngTextChunks = rawTags?.pngTextChunks as Array<{ keyword: string; text: string }> | undefined;
		if (pngTextChunks?.length) {
			for (const chunk of pngTextChunks) {
				const key = chunk.keyword?.toLowerCase();
				if (!(key && chunk.text)) continue;
				// Mapear keywords comunes a campos esperados por findParametersText / findWorkflowData
				if (key.includes('param')) {
					combined.parameters = chunk.text;
				} else if (key === 'comment' || key === 'description') {
					combined.Comment = chunk.text;
				} else if (key.includes('prompt')) {
					combined.prompt = chunk.text;
				} else if (key.includes('workflow')) {
					combined.workflow = chunk.text;
				}
			}
		}
	} catch (e) {
		logger.warn('No se pudieron integrar PNG text chunks en combinedMetadata', { error: e });
	}

	return combined;
}

/**
 * Extrae metadatos específicos de IA basado en el engine detectado
 */
async function extractAIMetadata(metadata: Record<string, unknown>, engine: AIEngine) {
	try {
		// Intentar parsers modulares primero
		const structured = await runParsers(metadata, engine);
		if (structured) {
			return structured; // Ya incluye legacy_flat
		}
		// Fallback genérico
		return await extractCommonAIParameters(metadata);
	} catch (error) {
		logger.warn('Error extrayendo metadatos específicos de IA (registry)', { engine, error });
		return null;
	}
}

/**
 * Busca texto de parámetros en metadatos
 */
function findParametersText(metadata: Record<string, unknown>): string | null {
	const possibleFields = [
		'parameters',
		'Parameters',
		'Comment',
		'Description',
		'UserComment',
		'Software',
		'ImageDescription',
	];

	const indicatorTokens = [
		'Steps:',
		'Sampler:',
		'CFG scale',
		'CFG Scale',
		'Seed:',
		'Model:',
		'Clip skip',
		'Scheduler:',
		'Negative prompt:',
	];

	const isParameterLike = (value: string): boolean => {
		if (value.includes('Steps:')) {
			return true;
		}
		let hits = 0;
		for (const token of indicatorTokens) {
			if (value.includes(token)) {
				hits++;
				if (hits >= 2) {
					return true;
				}
			}
		}
		return false;
	};

	for (const field of possibleFields) {
		if (!(field in metadata)) {
			continue;
		}
		const value = metadata[field];
		if (typeof value !== 'string') {
			continue;
		}
		if (isParameterLike(value)) {
			return value;
		}
	}
	return null;
}

/**
 * Busca datos de workflow en metadatos
 */
function findWorkflowData(metadata: Record<string, unknown>): string | Record<string, unknown> | null {
	const possibleFields = ['workflow', 'Workflow', 'prompt', 'Prompt', 'Comment', 'Description'];

	for (const field of possibleFields) {
		if (field in metadata) {
			const value = metadata[field];
			if (typeof value === 'string') {
				// Intentar parsear como JSON
				try {
					const parsed = JSON.parse(value);
					if (parsed && typeof parsed === 'object') {
						return parsed;
					}
				} catch {
					// Si no es JSON válido pero contiene indicadores de ComfyUI
					if (value.includes('class_type') || value.includes('ComfyUI')) {
						return value;
					}
				}
			} else if (typeof value === 'object') {
				return value as Record<string, unknown>;
			}
		}
	}

	return null;
}

/**
 * Utilidades para archivos
 */
function isImageFile(filename: string): boolean {
	const ext = filename.toLowerCase().split('.').pop() || '';
	return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'tif'].includes(ext);
}

/**
 * Detecta si un buffer es un archivo PNG por su signature
 */
function isPNGFile(buffer: Buffer): boolean {
	// PNG signature: 89 50 4E 47 0D 0A 1A 0A
	if (buffer.length < 8) {
		return false;
	}
	return (
		buffer[0] === 0x89 &&
		buffer[1] === 0x50 &&
		buffer[2] === 0x4e &&
		buffer[3] === 0x47 &&
		buffer[4] === 0x0d &&
		buffer[5] === 0x0a &&
		buffer[6] === 0x1a &&
		buffer[7] === 0x0a
	);
}

function isVideoFileExtension(filename: string): boolean {
	const videoExtensions = [
		'mp4',
		'mov',
		'avi',
		'mkv',
		'webm',
		'm4v',
		'3gp',
		'flv',
		'wmv',
		'mpg',
		'mpeg',
		'ts',
		'mts',
		'm2ts',
	];

	const ext = filename.toLowerCase().split('.').pop() || '';
	return videoExtensions.includes(ext);
}

function getFileFormat(filename: string): string {
	return filename.toLowerCase().split('.').pop() || 'unknown';
}

function getMimeType(filename: string): string {
	const ext = getFileFormat(filename);
	const mimeTypes: Record<string, string> = {
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		webp: 'image/webp',
		gif: 'image/gif',
		bmp: 'image/bmp',
		tiff: 'image/tiff',
		mp4: 'video/mp4',
		mov: 'video/quicktime',
		avi: 'video/x-msvideo',
		webm: 'video/webm',
	};

	return mimeTypes[ext] || 'application/octet-stream';
}

function calculateAspectRatio(width: number, height: number): string {
	const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
	const divisor = gcd(width, height);
	return `${width / divisor}:${height / divisor}`;
}

/**
 * Versión simplificada para casos donde solo se necesita detección rápida
 */
export async function quickOriginDetection(buffer: Buffer): Promise<{ engine: AIEngine; confidence: number }> {
	try {
		const technicalMetadata = await extractExifMetadata(buffer);
		if (!technicalMetadata) {
			return { engine: AIEngine.UNKNOWN, confidence: 0 };
		}

		const combined = {
			...technicalMetadata.exif,
			...technicalMetadata.iptc,
			...technicalMetadata.xmp,
		};

		const result = await detectOrigin(combined);
		return { engine: result.engine, confidence: result.confidence };
	} catch (error) {
		logger.warn('Error en detección rápida', { error });
		return { engine: AIEngine.UNKNOWN, confidence: 0 };
	}
}
