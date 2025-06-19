// Mappers para JsonFile
import type { JsonFileComplete } from '@/types/entities/json-file';

export function fromPrismaJsonFile(prisma: any): JsonFileComplete {
	return {
		id: prisma.id,
		name: prisma.name,
		filePath: prisma.filePath,
		content: prisma.content,
		createdAt: prisma.createdAt,
		updatedAt: prisma.updatedAt,
	};
}

export function toPrismaJsonFile(json: JsonFileComplete): any {
	return {
		id: json.id,
		name: json.name,
		filePath: json.filePath,
		content: json.content,
		createdAt: json.createdAt,
		updatedAt: json.updatedAt,
	};
}
