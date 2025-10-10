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
	 * Genera placeholder SVG para modelo 3D
	 */
	async generateThumbnail(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		try {
			const { generate3DModelThumbnail } = await import('@/config/thumbnail-generators');
			const { basename } = await import('node:path');

			const mockItem = {
				id: entityId,
				name: basename(filePath),
				path: filePath,
				entityType: 'file3d' as const,
			};

			const thumbnailUrl = await generate3DModelThumbnail(mockItem as any);
			if (!thumbnailUrl) {
				return { success: false, error: 'Failed to generate 3D preview' };
			}

			console.log(`✅ 3D Model thumbnail generado para: ${filePath}`);
			return { success: true };
		} catch (e) {
			console.warn('Error generando thumbnail 3D:', filePath, e);
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
		}
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
