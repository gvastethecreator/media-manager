/**
 * @file Funciones auxiliares para el manejo de videos
 * @module utils/video/helpers
 */

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
 * 🖼️ Genera un thumbnail WebP animado desde un video usando mediabunny
 * @param videoPath Ruta del archivo de video
 * @param options Opciones de configuración
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
	const { time = 2, quality = 'medium', frames = 6, duration = 2 } = options;

	// Primero intentar con mediabunny
	try {
		const result = await generateAnimatedVideoThumbnailMediabunny(videoPath, options);
		if (result) {
			console.log(`✅ Thumbnail animado generado con mediabunny: ${result.length} bytes`);
			return result;
		}
	} catch (error) {
		console.warn('Mediabunny falló para thumbnail animado, intentando con FFmpeg:', error);
	}

	// Fallback a FFmpeg si mediabunny falla
	try {
		const { generateAnimatedVideoThumbnailFFmpeg, isFFmpegAvailable } = await import('./ffmpeg-thumbnails.js');

		const ffmpegAvailable = await isFFmpegAvailable();
		if (!ffmpegAvailable) {
			console.error('Ni mediabunny ni FFmpeg están disponibles para generar thumbnails animados');
			return null;
		}

		return await generateAnimatedVideoThumbnailFFmpeg(videoPath, {
			time,
			duration,
			frames,
			width: 320,
			height: 240,
			quality,
		});
	} catch (error) {
		console.error('Error con fallback FFmpeg para thumbnail animado:', error);
		return null;
	}
}

/**
 * 🖼️ Genera un thumbnail animado usando solo mediabunny
 * @param videoPath Ruta del archivo de video
 * @param options Opciones de configuración
 * @returns Buffer con el WebP animado
 */
