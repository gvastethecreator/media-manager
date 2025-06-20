'use server';

import { getPrismaClient } from '@/lib/db';
import { handlePrismaError } from '@/lib/errors';
import { fromPrismaDocument, fromPrismaDocuments } from '@/transformers/document/transformer';
import type { DocumentFormData } from '@/types/entities/document/types';
import { revalidatePath } from 'next/cache';

// GET
export async function getDocuments() {
	try {
		const prisma = await getPrismaClient();
		const documents = await prisma.document.findMany({
			orderBy: { createdAt: 'desc' },
		});
		return fromPrismaDocuments(documents);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

export async function getDocumentById(id: string) {
	try {
		const prisma = await getPrismaClient();
		const document = await prisma.document.findUnique({
			where: { id },
		});
		if (!document) {
			throw new Error('Documento no encontrado');
		}
		return fromPrismaDocument(document);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

// CREATE
export async function createDocument(data: DocumentFormData) {
	const { filePath, ...documentData } = data;

	try {
		const prisma = await getPrismaClient();
		const newDocument = await prisma.document.create({
			data: {
				...documentData,
				filePath: filePath || '',
			},
		});
		revalidatePath('/document');
		return fromPrismaDocument(newDocument);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

// UPDATE
export async function updateDocument(id: string, data: DocumentFormData) {
	const { filePath, ...documentData } = data;

	try {
		const prisma = await getPrismaClient();
		const updatedDocument = await prisma.document.update({
			where: { id },
			data: {
				...documentData,
				filePath: filePath !== undefined ? filePath : undefined,
			},
		});
		revalidatePath('/document');
		revalidatePath(`/document/${id}`);
		return fromPrismaDocument(updatedDocument);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

// DELETE
export async function deleteDocument(id: string) {
	try {
		const prisma = await getPrismaClient();
		await prisma.document.delete({
			where: { id },
		});
		revalidatePath('/document');
		return { success: true };
	} catch (error) {
		throw handlePrismaError(error);
	}
}
