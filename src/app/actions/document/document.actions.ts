'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { toDocumentWithStats } from '@/transformers/document';
import { DocumentWithStats } from '@/types/entities/document';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('DocumentActions');

const revalidatePaths = ['/documents']; // Ajustar según las rutas reales

/**
 * Calcula el número de palabras y caracteres de un texto.
 * @param text - El texto a analizar.
 * @returns Un objeto con wordCount y charCount.
 */
const calculateTextStats = (text: string | null | undefined) => {
	if (!text) return { wordCount: 0, charCount: 0 };
	const charCount = text.length;
	const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
	return { wordCount, charCount };
};

/**
 * Obtiene todos los documentos con sus estadísticas.
 */
export async function getDocuments(): Promise<DocumentWithStats[]> {
	try {
		const documents = await prisma.document.findMany({
			orderBy: { name: 'asc' },
		});
		return documents.map(toDocumentWithStats);
	} catch (error) {
		logger.error('❌ Error al obtener documentos:', error);
		throw new Error('No se pudieron obtener los documentos.');
	}
}

/**
 * Crea un nuevo documento.
 * Recalcula wordCount y charCount antes de guardar.
 */
export async function createDocument(data: Prisma.DocumentCreateInput): Promise<DocumentWithStats> {
	try {
		const { wordCount, charCount } = calculateTextStats(data.content);
		const documentToCreate: Prisma.DocumentCreateInput = {
			...data,
			wordCount,
			charCount,
		};

		const newDocument = await prisma.document.create({ data: documentToCreate });
		revalidatePaths.forEach(p => revalidatePath(p));
		logger.info('✅ Documento creado:', newDocument.name);
		return toDocumentWithStats(newDocument);
	} catch (error) {
		logger.error('❌ Error al crear documento:', { data, error });
		throw new Error('No se pudo crear el documento.');
	}
}

/**
 * Actualiza un documento existente.
 * Recalcula wordCount y charCount si el contenido cambia.
 */
export async function updateDocument(id: string, data: Prisma.DocumentUpdateInput): Promise<DocumentWithStats> {
	try {
		const documentToUpdate: Prisma.DocumentUpdateInput = { ...data };

		if (typeof data.content === 'string') {
			const { wordCount, charCount } = calculateTextStats(data.content);
			documentToUpdate.wordCount = wordCount;
			documentToUpdate.charCount = charCount;
		}

		const updatedDocument = await prisma.document.update({ where: { id }, data: documentToUpdate });
		revalidatePaths.forEach(p => revalidatePath(p));
		revalidatePath(`/documents/${id}`);
		logger.info('✅ Documento actualizado:', updatedDocument.name);
		return toDocumentWithStats(updatedDocument);
	} catch (error) {
		logger.error('❌ Error al actualizar documento:', { id, error });
		throw new Error('No se pudo actualizar el documento.');
	}
}

/**
 * Elimina un documento.
 */
export async function deleteDocument(id: string): Promise<void> {
	try {
		await prisma.document.delete({ where: { id } });
		revalidatePaths.forEach(p => revalidatePath(p));
		logger.info('✅ Documento eliminado:', id);
	} catch (error) {
		logger.error('❌ Error al eliminar documento:', { id, error });
		throw new Error('No se pudo eliminar el documento.');
	}
}
