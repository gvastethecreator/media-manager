/**
 * @file Handler de metadata para archivos de audio
 * @module file-entity-mapper/handlers
 */

/**
 * Mapea campos técnicos del audio
 */
function mapAudioTechnical(meta: any) {
	return {
		duration: meta.duration ? Math.round(meta.duration * 1000) : null,
		bitrate: meta.bitrate ?? null,
		sampleRate: meta.sampleRate ?? null,
		channels: meta.channels ?? null,
		format: meta.format ?? null,
		codec: meta.codec ?? null,
	};
}

/**
 * Mapea tags/etiquetas del audio
 */
function mapAudioTags(tags: any) {
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

/**
 * Maneja extracción y persistencia de metadata para audios
 */
export async function handleAudioMetadata(filePath: string, entityId: string) {
	try {
		const { audioMetadataService } = await import('@/services/audio/audio-metadata.service');
		const { db } = await import('@/lib/drizzle');
		const { audios } = await import('@/lib/drizzle/schema');
		const { eq } = await import('drizzle-orm');

		// Obtener datos básicos del archivo de audio
		const meta = await audioMetadataService.extract(filePath);
		const baseFields = mapAudioTechnical(meta);
		const tagFields = mapAudioTags(meta.tags);

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
