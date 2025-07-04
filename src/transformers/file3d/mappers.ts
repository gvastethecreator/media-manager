// Mappers para File3D
// ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma

import type { File3D } from '@/types/entities/file3d';

// Tipo local equivalente a Prisma (migración a Drizzle)
type DrizzleFile3D = {
	id: string;
	name: string;
	filePath: string;
	format: string;
	size: number;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * Convierte un objeto File3D de Drizzle al tipo de la aplicación
 * ✅ MIGRADO A DRIZZLE
 */
export function fromDrizzleFile3D(drizzle: DrizzleFile3D): File3D {
	return {
		id: drizzle.id,
		name: drizzle.name,
		filePath: drizzle.filePath,
		format: drizzle.format,
		size: drizzle.size,
		createdAt: drizzle.createdAt,
		updatedAt: drizzle.updatedAt,
	};
}

/**
 * Convierte un objeto File3D de la aplicación al tipo de Drizzle
 * ✅ MIGRADO A DRIZZLE
 */
export function toDrizzleFile3D(file: File3D): DrizzleFile3D {
	return {
		id: file.id,
		name: file.name,
		filePath: file.filePath,
		format: file.format,
		size: file.size,
		createdAt: file.createdAt,
		updatedAt: file.updatedAt,
	};
}


