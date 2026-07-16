import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { serverLogger } from '@/lib/logger/server-logger';
import { createFile3D, getFile3DByHash } from '@/services/file3d/file3d.service';
import type { File3DCreateInput } from '@/types/entities/file3d';
import type { FileInfo } from '@/types/file-entity-mapper';
import { getMimeTypeFromExtension } from '../utils/file-info.utils';

// Regex para procesamiento de archivos OBJ
const LINE_SPLIT_REGEX = /\r?\n/;

interface Parsed3DMetadata {
	faces?: number | null;
	materials?: number | null;
	meshes?: number | null;
	nodes?: number | null;
	scenes?: number | null;
	vertices?: number | null;
}

interface File3DPreviewModel {
	faces?: number | null;
	format?: string | null;
	vertices?: number | null;
}

const SVG_COLORS = {
	canvas: 'oklch(0.12 0.002 0)',
	canvasRaised: 'oklch(0.18 0.002 0)',
	canvasMuted: 'oklch(0.25 0.002 0)',
	muted: 'oklch(0.7 0.002 0)',
	subtle: 'oklch(0.55 0.002 0)',
	subtler: 'oklch(0.45 0.002 0)',
};

const escapeSvgText = (value: string): string =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

const truncateText = (value: string, maxLength: number): string =>
	value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

/**
 * Procesador especializado para entidades de tipo FILE3D
 */
export class File3DProcessor {
	/**
	 * Verifica si un archivo 3D ya existe por hash
	 */
	async checkExists(fileInfo: FileInfo): Promise<boolean> {
		if (!fileInfo.hash) return false;
		try {
			const existing = await getFile3DByHash(fileInfo.hash);
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
			let rawInfo: Parsed3DMetadata | null = null;
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
					vertices: rawInfo?.vertices ?? null,
					faces: rawInfo?.faces ?? null,
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
	 * Usa SVG determinista con metadata del modelo para previews rápidas y seguras.
	 */
	async generateThumbnail(filePath: string, entityId: string): Promise<{ success: boolean; error?: string }> {
		const { basename } = await import('node:path');
		const fileName = basename(filePath);

		serverLogger.debug(`🎨 [File3DProcessor] Generando thumbnail: ${fileName}`);

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

			serverLogger.debug(`✅ [File3DProcessor] Placeholder thumbnail generado: ${fileName}`);
			return { success: true };
		} catch (error) {
			serverLogger.error(`❌ [File3DProcessor] Error generando thumbnail para ${fileName}:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Crea placeholder SVG mejorado con información del modelo 3D
	 */
	private create3DPlaceholderSVG(fileName: string, model: File3DPreviewModel | null | undefined): string {
		const vertices = model?.vertices || '?';
		const faces = model?.faces || '?';
		const format = model?.format?.toUpperCase() || 'Unknown';
		const safeFileName = escapeSvgText(truncateText(fileName, 36));
		const safeFormat = escapeSvgText(format);

		return `
			<svg width="320" height="320" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" style="stop-color:${SVG_COLORS.canvasRaised};stop-opacity:1" />
						<stop offset="100%" style="stop-color:${SVG_COLORS.canvas};stop-opacity:1" />
					</linearGradient>
				</defs>
				<rect width="320" height="320" fill="url(#bg)"/>
				
				<!-- Icono 3D -->
				<text x="160" y="120" font-family="Arial" font-size="72" fill="${SVG_COLORS.subtle}" text-anchor="middle">🎨</text>
				
				<!-- Nombre del archivo -->
				<text x="160" y="165" font-family="Arial" font-size="14" fill="${SVG_COLORS.muted}" text-anchor="middle">${safeFileName}</text>
				
				<!-- Formato -->
				<text x="160" y="190" font-family="Arial, sans-serif" font-size="12" fill="${SVG_COLORS.subtle}" text-anchor="middle" font-weight="bold">${safeFormat}</text>
				
				<!-- Stats -->
				<g transform="translate(160, 220)">
					<text x="0" y="0" font-family="monospace" font-size="10" fill="${SVG_COLORS.subtler}" text-anchor="middle">
						Vertices: ${escapeSvgText(String(vertices))}
					</text>
					<text x="0" y="15" font-family="monospace" font-size="10" fill="${SVG_COLORS.subtler}" text-anchor="middle">
						Faces: ${escapeSvgText(String(faces))}
					</text>
				</g>
				
				<!-- Badge de "3D Model" -->
				<rect x="100" y="270" width="120" height="25" rx="12" fill="${SVG_COLORS.canvasMuted}"/>
				<text x="160" y="288" font-family="Arial" font-size="12" fill="${SVG_COLORS.muted}" text-anchor="middle">3D Model</text>
			</svg>
		`.trim();
	}

	// ===================== MÉTODOS PRIVADOS =====================

	private async parseGltf(filePath: string): Promise<Parsed3DMetadata | null> {
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

	private async parseObj(filePath: string): Promise<Parsed3DMetadata | null> {
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
