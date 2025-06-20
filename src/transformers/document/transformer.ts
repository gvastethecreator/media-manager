/**
 * @file Transformador principal para la entidad Document
 * @module transformers/document/transformer
 * @description Contiene la lógica para convertir un objeto Document de Prisma a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { DocumentComplete } from '@/types/entities/document/types';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('DocumentTransformer');

/**
 * 🔄 Transforma un objeto Document de Prisma a nuestro tipo canónico DocumentComplete.
 *
 * @param prismaDocument - El objeto Document obtenido de Prisma.
 * @returns Un objeto DocumentComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaDocument(prismaDocument: any): DocumentComplete {
	if (!prismaDocument) {
		throw new TransformerError('El objeto de documento de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...documentData } = prismaDocument;

		const documentComplete: DocumentComplete = {
			...documentData,
			// Conteos
			_count: {
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
				audio: _count?.audio ?? 0,
				file3d: _count?.file3d ?? 0,
				jsonFiles: _count?.jsonFiles ?? 0,
				albums: _count?.albums ?? 0,
				collections: _count?.collections ?? 0,
				tags: _count?.tags ?? 0,
				characters: _count?.characters ?? 0,
				places: _count?.places ?? 0,
				worldItems: _count?.worldItems ?? 0,
				concepts: _count?.concepts ?? 0,
				prompts: _count?.prompts ?? 0,
				notes: _count?.notes ?? 0,
				wildcards: _count?.wildcards ?? 0,
				properties: _count?.properties ?? 0,
				groups: _count?.groups ?? 0,
			},
		};

		return documentComplete;
	} catch (error) {
		logger.error('Error transformando documento desde Prisma', {
			error,
			documentId: prismaDocument?.id,
		});
		throw new TransformerError(`Error al transformar el documento: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de documentos de Prisma a una lista de DocumentComplete.
 *
 * @param prismaDocuments - Un array de objetos Document de Prisma.
 * @returns Un array de objetos DocumentComplete.
 */
export function fromPrismaDocuments(prismaDocuments: any[]): DocumentComplete[] {
	return prismaDocuments.map(fromPrismaDocument);
}
