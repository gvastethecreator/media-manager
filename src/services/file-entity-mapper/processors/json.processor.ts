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
	async checkExists(fileInfo: FileInfo): Promise<boolean> {
		if (!fileInfo.hash) return false;
		try {
			const existing = await getJsonFileByHash(fileInfo.hash);
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
	 * Genera preview SVG del contenido JSON y lo guarda en metadata
	 */
	async generateThumbnail(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		const fileName = basename(filePath);

		jsonLogger.debug(`📝 [JsonProcessor] Generando thumbnail: ${fileName}`);

		try {
			const { db } = await import('@/lib/drizzle');
			const { jsonFiles } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');

			// Obtener metadata del JSON para mostrar en thumbnail
			const jsonFile = await db.query.jsonFiles.findFirst({
				where: eq(jsonFiles.id, entityId),
			});

			const keyCount = jsonFile?.keyCount ?? 0;
			const depth = jsonFile?.depth ?? 0;
			const isValid = jsonFile?.isValid ?? true;

			// Crear SVG placeholder con información del JSON
			const svg = this.createJsonPlaceholderSVG(fileName, keyCount, depth, isValid);

			// Guardar en metadata (jsonFiles tiene campo metadata)
			const existingMetadata = jsonFile?.metadata
				? typeof jsonFile.metadata === 'string'
					? JSON.parse(jsonFile.metadata)
					: jsonFile.metadata
				: {};

			const updatedMetadata = {
				...existingMetadata,
				thumbnail: {
					data: Buffer.from(svg).toString('base64'),
					width: 300,
					height: 400,
					format: 'svg',
					isPlaceholder: true,
					generatedAt: new Date().toISOString(),
				},
			};

			await db
				.update(jsonFiles)
				.set({
					metadata: JSON.stringify(updatedMetadata),
					updatedAt: new Date(),
				})
				.where(eq(jsonFiles.id, entityId));

			jsonLogger.debug(`✅ [JsonProcessor] Thumbnail generado: ${fileName}`);
			return { success: true };
		} catch (e) {
			jsonLogger.warn('Error generando thumbnail JSON:', {
				filePath,
				error: e instanceof Error ? e.message : String(e),
			});
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
		}
	}

	/**
	 * Crea placeholder SVG mejorado con información del archivo JSON
	 */
	private createJsonPlaceholderSVG(fileName: string, keyCount: number, depth: number, isValid: boolean): string {
		const keyInfo = keyCount > 0 ? `${keyCount} claves` : 'Sin claves';
		const depthInfo = depth > 0 ? `Profundidad: ${depth}` : 'Profundidad: 0';
		const validationIcon = isValid ? '✅' : '❌';

		return `
			<svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<linearGradient id="json-bg" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" style="stop-color:oklch(0.18 0.002 0);stop-opacity:1" />
						<stop offset="100%" style="stop-color:oklch(0.12 0.002 0);stop-opacity:1" />
					</linearGradient>
				</defs>
				<rect width="300" height="400" fill="url(#json-bg)" rx="8"/>

				<!-- Icono de JSON -->
				<text x="150" y="120" font-family="monospace" font-size="64" fill="oklch(0.55 0.002 0)" text-anchor="middle">{}</text>

				<!-- Validación -->
				<text x="150" y="150" font-family="Arial" font-size="32" fill="${isValid ? 'oklch(0.65 0.15 140)' : 'oklch(0.65 0.15 25)'}" text-anchor="middle">${validationIcon}</text>

				<!-- Nombre del archivo -->
				<text x="150" y="190" font-family="Arial" font-size="12" fill="oklch(0.7 0.002 0)" text-anchor="middle">${fileName}</text>

				<!-- Claves -->
				<text x="150" y="220" font-family="monospace" font-size="11" fill="oklch(0.55 0.002 0)" text-anchor="middle">
					${keyInfo}
				</text>

				<!-- Profundidad -->
				<text x="150" y="240" font-family="monospace" font-size="11" fill="oklch(0.55 0.002 0)" text-anchor="middle">
					${depthInfo}
				</text>

				<!-- Badge de "JSON" -->
				<rect x="100" y="350" width="100" height="20" rx="10" fill="oklch(0.25 0.002 0)"/>
				<text x="150" y="364" font-family="Arial" font-size="10" fill="oklch(0.7 0.002 0)" text-anchor="middle">JSON File</text>
			</svg>
		`.trim();
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
