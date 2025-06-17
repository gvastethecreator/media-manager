// Mappers para File3D
import type { File3D } from '@/types/entities/file3d/types';

export function fromPrismaFile3D(prisma: any): File3D {
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

export function toPrismaFile3D(file: File3D): any {
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
