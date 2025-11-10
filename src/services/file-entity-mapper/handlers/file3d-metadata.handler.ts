/**
 * @file Handler de metadata para archivos 3D
 * @module file-entity-mapper/handlers
 */

import { extname } from 'node:path';
import { readFile } from 'node:fs/promises';

// Regex para parseo de OBJ
const LINE_SPLIT_REGEX = /\r?\n/;

/**
 * Parsea archivo GLTF y extrae estadísticas
 */
async function parseGltf(filePath: string) {
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

/**
 * Parsea archivo OBJ y cuenta vértices/caras
 */
async function parseObj(filePath: string) {
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

/**
 * Maneja extracción y persistencia de metadata para archivos 3D
 */
export async function handleFile3DMetadata(filePath: string, entityId: string) {
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
				const parsed = await parseGltf(filePath);
				rawInfo = parsed;
			} else {
				// GLB: leer cabecera para versión (bytes 0-3 magic, 4-7 version LE)
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
			rawInfo = await parseObj(filePath);
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
