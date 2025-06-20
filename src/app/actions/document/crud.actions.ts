'use server';

// Server Actions para Document
import { validateDocument } from '@/transformers/document/serializers';
import type { DocumentComplete } from '@/types/entities/document';

export async function createDocument(input: unknown): Promise<DocumentComplete> {
	const doc = validateDocument(input);
	// TODO: Persistir en DB (Prisma/Drizzle)
	return doc;
}

export async function getDocumentById(_id: string): Promise<DocumentComplete | null> {
	// TODO: Obtener de DB
	return null;
}

export async function updateDocument(_id: string, input: unknown): Promise<DocumentComplete> {
	const doc = validateDocument(input);
	// TODO: Actualizar en DB
	return doc;
}

export async function deleteDocument(_id: string): Promise<boolean> {
	// TODO: Eliminar de DB
	return true;
}
