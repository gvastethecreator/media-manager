// Serializers para File3D

import { createDefaultEntityStats } from '@/lib/utils';
import type { File3DWithStats } from '../../types/entities/file3d';

export function validateFile3D(input: unknown): File3DWithStats {
	// Por ahora, una implementación simple hasta que esté listo el schema
	if (!input || typeof input !== 'object') {
		throw new Error('Los datos de entrada deben ser un objeto válido');
	}

	const data = input as Record<string, unknown>;

	// Crear File3D básico basándose en el schema local (Drizzle)
	const file3D: File3DWithStats = {
		id: (data.id as string) || generateId(),
		name: (data.name as string) || 'Sin nombre',
		path: (data.path as string) || '',
		size: (data.size as number) || 0,
		hash: (data.hash as string) || '',
		mimeType: (data.mimeType as string) || 'application/octet-stream',
		extension: (data.extension as string) || '',
		folderId: (data.folderId as string) || '',
		isFavorite: data.isFavorite as boolean,
		isArchived: data.isArchived as boolean,
		format: (data.format as string) || null,
		version: (data.version as string) || null,
		vertices: (data.vertices as number) || null,
		faces: (data.faces as number) || null,
		triangles: (data.triangles as number) || null,
		materials: (data.materials as number) || null,
		textures: (data.textures as number) || null,
		animations: (data.animations as number) || null,
		bones: (data.bones as number) || null,
		scenes: (data.scenes as number) || null,
		cameras: (data.cameras as number) || null,
		lights: (data.lights as number) || null,
		hasUV: (data.hasUV as boolean) || null,
		hasNormals: (data.hasNormals as boolean) || null,
		hasColors: (data.hasColors as boolean) || null,
		boundingBox: (data.boundingBox as string) || null,
		createdAt: new Date(),
		updatedAt: new Date(),
		stats: {
			...createDefaultEntityStats({
				size: (data.size as number) || 0,
				type: 'data',
			}),
			polygonCount: 0,
			textureSize: 0,
			format: (data.format as string) || 'unknown',
			vertexCount: 0,
			materialCount: 0,
			isDirectory: false,
			isFile: true,
		},
	};

	return file3D;
}

function generateId(): string {
	return `file3d_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
