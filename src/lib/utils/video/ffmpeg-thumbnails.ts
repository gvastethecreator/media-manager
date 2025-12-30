/**
 * 🖼️ Genera thumbnails de video usando FFmpeg como alternativa más confiable a mediabunny
 * @module utils/video/ffmpeg-thumbnails
 */

import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Genera un thumbnail estático usando FFmpeg
 * @param videoPath Ruta del archivo de video
 * @param options Opciones de configuración
 * @returns Buffer con la imagen WebP
 */
export async function generateStaticVideoThumbnailFFmpeg(
	videoPath: string,
	options: {
		time?: number;
		width?: number;
		height?: number;
		quality?: string;
	} = {}
): Promise<Buffer | null> {
	const { time = 2, width = 320, height = 240, quality = 'medium' } = options;

	// Protección contra rutas corruptas
	if (videoPath.length > 1024) {
		console.error(`Ruta de video demasiado larga (${videoPath.length} chars). Posible data corrupta.`);
		return null;
	}

	if (!existsSync(videoPath)) {
		console.warn(`Archivo de video no existe: ${videoPath}`);
		return null;
	}

	// Crear archivo temporal para el thumbnail
	const tempOutputPath = join(tmpdir(), `thumbnail-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`);

	try {
		// Construir comando FFmpeg
		const qualityValue = quality === 'high' ? 90 : quality === 'low' ? 50 : 75;

		const ffmpegCmd = [
			'ffmpeg',
			'-y', // Sobrescribir archivo de salida
			'-i',
			`"${videoPath}"`, // Archivo de entrada
			'-ss',
			time.toString(), // Timestamp para extraer
			'-vframes',
			'1', // Solo un frame
			'-vf',
			`scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`, // Redimensionar y recortar
			'-q:v',
			qualityValue.toString(), // Calidad
			'-f',
			'webp', // Formato WebP
			`"${tempOutputPath}"`, // Archivo de salida
		].join(' ');

		console.log(`🎬 Ejecutando: ${ffmpegCmd}`);

		// Ejecutar FFmpeg
		const { stdout, stderr } = await execAsync(ffmpegCmd);

		if (stderr?.includes('error')) {
			console.warn(`FFmpeg warning/error: ${stderr}`);
		}

		// Verificar que se generó el archivo
		if (!existsSync(tempOutputPath)) {
			console.warn(`No se generó el archivo thumbnail: ${tempOutputPath}`);
			return null;
		}

		// Leer el archivo generado
		const thumbnailBuffer = await readFile(tempOutputPath);

		// Limpiar archivo temporal
		await unlink(tempOutputPath).catch(() => {
			// Ignorar errores de limpieza
		});

		console.log(`✅ Thumbnail generado con FFmpeg: ${thumbnailBuffer.length} bytes`);
		return thumbnailBuffer;
	} catch (error) {
		console.error('Error generando thumbnail con FFmpeg:', error);

		// Limpiar archivo temporal en caso de error
		try {
			if (existsSync(tempOutputPath)) {
				await unlink(tempOutputPath);
			}
		} catch {
			// Ignorar errores de limpieza
		}

		return null;
	}
}

/**
 * Genera un thumbnail animado (GIF/WebP) usando FFmpeg
 * @param videoPath Ruta del archivo de video
 * @param options Opciones de configuración
 * @returns Buffer con la imagen animada
 */
export async function generateAnimatedVideoThumbnailFFmpeg(
	videoPath: string,
	options: {
		time?: number;
		duration?: number;
		frames?: number;
		width?: number;
		height?: number;
		quality?: string;
	} = {}
): Promise<Buffer | null> {
	const { time = 2, duration = 2, frames = 6, width = 320, height = 240, quality = 'medium' } = options;

	if (!existsSync(videoPath)) {
		console.warn(`Archivo de video no existe: ${videoPath}`);
		return null;
	}

	// Crear archivo temporal para el thumbnail animado
	const tempOutputPath = join(tmpdir(), `thumbnail-animated-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`);

	try {
		// Calcular FPS para el GIF animado
		const fps = frames / duration;

		// Construir comando FFmpeg para WebP animado
		const ffmpegCmd = [
			'ffmpeg',
			'-y', // Sobrescribir archivo de salida
			'-i',
			`"${videoPath}"`, // Archivo de entrada
			'-ss',
			time.toString(), // Timestamp de inicio
			'-t',
			duration.toString(), // Duración a extraer
			'-vf',
			[
				`scale=${width}:${height}:force_original_aspect_ratio=increase`,
				`crop=${width}:${height}`,
				`fps=${fps}`, // Reducir FPS para animación más suave
			].join(','),
			'-loop',
			'0', // Loop infinito
			'-quality',
			quality === 'high' ? '80' : quality === 'low' ? '40' : '60',
			'-f',
			'webp', // Formato WebP animado
			`"${tempOutputPath}"`, // Archivo de salida
		].join(' ');

		console.log(`🎬 Ejecutando: ${ffmpegCmd}`);

		// Ejecutar FFmpeg
		const { stdout, stderr } = await execAsync(ffmpegCmd, { timeout: 30_000 }); // 30s timeout

		if (stderr?.includes('error')) {
			console.warn(`FFmpeg warning/error: ${stderr}`);
		}

		// Verificar que se generó el archivo
		if (!existsSync(tempOutputPath)) {
			console.warn(`No se generó el archivo thumbnail animado: ${tempOutputPath}`);
			return null;
		}

		// Leer el archivo generado
		const thumbnailBuffer = await readFile(tempOutputPath);

		// Limpiar archivo temporal
		await unlink(tempOutputPath).catch(() => {
			// Ignorar errores de limpieza
		});

		console.log(`✅ Thumbnail animado generado con FFmpeg: ${thumbnailBuffer.length} bytes`);
		return thumbnailBuffer;
	} catch (error) {
		console.error('Error generando thumbnail animado con FFmpeg:', error);

		// Limpiar archivo temporal en caso de error
		try {
			if (existsSync(tempOutputPath)) {
				await unlink(tempOutputPath);
			}
		} catch {
			// Ignorar errores de limpieza
		}

		return null;
	}
}

/**
 * Verifica si FFmpeg está disponible en el sistema
 * @returns true si FFmpeg está disponible
 */
export async function isFFmpegAvailable(): Promise<boolean> {
	try {
		const { stdout } = await execAsync('ffmpeg -version');
		return stdout.includes('ffmpeg version');
	} catch {
		return false;
	}
}

/**
 * Obtiene información del video usando FFprobe
 * @param videoPath Ruta del video
 * @returns Información del video o null si falla
 */
export async function getVideoInfo(videoPath: string): Promise<{
	duration: number;
	width: number;
	height: number;
	codec: string;
} | null> {
	try {
		const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`);
		const data = JSON.parse(stdout);

		const videoStream = data.streams?.find((stream: any) => stream.codec_type === 'video');
		if (!videoStream) {
			return null;
		}

		return {
			duration: Number.parseFloat(data.format?.duration || '0'),
			width: videoStream.width || 0,
			height: videoStream.height || 0,
			codec: videoStream.codec_name || 'unknown',
		};
	} catch (error) {
		console.error('Error obteniendo info del video:', error);
		return null;
	}
}
