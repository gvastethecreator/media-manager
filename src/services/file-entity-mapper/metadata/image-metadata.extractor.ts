import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

/**
 * Extractor de metadatos para imágenes
 * Extraído de FileEntityMapperService para mejorar modularidad
 */
export class ImageMetadataExtractor {
	private static instance: ImageMetadataExtractor;

	static getInstance(): ImageMetadataExtractor {
		if (!ImageMetadataExtractor.instance) {
			ImageMetadataExtractor.instance = new ImageMetadataExtractor();
		}
		return ImageMetadataExtractor.instance;
	}

	/**
	 * Extrae y procesa metadatos unificados de una imagen
	 */
	async extractMetadata(filePath: string): Promise<{ success: boolean; metadata?: any; error?: string }> {
		try {
			const { extractAllMetadata } = await import('@/server/services/metadata/unified-parser.service');
			const fileBuffer = await readFile(filePath);
			const fileName = basename(filePath);
			const metadataResult = await extractAllMetadata(fileBuffer, fileName);

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

			// Aplicar legacy flat metadata
			this.flattenLegacyMetadata(metadataResult, persisted);

			return {
				success: true,
				metadata: {
					metadata: persisted,
					width: metadataResult.base?.dimensions?.width || 0,
					height: metadataResult.base?.dimensions?.height || 0,
				},
			};
		} catch (error) {
			return { success: false, error: `Error extracting image metadata: ${error}` };
		}
	}

	/**
	 * Actualiza metadatos en la base de datos
	 */
	async updateMetadata(entityId: string, metadata: any): Promise<void> {
		const { db } = await import('@/lib/drizzle');
		const { images } = await import('@/lib/drizzle/schema');
		const { eq } = await import('drizzle-orm');

		try {
			await db
				.update(images)
				.set({
					metadata: JSON.stringify(metadata.metadata),
					...(metadata.width > 0 && metadata.height > 0
						? {
								width: metadata.width,
								height: metadata.height,
							}
						: {}),
					updatedAt: new Date(),
				})
				.where(eq(images.id, entityId));
		} catch (err) {
			console.warn('No se pudo persistir metadata imagen', err);
			throw err;
		}
	}

	private flattenLegacyMetadata(metadataResult: any, persisted: Record<string, any>) {
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
}
