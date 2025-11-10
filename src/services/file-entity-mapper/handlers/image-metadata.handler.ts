/**
 * @file Handler de metadata para imágenes
 * @module file-entity-mapper/handlers
 */

import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

/**
 * Ejecuta extracción unificada de metadata para imágenes
 */
async function runUnifiedImageMetadataExtraction(filePath: string) {
	const { extractAllMetadata } = await import('@/server/services/metadata/unified-parser.service');
	const { images } = await import('@/lib/drizzle/schema');
	const { db } = await import('@/lib/drizzle');
	const { eq } = await import('drizzle-orm');
	const fileBuffer = await readFile(filePath);
	const fileName = basename(filePath);
	const metadataResult = await extractAllMetadata(fileBuffer, fileName);
	return { metadataResult, db, images, eq };
}

/**
 * Aplana metadata legacy en el objeto persisted
 */
function flattenLegacyMetadata(metadataResult: any, persisted: Record<string, any>) {
	try {
		const aiMeta: any = metadataResult?.ai_metadata;
		const flat = aiMeta?.legacy_flat;
		if (flat && typeof flat === 'object') {
			for (const [k, v] of Object.entries(flat)) {
				if (v !== undefined && v !== null && !(k in persisted)) {
					(persisted as any)[k] = v;
				}
			}
		}
	} catch (e) {
		console.warn('No se pudo aplanar legacy_flat', e);
	}
}

/**
 * Maneja extracción y persistencia de metadata para imágenes
 */
export async function handleImageMetadata(filePath: string, entityId: string) {
	const { metadataResult, db, images, eq } = await runUnifiedImageMetadataExtraction(filePath);
	if (!metadataResult.success) {
		return { success: false, error: 'Metadata extraction failed' };
	}
	const persisted: Record<string, any> = {
		parser: metadataResult.parser_used,
		processingTime: metadataResult.processing_time,
		origin: metadataResult.origin,
		ai_metadata: metadataResult.ai_metadata,
		exif: metadataResult.exif,
		iptc: metadataResult.iptc,
		xmp: metadataResult.xmp,
		base: metadataResult.base,
		errors: metadataResult.errors,
		warnings: metadataResult.warnings,
	};
	flattenLegacyMetadata(metadataResult, persisted);
	const w = metadataResult.base?.dimensions?.width || 0;
	const h = metadataResult.base?.dimensions?.height || 0;
	try {
		await db
			.update(images)
			.set({
				metadata: JSON.stringify(persisted),
				...(w > 0 && h > 0 ? { width: w, height: h } : {}),
				updatedAt: new Date(),
			})
			.where(eq(images.id, entityId));
	} catch (err) {
		console.warn('No se pudo persistir metadata imagen', err);
	}
	return { success: true };
}
