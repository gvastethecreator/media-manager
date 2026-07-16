import { Effect } from 'effect';
import { serverLogger } from '@/lib/logger/server-logger';
import { create, getByHash } from '@/services/audio/audio.service.effect';
import type { AudioCreateInput } from '@/types/entities/audio';
import type { FileInfo } from '@/types/file-entity-mapper';
import { getMimeTypeFromExtension } from '../utils/file-info.utils';

/**
 * Procesador especializado para entidades de tipo AUDIO
 */
export class AudioProcessor {
	/**
	 * Verifica si un archivo de audio ya existe por hash
	 */
	async checkExists(fileInfo: FileInfo): Promise<boolean> {
		if (!fileInfo.hash) return false;
		try {
			const existing = await Effect.runPromise(getByHash(fileInfo.hash));
			return !!existing;
		} catch {
			return false;
		}
	}

	/**
	 * Crea entidad audio básica en BD
	 */
	async createBasicEntity(fileInfo: FileInfo): Promise<string> {
		if (!fileInfo.hash) {
			throw new Error('File hash is required for audio creation');
		}

		const audioData: AudioCreateInput = {
			name: fileInfo.name,
			path: fileInfo.path,
			hash: fileInfo.hash,
			size: fileInfo.size,
			folderId: fileInfo.folderId,
			mimeType: getMimeTypeFromExtension(fileInfo.extension),
			extension: fileInfo.extension,
			description: null,
			isFavorite: false,
			isArchived: false,
			duration: null,
			bitrate: null,
			sampleRate: null,
			channels: null,
			format: null,
			codec: null,
			title: null,
			artist: null,
			album: null,
			year: null,
			genre: null,
			track: null,
			disc: null,
			albumArtist: null,
			composer: null,
			comment: null,
			lyrics: null,
			bpm: null,
			key: null,
			mood: null,
		};

		const audio = await Effect.runPromise(create(audioData));
		return audio.id;
	}

	/**
	 * Extrae metadata de audio (duración, bitrate, tags ID3)
	 * con fallback gracioso para formatos sin metadata completa
	 */
	async extractMetadata(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		const { basename, extname } = await import('node:path');
		const fileName = basename(filePath);
		const extension = extname(filePath).toLowerCase();

		serverLogger.debug(`🎵 [AudioProcessor] Extrayendo metadata: ${fileName}`);

		try {
			const { audioMetadataService } = await import('@/services/audio/audio-metadata.service');
			const { db } = await import('@/lib/drizzle');
			const { audios } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');

			// Intentar extracción con servicio principal
			const meta = await audioMetadataService.extract(filePath);
			const baseFields = this.mapAudioTechnical(meta);
			const tagFields = this.mapAudioTags(meta.tags);

			const enhancedMetadata = {
				audioData: {
					duration: meta.duration,
					bitrate: meta.bitrate,
					channels: meta.channels,
					sampleRate: meta.sampleRate,
					format: meta.format,
					codec: meta.format,
					title: meta.tags?.title,
					artist: meta.tags?.artist,
					album: meta.tags?.album,
					year: meta.tags?.year,
					genre: meta.tags?.genre,
				},
				raw: meta.raw,
			};

			await db
				.update(audios)
				.set({
					...baseFields,
					...tagFields,
					metadata: JSON.stringify(enhancedMetadata),
					updatedAt: new Date(),
				})
				.where(eq(audios.id, entityId));

			serverLogger.debug(`✅ [AudioProcessor] Metadata extraída: ${fileName}`);
			return { success: true };
		} catch (primaryError) {
			serverLogger.warn(`⚠️ [AudioProcessor] Servicio principal falló para ${fileName}:`, primaryError);

			// Fallback: Extracción básica de metadata sin dependencias
			try {
				const basicMeta = await this.extractBasicAudioMetadata(filePath);
				const { db } = await import('@/lib/drizzle');
				const { audios } = await import('@/lib/drizzle/schema');
				const { eq } = await import('drizzle-orm');

				const enhancedMetadata = {
					audioData: {
						format: extension.slice(1), // .mp3 -> mp3
						extractedBy: 'fallback',
						note: 'Metadata básica extraída por fallback',
					},
				};

				await db
					.update(audios)
					.set({
						format: extension.slice(1),
						metadata: JSON.stringify(enhancedMetadata),
						updatedAt: new Date(),
					})
					.where(eq(audios.id, entityId));

				serverLogger.debug(`⚠️ [AudioProcessor] Metadata básica guardada (fallback): ${fileName}`);
				return { success: true, error: 'Used fallback extraction' };
			} catch (fallbackError) {
				serverLogger.error(`❌ [AudioProcessor] Fallback también falló para ${fileName}:`, fallbackError);
				return {
					success: false,
					error: `Audio metadata extraction failed: ${primaryError instanceof Error ? primaryError.message : 'Unknown error'}`,
				};
			}
		}
	}

