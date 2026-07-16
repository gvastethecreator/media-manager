import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { serverLogger } from '@/lib/logger/server-logger';
import { createDocument, getDocumentByHash } from '@/services/document/document.service';
import type { DocumentCreateInput } from '@/transformers/document/validators';
import type { FileInfo } from '@/types/file-entity-mapper';
import { getMimeTypeFromExtension } from '../utils/file-info.utils';

// Regex reutilizables para procesamiento de documentos
const WORD_SPLIT_REGEX = /\s+/g;

/**
 * Procesador especializado para entidades de tipo DOCUMENT
 */
export class DocumentProcessor {
	/**
	 * Verifica si un documento ya existe por hash
	 */
	async checkExists(fileInfo: FileInfo): Promise<boolean> {
		if (!fileInfo.hash) return false;
		try {
			const existing = await getDocumentByHash(fileInfo.hash);
			return !!existing;
		} catch {
			return false;
		}
	}

	/**
	 * Crea entidad documento básica en BD
	 */
	async createBasicEntity(fileInfo: FileInfo): Promise<string> {
		if (!fileInfo.hash) {
			throw new Error('File hash is required for document creation');
		}

		const documentData: DocumentCreateInput = {
			name: fileInfo.name,
			path: fileInfo.path,
			hash: fileInfo.hash,
			size: fileInfo.size,
			mimeType: getMimeTypeFromExtension(fileInfo.extension),
			extension: fileInfo.extension,
			folderId: fileInfo.folderId,
			isFavorite: false,
			isArchived: false,
			pageCount: null,
			wordCount: null,
			language: null,
			title: null,
			author: null,
			subject: null,
			keywords: null,
			creator: null,
			producer: null,
			creationDate: null,
			modificationDate: null,
			encrypted: null,
			version: null,
			content: null,
			summary: null,
		};

		const document = await createDocument(documentData);
		return document.id;
	}

	/**
	 * Extrae metadata de documento (páginas, palabras, frontmatter)
	 */
	async extractMetadata(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		try {
			const ext = extname(filePath).toLowerCase();
			const { db } = await import('@/lib/drizzle');
			const { documents } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');

			let pageCount: number | null = null;
			let wordCount: number | null = null;
			let contentPreview: string | null = null;
			let hasFrontmatter = false;
			let documentType = 'unknown';

			if (ext === '.pdf') {
				documentType = 'pdf';
				const buf = await readFile(filePath);
				const text = buf.toString('latin1');
				const matches = text.match(/\/Type\s*\/Page/g);
				pageCount = matches ? matches.length : null;
			} else if (ext === '.txt' || ext === '.md') {
				documentType = ext === '.md' ? 'markdown' : 'text';
				const buf = await readFile(filePath);
				const text = buf.toString('utf8');
				const words = text.trim().split(WORD_SPLIT_REGEX).filter(Boolean);
				wordCount = words.length;
				contentPreview = text.slice(0, 800);

				if (ext === '.md') {
					hasFrontmatter = text.startsWith('---\n') || text.startsWith('+++\n');
				}
			}

			const enhancedMetadata = {
				documentData: {
					type: documentType,
					wordCount,
					pageCount,
					hasFrontmatter,
					encoding: 'utf8',
				},
				preview: contentPreview,
			};

			await db
				.update(documents)
				.set({
					pageCount,
					wordCount,
					metadata: JSON.stringify(enhancedMetadata),
					updatedAt: new Date(),
				})
				.where(eq(documents.id, entityId));

			return { success: true };
		} catch (e) {
			return { success: false, error: 'Document metadata extraction failed' };
		}
	}

	/**
	 * Genera preview SVG para el documento y lo guarda en tabla metadatas
	 */
	async generateThumbnail(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		const { basename } = await import('node:path');
		const fileName = basename(filePath);

		serverLogger.debug(`📄 [DocumentProcessor] Generando thumbnail: ${fileName}`);

		try {
			const { db } = await import('@/lib/drizzle');
			const { documents } = await import('@/lib/drizzle/schema');
			const { metadatas } = await import('@/lib/drizzle/schema/core');
			const { eq } = await import('drizzle-orm');

			// Obtener metadata del documento para mostrar en thumbnail
			const document = await db.query.documents.findFirst({
				where: eq(documents.id, entityId),
			});

			const pageCount = document?.pageCount ?? 0;
			const wordCount = document?.wordCount ?? 0;

			// Crear SVG placeholder con información del documento
			const svg = this.createDocumentPlaceholderSVG(fileName, pageCount, wordCount);

			// Guardar en tabla metadatas (no hay campo thumbnail dedicado en documents)
			const svgBase64 = Buffer.from(svg).toString('base64');

			await db
				.insert(metadatas)
				.values({
					id: `${entityId}-thumbnail`,
					entityType: 'document',
					entityId,
					key: 'thumbnail',
					value: svgBase64,
					type: 'base64',
					category: 'preview',
					description: 'Document thumbnail preview',
				})
				.onConflictDoUpdate({
					target: metadatas.id,
					set: {
						value: svgBase64,
						updatedAt: new Date(),
					},
				});

			serverLogger.debug(`✅ [DocumentProcessor] Thumbnail generado: ${fileName}`);
			return { success: true };
		} catch (e) {
			serverLogger.warn('Error generando thumbnail documento:', {
				filePath,
				error: e instanceof Error ? e.message : String(e),
			});
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
		}
	}

	/**
	 * Crea placeholder SVG mejorado con información del documento
	 */
	private createDocumentPlaceholderSVG(fileName: string, pageCount: number, wordCount: number): string {
		const pageInfo = pageCount > 0 ? `${pageCount} páginas` : 'Desconocido';
		const wordInfo = wordCount > 0 ? `${wordCount.toLocaleString()} palabras` : '';

		return `
			<svg width="212" height="300" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<linearGradient id="doc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" style="stop-color:oklch(0.18 0.002 0);stop-opacity:1" />
						<stop offset="100%" style="stop-color:oklch(0.12 0.002 0);stop-opacity:1" />
					</linearGradient>
				</defs>
				<rect width="212" height="300" fill="url(#doc-bg)" rx="8"/>

				<!-- Icono de documento -->
				<text x="106" y="100" font-family="Arial" font-size="64" fill="oklch(0.55 0.002 0)" text-anchor="middle">📄</text>

				<!-- Nombre del archivo -->
				<text x="106" y="145" font-family="Arial" font-size="12" fill="oklch(0.7 0.002 0)" text-anchor="middle">${fileName}</text>

				<!-- Páginas -->
				<text x="106" y="170" font-family="monospace" font-size="10" fill="oklch(0.55 0.002 0)" text-anchor="middle">
					${pageInfo}
				</text>

				${
					wordInfo
						? `<text x="106" y="185" font-family="monospace" font-size="10" fill="oklch(0.55 0.002 0)" text-anchor="middle">
					${wordInfo}
				</text>`
						: ''
				}

				<!-- Badge de "Document" -->
				<rect x="50" y="260" width="112" height="20" rx="10" fill="oklch(0.25 0.002 0)"/>
				<text x="106" y="274" font-family="Arial" font-size="10" fill="oklch(0.7 0.002 0)" text-anchor="middle">Document</text>
			</svg>
		`.trim();
	}
}
