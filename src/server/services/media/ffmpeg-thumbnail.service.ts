/**
 * Servicio de fallback para generar thumbnails usando FFmpeg
 * Se usa cuando mediabunny no puede procesar el archivo
 */

import { spawn } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serverLogger } from '../../../lib/logger/server-logger';

const logger = serverLogger.withContext('FFmpegThumbnailService');

interface FFmpegThumbnailOptions {
	timestampSeconds?: number;
	width?: number;
	height?: number;
	quality?: number; // 1-31, donde 1 es mejor calidad
}

/**
 * Genera un thumbnail usando FFmpeg como comando externo
 */
export async function generateFFmpegThumbnail(
	videoPath: string,
	options: FFmpegThumbnailOptions = {}
): Promise<Buffer | null> {
	const { timestampSeconds = 1, width = 320, height = 240, quality = 15 } = options;

	// Generar nombre único para el archivo temporal
	const tempFilename = `thumbnail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
	const tempPath = join(tmpdir(), tempFilename);

	try {
		logger.info('🎬 Iniciando generación FFmpeg', {
			videoPath,
			timestamp: timestampSeconds,
			dimensions: `${width}x${height}`,
			outputPath: tempPath,
		});

		// Verificar que FFmpeg esté disponible
		const ffmpegAvailable = await checkFFmpegAvailability();
		if (!ffmpegAvailable) {
			logger.error('❌ FFmpeg no está disponible en el sistema');
			return null;
		}

		// Construir comando FFmpeg
		const ffmpegArgs = [
			'-i',
			videoPath,
			'-ss',
			timestampSeconds.toString(),
			'-vframes',
			'1',
			'-vf',
			`scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
			'-q:v',
			quality.toString(),
			'-y', // Sobrescribir archivo si existe
			tempPath,
		];

		logger.info('📝 Comando FFmpeg:', {
			command: 'ffmpeg',
			args: ffmpegArgs.join(' '),
		});

		// Ejecutar FFmpeg
		const success = await executeFFmpeg(ffmpegArgs);

		if (!success) {
			logger.error('❌ FFmpeg falló al ejecutarse');
			return null;
		}

		// Verificar que el archivo se generó
		if (!existsSync(tempPath)) {
			logger.error('❌ El archivo thumbnail no se generó', { expectedPath: tempPath });
			return null;
		}

		// Leer el archivo generado
		const thumbnailBuffer = await readFile(tempPath);
		logger.info('✅ Thumbnail FFmpeg generado exitosamente', {
			videoPath,
			outputSize: `${Math.round(thumbnailBuffer.length / 1024)} KB`,
		});

		return thumbnailBuffer;
	} catch (error) {
		logger.error('💥 Error generando thumbnail con FFmpeg', {
			videoPath,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined,
		});
		return null;
	} finally {
		// Limpiar archivo temporal
		try {
			if (existsSync(tempPath)) {
				unlinkSync(tempPath);
				logger.debug('🧹 Archivo temporal limpiado', { tempPath });
			}
		} catch (cleanupError) {
			logger.warn('⚠️ No se pudo limpiar archivo temporal', {
				tempPath,
				error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
			});
		}
	}
}

/**
 * Verifica si FFmpeg está disponible en el sistema
 */
async function checkFFmpegAvailability(): Promise<boolean> {
	return new Promise((resolve) => {
		const ffmpeg = spawn('ffmpeg', ['-version'], {
			stdio: 'pipe',
		});

		let output = '';

		ffmpeg.stdout.on('data', (data) => {
			output += data.toString();
		});

		ffmpeg.on('close', (code) => {
			if (code === 0 && output.includes('ffmpeg version')) {
				logger.info('✅ FFmpeg disponible', {
					version: output.split('\n')[0],
				});
				resolve(true);
			} else {
				logger.warn('❌ FFmpeg no disponible', { exitCode: code });
				resolve(false);
			}
		});

		ffmpeg.on('error', (error) => {
			logger.warn('❌ Error verificando FFmpeg', { error: error.message });
			resolve(false);
		});
	});
}

/**
 * Ejecuta comando FFmpeg y retorna si fue exitoso
 */
function executeFFmpeg(args: string[]): Promise<boolean> {
	return new Promise((resolve) => {
		const ffmpeg = spawn('ffmpeg', args, {
			stdio: 'pipe',
		});

		let stderr = '';

		ffmpeg.stderr.on('data', (data) => {
			stderr += data.toString();
		});

		ffmpeg.on('close', (code) => {
			if (code === 0) {
				logger.info('✅ FFmpeg ejecutado exitosamente');
				resolve(true);
			} else {
				logger.error('❌ FFmpeg falló', {
					exitCode: code,
					stderr: stderr.slice(-500), // Últimos 500 caracteres del error
				});
				resolve(false);
			}
		});

		ffmpeg.on('error', (error) => {
			logger.error('💥 Error ejecutando FFmpeg', { error: error.message });
			resolve(false);
		});
	});
}

/**
 * Genera múltiples thumbnails en diferentes timestamps
 */
export async function generateMultipleFFmpegThumbnails(
	videoPath: string,
	timestamps: number[],
	options: Omit<FFmpegThumbnailOptions, 'timestampSeconds'> = {}
): Promise<Buffer[]> {
	const thumbnails: Buffer[] = [];

	logger.info('📸 Generando múltiples thumbnails con FFmpeg', {
		videoPath,
		timestampCount: timestamps.length,
	});

	for (const timestamp of timestamps) {
		try {
			const thumbnail = await generateFFmpegThumbnail(videoPath, {
				...options,
				timestampSeconds: timestamp,
			});

			if (thumbnail) {
				thumbnails.push(thumbnail);
			}
		} catch (error) {
			logger.warn('⚠️ Error generando thumbnail individual', {
				timestamp,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	logger.info('✅ Thumbnails múltiples completados', {
		videoPath,
		requested: timestamps.length,
		generated: thumbnails.length,
	});

	return thumbnails;
}
