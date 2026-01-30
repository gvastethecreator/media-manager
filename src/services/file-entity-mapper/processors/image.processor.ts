import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { Effect } from 'effect';
import { ImageCreateInput } from '@/lib/effect/schemas/entities';
import { serverLogger } from '@/lib/logger/server-logger';
import { create as createImage, getByHash as getImageByHash } from '@/services/image/image.service.effect';
import type { FileInfo } from '@/types/file-entity-mapper';

const imageLogger = serverLogger.withContext('ImageProcessor');

/**
 * Procesador especializado para entidades de tipo IMAGE
 */
export class ImageProcessor {
	/**
	 * Verifica si una imagen ya existe por hash
	 */
	async checkExists(hash: string): Promise<boolean> {
		if (!hash) return false;
		try {
			const existing = await Effect.runPromise(getImageByHash(hash));
			return !!existing;
		} catch {
			return false;
		}
	}

	/**
	 * Crea entidad imagen básica en BD
	 */
	async createBasicEntity(fileInfo: FileInfo): Promise<string> {
		if (!fileInfo.hash) {
			throw new Error('File hash is required for image creation');
		}

		let width = 1;
		let height = 1;

		try {
			const sharp = (await import('sharp')).default;
			const metadata = await sharp(fileInfo.path).metadata();
			width = metadata.width || 1;
			height = metadata.height || 1;
		} catch (error) {
			imageLogger.warn(`No se pudieron obtener dimensiones para ${fileInfo.path}, usando valores por defecto:`, error);
		}

		const imageData: typeof ImageCreateInput.Type = {
			name: fileInfo.name,
			path: fileInfo.path,
			size: fileInfo.size,
			width,
			height,
			hash: fileInfo.hash,
			folderId: fileInfo.folderId,
		};

		const image = await Effect.runPromise(createImage(imageData));
		return image.id;
	}

	/**
	 * Extrae metadata completa de imagen (EXIF, IPTC, XMP, AI)
	 */
	async extractMetadata(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		try {
			const { extractAllMetadata } = await import('@/server/services/metadata/unified-parser.service');
			const { images } = await import('@/lib/drizzle/schema');
			const { db } = await import('@/lib/drizzle');
			const { eq } = await import('drizzle-orm');

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

			// Aplanar legacy_flat si existe
			this.flattenLegacyMetadata(metadataResult, persisted);

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
				imageLogger.warn('No se pudo persistir metadata imagen', err);
			}

			return { success: true };
		} catch (e) {
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
		}
	}

	/**
	 * Genera thumbnail optimizado para la imagen
	 */
	async generateThumbnail(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		try {
			const sharpMod = await import('sharp');
			const sharp = sharpMod.default || (sharpMod as any);
			const { db } = await import('@/lib/drizzle');
			const { images } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');

			const thumbBuffer = await sharp(filePath)
				.resize({ width: 320, withoutEnlargement: true })
				.jpeg({ quality: 70 })
				.toBuffer();

			const b64 = thumbBuffer.toString('base64');

			await db
				.update(images)
				.set({
					metadata: await this.mergeThumbnailIntoMetadata(db, images, entityId, b64, eq),
					updatedAt: new Date(),
				})
				.where(eq(images.id, entityId));

			return { success: true };
		} catch (e) {
			imageLogger.warn('Fallo generando thumbnail imagen', e);
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
		}
	}

	/**
	 * Verifica si una imagen existente necesita metadata actualizada
	 */
	async checkNeedsDeferredMetadata(filePath: string): Promise<{ needsUpdate: boolean; entityId?: string }> {
		try {
			const { db } = await import('@/lib/drizzle');
			const { images } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');

			const existing = await db
				.select({ id: images.id, metadata: images.metadata })
				.from(images)
				.where(eq(images.path, filePath))
				.limit(1);

			if (existing.length !== 1) {
				return { needsUpdate: false };
			}

			const metaRaw = existing[0].metadata ? JSON.parse(existing[0].metadata) : null;
			const hasAI = Boolean(metaRaw?.ai_metadata || metaRaw?.aiMetadata);

			if (hasAI) {
				return { needsUpdate: false };
			}

			return { needsUpdate: true, entityId: existing[0].id };
		} catch {
			return { needsUpdate: false };
		}
	}

	// ===================== MÉTODOS PRIVADOS =====================

	private flattenLegacyMetadata(metadataResult: any, persisted: Record<string, any>): void {
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
			imageLogger.warn('No se pudo aplanar legacy_flat', e);
		}
	}

	private async mergeThumbnailIntoMetadata(
		db: any,
		table: any,
		entityId: string,
		b64: string,
		eq: any
	): Promise<string> {
		try {
			const existing = await db.select({ metadata: table.metadata }).from(table).where(eq(table.id, entityId)).limit(1);
			let metaObj: any = {};
			if (existing.length === 1 && existing[0].metadata) {
				try {
					metaObj = JSON.parse(existing[0].metadata);
				} catch {
					/* ignore */
				}
			}
			metaObj.thumbnail = { format: 'jpeg', width: 320, data: b64 };
			return JSON.stringify(metaObj);
		} catch (e) {
			imageLogger.warn('No se pudo fusionar thumbnail en metadata', e);
			return JSON.stringify({ thumbnail: { format: 'jpeg', width: 320, data: b64 } });
		}
	}
}
