/**
 * @file Extractor de metadata para archivos JSON
 * @module services/file-entity-mapper/metadata/json-metadata
 */

import { readFile } from 'node:fs/promises';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { jsonFiles } from '@/lib/drizzle/schema';

/**
 * Servicio especializado en la extracción de metadata de archivos JSON
 */
export class JsonMetadataExtractor {
	private static instance: JsonMetadataExtractor;

	private constructor() {}

	public static getInstance(): JsonMetadataExtractor {
		if (!JsonMetadataExtractor.instance) {
			JsonMetadataExtractor.instance = new JsonMetadataExtractor();
		}
		return JsonMetadataExtractor.instance;
	}

	/**
	 * Extrae metadata de un archivo JSON y actualiza la entidad en la base de datos
	 */
	public async extractMetadata(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		try {
			const metadata = await this.extractJsonMetadata(filePath);

			// Actualizar la entidad en la base de datos
			await db
				.update(jsonFiles)
				.set({
					content: metadata.content,
					schema: metadata.schema,
					isValid: metadata.isValid,
					validationErrors: metadata.validationErrors,
					keyCount: metadata.keyCount,
					depth: metadata.depth,
					updatedAt: new Date(),
				})
				.where(eq(jsonFiles.id, entityId));

			return { success: true };
		} catch (error) {
			console.warn('❌ Error al extraer metadata de archivo JSON:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Extrae metadata específica de archivos JSON
	 */
	private async extractJsonMetadata(filePath: string) {
		try {
			const content = await readFile(filePath, 'utf-8');

			let isValid = true;
			let parsedContent: any = null;
			let validationErrors: string | null = null;

			// Intentar parsear el JSON
			try {
				parsedContent = JSON.parse(content);
			} catch (parseError) {
				isValid = false;
				validationErrors = parseError instanceof Error ? parseError.message : 'Invalid JSON format';
			}

			const metadata = {
				content: content.length > 50_000 ? content.substring(0, 50_000) : content, // Limitar contenido a 50KB
				schema: null as string | null,
				isValid,
				validationErrors,
				keyCount: isValid && parsedContent ? this.countKeys(parsedContent) : null,
				depth: isValid && parsedContent ? this.calculateDepth(parsedContent) : null,
			};

			// Intentar detectar el esquema si es válido
			if (isValid && parsedContent) {
				metadata.schema = this.detectSchema(parsedContent);
			}

			return metadata;
		} catch (error) {
			return {
				content: null,
				schema: null,
				isValid: false,
				validationErrors: error instanceof Error ? error.message : 'Error reading file',
				keyCount: null,
				depth: null,
			};
		}
	}

	/**
	 * Cuenta recursivamente las claves en un objeto JSON
	 */
	private countKeys(obj: any, visited = new WeakSet()): number {
		if (obj === null || typeof obj !== 'object') {
			return 0;
		}

		// Evitar ciclos infinitos
		if (visited.has(obj)) {
			return 0;
		}
		visited.add(obj);

		let count = 0;

		if (Array.isArray(obj)) {
			// Para arrays, contar las claves de todos los objetos dentro
			for (const item of obj) {
				count += this.countKeys(item, visited);
			}
		} else {
			// Para objetos, contar las claves propias
			count = Object.keys(obj).length;

			// Recursivamente contar claves en propiedades anidadas
			for (const value of Object.values(obj)) {
				count += this.countKeys(value, visited);
			}
		}

		return count;
	}

	/**
	 * Calcula la profundidad máxima de anidamiento
	 */
	private calculateDepth(obj: any, visited = new WeakSet()): number {
		if (obj === null || typeof obj !== 'object') {
			return 0;
		}

		// Evitar ciclos infinitos
		if (visited.has(obj)) {
			return 0;
		}
		visited.add(obj);

		let maxDepth = 0;

		if (Array.isArray(obj)) {
			for (const item of obj) {
				const depth = this.calculateDepth(item, visited);
				maxDepth = Math.max(maxDepth, depth);
			}
		} else {
			for (const value of Object.values(obj)) {
				const depth = this.calculateDepth(value, visited);
				maxDepth = Math.max(maxDepth, depth);
			}
		}

		return maxDepth + 1;
	}

	/**
	 * Detecta el tipo de esquema o estructura del JSON
	 */
	private detectSchema(obj: any): string | null {
		if (!obj || typeof obj !== 'object') {
			return null;
		}

		// Detectar algunos patrones comunes
		const keys = Object.keys(obj);

		// GeoJSON
		if (keys.includes('type') && keys.includes('coordinates')) {
			return 'geojson';
		}

		// Package.json
		if (keys.includes('name') && keys.includes('version') && keys.includes('dependencies')) {
			return 'package.json';
		}

		// OpenAPI/Swagger
		if (keys.includes('openapi') || keys.includes('swagger')) {
			return 'openapi';
		}

		// JSON Schema
		if (keys.includes('$schema') || (keys.includes('type') && keys.includes('properties'))) {
			return 'json-schema';
		}

		// Configuración de proyecto
		if (keys.includes('compilerOptions') || keys.includes('include') || keys.includes('exclude')) {
			return 'tsconfig';
		}

		// Array de objetos (dataset)
		if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
			return 'dataset';
		}

		// Objeto genérico
		return 'object';
	}
}
