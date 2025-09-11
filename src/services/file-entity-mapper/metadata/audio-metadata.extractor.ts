/**
 * Extractor de metadatos para archivos de audio
 * Extraído de FileEntityMapperService para mejorar modularidad
 */
export class AudioMetadataExtractor {
	private static instance: AudioMetadataExtractor;

	static getInstance(): AudioMetadataExtractor {
		if (!AudioMetadataExtractor.instance) {
			AudioMetadataExtractor.instance = new AudioMetadataExtractor();
		}
		return AudioMetadataExtractor.instance;
	}

	/**
	 * Extrae metadatos de un archivo de audio
	 */
	async extractMetadata(filePath: string): Promise<{ success: boolean; metadata?: any; error?: string }> {
		try {
			const { audioMetadataService } = await import('@/services/audio/audio-metadata.service');

			// Obtener datos básicos del archivo de audio
			const meta = await audioMetadataService.extract(filePath);
			const baseFields = this.mapAudioTechnical(meta);
			const tagFields = this.mapAudioTags(meta.tags);

			// Crear enhanced metadata usando nuestro formato
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

			return {
				success: true,
				metadata: {
					...baseFields,
					...tagFields,
					metadata: enhancedMetadata,
				},
			};
		} catch (error) {
			return { success: false, error: `Error extracting audio metadata: ${error}` };
		}
	}

	/**
	 * Actualiza metadatos en la base de datos
	 */
	async updateMetadata(entityId: string, metadata: any): Promise<void> {
		const { db } = await import('@/lib/drizzle');
		const { audios } = await import('@/lib/drizzle/schema');
		const { eq } = await import('drizzle-orm');

		try {
			await db
				.update(audios)
				.set({
					...metadata,
					metadata: JSON.stringify(metadata.metadata),
					updatedAt: new Date(),
				})
				.where(eq(audios.id, entityId));
		} catch (err) {
			console.warn('No se pudo persistir metadata audio', err);
			throw err;
		}
	}

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
