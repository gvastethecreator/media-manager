/**
 * @file Handler de metadata para videos
 * @module file-entity-mapper/handlers
 */

/**
 * Maneja extracción y persistencia de metadata para videos
 */
export async function handleVideoMetadata(filePath: string, entityId: string) {
	try {
		const { videoProbeService } = await import('@/services/video/video-probe.service');
		const { db } = await import('@/lib/drizzle');
		const { videos } = await import('@/lib/drizzle/schema');
		const { eq } = await import('drizzle-orm');

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

		await db
			.update(videos)
			.set({
				duration: probe.duration ? Math.round(probe.duration * 1000) : 0,
				width: probe.width ?? null,
				height: probe.height ?? null,
				metadata: JSON.stringify(enhancedMetadata),
				updatedAt: new Date(),
			})
			.where(eq(videos.id, entityId));
		return { success: true };
	} catch (e) {
		return { success: false, error: 'Video metadata extraction failed' };
	}
}
