/**
 * 📄 Servicio para la entidad Document
 * @file Servicio de Document con lógica de negocio
 * @module services/document.service
 * @description Capa de servicio para la entidad Document que maneja la lógica de negocio
 * @updated 2025-06-27
 */

import type { Prisma } from '@prisma/client';
import { db } from '@/lib/drizzle';
import { documents } from '@/lib/drizzle/schema';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { toDocumentWithStats } from '@/transformers/document';
import type { DocumentWithStats } from '@/types/entities/document';
// Drizzle imports
import { eq, asc, desc, count } from 'drizzle-orm';

const documentLogger = serverLogger.withContext('DocumentService');

// Constantes para los tipos de eventos
const EVENTS = {
	DOCUMENT_CREATED: 'document:created',
	DOCUMENT_UPDATED: 'document:updated',
	DOCUMENT_DELETED: 'document:deleted',
	DOCUMENTS_CHANGED: 'documents:changed',
};

// Mapeo de eventos a EventType - usar eventos existentes
const EVENT_TYPE_MAPPING: Record<string, EventType> = {
	[EVENTS.DOCUMENT_CREATED]: 'create',
	[EVENTS.DOCUMENT_UPDATED]: 'update',
	[EVENTS.DOCUMENT_DELETED]: 'delete',
	[EVENTS.DOCUMENTS_CHANGED]: 'update',
};

// Función auxiliar para crear errores
const createDocumentError = (
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	return createEntityErrorObject('DocumentError', message, code, cause);
};

/**
 * Obtiene todos los documentos con sus estadísticas
 */
export async function getDocuments(): Promise<DocumentWithStats[]> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		documentLogger.info('📄 Obteniendo documentos');

		const drizzleDocuments = await db
			.select({
				id: documents.id,
				name: documents.name,
				description: documents.description,
				emoji: documents.emoji,
				color: documents.color,
				shortcut: documents.shortcut,
				category: documents.category,
				filePath: documents.filePath,
				fileName: documents.fileName,
				fileSize: documents.fileSize,
				mimeType: documents.mimeType,
				pageCount: documents.pageCount,
				content: documents.content,
				tags: documents.tags,
				metadata: documents.metadata,
				sortBy: documents.sortBy,
				filters: documents.filters,
				featuredImage: documents.featuredImage,
				isFavorite: documents.isFavorite,
				createdAt: documents.createdAt,
				updatedAt: documents.updatedAt,
			})
			.from(documents)
			.orderBy(asc(documents.name));

		// Transformar a formato compatible con Prisma
		const transformedDocuments = drizzleDocuments.map((rawDocument) => ({
			...rawDocument,
			isFavorite: Boolean(rawDocument.isFavorite),
		}));

		return transformedDocuments.map(toDocumentWithStats);
	} catch (error) {
		documentLogger.error('Error obteniendo documentos:', { error });
		throw new Error('Error al obtener documentos');
	}
}

/**
 * Obtiene un documento por su ID
 */
export async function getDocumentById(id: string): Promise<DocumentWithStats | null> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		documentLogger.info(`🔍 Obteniendo documento por ID: ${id}`);

		const drizzleDocument = await db
			.select({
				id: documents.id,
				name: documents.name,
				description: documents.description,
				emoji: documents.emoji,
				color: documents.color,
				shortcut: documents.shortcut,
				category: documents.category,
				filePath: documents.filePath,
				fileName: documents.fileName,
				fileSize: documents.fileSize,
				mimeType: documents.mimeType,
				pageCount: documents.pageCount,
				content: documents.content,
				tags: documents.tags,
				metadata: documents.metadata,
				sortBy: documents.sortBy,
				filters: documents.filters,
				featuredImage: documents.featuredImage,
				isFavorite: documents.isFavorite,
				createdAt: documents.createdAt,
				updatedAt: documents.updatedAt,
			})
			.from(documents)
			.where(eq(documents.id, id))
			.limit(1);

		if (drizzleDocument.length === 0) {
			documentLogger.warn(`Documento no encontrado: ${id}`);
			return null;
		}

		const rawDocument = drizzleDocument[0];

		// Transformar a formato compatible con Prisma
		const transformedDocument = {
			...rawDocument,
			isFavorite: Boolean(rawDocument.isFavorite),
		};

		return toDocumentWithStats(transformedDocument as any);
	} catch (error) {
		documentLogger.error('Error obteniendo documento por ID:', { id, error });
		throw new Error('Error al obtener documento');
	}
}

/**
 * Crea un nuevo documento
 */