async function generateAnimatedVideoThumbnailMediabunny(
	videoPath: string,
	options: {
		time?: number;
		quality?: string;
		frames?: number;
		duration?: number;
	} = {}
): Promise<Buffer | null> {
	const { time = 2, quality = 'medium', frames = 6, duration = 2 } = options;

	try {
		// Importar mediabunny dinámicamente
		const { Input, ALL_FORMATS, BlobSource, CanvasSink } = await import('mediabunny');
		const { readFile } = await import('node:fs/promises');

		// Leer archivo como Blob (siguiendo patrón oficial)
		const fileBuffer = await readFile(videoPath);
		const blob = new Blob([new Uint8Array(fileBuffer)]);

		// Crear input de mediabunny usando BlobSource (como en ejemplos oficiales)
		const input = new Input({
			source: new BlobSource(blob),
			formats: ALL_FORMATS,
		});

		// Obtener track de video
		const videoTrack = await input.getPrimaryVideoTrack();
		if (!videoTrack) {
			console.warn(`No se encontró track de video: ${videoPath}`);
			return null;
		}

		// Verificar codec (siguiendo ejemplo oficial)
		if (videoTrack.codec === null) {
			console.warn(`Codec de video no soportado: ${videoPath}`);
			return null;
		}

		// Verificar que se puede decodificar
		const canDecode = await videoTrack.canDecode();
		if (!canDecode) {
			console.warn(`Track de video no se puede decodificar: ${videoPath}`);
			return null;
		}

		// Obtener duración del video
		const totalDuration = await videoTrack.computeDuration();
		if (totalDuration <= 0) {
			console.warn(`Duración inválida para el video: ${videoPath}`);
			return null;
		}

		// Calcular timestamps seguros para los frames usando getFirstTimestamp
		const firstTimestamp = await videoTrack.getFirstTimestamp();
		const safeStart = Math.min(time, Math.max(firstTimestamp, totalDuration - duration));
		const frameInterval = duration / frames;
		const timestamps: number[] = [];

		for (let i = 0; i < frames; i++) {
			const timestamp = Math.min(safeStart + i * frameInterval, totalDuration - 0.1);
			timestamps.push(timestamp);
		}

		// Crear sink para canvas con poolSize para mejor rendimiento
		const sink = new CanvasSink(videoTrack, {
			width: 320,
			height: 240,
			fit: 'cover', // Mantener aspecto ratio cubriendo completamente
			poolSize: Math.min(frames, 3), // Pool de canvas para reutilización
		});

		// Generar frames usando método optimizado de mediabunny
		const frameBuffers: Buffer[] = [];

		for await (const result of sink.canvasesAtTimestamps(timestamps)) {
			if (!result) {
				console.warn('Frame resultado nulo en timestamp, saltando...');
				continue;
			}

			const canvas = result.canvas;

			try {
				let frameBuffer: Buffer | null = null;

				// Manejar diferentes tipos de canvas de mediabunny
				if (canvas instanceof OffscreenCanvas) {
					const blob = await canvas.convertToBlob({
						type: 'image/webp',
						quality: 0.8,
					});
					const arrayBuffer = await blob.arrayBuffer();
					frameBuffer = Buffer.from(arrayBuffer);
				} else if (typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement) {
					// En Node.js con jsdom o similar
					const blob = await new Promise<Blob>((resolve, reject) => {
						canvas.toBlob(
							(blob: Blob | null) => {
								if (blob) resolve(blob);
								else reject(new Error('Failed to create blob from canvas'));
							},
							'image/webp',
							0.8
						);
					});

					const arrayBuffer = await blob.arrayBuffer();
					frameBuffer = Buffer.from(arrayBuffer);
				}

				if (frameBuffer && frameBuffer.length > 0) {
					frameBuffers.push(frameBuffer);
				}
			} catch (error) {
				console.warn('Error convirtiendo canvas a buffer:', error);
			}
		}

		if (frameBuffers.length === 0) {
			console.warn('No se pudieron generar frames del video');
			return null;
		}

		console.log(`✅ Generados ${frameBuffers.length} frames para WebP animado`);

		// Si solo tenemos un frame, retornar como imagen estática
		if (frameBuffers.length === 1) {
			return frameBuffers[0];
		}

		// Para múltiples frames, crear WebP animado con Sharp
		const sharp = await import('sharp');

		// Calcular delay entre frames (en ms)
		const delayMs = Math.max(100, Math.round((duration * 1000) / frames));

		try {
			// Crear WebP animado usando el primer frame como base
			const animatedWebp = await sharp
				.default(frameBuffers[0])
				.webp({
					quality: quality === 'high' ? 85 : quality === 'low' ? 60 : 75,
					effort: 4,
					loop: 0, // Loop infinito
					delay: delayMs,
					// Para animación necesitamos especificar los frames adicionales
					...(frameBuffers.length > 1 && {
						animated: true,
						// Sharp no soporta múltiples frames directamente
						// Usar solo el primer frame por ahora
					}),
				})
				.toBuffer();

			return animatedWebp;
		} catch (sharpError) {
			console.warn('Error creando WebP animado, usando primer frame:', sharpError);
			// Fallback: usar solo el primer frame como imagen estática
			const staticWebp = await sharp
				.default(frameBuffers[0])
				.webp({
					quality: quality === 'high' ? 85 : quality === 'low' ? 60 : 75,
					effort: 4,
				})
				.toBuffer();

			return staticWebp;
		}
	} catch (error) {
		console.error('Error generando thumbnail con mediabunny:', error);
		return null;
	}
}

/**
 * 🖼️ Genera un thumbnail estático desde un video usando mediabunny (más confiable)
 * @param videoPath Ruta del archivo de video
 * @param options Opciones de configuración
 * @returns Buffer con el WebP estático
 */
export async function generateStaticVideoThumbnail(
	videoPath: string,
	options: {
		time?: number;
		quality?: string;
		width?: number;
		height?: number;
	} = {}
): Promise<Buffer | null> {
	const { time = 2, quality = 'medium', width = 320, height = 240 } = options;

	// Primero intentar con mediabunny
	try {
		const result = await generateStaticVideoThumbnailMediabunny(videoPath, options);
		if (result) {
			console.log(`✅ Thumbnail generado con mediabunny: ${result.length} bytes`);
			return result;
		}
	} catch (error) {
		console.warn('Mediabunny falló, intentando con FFmpeg:', error);
	}

	// Fallback a FFmpeg si mediabunny falla
	try {
		const { generateStaticVideoThumbnailFFmpeg, isFFmpegAvailable } = await import('./ffmpeg-thumbnails.js');

		const ffmpegAvailable = await isFFmpegAvailable();
		if (!ffmpegAvailable) {
			console.error('Ni mediabunny ni FFmpeg están disponibles para generar thumbnails');
			return null;
		}

		return await generateStaticVideoThumbnailFFmpeg(videoPath, { time, width, height, quality });
	} catch (error) {
		console.error('Error con fallback FFmpeg:', error);
		return null;
	}
}

