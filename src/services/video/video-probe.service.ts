/**
 * Servicio para hacer probe de archivos de video usando mediabunny
 * Reemplaza la implementación anterior basada en ffprobe
 */

import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { ALL_FORMATS, BufferSource, Input } from 'mediabunny';
import { serverLogger } from '@/lib/logger/server-logger';

export interface VideoProbeData {
	duration: number | null;
	width: number | null;
	height: number | null;
	codec: string | null;
	format: string | null;
	bitRate: number | null;
	raw?: any;
}

export class VideoProbeService {
	private static instance: VideoProbeService;

	static getInstance(): VideoProbeService {
		if (!VideoProbeService.instance) {
			VideoProbeService.instance = new VideoProbeService();
		}
		return VideoProbeService.instance;
	}

	async probe(filePath: string): Promise<VideoProbeData> {
		try {
			// Leer archivo como buffer
			const fileBuffer = await readFile(filePath);

			// Crear input de mediabunny
			const input = new Input({
				source: new BufferSource(fileBuffer),
				formats: ALL_FORMATS,
			});

			const result: VideoProbeData = {
				duration: null,
				width: null,
				height: null,
				codec: null,
				format: null,
				bitRate: null,
			};

			// Extraer duración total
			try {
				result.duration = await input.computeDuration();
			} catch (error) {
				serverLogger.debug('Error computando duración:', error);
			}

			// Extraer información del track de video principal
			const videoTrack = await input.getPrimaryVideoTrack();
			if (videoTrack) {
				result.width = videoTrack.displayWidth;
				result.height = videoTrack.displayHeight;

				// Obtener codec desde configuración del decodificador
				try {
					const decoderConfig = await videoTrack.getDecoderConfig();
					if (decoderConfig) {
						result.codec = decoderConfig.codec;
					}
				} catch (error) {
					serverLogger.debug('Error obteniendo codec:', error);
				}

				// Estimar bitrate usando estadísticas de paquetes
				try {
					const stats = await videoTrack.computePacketStats(20);
					if (stats.averageBitrate) {
						result.bitRate = Math.round(stats.averageBitrate);
					}
				} catch (error) {
					serverLogger.debug('Error calculando bitrate:', error);
				}
			}

			// Obtener formato del contenedor
			try {
				const format = await input.getFormat();
				result.format = format?.name || null;
			} catch (error) {
				serverLogger.debug('Error obteniendo formato:', error);
			}

			// Raw data para compatibilidad
			result.raw = {
				format: {
					duration: result.duration,
					format_name: result.format,
					bit_rate: result.bitRate,
				},
				streams: videoTrack
					? [
							{
								codec_type: 'video',
								codec_name: result.codec,
								width: result.width,
								height: result.height,
								duration: result.duration,
								bit_rate: result.bitRate,
							},
						]
					: [],
			};

			return result;
		} catch (error) {
			serverLogger.warn('VideoProbeService: fallo al hacer probe de video con mediabunny para', { filePath: basename(filePath), error: String(error) });
			return {
				duration: null,
				width: null,
				height: null,
				codec: null,
				format: null,
				bitRate: null,
			};
		}
	}
}

export const videoProbeService = VideoProbeService.getInstance();
