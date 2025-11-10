/**
 * @file Handler de metadata para documentos
 * @module file-entity-mapper/handlers
 */

import { extname } from 'node:path';
import { readFile } from 'node:fs/promises';

// Regex reutilizables para evitar recreación
const WORD_SPLIT_REGEX = /\s+/g;

/**
 * Maneja extracción y persistencia de metadata para documentos
 */
export async function handleDocumentMetadata(filePath: string, entityId: string) {
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
			// Heurística simple: contar ocurrencias de '/Type /Page'
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

			// Detectar frontmatter en archivos markdown
			if (ext === '.md') {
				hasFrontmatter = text.startsWith('---\n') || text.startsWith('+++\n');
			}
		}

		// Crear enhanced metadata usando nuestro formato
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
