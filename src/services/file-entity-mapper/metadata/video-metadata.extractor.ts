/**
 * Extractor de metadatos para archivos de video
 * Extraído de FileEntityMapperService para mejorar modularidad
 */
export class VideoMetadataExtractor {
	private static instance: VideoMetadataExtractor;

	static getInstance(): VideoMetadataExtractor {
		if (!VideoMetadataExtractor.instance) {
			VideoMetadataExtractor.instance = new VideoMetadataExtractor();
		}
		return VideoMetadataExtractor.instance;
	}

	/**
	 * Extrae metadatos de un archivo de video
	 */
	async extractMetadata(filePath: string): Promise<{ success: boolean; metadata?: any; error?: string }> {
		try {
			const { videoProbeService } = await import('@/services/video/video-probe.service');

			// Obtener datos básicos de probe
			const probe = await videoProbeService.probe(filePath);

			// Crear enhanced metadata usando nuestro formato
			const enhancedMetadata = {
				videoData: {
					duration: probe.duration,
					width: probe.width,
					height: probe.height,
					resolution: probe.width && probe.height ? `${probe.width}x${probe.height}` : null,
					bitRate: probe.bitRate,
					codec: probe.codec,
					format: probe.format,
				},
				raw: probe.raw,
			};

			return {
				success: true,
				metadata: {
					duration: probe.duration ? Math.round(probe.duration * 1000) : 0,
					width: probe.width ?? null,
					height: probe.height ?? null,
					metadata: enhancedMetadata,
				},
			};
		} catch (error) {
			return { success: false, error: `Error extracting video metadata: ${error}` };
		}
	}

	/**
	 * Actualiza metadatos en la base de datos
	 */
	async updateMetadata(entityId: string, metadata: any): Promise<void> {
		const { db } = await import('@/lib/drizzle');
		const { videos } = await import('@/lib/drizzle/schema');
		const { eq } = await import('drizzle-orm');

		try {
			await db
				.update(videos)
				.set({
					...metadata,
					metadata: JSON.stringify(metadata.metadata),
					updatedAt: new Date(),
				})
				.where(eq(videos.id, entityId));
		} catch (err) {
			console.warn('No se pudo persistir metadata video', err);
			throw err;
		}
	}
}
