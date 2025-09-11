/**
 * @file Extractor de metadata para documentos
 * @module services/file-entity-mapper/metadata/document-metadata
 */

import { eq } from 'drizzle-orm';
import { readFile } from 'node:fs/promises';
import { db } from '@/lib/drizzle';
import { documents } from '@/lib/drizzle/schema';

/**
 * Servicio especializado en la extracción de metadata de documentos
 */
export class DocumentMetadataExtractor {
	private static instance: DocumentMetadataExtractor;

	private constructor() {}

	public static getInstance(): DocumentMetadataExtractor {
		if (!DocumentMetadataExtractor.instance) {
			DocumentMetadataExtractor.instance = new DocumentMetadataExtractor();
		}
		return DocumentMetadataExtractor.instance;
	}

	/**
	 * Extrae metadata de un documento y actualiza la entidad en la base de datos
	 */
	public async extractMetadata(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		try {
			// Placeholder para extracción de metadata de documentos
			// En el futuro se puede integrar con librerías como pdf-parse, mammoth, etc.

			const metadata = await this.extractDocumentMetadata(filePath);

			// Actualizar la entidad en la base de datos
			await db
				.update(documents)
				.set({
					pageCount: metadata.pageCount,
					wordCount: metadata.wordCount,
					language: metadata.language,
					title: metadata.title,
					author: metadata.author,
					subject: metadata.subject,
					keywords: metadata.keywords,
					creator: metadata.creator,
					producer: metadata.producer,
					creationDate: metadata.creationDate,
					modificationDate: metadata.modificationDate,
					encrypted: metadata.encrypted,
					version: metadata.version,
					content: metadata.content,
					summary: metadata.summary,
					updatedAt: new Date(),
				})
				.where(eq(documents.id, entityId));

			return { success: true };
		} catch (error) {
			console.warn('❌ Error al extraer metadata de documento:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Extrae metadata específica de documentos
	 */
	private async extractDocumentMetadata(filePath: string) {
		// Leer el archivo para análisis básico
		const buffer = await readFile(filePath);
		const content = buffer.toString('utf-8', 0, Math.min(1000, buffer.length));

		// Metadata básica que se puede extraer
		const metadata = {
			pageCount: null as number | null,
			wordCount: this.estimateWordCount(content),
			language: this.detectLanguage(content),
			title: this.extractTitleFromContent(content),
			author: null as string | null,
			subject: null as string | null,
			keywords: null as string | null,
			creator: null as string | null,
			producer: null as string | null,
			creationDate: null as Date | null,
			modificationDate: null as Date | null,
			encrypted: false,
			version: null as string | null,
			content: content.substring(0, 2000), // Primeros 2000 caracteres
			summary: this.generateBasicSummary(content),
		};

		return metadata;
	}

	/**
	 * Estima el número de palabras en el contenido
	 */
	private estimateWordCount(content: string): number | null {
		if (!content || typeof content !== 'string') return null;

		// Eliminar caracteres especiales y contar palabras
		const words = content
			.replace(/[^\w\s]/g, ' ')
			.split(/\s+/)
			.filter((word) => word.length > 0);

		return words.length;
	}

	/**
	 * Detecta el idioma del contenido de forma básica
	 */
	private detectLanguage(content: string): string | null {
		if (!content || typeof content !== 'string') return null;

		// Detección básica basada en palabras comunes
		const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no'];
		const englishWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it'];

		const lowerContent = content.toLowerCase();

		let spanishCount = 0;
		let englishCount = 0;

		for (const word of spanishWords) {
			if (lowerContent.includes(` ${word} `)) spanishCount++;
		}

		for (const word of englishWords) {
			if (lowerContent.includes(` ${word} `)) englishCount++;
		}

		if (spanishCount > englishCount) return 'es';
		if (englishCount > spanishCount) return 'en';

		return null;
	}

	/**
	 * Extrae un título del contenido
	 */
	private extractTitleFromContent(content: string): string | null {
		if (!content || typeof content !== 'string') return null;

		// Buscar patrones de título en las primeras líneas
		const lines = content.split('\n').slice(0, 5);

		for (const line of lines) {
			const trimmed = line.trim();
			// Si la línea tiene entre 5 y 100 caracteres y no parece código
			if (
				trimmed.length >= 5 &&
				trimmed.length <= 100 &&
				!trimmed.includes('=') &&
				!trimmed.includes('{') &&
				!trimmed.includes('<')
			) {
				return trimmed;
			}
		}

		return null;
	}

	/**
	 * Genera un resumen básico del contenido
	 */
	private generateBasicSummary(content: string): string | null {
		if (!content || typeof content !== 'string') return null;

		// Tomar las primeras 200 palabras como resumen
		const words = content
			.replace(/[^\w\s]/g, ' ')
			.split(/\s+/)
			.filter((word) => word.length > 0)
			.slice(0, 200);

		if (words.length === 0) return null;

		const summary = words.join(' ');
		return summary.length > 500 ? `${summary.substring(0, 500)}...` : summary;
	}
}
