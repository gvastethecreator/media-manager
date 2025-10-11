import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { createFile3D, getFile3DByHash } from '@/services/file3d/file3d.service';
import type { File3DCreateInput } from '@/types/entities/file3d';
import type { FileInfo } from '@/types/file-entity-mapper';
import { getMimeTypeFromExtension } from '../utils/file-info.utils';

// Regex para procesamiento de archivos OBJ
const LINE_SPLIT_REGEX = /\r?\n/;

/**
 * Procesador especializado para entidades de tipo FILE3D
 */
export class File3DProcessor {
	/**
	 * Verifica si un archivo 3D ya existe por hash
	 */
	async checkExists(hash: string): Promise<boolean> {
		if (!hash) return false;
		try {
			const existing = await getFile3DByHash(hash);
			return !!existing;
		} catch {
			return false;
		}
	}

	/**
	 * Crea entidad file3d básica en BD
	 */
	async createBasicEntity(fileInfo: FileInfo): Promise<string> {
		if (!fileInfo.hash) {
			throw new Error('File hash is required for file3d creation');
		}

		const file3dData: File3DCreateInput = {
			name: fileInfo.name,
			path: fileInfo.path,
			hash: fileInfo.hash,
			size: fileInfo.size,
			mimeType: getMimeTypeFromExtension(fileInfo.extension),
			extension: fileInfo.extension,
			folderId: fileInfo.folderId,
			isFavorite: false,
			isArchived: false,
			format: null,
			version: null,
			vertices: null,
			faces: null,
			triangles: null,
			materials: null,
			textures: null,
			animations: null,
			bones: null,
			scenes: null,
			cameras: null,
			lights: null,
			hasUV: null,
			hasNormals: null,
			hasColors: null,
			boundingBox: null,
		};

		const file3d = await createFile3D(file3dData);
		return file3d.id;
	}

	/**
	 * Extrae metadata de archivo 3D (formato, vértices, caras)
	 */
	async extractMetadata(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		try {
			const ext = extname(filePath).toLowerCase();
			const { db } = await import('@/lib/drizzle');
			const { file3Ds } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');

			let format: string | null = null;
			let rawInfo: Record<string, any> | null = null;
			let version: string | null = null;

			if (ext === '.gltf' || ext === '.glb') {
				format = 'gltf';
				if (ext === '.gltf') {
					rawInfo = await this.parseGltf(filePath);
				} else {
					// GLB: leer cabecera para versión
					try {
						const buf = await readFile(filePath);
						if (buf.length >= 8 && buf.toString('ascii', 0, 4) === 'glTF') {
							const ver = buf.readUInt32LE(4);
							version = String(ver);
						}
					} catch {
						// ignore
					}
				}
			} else if (ext === '.obj') {
				format = 'obj';
				rawInfo = await this.parseObj(filePath);
			}

			await db
				.update(file3Ds)
				.set({
					format,
					vertices: (rawInfo as any)?.vertices ?? null,
					faces: (rawInfo as any)?.faces ?? null,
					version,
					updatedAt: new Date(),
				})
				.where(eq(file3Ds.id, entityId));

			return { success: true };
		} catch {
			return { success: false, error: '3D metadata extraction failed' };
		}
	}

