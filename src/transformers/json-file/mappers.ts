// Mappers para JsonFile
import type { JsonFile } from '@/types/entities/json-file';

export function fromPrismaJsonFile(prisma: any): JsonFile {
	return {
		id: prisma.id,
		name: prisma.name,
		filePath: prisma.filePath,
		content: prisma.content,
		createdAt: prisma.createdAt,
		updatedAt: prisma.updatedAt,
	};
}

export function toPrismaJsonFile(json: JsonFile): any {
	return {
		id: json.id,
		name: json.name,
		filePath: json.filePath,
		content: json.content,
		createdAt: json.createdAt,
		updatedAt: json.updatedAt,
	};
}
