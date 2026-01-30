/**
 * @file File Actions Service
 * @module services/files/file-actions.service
 * @description Servicio para acciones de archivos como mover, copiar, etc.
 */

import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { audios, documents, images, videos } from '@/lib/drizzle/schema';

// Tipo de entidad de archivo para operaciones de archivos
export type FileEntityType = 'image' | 'video' | 'audio' | 'document';

/**
 * Mueve un archivo a otra carpeta
 * @param fileId ID del archivo
 * @param entityType Tipo de entidad
 * @param targetFolderId ID de la carpeta destino
 */
export async function moveFile(fileId: string, entityType: FileEntityType, targetFolderId: string): Promise<void> {
	switch (entityType) {
		case 'image':
			await db.update(images).set({ folderId: targetFolderId }).where(eq(images.id, fileId));
			break;
		case 'video':
			await db.update(videos).set({ folderId: targetFolderId }).where(eq(videos.id, fileId));
			break;
		case 'audio':
			await db.update(audios).set({ folderId: targetFolderId }).where(eq(audios.id, fileId));
			break;
		case 'document':
			await db.update(documents).set({ folderId: targetFolderId }).where(eq(documents.id, fileId));
			break;
		default:
			throw new Error(`Unsupported entity type: ${entityType}`);
	}
}

/**
 * Elimina un archivo
 * @param fileId ID del archivo
 * @param entityType Tipo de entidad
 */
export async function deleteFile(fileId: string, entityType: FileEntityType): Promise<void> {
	switch (entityType) {
		case 'image':
			await db.delete(images).where(eq(images.id, fileId));
			break;
		case 'video':
			await db.delete(videos).where(eq(videos.id, fileId));
			break;
		case 'audio':
			await db.delete(audios).where(eq(audios.id, fileId));
			break;
		case 'document':
			await db.delete(documents).where(eq(documents.id, fileId));
			break;
		default:
			throw new Error(`Unsupported entity type: ${entityType}`);
	}
}

/**
 * Renombra un archivo
 * @param fileId ID del archivo
 * @param entityType Tipo de entidad
 * @param newName Nuevo nombre
 */
export async function renameFile(fileId: string, entityType: FileEntityType, newName: string): Promise<void> {
	switch (entityType) {
		case 'image':
			await db.update(images).set({ name: newName }).where(eq(images.id, fileId));
			break;
		case 'video':
			await db.update(videos).set({ name: newName }).where(eq(videos.id, fileId));
			break;
		case 'audio':
			await db.update(audios).set({ name: newName }).where(eq(audios.id, fileId));
			break;
		case 'document':
			await db.update(documents).set({ name: newName }).where(eq(documents.id, fileId));
			break;
		default:
			throw new Error(`Unsupported entity type: ${entityType}`);
	}
}
