/**
 * Servicio para extraer metadatos usando mediabunny
 */

import { readFile } from 'node:fs/promises';
import { ALL_FORMATS, BufferSource, Input } from 'mediabunny';
import { serverLogger } from '@/lib/logger/server-logger';
import type { VideoMetadata } from '@/types/metadata-origin.types';

const logger = serverLogger.withContext('MediabunnyParserService');

export async function extractVideoMetadata(filePath: string): Promise<VideoMetadata | null> {
	try {
		const fileBuffer = await readFile(filePath);

		// Verificar que el buffer no esté vacío
		if (!fileBuffer || fileBuffer.length === 0) {
			logger.warn('Archivo vacío o no leído correctamente', { filePath });
			return null;
		}

		logger.debug('Archivo leído correctamente', {
			filePath,
			size: fileBuffer.length,
			firstBytes: Array.from(fileBuffer.subarray(0, 8))
				.map((b) => b.toString(16))
				.join(' '),
		});

		const input = new Input({
			source: new BufferSource(fileBuffer),
			formats: ALL_FORMATS,
		});

		const result: VideoMetadata = {
			filename: filePath.split(/[/\\]/).pop() || 'unknown',
		};

		// Verificar formato válido primero
		try {
			const inputFormat = await input.getFormat();
			logger.debug('Formato detectado', { filePath, format: inputFormat?.name });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.warn('Formato no reconocido por mediabunny', { filePath, error: errorMessage });
			return null;
		}

		try {
			const duration = await input.computeDuration();
			result.duration = duration;
			logger.debug('Duración extraída', { filePath, duration });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.warn('Error computando duración', { filePath, error: errorMessage });
		}

		const videoTrack = await input.getPrimaryVideoTrack();
		if (videoTrack) {
			result.width = videoTrack.displayWidth;
			result.height = videoTrack.displayHeight;

			if (result.width && result.height) {
				result.resolution = `${result.width}x${result.height}`;
			}

			try {
				const packetStats = await videoTrack.computePacketStats(100);
				if (packetStats?.averagePacketRate) {
					result.frameRate = packetStats.averagePacketRate;
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				logger.debug('Error estimando frame rate', { error: errorMessage });
			}

			if (result.duration && result.duration > 0) {
				const fileSizeBytes = fileBuffer.byteLength;
				result.bitrate = Math.round((fileSizeBytes * 8) / result.duration);
			}

			const extension = filePath.split('.').pop()?.toLowerCase();
			if (extension) {
				result.format = extension;
			}
		} else {
			logger.warn('No se encontró track de video', { filePath });
		}

		logger.debug('Metadatos extraídos exitosamente', { filePath, result });
		return result;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack?.substring(0, 500) : undefined;
		logger.warn('Error extrayendo metadatos de video con mediabunny', {
			filePath,
			error: errorMessage,
			stack: errorStack,
		});
		return null;
	}
}

export async function extractAudioMetadata(filePath: string) {
	try {
		const fileBuffer = await readFile(filePath);
		const input = new Input({
			source: new BufferSource(fileBuffer),
			formats: ALL_FORMATS,
		});

		const result: any = {
			filename: filePath.split(/[/\\]/).pop() || 'unknown',
		};

		try {
			const duration = await input.computeDuration();
			result.duration = duration;
		} catch (error) {
			logger.debug('Error computando duración de audio', { error });
		}

		const audioTrack = await input.getPrimaryAudioTrack();
		if (audioTrack) {
			result.channels = audioTrack.numberOfChannels;
			result.sampleRate = audioTrack.sampleRate;

			if (result.duration && result.duration > 0) {
				const fileSizeBytes = fileBuffer.byteLength;
				result.bitrate = Math.round((fileSizeBytes * 8) / result.duration);
			}

			const extension = filePath.split('.').pop()?.toLowerCase();
			if (extension) {
				result.format = extension;
			}
		}

		return result;
	} catch (error) {
		logger.warn('Error extrayendo metadatos de audio con mediabunny', { filePath, error });
		return null;
	}
}