	/**
	 * Genera thumbnail visual para modelo 3D
	 * Por ahora usa placeholder SVG mejorado con información del modelo
	 * TODO: Implementar renderizado real con three.js headless
	 */
	async generateThumbnail(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		const { basename } = await import('node:path');
		const fileName = basename(filePath);
		
		console.log(`🎨 [File3DProcessor] Generando thumbnail: ${fileName}`);

		try {
			// Obtener metadata del modelo para mostrar en thumbnail
			const { db } = await import('@/lib/drizzle');
			const { file3Ds } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');

			const model = await db.query.file3Ds.findFirst({
				where: eq(file3Ds.id, entityId),
			});

			// Crear placeholder SVG mejorado con información del modelo
			const svg = this.create3DPlaceholderSVG(fileName, model);

			// Guardar en metadata
			const existingMetadata = model?.metadata
				? typeof model.metadata === 'string'
					? JSON.parse(model.metadata)
					: model.metadata
				: {};

			const updatedMetadata = {
				...existingMetadata,
				thumbnail: {
					data: Buffer.from(svg).toString('base64'),
					width: 320,
					height: 320,
					format: 'svg',
					isPlaceholder: true,
					generatedAt: new Date().toISOString(),
				},
			};

			await db
				.update(file3Ds)
				.set({
					metadata: JSON.stringify(updatedMetadata),
					updatedAt: new Date(),
				})
				.where(eq(file3Ds.id, entityId));

			console.log(`✅ [File3DProcessor] Placeholder thumbnail generado: ${fileName}`);
			return { success: true };
		} catch (error) {
			console.error(`❌ [File3DProcessor] Error generando thumbnail para ${fileName}:`, error);
			return { 
				success: false, 
				error: error instanceof Error ? error.message : 'Unknown error' 
			};
		}
	}

	/**
	 * Crea placeholder SVG mejorado con información del modelo 3D
	 */
	private create3DPlaceholderSVG(fileName: string, model: any): string {
		const vertices = model?.vertices || '?';
		const faces = model?.faces || '?';
		const format = model?.format?.toUpperCase() || 'Unknown';

		return `
			<svg width="320" height="320" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
						<stop offset="100%" style="stop-color:#111827;stop-opacity:1" />
					</linearGradient>
				</defs>
				<rect width="320" height="320" fill="url(#bg)"/>
				
				<!-- Icono 3D -->
				<text x="160" y="120" font-family="Arial" font-size="72" fill="#6b7280" text-anchor="middle">🎨</text>
				
				<!-- Nombre del archivo -->
				<text x="160" y="165" font-family="Arial" font-size="14" fill="#9ca3af" text-anchor="middle">${fileName}</text>
				
				<!-- Formato -->
				<text x="160" y="190" font-family="Arial, sans-serif" font-size="12" fill="#6b7280" text-anchor="middle" font-weight="bold">${format}</text>
				
				<!-- Stats -->
				<g transform="translate(160, 220)">
					<text x="0" y="0" font-family="monospace" font-size="10" fill="#4b5563" text-anchor="middle">
						Vertices: ${vertices}
					</text>
					<text x="0" y="15" font-family="monospace" font-size="10" fill="#4b5563" text-anchor="middle">
						Faces: ${faces}
					</text>
				</g>
				
				<!-- Badge de "3D Model" -->
				<rect x="100" y="270" width="120" height="25" rx="12" fill="#374151"/>
				<text x="160" y="288" font-family="Arial" font-size="12" fill="#9ca3af" text-anchor="middle">3D Model</text>
			</svg>
		`.trim();
	}

	// ===================== MÉTODOS PRIVADOS =====================

	private async parseGltf(filePath: string): Promise<Record<string, any> | null> {
		try {
			const txt = await readFile(filePath, 'utf8');
			const json = JSON.parse(txt);
			return {
				scenes: json.scenes?.length ?? null,
				materials: json.materials?.length ?? null,
				meshes: json.meshes?.length ?? null,
				nodes: json.nodes?.length ?? null,
			};
		} catch {
			return null;
		}
	}

	private async parseObj(filePath: string): Promise<Record<string, any> | null> {
		try {
			const txt = await readFile(filePath, 'utf8');
			const lines = txt.split(LINE_SPLIT_REGEX);
			let vertices = 0;
			let faces = 0;
			for (const line of lines) {
				if (line.startsWith('v ')) {
					vertices++;
				} else if (line.startsWith('f ')) {
					faces++;
				}
			}
			return { vertices, faces };
		} catch {
			return null;
		}
	}
}
