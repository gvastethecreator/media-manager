/**
 * 📄 Servicio para la entidad Document
 * @file Servicio de Document con lógica de negocio
 * @module services/document.service
 * @description Capa de servicio para la entidad Document que maneja la lógica de negocio
 * @updated 2025-06-27
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/database/prisma';
import { type EventType, emit } from '@/lib/server/events.server';
import { toDocumentWithStats } from '@/transformers/document';
import type { DocumentWithStats } from '@/types/entities/document';
import type { Document, Prisma } from '@prisma/client';

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
		const documents = await prisma.document.findMany({
			orderBy: { name: 'asc' },
		});
		return documents.map(toDocumentWithStats);
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
		return await prisma.document.findUnique({
			where: { id },
		});
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
			data
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
			data
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
			where: { id }
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
