/**
 * @file Funciones auxiliares para el manejo de videos
 * @module utils/video/helpers
 */

import { spawn } from 'node:child_process';
import sharp from 'sharp';
import { z } from 'zod';
import { formatBytes } from '@/lib/utils/format.utils';
import { type VideoBase } from '@/types/entities/video';
import { VideoFormat } from '@/types/entities/video/enums';
import { VideoMetadataSchema } from '@/types/entities/video/schema';

type VideoMetadata = z.infer<typeof VideoMetadataSchema>;

/**
 * Formatea la duración de un video en segundos a formato legible
 * @param durationSeconds Duración en segundos
 * @returns Duración formateada como HH:MM:SS o MM:SS
 */
export function formatVideoDuration(durationSeconds?: number): string {
	if (!durationSeconds) {
		return '00:00';
	}

	const hours = Math.floor(durationSeconds / 3600);
	const minutes = Math.floor((durationSeconds % 3600) / 60);
	const seconds = Math.floor(durationSeconds % 60);

	if (hours > 0) {
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Genera una URL para la miniatura de un video
 * @param video Objeto de video o ID
 * @param width Ancho opcional de la miniatura
 * @param height Alto opcional de la miniatura
 * @param timestamp Tiempo en segundos para extraer el frame (opcional)
 * @returns URL para la miniatura
 */
export function generateVideoThumbnailUrl(
	video: VideoBase | string,
	width?: number,
	height?: number,
	timestamp?: number
): string {
	const videoId = typeof video === 'string' ? video : video.id;
	const url = `/api/videos/${videoId}/thumbnail`;

	// Añadir parámetros
	const params = new URLSearchParams();
	if (width) {
		params.append('width', width.toString());
	}
	if (height) {
		params.append('height', height.toString());
	}
	if (timestamp !== undefined) {
		params.append('timestamp', timestamp.toString());
	}

	const queryString = params.toString();
	return queryString ? `${url}?${queryString}` : url;
}

/**
 * Formatea el tamaño de un video
 * @param metadata Metadatos del video
 * @returns Tamaño formateado
 */
export function formatVideoSize(metadata?: VideoMetadata): string {
	if (!metadata || metadata.size === undefined) {
		return 'Desconocido';
	}
	return formatBytes(metadata.size);
}

/**
 * Formatea las dimensiones de un video
 * @param width Ancho del video
 * @param height Alto del video
 * @returns Dimensiones formateadas
 */
export function formatVideoDimensions(width?: number, height?: number): string {
	if (!(width && height)) {
		return 'Desconocido';
	}
	return `${width} × ${height}`;
}

/**
 * Obtiene un string descriptivo para el formato de video
 * @param format Formato del video
 * @returns Descripción en español
 */
export function getVideoFormatDescription(format?: VideoFormat): string {
	if (!format) {
		return 'Desconocido';
	}

	switch (format) {
		case VideoFormat.MP4:
			return 'MP4 (H.264)';
		case VideoFormat.MOV:
			return 'QuickTime (MOV)';
		case VideoFormat.AVI:
			return 'AVI';
		case VideoFormat.WMV:
			return 'Windows Media';
		case VideoFormat.MKV:
			return 'Matroska';
		case VideoFormat.WEBM:
			return 'WebM';
		case VideoFormat.FLV:
			return 'Flash Video';
		default:
			return format ? (format as string).toUpperCase() : 'Desconocido';
	}
}

/**
 * Calcula el bitrate aproximado a partir del tamaño y duración
 * @param size Tamaño en bytes
 * @param durationSeconds Duración en segundos
 * @returns Bitrate formateado o undefined
 */
export function calculateBitrate(size?: number, durationSeconds?: number): string | undefined {
	if (!(size && durationSeconds)) {
		return;
	}

	// Bitrate en kilobits por segundo (kbps)
	const bitrateKbps = (size * 8) / (durationSeconds * 1000);

	if (bitrateKbps >= 1000) {
		return `${(bitrateKbps / 1000).toFixed(2)} Mbps`;
	}

	return `${Math.round(bitrateKbps)} kbps`;
}

/**
 * Genera un thumbnail animado de un video con 12 frames en formato WebP
 * @param videoPath Ruta del archivo de video
 * @param options Opciones de generación
 * @returns Buffer con el WebP animado
 */
export async function generateAnimatedVideoThumbnail(
	videoPath: string,
	options: {
		time?: number;
		quality?: string;
		frames?: number;
		duration?: number;
	} = {}
): Promise<Buffer | null> {
	const { time = 5, quality = 'medium', frames = 12, duration = 2 } = options;

	try {
		// 0. Validar que el archivo sea un video válido y obtener metadatos clave
		const streamInfo = await probeVideoStream(videoPath);
		if (!streamInfo) {
			console.warn(`Archivo no es un video válido: ${videoPath}`);
			return null;
		}

		// Evitar timestamps fuera de rango o exactamente 0 que a veces falla con ciertos contenedores
		const safeStart = (() => {
			const maxStart = Math.max(0, (streamInfo.duration || 0) - Math.max(duration, 0.1));
			const requested = Number.isFinite(time) ? Math.max(0, time) : 0;
			// Evitar exactamente 0 (algunos vídeos con time base negativo pueden fallar). Usar 0.05s
			const clamped = Math.min(requested, maxStart);
			return clamped === 0 ? 0.05 : clamped;
		})();

		// 1. Extraer frames individuales usando FFmpeg (secuencial para evitar saturación y errores en Windows)
		const frameInterval = duration / frames;
		const frameBuffers: Buffer[] = [];
		for (let i = 0; i < frames; i++) {
			// Evitar pedir un frame fuera del vídeo
			const timestamp = Math.min(safeStart + i * frameInterval, (streamInfo.duration || safeStart) - 0.001);
			try {
				const frame = await extractSingleFrame(videoPath, timestamp);
				if (frame?.length) frameBuffers.push(frame);
			} catch (e) {
				// Reintento ligero moviendo 0.1s hacia atrás si falla
				try {
					const retryTs = Math.max(0.05, timestamp - 0.1);
					const frame = await extractSingleFrame(videoPath, retryTs);
					if (frame?.length) {
						frameBuffers.push(frame);
					}
				} catch {}
			}
		}

		// 2. Crear WebP animado con Sharp
		if (frameBuffers.length === 0) {
			return null;
		}

		// Redimensionar y optimizar frames
		const resizedFrames = await Promise.all(
			frameBuffers.map(async (buffer) => {
				const resized = await sharp(buffer)
					.resize(320, 240, { fit: 'cover', position: 'center' })
					.webp({ quality: quality === 'high' ? 90 : quality === 'low' ? 60 : 75 })
					.toBuffer();
				return resized;
			})
		);

		// 3. Combinar frames en animación
		const animatedWebp = await sharp(resizedFrames[0], { animated: true })
			.webp({
				quality: quality === 'high' ? 90 : quality === 'low' ? 60 : 75,
				effort: 4,
				loop: 0,
				delay: Math.max(10, Math.round(1000 / (frames / duration))),
			})
			.toBuffer();

		return animatedWebp;
	} catch (error) {
		console.error('Error generando thumbnail animado:', error);
		return null;
	}
}

/**
 * Valida si un archivo es un video válido usando FFprobe
 * @param videoPath Ruta del video
 * @returns true si es un video válido
 */
async function probeVideoStream(
	videoPath: string
): Promise<{ width: number; height: number; duration: number } | null> {
	return new Promise((resolve) => {
		const args = [
			'-v',
			'error',
			'-select_streams',
			'v:0',
			'-show_entries',
			'stream=codec_type,duration,width,height',
			'-print_format',
			'json',
			videoPath,
		];

		const proc = spawn('ffprobe', args, { stdio: ['ignore', 'pipe', 'pipe'] });

		let output = '';
		let stderrOut = '';

		proc.stdout?.on('data', (chunk) => {
			output += chunk.toString();
		});

		proc.stderr?.on('data', (chunk) => {
			stderrOut += chunk.toString();
		});

		proc.on('close', (_code) => {
			try {
				const metadata = JSON.parse(output);
				if (!metadata.streams || metadata.streams.length === 0) {
					resolve(null);
					return;
				}
				const videoStream = metadata.streams[0];
				if (videoStream.codec_type !== 'video') {
					resolve(null);
					return;
				}
				const width = Number(videoStream.width || 0);
				const height = Number(videoStream.height || 0);
				const duration = Number.parseFloat(videoStream.duration || '0');
				if (width > 0 && height > 0 && duration >= 0) {
					resolve({ width, height, duration });
				} else {
					resolve(null);
				}
			} catch (_e) {
				// Para depuración
				if (stderrOut) {
					console.warn('ffprobe stderr:', stderrOut);
				}
				resolve(null);
			}
		});

		proc.on('error', () => resolve(null));
	});
}

/**
 * Extrae un frame único de un video en un timestamp específico
 * @param videoPath Ruta del video
 * @param timestamp Tiempo en segundos
 * @returns Buffer del frame como JPEG
 */
async function extractSingleFrame(videoPath: string, timestamp: number): Promise<Buffer> {
	const TIMEOUT_MS = 5000;
	// Estrategia con reintento: primero -ss antes de -i (rápido), si falla reintentar con -ss después de -i (más compatible)
	const runOnce = (placeSsAfterInput: boolean) =>
		new Promise<Buffer>((resolve, reject) => {
			const commonArgs = [
				'-hide_banner',
				'-loglevel',
				'error',
				'-nostdin',
				...(placeSsAfterInput ? [] : ['-ss', String(Math.max(0.001, timestamp))]),
				'-i',
				videoPath,
				...(placeSsAfterInput ? ['-ss', String(Math.max(0.001, timestamp))] : []),
				'-an',
				'-frames:v',
				'1',
				'-vf',
				'scale=320:240:force_original_aspect_ratio=increase,crop=320:240',
				'-q:v',
				'3',
				'-f',
				'mjpeg',
				'pipe:1',
			];

			const proc = spawn('ffmpeg', commonArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
			const chunks: Buffer[] = [];
			let stderrOut = '';
			const timer = setTimeout(() => {
				try {
					proc.kill('SIGKILL');
				} catch {}
			}, TIMEOUT_MS);

			proc.stdout?.on('data', (chunk) => chunks.push(chunk as Buffer));
			proc.stderr?.on('data', (chunk) => {
				stderrOut += chunk.toString();
			});

			proc.on('close', (code) => {
				clearTimeout(timer);
				if (code === 0 && chunks.length > 0) {
					resolve(Buffer.concat(chunks));
				} else {
					reject(new Error(`FFmpeg failed with code ${code}${stderrOut ? `: ${stderrOut.trim()}` : ''}`));
				}
			});

			proc.on('error', (error) => {
				clearTimeout(timer);
				reject(error);
			});
		});

	try {
		return await runOnce(false);
	} catch (_e) {
		// Reintento con -ss después de -i
		return await runOnce(true);
	}
}

/**
 * Determina si un video es de alta definición
 * @param height Alto del video en píxeles
 * @returns true si es HD o superior
 */
export function isHDVideo(height?: number): boolean {
	if (!height) {
		return false;
	}
	return height >= 720;
}

/**
 * Obtiene la calidad del video en texto
 * @param height Alto del video en píxeles
 * @returns Etiqueta de calidad
 */
export function getVideoQualityLabel(height?: number): string {
	if (!height) {
		return 'Desconocido';
	}

	if (height >= 2160) {
		return '4K UHD';
	}
	if (height >= 1440) {
		return '2K QHD';
	}
	if (height >= 1080) {
		return 'Full HD';
	}
	if (height >= 720) {
		return 'HD';
	}
	if (height >= 480) {
		return 'SD';
	}
	return 'Baja resolución';
}

/**
 * Extrae palabras clave de los metadatos del video para sugerir etiquetas
 * @param metadata Metadatos del video
 * @returns Array de etiquetas sugeridas
 */
export function extractVideoTagSuggestions(metadata?: VideoMetadata): string[] {
	if (!metadata) {
		return [];
	}

	const suggestions: string[] = [];

	// Sugerir en base a la calidad
	if (metadata.height) {
		suggestions.push(getVideoQualityLabel(metadata.height));
	}

	// Sugerir en base a la duración
	if (metadata.duration) {
		if (metadata.duration < 60) {
			suggestions.push('Clip corto');
		} else if (metadata.duration < 600) {
			suggestions.push('Video corto');
		} else if (metadata.duration > 1800) {
			suggestions.push('Video largo');
		}
	}

	// Añadir formato como sugerencia
	if (metadata.format) {
		suggestions.push(metadata.format.toUpperCase());
	}

	return suggestions;
}

/**
 * Comprueba si un video tiene metadatos completos
 * @param video Objeto de video
 * @returns true si tiene metadatos completos
 */
export function hasCompleteMetadata(video: VideoBase): boolean {
	if (!video.metadata) {
		return false;
	}

	const metadata: VideoMetadata = typeof video.metadata === 'string' ? JSON.parse(video.metadata) : video.metadata;

	const { width, height, duration, format, size } = metadata;
	return !!(width && height && duration && format && size);
}

/**
 * Genera URL para streaming de video con diferentes resoluciones
 * @param video Objeto de video o ID
 * @param quality Calidad deseada (auto, high, medium, low)
 * @returns URL para streaming
 */
export function generateVideoStreamUrl(
	video: VideoBase | string,
	quality: 'auto' | 'high' | 'medium' | 'low' = 'auto'
): string {
	const videoId = typeof video === 'string' ? video : video.id;
	let url = `/api/videos/${videoId}/stream`;

	if (quality !== 'auto') {
		url += `?quality=${quality}`;
	}

	return url;
}

/**
 * Obtiene la URL de un video para descargar
 * @param video Objeto de video o ID
 * @param filename Nombre opcional para el archivo
 * @returns URL para descarga
 */
export function generateVideoDownloadUrl(video: VideoBase | string, filename?: string): string {
	const videoId = typeof video === 'string' ? video : video.id;
	let url = `/api/videos/${videoId}/download`;

	if (filename) {
		url += `?filename=${encodeURIComponent(filename)}`;
	}

	return url;
}

/**
 * Obtiene un objeto con los valores predeterminados para la configuración visual de un video
 * @returns Configuración visual con valores predeterminados
 */
export function getDefaultVideoVisualConfig(): Omit<Record<string, any>, 'id' | 'videoId'> {
	return {
		enable3DEffect: true,
		designSystem: 'default_design_system',
		enableHolographicEffect: true,
		enableGlowEffect: true,
		enableAnimatedBorder: true,
		enableLightHalo: true,
		layerSystem: '{"version":"1.0","layers":[]}',
		effects: '{"enabled":true,"list":[]}',
		performance: '{"mode":"balanced","cache":true,"preload":true}',
		states: '{"hover":true,"active":true,"focus":true}',
	};
}

/**
 * Verifica si hay cambios significativos entre dos configuraciones visuales
 * @param configA Primera configuración
 * @param configB Segunda configuración
 * @returns true si hay diferencias importantes
 */
export function hasVisualConfigChanged(
	configA?: Partial<Record<string, any>>,
	configB?: Partial<Record<string, any>>
): boolean {
	if (!(configA && configB)) {
		return true;
	}

	const keysToCompare = [
		'enable3DEffect',
		'enableHolographicEffect',
		'enableGlowEffect',
		'enableAnimatedBorder',
		'enableLightHalo',
		'designSystem',
		'layerSystem',
		'effects',
		'performance',
		'states',
	];

	for (const key of keysToCompare) {
		// Comparación especial para campos JSON almacenados como string
		if (['layerSystem', 'effects', 'performance', 'states'].includes(key)) {
			// Si alguno está definido como objeto y el otro como string, se consideran diferentes
			const typeA = typeof configA[key];
			const typeB = typeof configB[key];

			if (typeA !== typeB) {
				return true;
			}

			// Si ambos son string, comparar como JSON
			if (typeA === 'string' && typeB === 'string') {
				try {
					const objA = JSON.parse(configA[key] as string);
					const objB = JSON.parse(configB[key] as string);
					// Comparación simple de estructuras JSON
					if (JSON.stringify(objA) !== JSON.stringify(objB)) {
						return true;
					}
				} catch (_e) {
					// Si falla el parse, comparar como strings
					if (configA[key] !== configB[key]) {
						return true;
					}
				}
			}
			// Si son objetos, comparar directamente
			else if (configA[key] !== configB[key]) {
				return true;
			}
		}
		// Para campos simples, comparación directa
		else if (configA[key] !== configB[key]) {
			return true;
		}
	}

	return false;
}
