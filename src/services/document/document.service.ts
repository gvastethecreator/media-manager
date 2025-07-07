/**
 * 📄 Servicio para la entidad Document
 * @file Servicio de Document con lógica de negocio
 * @module services/document.service
 * @description Capa de servicio para la entidad Document que maneja la lógica de negocio
 * @updated 2025-06-27
 */

import * as crypto from 'crypto';
// Drizzle imports
import { asc, count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { documents } from '@/lib/drizzle/schema';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { toDocumentWithStats } from '@/transformers/document';
import type { DocumentCreateInput, DocumentUpdateInput, DocumentWithStats } from '@/types/entities/document';

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
export async function createDocument(data: DocumentCreateInput): Promise<DocumentWithStats> {
	try {
		documentLogger.info('📝 Creando documento:', data.name);

		// **MIGRACIÓN A DRIZZLE**
		const result = await db
			.insert(documents)
			.values({
				id: crypto.randomUUID(),
				name: data.name,
				path: data.path,
				size: data.size,
				hash: data.hash,
				mimeType: data.mimeType,
				extension: data.extension,
				folderId: data.folderId,
				isFavorite: data.isFavorite || false,
				isArchived: data.isArchived || false,
				pageCount: data.pageCount || null,
				wordCount: data.wordCount || null,
				language: data.language || null,
				title: data.title || null,
				author: data.author || null,
				subject: data.subject || null,
				keywords: data.keywords || null,
				creator: data.creator || null,
				producer: data.producer || null,
				creationDate: data.creationDate || null,
				modificationDate: data.modificationDate || null,
				encrypted: data.encrypted || false,
				version: data.version || null,
				content: data.content || null,
				summary: data.summary || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		const newDocument = result[0];
		const documentWithStats = toDocumentWithStats(newDocument);

		// Emitir eventos
		await emit({
			type: 'files:modified',
			data: { action: 'create', document: newDocument },
		});
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		documentLogger.info('✅ Documento creado:', documentWithStats.name);
		return documentWithStats;
	} catch (error) {
		documentLogger.error('❌ Error al crear documento:', error);
		throw createDocumentError('No se pudo crear el documento', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un documento existente
 */
export async function updateDocument(id: string, data: DocumentUpdateInput): Promise<DocumentWithStats> {
	try {
		documentLogger.info('🔄 Actualizando documento:', id);

		// Verificar que el documento existe
		const exists = await documentExists(id);
		if (!exists) {
			throw createDocumentError('Documento no encontrado', EntityErrorCode.ENTITY_NOT_FOUND);
		}

		// **MIGRACIÓN A DRIZZLE**
		// Solo actualizar campos que están presentes en data
		const updateData: any = {
			updatedAt: new Date(),
		};

		if (data.name !== undefined) updateData.name = data.name;
		if (data.path !== undefined) updateData.path = data.path;
		if (data.size !== undefined) updateData.size = data.size;
		if (data.hash !== undefined) updateData.hash = data.hash;
		if (data.mimeType !== undefined) updateData.mimeType = data.mimeType;
		if (data.extension !== undefined) updateData.extension = data.extension;
		if (data.folderId !== undefined) updateData.folderId = data.folderId;
		if (data.isFavorite !== undefined) updateData.isFavorite = Boolean(data.isFavorite);
		if (data.isArchived !== undefined) updateData.isArchived = Boolean(data.isArchived);
		if (data.pageCount !== undefined) updateData.pageCount = data.pageCount;
		if (data.wordCount !== undefined) updateData.wordCount = data.wordCount;
		if (data.language !== undefined) updateData.language = data.language;
		if (data.title !== undefined) updateData.title = data.title;
		if (data.author !== undefined) updateData.author = data.author;
		if (data.subject !== undefined) updateData.subject = data.subject;
		if (data.keywords !== undefined) updateData.keywords = data.keywords;
		if (data.creator !== undefined) updateData.creator = data.creator;
		if (data.producer !== undefined) updateData.producer = data.producer;
		if (data.creationDate !== undefined) updateData.creationDate = data.creationDate;
		if (data.modificationDate !== undefined) updateData.modificationDate = data.modificationDate;
		if (data.encrypted !== undefined) updateData.encrypted = Boolean(data.encrypted);
		if (data.version !== undefined) updateData.version = data.version;
		if (data.content !== undefined) updateData.content = data.content;
		if (data.summary !== undefined) updateData.summary = data.summary;

		const result = await db.update(documents).set(updateData).where(eq(documents.id, id)).returning();

		const updatedDocument = result[0];
		const documentWithStats = toDocumentWithStats(updatedDocument);

		// Emitir eventos
		await emit({
			type: 'files:modified',
			data: { action: 'update', document: updatedDocument },
		});
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		documentLogger.info('✅ Documento actualizado:', documentWithStats.name);
		return documentWithStats;
	} catch (error) {
		documentLogger.error('❌ Error al actualizar documento:', error);
		throw createDocumentError('No se pudo actualizar el documento', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un documento
 */
export async function deleteDocument(id: string): Promise<void> {
	try {
		documentLogger.info('🗑️ Eliminando documento:', id);

		// Verificar que el documento existe
		const exists = await documentExists(id);
		if (!exists) {
			throw createDocumentError('Documento no encontrado', EntityErrorCode.ENTITY_NOT_FOUND);
		}

		// **MIGRACIÓN A DRIZZLE**
		const result = await db.delete(documents).where(eq(documents.id, id)).returning();

		const deletedDocument = result[0];

		// Emitir eventos
		await emit({
			type: 'files:modified',
			data: { action: 'delete', document: deletedDocument },
		});
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		documentLogger.info('✅ Documento eliminado:', deletedDocument.name);
	} catch (error) {
		documentLogger.error('❌ Error al eliminar documento:', error);
		throw createDocumentError('No se pudo eliminar el documento', EntityErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Verifica si un documento existe
 */
export async function documentExists(id: string): Promise<boolean> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		const result = await db.select({ count: count() }).from(documents).where(eq(documents.id, id));

		return result[0].count > 0;
	} catch (error) {
		documentLogger.error('❌ Error verificando existencia de documento:', { id, error });
		return false;
	}
}

/**
 * Obtiene el conteo total de documentos
 */
export async function getDocumentCount(): Promise<number> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		const result = await db.select({ count: count() }).from(documents);

		return result[0].count;
	} catch (error) {
		documentLogger.error('❌ Error obteniendo conteo de documentos:', error);
		throw createDocumentError('No se pudo obtener el conteo de documentos', EntityErrorCode.OPERATION_FAILED, error);
	}
}