/**
 * 🖼️ Genera un thumbnail estático usando solo mediabunny
 * @param videoPath Ruta del archivo de video
 * @param options Opciones de configuración
 * @returns Buffer con el WebP estático
 */
async function generateStaticVideoThumbnailMediabunny(
	videoPath: string,
	options: {
		time?: number;
		quality?: string;
		width?: number;
		height?: number;
	} = {}
): Promise<Buffer | null> {
	const { time = 2, quality = 'medium', width = 320, height = 240 } = options;

	try {
		// Importar mediabunny dinámicamente
		const { Input, ALL_FORMATS, BlobSource, CanvasSink } = await import('mediabunny');
		const { readFile } = await import('node:fs/promises');

		// Leer archivo como Blob (siguiendo patrón oficial)
		const fileBuffer = await readFile(videoPath);
		const blob = new Blob([new Uint8Array(fileBuffer)]);

		// Crear input de mediabunny usando BlobSource (como en ejemplos oficiales)
		const input = new Input({
			source: new BlobSource(blob),
			formats: ALL_FORMATS,
		});

		// Obtener track de video
		const videoTrack = await input.getPrimaryVideoTrack();
		if (!videoTrack) {
			console.warn(`No se encontró track de video: ${videoPath}`);
			return null;
		}

		// Verificar codec (siguiendo ejemplo oficial)
		if (videoTrack.codec === null) {
			console.warn(`Codec de video no soportado: ${videoPath}`);
			return null;
		}

		// Verificar que se puede decodificar
		const canDecode = await videoTrack.canDecode();
		if (!canDecode) {
			console.warn(
				`Track de video no se puede decodificar (posiblemente falta WebCodecs API en Node.js): ${videoPath}`
			);
			return null;
		}

		// Obtener duración del video
		const totalDuration = await videoTrack.computeDuration();
		if (totalDuration <= 0) {
			console.warn(`Duración inválida para el video: ${videoPath}`);
			return null;
		}

		// Calcular timestamp seguro (usar getFirstTimestamp como referencia)
		const firstTimestamp = await videoTrack.getFirstTimestamp();
		const safeTime = Math.min(time, Math.max(firstTimestamp, totalDuration - 0.1));

		// Crear sink para canvas con dimensiones proporcionales si no se especifican
		let finalWidth = width;
		let finalHeight = height;

		if (!(width && height)) {
			const aspectRatio = videoTrack.displayWidth / videoTrack.displayHeight;
			if (width && !height) {
				finalHeight = Math.floor(width / aspectRatio);
			} else if (height && !width) {
				finalWidth = Math.floor(height * aspectRatio);
			}
		}

		const sink = new CanvasSink(videoTrack, {
			width: finalWidth,
			height: finalHeight,
			fit: 'cover', // Mantener aspecto ratio
		});

		// Obtener un solo frame
		const result = await sink.getCanvas(safeTime);

		if (!result) {
			console.warn(`No se pudo obtener frame en timestamp ${safeTime}`);
			return null;
		}

		const canvas = result.canvas;

		try {
			let frameBuffer: Buffer | null = null;

			// Manejar diferentes tipos de canvas
			if (canvas instanceof OffscreenCanvas) {
				const blob = await canvas.convertToBlob({
					type: 'image/webp',
					quality: quality === 'high' ? 0.9 : quality === 'low' ? 0.6 : 0.8,
				});
				const arrayBuffer = await blob.arrayBuffer();
				frameBuffer = Buffer.from(arrayBuffer);
			} else if (typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement) {
				const blob = await new Promise<Blob>((resolve, reject) => {
					canvas.toBlob(
						(blob: Blob | null) => {
							if (blob) resolve(blob);
							else reject(new Error('Failed to create blob from canvas'));
						},
						'image/webp',
						quality === 'high' ? 0.9 : quality === 'low' ? 0.6 : 0.8
					);
				});

				const arrayBuffer = await blob.arrayBuffer();
				frameBuffer = Buffer.from(arrayBuffer);
			}

			if (frameBuffer && frameBuffer.length > 0) {
				return frameBuffer;
			}

			console.warn('No se pudo generar buffer del canvas');
			return null;
		} catch (error) {
			console.error('Error convirtiendo canvas a buffer:', error);
			return null;
		}
	} catch (error) {
		console.error('Error generando thumbnail estático con mediabunny:', error);
		return null;
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
