import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { serverLogger } from '@/lib/logger/server-logger';
import { createJsonFile, getJsonFileByHash } from '@/services/json-file/json-file.service';
import type { JsonFileCreateInput } from '@/types/entities/json-file';
import type { FileInfo } from '@/types/file-entity-mapper';
import { getMimeTypeFromExtension } from '../utils/file-info.utils';

const jsonLogger = serverLogger.withContext('JsonProcessor');

/**
 * Procesador especializado para entidades de tipo JSON
 */
export class JsonProcessor {
	/**
	 * Verifica si un archivo JSON ya existe por hash
	 */
	async checkExists(hash: string): Promise<boolean> {
		if (!hash) return false;
		try {
			const existing = await getJsonFileByHash(hash);
			return !!existing;
		} catch {
			return false;
		}
	}

	/**
	 * Crea entidad JSON básica en BD
	 */
	async createBasicEntity(fileInfo: FileInfo): Promise<string> {
		if (!fileInfo.hash) {
			throw new Error('File hash is required for json creation');
		}

		const jsonData: JsonFileCreateInput = {
			name: fileInfo.name,
			path: fileInfo.path,
			size: fileInfo.size,
			hash: fileInfo.hash,
			mimeType: getMimeTypeFromExtension(fileInfo.extension),
			extension: fileInfo.extension,
			folderId: fileInfo.folderId,
			isFavorite: false,
			isArchived: false,
			content: null,
			schema: null as any,
			isValid: true as any,
			validationErrors: null as any,
			keyCount: null as any,
			depth: null as any,
		};

		const json = await createJsonFile(jsonData as any);
		return json.id as string;
	}

	/**
	 * Extrae metadata de JSON (validez, profundidad, tipo)
	 */
	async extractMetadata(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
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
					keyCount = this.countJsonKeys(parsed);
					depth = this.computeJsonDepth(parsed);

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
				content: contentText && contentText.length < 50_000 ? contentText : null,
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

	/**
	 * Genera preview SVG del contenido JSON
	 */
	async generateThumbnail(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		try {
			const { generateJsonPreview } = await import('@/config/thumbnail-generators');

			const mockItem = {
				id: entityId,
				name: basename(filePath),
				path: filePath,
				entityType: 'jsonFile' as const,
			};

			const thumbnailUrl = await generateJsonPreview(mockItem as any);
			if (!thumbnailUrl) {
				return { success: false, error: 'Failed to generate JSON preview' };
			}

			jsonLogger.debug(`✅ JSON thumbnail generado para: ${filePath}`);
			return { success: true };
		} catch (e) {
			jsonLogger.warn('Error generando thumbnail JSON:', { filePath, error: e instanceof Error ? e.message : String(e) });
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
		}
	}

	// ===================== MÉTODOS PRIVADOS =====================

	private computeJsonDepth(obj: any): number {
		if (obj === null || typeof obj !== 'object') return 0;
		let max = 0;
		for (const v of Object.values(obj)) {
			const d = this.computeJsonDepth(v);
			if (d > max) max = d;
		}
		return max + 1;
	}

	private countJsonKeys(obj: any): number {
		if (obj === null || typeof obj !== 'object') return 0;
		let count = 0;
		for (const [_, v] of Object.entries(obj)) {
			count += 1;
			count += this.countJsonKeys(v);
		}
		return count;
	}
}
