/**
 * @file Servicio de metadata unificada para imágenes
 * @module services/file-entity-mapper/metadata/unified-image-metadata
 */

import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { images } from '@/lib/drizzle/schema';
import { EntityType } from '@/types/file-entity-mapper';
import { ImageMetadataExtractor } from './image-metadata.extractor';

/**
 * Servicio especializado en metadata unificada y diferida de imágenes
 */
export class UnifiedImageMetadataService {
	private static instance: UnifiedImageMetadataService;
	private imageMetadataExtractor: ImageMetadataExtractor;

	private constructor() {
		this.imageMetadataExtractor = ImageMetadataExtractor.getInstance();
	}

	public static getInstance(): UnifiedImageMetadataService {
		if (!UnifiedImageMetadataService.instance) {
			UnifiedImageMetadataService.instance = new UnifiedImageMetadataService();
		}
		return UnifiedImageMetadataService.instance;
	}

	/**
	 * Ejecuta extracción unificada de metadata de imagen
	 */
	public async runUnifiedImageMetadataExtraction(filePath: string): Promise<void> {
		try {
			// Buscar si ya existe una imagen con este path
			const existing = await db.select().from(images).where(eq(images.path, filePath)).limit(1);

			if (existing.length === 0) {
				console.warn(`No se encontró imagen existente para ${filePath}`);
				return;
			}

			const imageEntity = existing[0];

			// Verificar si ya tiene metadata AI
			let hasAIMetadata = false;
			if (imageEntity.metadata) {
				try {
					const metadata = JSON.parse(imageEntity.metadata);
					hasAIMetadata = Boolean(metadata.ai_metadata || metadata.aiMetadata);
				} catch {
					// Metadata corrupta, continuar con extracción
				}
			}

			// Si ya tiene metadata AI, no extraer de nuevo
			if (hasAIMetadata) {
				console.log(`Imagen ${filePath} ya tiene metadata AI, omitiendo extracción`);
				return;
			}

			// Extraer metadata
			await this.imageMetadataExtractor.extractMetadata(filePath);
		} catch (error) {
			console.warn('Error en extracción unificada de metadata de imagen:', error);
		}
	}

	/**
	 * Extracción diferida de metadata para imágenes que posiblemente la necesiten
	 */
	public async maybeDeferredImageMetadataExtraction(filePath: string, entityType: EntityType): Promise<void> {
		// Solo procesar si es una imagen
		if (entityType !== EntityType.IMAGE) {
			return;
		}

		try {
			// Buscar imagen existente
			const existing = await db.select().from(images).where(eq(images.path, filePath)).limit(1);

			if (existing.length === 0) {
				console.warn(`Imagen no encontrada para extracción diferida: ${filePath}`);
				return;
			}

			const imageEntity = existing[0];

			// Verificar si ya tiene metadata AI
			let hasAIMetadata = false;
			if (imageEntity.metadata) {
				try {
					const metadata = JSON.parse(imageEntity.metadata);
					hasAIMetadata = Boolean(metadata.ai_metadata || metadata.aiMetadata);
				} catch {
					// Metadata corrupta, proceder con extracción
				}
			}

			// Si ya tiene metadata AI, no extraer
			if (hasAIMetadata) {
				return;
			}

			// Ejecutar extracción diferida
			console.log(`🕐 Ejecutando extracción diferida de metadata para ${filePath}`);
			await this.imageMetadataExtractor.extractMetadata(filePath);
		} catch (error) {
			console.warn('Error en extracción diferida de metadata:', error);
		}
	}

	/**
	 * Verifica si una imagen necesita extracción de metadata
	 */
	public async needsMetadataExtraction(filePath: string): Promise<boolean> {
		try {
			const existing = await db.select().from(images).where(eq(images.path, filePath)).limit(1);

			if (existing.length === 0) {
				return false; // No existe la imagen
			}

			const imageEntity = existing[0];

			// Si no tiene metadata, necesita extracción
			if (!imageEntity.metadata) {
				return true;
			}

			try {
				const metadata = JSON.parse(imageEntity.metadata);
				// Si no tiene metadata AI, necesita extracción
				return !(metadata.ai_metadata || metadata.aiMetadata);
			} catch {
				// Metadata corrupta, necesita extracción
				return true;
			}
		} catch (error) {
			console.warn('Error verificando si necesita metadata:', error);
			return false;
		}
	}

	/**
	 * Procesa múltiples imágenes para extracción diferida
	 */
	public async processBatchDeferredExtraction(imagePaths: string[]): Promise<void> {
		console.log(`🔄 Procesando ${imagePaths.length} imágenes para extracción diferida`);

		for (const imagePath of imagePaths) {
			try {
				if (await this.needsMetadataExtraction(imagePath)) {
					await this.maybeDeferredImageMetadataExtraction(imagePath, EntityType.IMAGE);
				}
			} catch (error) {
				console.warn(`Error procesando ${imagePath}:`, error);
			}
		}

		console.log(`✅ Completado procesamiento de ${imagePaths.length} imágenes`);
	}
}