export async function createDocument(data: Prisma.DocumentCreateInput): Promise<DocumentWithStats> {
	try {
		documentLogger.info('Creando documento:', data.name);

		const newDocument = await db.insert(documents).values({
			name: data.name,
			description: data.description,
			emoji: data.emoji,
			color: data.color,
			shortcut: data.shortcut,
			category: data.category,
			filePath: data.filePath,
			fileName: data.fileName,
			fileSize: data.fileSize,
			mimeType: data.mimeType,
			pageCount: data.pageCount,
			content: data.content,
			tags: data.tags,
			metadata: data.metadata,
			sortBy: data.sortBy,
			filters: data.filters,
			featuredImage: data.featuredImage,
			isFavorite: data.isFavorite,
			createdAt: data.createdAt,
			updatedAt: data.updatedAt,
		}).returning();

		// Emitir eventos con el nuevo sistema
		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.DOCUMENT_CREATED],
			data: { action: 'create', entity: newDocument[0], eventType: EVENTS.DOCUMENT_CREATED },
		});

		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.DOCUMENTS_CHANGED],
			data: { action: 'change', eventType: EVENTS.DOCUMENTS_CHANGED },
		});

		documentLogger.info('Documento creado:', newDocument[0].name);
		return toDocumentWithStats(newDocument[0]);
	} catch (error) {
		documentLogger.error('Error creando documento:', { data, error });
		throw new Error('Error al crear documento');
	}
}

/**
 * Actualiza un documento existente
 */
export async function updateDocument(id: string, data: Prisma.DocumentUpdateInput): Promise<DocumentWithStats> {
	try {
		documentLogger.info('Actualizando documento:', id);

		const updatedDocument = await db.update(documents)
			.set({
				name: data.name,
				description: data.description,
				emoji: data.emoji,
				color: data.color,
				shortcut: data.shortcut,
				category: data.category,
				filePath: data.filePath,
				fileName: data.fileName,
				fileSize: data.fileSize,
				mimeType: data.mimeType,
				pageCount: data.pageCount,
				content: data.content,
				tags: data.tags,
				metadata: data.metadata,
				sortBy: data.sortBy,
				filters: data.filters,
				featuredImage: data.featuredImage,
				isFavorite: data.isFavorite,
				createdAt: data.createdAt,
				updatedAt: new Date(), // Actualizar timestamp
			})
			.where(eq(documents.id, id))
			.returning();

		// Emitir eventos con el nuevo sistema
		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.DOCUMENT_UPDATED],
			data: { action: 'update', entity: updatedDocument[0], eventType: EVENTS.DOCUMENT_UPDATED },
		});

		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.DOCUMENTS_CHANGED],
			data: { action: 'change', eventType: EVENTS.DOCUMENTS_CHANGED },
		});

		documentLogger.info('Documento actualizado:', updatedDocument[0].name);
		return toDocumentWithStats(updatedDocument[0]);
	} catch (error) {
		documentLogger.error('Error actualizando documento:', { id, data, error });
		throw new Error('Error al actualizar documento');
	}
}

/**
 * Elimina un documento
 */
export async function deleteDocument(id: string): Promise<void> {
	try {
		documentLogger.info('Eliminando documento:', id);

		const deletedDocument = await db.delete(documents)
			.where(eq(documents.id, id))
			.returning();

		// Emitir eventos con el nuevo sistema
		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.DOCUMENT_DELETED],
			data: { action: 'delete', entity: { id }, eventType: EVENTS.DOCUMENT_DELETED },
		});

		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.DOCUMENTS_CHANGED],
			data: { action: 'change', eventType: EVENTS.DOCUMENTS_CHANGED },
		});

		documentLogger.info('Documento eliminado:', id);
	} catch (error) {
		documentLogger.error('Error eliminando documento:', { id, error });
		throw new Error('Error al eliminar documento');
	}
}

/**
 * Verifica si un documento existe
 */
export async function documentExists(id: string): Promise<boolean> {
	try {
		const result = await db.select({ id: documents.id })
			.from(documents)
			.where(eq(documents.id, id))
			.limit(1);
		return result.length > 0;
	} catch (error) {
		documentLogger.error('Error verificando existencia de documento:', { id, error });
		return false;
	}
}

/**
 * Obtiene el conteo total de documentos
 */
export async function getDocumentCount(): Promise<number> {
	try {
		const result = await db.select({ count: count() })
			.from(documents);
		return result[0].count;
	} catch (error) {
		documentLogger.error('Error obteniendo conteo de documentos:', { error });
		throw new Error('Error al obtener conteo de documentos');
	}
}