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
	async checkExists(hash: string): Promise<boolean> {
		if (!hash) return false;
		try {
			const existing = await getDocumentByHash(hash);
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
	 * Genera preview SVG para el documento
	 */
	async generateThumbnail(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		try {
			const { generateDocumentPreview } = await import('@/config/thumbnail-generators');
			const { basename } = await import('node:path');

			const mockItem = {
				id: entityId,
				name: basename(filePath),
				path: filePath,
				entityType: 'document' as const,
			};

			const thumbnailUrl = await generateDocumentPreview(mockItem as any);
			if (!thumbnailUrl) {
				return { success: false, error: 'Failed to generate preview' };
			}

			serverLogger.debug(`✅ Document thumbnail generado para: ${filePath}`);
			return { success: true };
		} catch (e) {
			serverLogger.warn('Error generando thumbnail documento:', {
				filePath,
				error: e instanceof Error ? e.message : String(e),
			});
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
		}
	}
}
