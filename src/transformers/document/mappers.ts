// Mappers para Document
// Aquí se definen funciones para mapear entre Prisma, dominio y UI

import type { Document } from '@/types/entities/document/types';

export function fromPrismaDocument(prisma: any): Document {
	return {
		id: prisma.id,
		name: prisma.name,
		filePath: prisma.filePath,
		content: prisma.content,
		createdAt: prisma.createdAt,
		updatedAt: prisma.updatedAt,
	};
}

export function toPrismaDocument(doc: Document): any {
	return {
		id: doc.id,
		name: doc.name,
		filePath: doc.filePath,
		content: doc.content,
		createdAt: doc.createdAt,
		updatedAt: doc.updatedAt,
	};
}
