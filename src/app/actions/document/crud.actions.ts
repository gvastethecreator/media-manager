// Server Actions para Document
import { validateDocument } from '@/transformers/document/serializers';
import type { Document } from '@/types/entities/document/types';

export async function createDocument(input: unknown): Promise<Document> {
  const doc = validateDocument(input);
  // TODO: Persistir en DB (Prisma/Drizzle)
  return doc;
}

export async function getDocumentById(id: string): Promise<Document | null> {
  // TODO: Obtener de DB
  return null;
}

export async function updateDocument(id: string, input: unknown): Promise<Document> {
  const doc = validateDocument(input);
  // TODO: Actualizar en DB
  return doc;
}

export async function deleteDocument(id: string): Promise<boolean> {
  // TODO: Eliminar de DB
  return true;
}
