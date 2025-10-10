import { createAudio, getAudioByHash } from '@/services/audio/audio.service';
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
	async checkExists(hash: string): Promise<boolean> {
		if (!hash) return false;
		try {
			const existing = await getAudioByHash(hash);
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

		const audio = await createAudio(audioData);
		return audio.id;
	}

	/**
	 * Extrae metadata de audio (duración, bitrate, tags ID3)
	 */
	async extractMetadata(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		try {
			const { audioMetadataService } = await import('@/services/audio/audio-metadata.service');
			const { db } = await import('@/lib/drizzle');
			const { audios } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');

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

			return { success: true };
		} catch (e) {
			return { success: false, error: 'Audio metadata extraction failed' };
		}
	}

	/**
	 * Genera waveform SVG como thumbnail para el audio
	 */
	async generateThumbnail(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		try {
			const { generateAudioWaveform } = await import('@/config/thumbnail-generators');
			const { basename } = await import('node:path');

			const mockItem = {
				id: entityId,
				name: basename(filePath),
				path: filePath,
				entityType: 'audio' as const,
			};

			const thumbnailUrl = await generateAudioWaveform(mockItem as any);
			if (!thumbnailUrl) {
				return { success: false, error: 'Failed to generate waveform' };
			}

			console.log(`✅ Audio thumbnail generado para: ${filePath}`);
			return { success: true };
		} catch (e) {
			console.warn('Error generando thumbnail de audio:', filePath, e);
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
		}
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
