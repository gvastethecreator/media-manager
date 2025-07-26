// Serializers para File3D

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
		filePath: (data.filePath as string) || '',
		format: (data.format as string) || 'unknown',
		size: (data.size as number) || 0,
		createdAt: new Date(),
		updatedAt: new Date(),
		stats: {
			polygonCount: 0,
			textureSize: 0,
			format: (data.format as string) || 'unknown',
			vertexCount: 0,
			materialCount: 0,
		},
	};

	return file3D;
}

function generateId(): string {
	return `file3d_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
