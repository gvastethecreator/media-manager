'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from '@/lib/server/revalidate';
import * as DocumentService from '@/services/document';
import { DocumentWithStats } from '@/types/entities/document';

/**
 * 📄 Server Actions para la entidad Document
 * @description Controladores delgados que delegan toda la lógica al servicio
 */

const revalidatePaths = ['/documents'];

/**
 * Obtiene todos los documentos con sus estadísticas
 */
export async function getDocuments(): Promise<DocumentWithStats[]> {
	return await DocumentService.getDocuments();
}

/**
 * Crea un nuevo documento
 */
export async function createDocument(data: Prisma.DocumentCreateInput): Promise<DocumentWithStats> {
	const result = await DocumentService.createDocument(data);
	for (const path of revalidatePaths) {
		revalidatePath(path);
	}
	return result;
}

/**
 * Actualiza un documento existente
 */
export async function updateDocument(id: string, data: Prisma.DocumentUpdateInput): Promise<DocumentWithStats> {
	const result = await DocumentService.updateDocument(id, data);
	for (const path of revalidatePaths) {
		revalidatePath(path);
	}
	revalidatePath(`/documents/${id}`);
	return result;
}

/**
 * Elimina un documento
 */
export async function deleteDocument(id: string): Promise<void> {
	await DocumentService.deleteDocument(id);
	for (const path of revalidatePaths) {
		revalidatePath(path);
	}
}