	/**
	 * Extracción básica de metadata sin dependencias externas
	 * (para formatos WAV, AIFF sin tags)
	 */
	private async extractBasicAudioMetadata(filePath: string): Promise<any> {
		const { stat } = await import('node:fs/promises');
		const { extname } = await import('node:path');

		const stats = await stat(filePath);
		const extension = extname(filePath).toLowerCase();

		// Metadata minima inferida
		return {
			format: extension.slice(1),
			size: stats.size,
			created: stats.birthtime,
			modified: stats.mtime,
		};
	}

	/**
	 * Genera waveform visual como thumbnail para el audio
	 */
	async generateThumbnail(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		const { basename } = await import('node:path');
		const fileName = basename(filePath);

		serverLogger.debug(`🎵 [AudioProcessor] Generando waveform: ${fileName}`);

		try {
			const { generateAndSaveWaveform } = await import('@/lib/utils/audio/waveform-generator');

			// Generar waveform con configuración personalizada
			await generateAndSaveWaveform(filePath, entityId, {
				width: 800,
				height: 200,
				waveColor: 'oklch(0.59 0.2 255)', // --entity-audio
				backgroundColor: 'oklch(0.18 0.002 0)', // --dt-neutral-900
				samples: 200,
			});

			serverLogger.debug(`✅ [AudioProcessor] Waveform generado: ${fileName}`);
			return { success: true };
		} catch (error) {
			serverLogger.warn(`⚠️ [AudioProcessor] Error generando waveform para ${fileName}:`, error);

			// Fallback: Crear placeholder simple
			try {
				await this.createAudioPlaceholder(filePath, entityId);
				serverLogger.debug(`⚠️ [AudioProcessor] Usando placeholder para: ${fileName}`);
				return { success: true, error: 'Using placeholder due to waveform generation failure' };
			} catch (placeholderError) {
				serverLogger.error(`❌ [AudioProcessor] Placeholder también falló para ${fileName}:`, placeholderError);
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				};
			}
		}
	}

	/**
	 * Crea un placeholder SVG simple para audio
	 */
	private async createAudioPlaceholder(filePath: string, entityId: string): Promise<void> {
		const { basename } = await import('node:path');
		const { db } = await import('@/lib/drizzle');
		const { audios } = await import('@/lib/drizzle/schema');
		const { eq } = await import('drizzle-orm');

		const fileName = basename(filePath);

		// SVG placeholder con icono de audio
		const svg = `
			<svg width="800" height="200" xmlns="http://www.w3.org/2000/svg">
				<rect width="800" height="200" fill="oklch(0.18 0.002 0)"/>
				<text x="400" y="90" font-family="Arial" font-size="64" fill="oklch(0.55 0.002 0)" text-anchor="middle">🎵</text>
				<text x="400" y="130" font-family="Arial" font-size="16" fill="oklch(0.7 0.002 0)" text-anchor="middle">${fileName}</text>
				<text x="400" y="155" font-family="Arial" font-size="12" fill="oklch(0.55 0.002 0)" text-anchor="middle">Audio File</text>
			</svg>
		`.trim();

		// Guardar en metadata
		const existingAudio = await db.query.audios.findFirst({
			where: eq(audios.id, entityId),
		});

		const existingMetadata = existingAudio?.metadata
			? typeof existingAudio.metadata === 'string'
				? JSON.parse(existingAudio.metadata)
				: existingAudio.metadata
			: {};

		const updatedMetadata = {
			...existingMetadata,
			waveform: {
				data: Buffer.from(svg).toString('base64'),
				width: 800,
				height: 200,
				format: 'svg',
				isPlaceholder: true,
				generatedAt: new Date().toISOString(),
			},
		};

		await db
			.update(audios)
			.set({
				metadata: JSON.stringify(updatedMetadata),
				updatedAt: new Date(),
			})
			.where(eq(audios.id, entityId));
	}

	// ===================== MÉTODOS PRIVADOS =====================

	private mapAudioTechnical(meta: any) {
		return {
			duration: meta.duration ? Math.round(meta.duration * 1000) : null,
			bitrate: meta.bitrate ?? null,
			sampleRate: meta.sampleRate ?? null,
			channels: meta.channels ?? null,
			format: meta.format ?? null,
			codec: meta.codec ?? null,
		};
	}

	private mapAudioTags(tags: any) {
		return {
			title: tags?.title ?? null,
			artist: tags?.artist ?? null,
			album: tags?.album ?? null,
			year: tags?.year ? Number(tags.year) : null,
			genre: tags?.genre ?? null,
			track: tags?.track ? Number(tags.track) : null,
			disc: tags?.disc ? Number(tags.disc) : null,
			albumArtist: tags?.albumArtist ?? null,
			composer: tags?.composer ?? null,
			comment: tags?.comment ?? null,
			lyrics: tags?.lyrics ?? null,
			bpm: tags?.bpm ? Number(tags.bpm) : null,
			key: tags?.key ?? null,
			mood: tags?.mood ?? null,
		};
	}
}
