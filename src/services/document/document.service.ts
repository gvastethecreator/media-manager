/**
 * 📄 Servicio para la entidad Document
 * @file Servicio de Document con lógica de negocio
 * @module services/document.service
 * @description Capa de servicio para la entidad Document que maneja la lógica de negocio
 * @updated 2025-06-27
 */

import type { Document, Prisma } from '@prisma/client';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import { toDocumentWithStats } from '@/transformers/document';
import type { DocumentWithStats } from '@/types/entities/document';
// Drizzle imports
import { eq, asc, desc } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { documents } from '@/lib/drizzle/schema';

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

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				const prismaDocuments = await prisma.document.findMany({
					orderBy: { name: 'asc' },
				});

				if (Math.abs(transformedDocuments.length - prismaDocuments.length) > 0) {
					documentLogger.warn('⚠️ Diferencia en conteo getDocuments:', {
						drizzle: transformedDocuments.length,
						prisma: prismaDocuments.length
					});
				} else {
					documentLogger.info('✅ Validación dual exitosa getDocuments:', {
						total: transformedDocuments.length
					});
				}
			} catch (validationError) {
				documentLogger.error('❌ Error en validación dual getDocuments:', validationError);
			}
		}

		return transformedDocuments.map(toDocumentWithStats);
	} catch (error) {
		documentLogger.error('Error obteniendo documentos:', { error });
		throw new Error('Error al obtener documentos');
	}
}

/**
 * Obtiene un documento por su ID
 */
export async function getDocumentById(id: string): Promise<Document | null> {
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

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				const prismaDocument = await prisma.document.findUnique({
					where: { id },
				});

				if (prismaDocument && transformedDocument) {
					documentLogger.info('✅ Validación dual exitosa getDocumentById:', {
						documentName: transformedDocument.name
					});
				} else if (!prismaDocument && !transformedDocument) {
					documentLogger.info('✅ Validación dual exitosa getDocumentById: ambos null');
				} else {
					documentLogger.warn('⚠️ Diferencia en getDocumentById:', {
						drizzleFound: !!transformedDocument,
						prismaFound: !!prismaDocument
					});
				}
			} catch (validationError) {
				documentLogger.error('❌ Error en validación dual getDocumentById:', validationError);
			}
		}

		return transformedDocument as Document;
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
		const newDocument = await prisma.document.create({
			data,
		});

		// Emitir eventos con el nuevo sistema
		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.DOCUMENT_CREATED],
			data: { action: 'create', entity: newDocument, eventType: EVENTS.DOCUMENT_CREATED },
		});

		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.DOCUMENTS_CHANGED],
			data: { action: 'change', eventType: EVENTS.DOCUMENTS_CHANGED },
		});

		documentLogger.info('Documento creado:', newDocument.name);
		return toDocumentWithStats(newDocument);
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
		const updatedDocument = await prisma.document.update({
			where: { id },
			data,
		});

		// Emitir eventos con el nuevo sistema
		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.DOCUMENT_UPDATED],
			data: { action: 'update', entity: updatedDocument, eventType: EVENTS.DOCUMENT_UPDATED },
		});

		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.DOCUMENTS_CHANGED],
			data: { action: 'change', eventType: EVENTS.DOCUMENTS_CHANGED },
		});

		documentLogger.info('Documento actualizado:', updatedDocument.name);
		return toDocumentWithStats(updatedDocument);
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
		await prisma.document.delete({
			where: { id },
		});

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
		const document = await prisma.document.findUnique({
			where: { id },
			select: { id: true },
		});
		return document !== null;
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
		return await prisma.document.count();
	} catch (error) {
		documentLogger.error('Error obteniendo conteo de documentos:', { error });
		throw new Error('Error al obtener conteo de documentos');
	}
}
