/**
 * @file Servicio de generación de thumbnails
 * @module services/file-entity-mapper/thumbnail/thumbnail-generator
 */

import { readFile } from 'node:fs/promises';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { db } from '@/lib/drizzle';
import { audios, documents, file3Ds, images, jsonFiles, videos } from '@/lib/drizzle/schema';
import { EntityType } from '@/types/file-entity-mapper';

/**
 * Servicio especializado en la generación de thumbnails para diferentes tipos de archivos
 */
export class ThumbnailGeneratorService {
	private static instance: ThumbnailGeneratorService;

	private constructor() {}

	public static getInstance(): ThumbnailGeneratorService {
		if (!ThumbnailGeneratorService.instance) {
			ThumbnailGeneratorService.instance = new ThumbnailGeneratorService();
		}
		return ThumbnailGeneratorService.instance;
	}

	/**
	 * Genera thumbnail para una entidad según su tipo
	 */
	public async generateThumbnail(
		filePath: string,
		entityId: string,
		entityType: EntityType
	): Promise<{ success: boolean; error?: string }> {
		try {
			switch (entityType) {
				case EntityType.IMAGE:
					await this.generateImageThumbnail(filePath, entityId);
					break;
				case EntityType.VIDEO:
					await this.generateVideoThumbnail(filePath, entityId);
					break;
				case EntityType.JSON:
					await this.generateJsonThumbnail(filePath, entityId);
					break;
				case EntityType.AUDIO:
					await this.generateAudioThumbnail(filePath, entityId);
					break;
				case EntityType.FILE3D:
					await this.generate3DThumbnail(filePath, entityId);
					break;
				case EntityType.DOCUMENT:
					await this.generateDocumentThumbnail(filePath, entityId);
					break;
				default:
					// No generar thumbnail para tipos no soportados
					break;
			}
			return { success: true };
		} catch (error) {
			console.warn(`❌ Error generando thumbnail para ${entityType}:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Genera thumbnail para imágenes usando Sharp
	 */
	private async generateImageThumbnail(filePath: string, entityId: string): Promise<void> {
		try {
			// Generar thumbnail usando Sharp
			const thumbnailBuffer = await sharp(filePath)
				.resize(200, 200, {
					fit: 'inside',
					withoutEnlargement: true,
				})
				.jpeg({ quality: 80 })
				.toBuffer();

			const thumbnailBase64 = thumbnailBuffer.toString('base64');

			// Actualizar la metadata en la base de datos
			await this.mergeThumbnailIntoMetadata(db, images, entityId, thumbnailBase64, eq);
		} catch (error) {
			console.warn('Error generando thumbnail de imagen:', error);
		}
	}

	/**
	 * Placeholder para generación de thumbnail de video
	 */
	private async generateVideoThumbnail(_filePath: string, _entityId: string): Promise<void> {
		// TODO: Implementar generación de thumbnail de video usando ffmpeg
		console.log('🎬 Video thumbnail generation not implemented yet');
	}

	/**
	 * Genera thumbnail para archivos JSON (preview de estructura)
	 */
	private async generateJsonThumbnail(filePath: string, entityId: string): Promise<void> {
		try {
			const content = await readFile(filePath, 'utf-8');
			let jsonData: any;

			try {
				jsonData = JSON.parse(content);
			} catch {
				// Si no se puede parsear, crear un thumbnail de error
				const errorThumbnail = this.createTextThumbnail('Invalid JSON');
				await this.mergeThumbnailIntoMetadata(db, jsonFiles, entityId, errorThumbnail, eq);
				return;
			}

			// Crear preview de la estructura del JSON
			const preview = this.createJsonStructurePreview(jsonData);
			const thumbnailBase64 = this.createTextThumbnail(preview);

			await this.mergeThumbnailIntoMetadata(db, jsonFiles, entityId, thumbnailBase64, eq);
		} catch (error) {
			console.warn('Error generando thumbnail de JSON:', error);
		}
	}

	/**
	 * Placeholder para generación de thumbnail de audio (waveform)
	 */
	private async generateAudioThumbnail(filePath: string, entityId: string): Promise<void> {
		try {
			// TODO: Implementar generación de waveform usando librería de audio
			const placeholder = this.createTextThumbnail('🎵 Audio File');
			await this.mergeThumbnailIntoMetadata(db, audios, entityId, placeholder, eq);
		} catch (error) {
			console.warn('Error generando thumbnail de audio:', error);
		}
	}

	/**
	 * Placeholder para generación de thumbnail de archivo 3D
	 */
	private async generate3DThumbnail(filePath: string, entityId: string): Promise<void> {
		try {
			// TODO: Implementar renderizado de modelo 3D
			const placeholder = this.createTextThumbnail('🎯 3D Model');
			await this.mergeThumbnailIntoMetadata(db, file3Ds, entityId, placeholder, eq);
		} catch (error) {
			console.warn('Error generando thumbnail de archivo 3D:', error);
		}
	}

	/**
	 * Placeholder para generación de thumbnail de documento
	 */
	private async generateDocumentThumbnail(filePath: string, entityId: string): Promise<void> {
		try {
			// TODO: Implementar renderizado de primera página de documento
			const placeholder = this.createTextThumbnail('📄 Document');
			await this.mergeThumbnailIntoMetadata(db, documents, entityId, placeholder, eq);
		} catch (error) {
			console.warn('Error generando thumbnail de documento:', error);
		}
	}

	/**
	 * Crea un preview de la estructura de un objeto JSON
	 */
	private createJsonStructurePreview(obj: any): string {
		if (Array.isArray(obj)) {
			const length = obj.length;
			const sample = obj.slice(0, 3).map((item) => {
				if (typeof item === 'object' && item !== null) {
					const keys = Object.keys(item);
					return `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
				}
				return typeof item;
			});
			return `Array[${length}]: [${sample.join(', ')}${length > 3 ? '...' : ''}]`;
		}

		if (typeof obj === 'object' && obj !== null) {
			const keys = Object.keys(obj);
			const sample = keys.slice(0, 5).join(', ');
			return `Object: {${sample}${keys.length > 5 ? '...' : ''}}`;
		}

		return typeof obj;
	}

	/**
	 * Crea un thumbnail de texto usando canvas simulado
	 */
	private createTextThumbnail(text: string): string {
		// Crear un SVG simple como thumbnail de texto
		const svg = `
			<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
				<rect width="200" height="200" fill="#f0f0f0" stroke="#ccc"/>
				<text x="100" y="100" text-anchor="middle" 
					  font-family="Arial" font-size="12" fill="#333">${text}</text>
			</svg>
		`;

		// Convertir SVG a base64
		return Buffer.from(svg).toString('base64');
	}

	/**
	 * Utility para fusionar thumbnail en metadata
	 */
	private async mergeThumbnailIntoMetadata(
		db: any,
		table: any,
		entityId: string,
		thumbnailBase64: string,
		eq: any
	): Promise<void> {
		try {
			// Obtener metadata existente
			const entity = await db.select().from(table).where(eq(table.id, entityId)).limit(1);

			if (entity.length === 0) return;

			const existingMetadata = entity[0].metadata;
			let metadata: any = {};

			if (existingMetadata) {
				try {
					metadata = JSON.parse(existingMetadata);
				} catch {
					metadata = {};
				}
			}

			// Agregar thumbnail
			metadata.thumbnail = thumbnailBase64;

			// Actualizar en base de datos
			await db
				.update(table)
				.set({
					metadata: JSON.stringify(metadata),
					updatedAt: new Date(),
				})
				.where(eq(table.id, entityId));
		} catch (error) {
			console.warn('Error al fusionar thumbnail en metadata:', error);
		}
	}
}
