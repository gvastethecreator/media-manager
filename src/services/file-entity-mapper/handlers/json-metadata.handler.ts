/**
 * @file Handler de metadata para archivos JSON
 * @module file-entity-mapper/handlers
 */

import { basename } from 'node:path';
import { readFile } from 'node:fs/promises';

/**
 * Calcula la profundidad de un objeto JSON
 */
function computeJsonDepth(obj: any): number {
	if (obj === null || typeof obj !== 'object') return 0;
	let max = 0;
	for (const v of Object.values(obj)) {
		const d = computeJsonDepth(v);
		if (d > max) max = d;
	}
	return max + 1;
}

/**
 * Cuenta el número total de claves en un objeto JSON
 */
function countJsonKeys(obj: any): number {
	if (obj === null || typeof obj !== 'object') return 0;
	let count = 0;
	for (const [_, v] of Object.entries(obj)) {
		count += 1;
		count += countJsonKeys(v);
	}
	return count;
}

/**
 * Maneja extracción y persistencia de metadata para archivos JSON
 */
export async function handleJsonMetadata(filePath: string, entityId: string) {
	try {
		const { db } = await import('@/lib/drizzle');
		const { jsonFiles } = await import('@/lib/drizzle/schema');
		const { eq } = await import('drizzle-orm');

		let contentText: string | null = null;
		try {
			const buf = await readFile(filePath);
			contentText = buf.toString('utf8');
		} catch {
			contentText = null;
		}

		let isValid = false;
		let validationErrors: string | null = null;
		let keyCount: number | null = null;
		let depth: number | null = null;
		let parsed: any = null;
		let jsonType = 'generic';

		if (contentText && contentText.trim().length > 0) {
			try {
				parsed = JSON.parse(contentText);
				isValid = true;
				keyCount = countJsonKeys(parsed);
				depth = computeJsonDepth(parsed);

				// Detectar tipo de JSON especial
				const fileName = basename(filePath).toLowerCase();
				if (fileName === 'package.json') {
					jsonType = 'package';
				} else if (fileName === 'tsconfig.json') {
					jsonType = 'tsconfig';
				} else if (parsed.configurations || parsed.launch) {
					jsonType = 'vscode';
				}
			} catch (e) {
				isValid = false;
				validationErrors = (e as Error).message;
			}
		}

		// Crear enhanced metadata usando nuestro formato
		const enhancedMetadata = {
			jsonData: {
				type: jsonType,
				keyCount,
				depth,
				size: contentText?.length || 0,
				isValid,
				validationErrors,
				hasNestedObjects: depth !== null && depth > 1,
				isPackageJson: jsonType === 'package',
			},
			content: contentText && contentText.length < 50_000 ? contentText : null, // Limitar contenido muy grande
		};

		await db
			.update(jsonFiles)
			.set({
				content: contentText,
				isValid,
				validationErrors,
				keyCount,
				depth,
				metadata: JSON.stringify(enhancedMetadata),
				updatedAt: new Date(),
			})
			.where(eq(jsonFiles.id, entityId));
		return { success: true };
	} catch (e) {
		return { success: false, error: 'JSON metadata extraction failed' };
	}
}
