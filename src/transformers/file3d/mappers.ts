// Mappers para File3D

import type { File3D } from '@/types/entities/file3d';
import type { File3D as PrismaFile3D } from '@prisma/client';

export function fromPrismaFile3D(prisma: PrismaFile3D): File3D {
	return {
		id: prisma.id,
		name: prisma.name,
		filePath: prisma.filePath,
		format: prisma.format,
		size: prisma.size,
		createdAt: prisma.createdAt,
		updatedAt: prisma.updatedAt,
	};
}

export function toPrismaFile3D(file: File3D): PrismaFile3D {
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
