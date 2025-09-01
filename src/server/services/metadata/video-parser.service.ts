/**
 * Servicio para extraer metadatos de archivos de video
 * Soporta MP4, MOV, AVI, WebM y otros formatos
 * Usa ffprobe para análisis técnico y búsqueda de metadatos de IA
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { serverLogger } from '@/lib/logger/server-logger';
import type { VideoMetadata } from '@/types/metadata-origin.types';

const execFileAsync = promisify(execFile);
const logger = serverLogger.withContext('VideoParserService');

// Importar ffprobe-static dinámicamente para evitar problemas de bundling
let ffprobePath: string;

async function getFfprobePath(): Promise<string> {
	if (!ffprobePath) {
		try {
			const ffprobeStatic = await import('ffprobe-static');
			const staticModule = ffprobeStatic.default;
			ffprobePath = typeof staticModule === 'string' ? staticModule : staticModule.path;
		} catch (error) {
			logger.error('Error importando ffprobe-static', { error });
			throw new Error('ffprobe-static no disponible');
		}
	}
	return ffprobePath;
}

/**
 * Extrae metadatos de un archivo de video usando ffprobe
 */
export async function extractVideoMetadata(filePath: string): Promise<VideoMetadata | null> {
	try {
		const ffprobe = await getFfprobePath();

		const { stdout } = await execFileAsync(
			ffprobe,
			['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', filePath],
			{
				timeout: 30_000, // 30 segundos timeout
			}
		);

		const ffprobeData = JSON.parse(stdout);

		return parseVideoMetadata(ffprobeData, filePath);
	} catch (error) {
		logger.warn('Error extrayendo metadatos de video', { filePath, error });
		return null;
	}
}

/**
 * Parsea los datos de ffprobe a nuestro formato VideoMetadata
 */
function parseVideoMetadata(ffprobeData: any, filePath: string): VideoMetadata {
	const format = ffprobeData.format || {};
	const streams = ffprobeData.streams || [];

	// Buscar stream de video principal
	const videoStream = streams.find((s: any) => s.codec_type === 'video');
	const audioStream = streams.find((s: any) => s.codec_type === 'audio');

	const result: VideoMetadata = {
		filename: format.filename?.split('/').pop()?.split('\\').pop() || 'unknown',
		format: format.format_name || 'unknown',
		size: Number.parseInt(format.size) || 0,

		// Información de video
		duration: Number.parseFloat(format.duration) || 0,
		bitrate: Number.parseInt(format.bit_rate) || 0,

		// Stream de video
		width: videoStream?.width || 0,
		height: videoStream?.height || 0,
		videoCodec: videoStream?.codec_name || 'unknown',
		videoProfile: videoStream?.profile,
		frameRate: parseFrameRate(videoStream?.r_frame_rate),

		// Stream de audio
		audioCodec: audioStream?.codec_name,
		audioChannels: audioStream?.channels,
		audioSampleRate: audioStream?.sample_rate,

		// Container/formato
		container: format.format_long_name,

		// Metadatos técnicos adicionales
		createdAt: format.tags?.creation_time,
		modifiedAt: format.tags?.modification_time,

		// Buscar metadatos de IA en tags
		aiMetadata: extractAIMetadataFromTags(format.tags),
	};

	// Calcular resolución estándar
	if (result.width && result.height) {
		result.resolution = `${result.width}x${result.height}`;
	}

	logger.info('✅ Metadatos de video extraídos', {
		filename: result.filename,
		format: result.format,
		duration: result.duration,
		resolution: result.resolution,
		hasAiMetadata: !!result.aiMetadata,
	});

	return result;
}

/**
 * Parsea frame rate de formato racional (ej: "30/1")
 */
function parseFrameRate(frameRateStr?: string): number | undefined {
	if (!frameRateStr) return;

	const parts = frameRateStr.split('/');
	if (parts.length !== 2) return;

	const numerator = Number.parseInt(parts[0]);
	const denominator = Number.parseInt(parts[1]);

	if (Number.isNaN(numerator) || Number.isNaN(denominator) || denominator === 0) {
		return;
	}

	return numerator / denominator;
}

/**
 * Busca metadatos de IA en tags de video
 */
function extractAIMetadataFromTags(tags: Record<string, any> = {}): Record<string, any> | undefined {
	const aiFields: Record<string, any> = {};

	// Patrones comunes de metadatos de IA en videos
	const aiPatterns = [
		'prompt',
		'negative_prompt',
		'steps',
		'cfg_scale',
		'seed',
		'sampler',
		'model',
		'workflow',
		'parameters',
		'generator',
		'engine',
		'ai_model',
		'diffusion_model',
	];

	for (const [key, value] of Object.entries(tags)) {
		const lowerKey = key.toLowerCase();

		// Buscar patrones de IA
		if (aiPatterns.some((pattern) => lowerKey.includes(pattern))) {
			aiFields[key] = value;
		}

		// Patrones específicos de herramientas de video IA
		if (
			lowerKey.includes('runway') ||
			lowerKey.includes('stable_video') ||
			lowerKey.includes('pika') ||
			lowerKey.includes('gen2') ||
			lowerKey.includes('deforum')
		) {
			aiFields[key] = value;
		}
	}

	return Object.keys(aiFields).length > 0 ? aiFields : undefined;
}

/**
 * Verifica si un archivo es de video basado en su extensión
 */
export function isVideoFile(filename: string): boolean {
	const videoExtensions = [
		'.mp4',
		'.mov',
		'.avi',
		'.mkv',
		'.webm',
		'.m4v',
		'.3gp',
		'.flv',
		'.wmv',
		'.mpg',
		'.mpeg',
		'.ts',
		'.mts',
		'.m2ts',
	];

	const ext = filename.toLowerCase().split('.').pop();
	return ext ? videoExtensions.includes(`.${ext}`) : false;
}

/**
 * Extrae thumbnail de video en tiempo específico
 */
export async function extractVideoThumbnail(filePath: string, outputPath: string, timeSeconds = 1): Promise<boolean> {
	try {
		const ffprobe = await getFfprobePath();
		// Usar ffmpeg para extraer thumbnail (si está disponible)
		// Por ahora retornamos false indicando que no se implementó
		logger.info('Extracción de thumbnail de video no implementada aún', {
			filePath,
			outputPath,
			timeSeconds,
		});
		return false;
	} catch (error) {
		logger.warn('Error extrayendo thumbnail de video', { filePath, error });
		return false;
	}
}
