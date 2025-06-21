// Mappers para Document
// Aquí se definen funciones para mapear entre Prisma, dominio y UI

import type { Document, DocumentComplete } from '@/types/entities/document';
import type { Prisma, Document as PrismaDocument } from '@prisma/client';

export function fromPrismaDocument(prisma: PrismaDocument): DocumentComplete {
	return {
		// Prisma fields
		id: prisma.id,
		name: prisma.name,
		filePath: prisma.filePath,
		content: prisma.content,
		createdAt: prisma.createdAt,
		updatedAt: prisma.updatedAt,
		// BaseEntity fields
		description: null,
		shortcut: null,
		category: 'document',
		sortBy: 'name',
		filters: '{}',
		// UIFields
		emoji: '📄',
		color: '#718096', // gray-500
		featuredImage: null,
		isFavorite: false,
		// DocumentCounts
		_count: {},
	};
}

export function fromPrismaDocuments(prismaDocuments: PrismaDocument[]): DocumentComplete[] {
	return prismaDocuments.map(fromPrismaDocument);
}

export function toPrismaDocument(doc: Document): Prisma.DocumentCreateInput {
	return {
		id: doc.id,
		name: doc.name,
		filePath: doc.filePath,
		content: doc.content,
	};
}
