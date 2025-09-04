import { sql } from 'drizzle-orm';

import { instrumentedAll } from '@/lib/drizzle/instrumentation';
import type { FolderComplete, FolderCreateInput, FolderUpdateInput, FolderWithStats } from '@/types/entities/folder';

export type FolderMediaCounts = {
	images: number;
	videos: number;
	audios: number;
	documents: number;
	jsonFiles: number;
	file3Ds: number;
};

export type FolderMediaCountsMap = Record<string, FolderMediaCounts>;

/**
 * Devuelve conteos de archivos por tipo para un conjunto de carpetas.
 * Implementación en una única consulta (UNION ALL) para evitar N+1.
 */
export async function getFolderMediaCountsBatch(folderIds: string[]): Promise<FolderMediaCountsMap> {
	const result: FolderMediaCountsMap = {};
	if (!folderIds.length) return result;

	const inList = sql.join(
		folderIds.map((id) => sql`${id}`),
		sql`, `
	);

	type Row = {
		type: string;
		folderId: string;
		count: number;
	};

	// Nota: usamos los nombres de tablas físicos según el esquema (Image, Video, Audio, Document, JsonFile, File3D)
	const rows = await instrumentedAll<Row>(
		'stats.batch.folders.mediaCounts',
		sql`
      SELECT 'image' AS type, folderId, COUNT(1) AS count
      FROM Image
      WHERE folderId IN (${inList})
      GROUP BY folderId
      UNION ALL
      SELECT 'video' AS type, folderId, COUNT(1) AS count
      FROM Video
      WHERE folderId IN (${inList})
      GROUP BY folderId
      UNION ALL
      SELECT 'audio' AS type, folderId, COUNT(1) AS count
      FROM Audio
      WHERE folderId IN (${inList})
      GROUP BY folderId
      UNION ALL
      SELECT 'document' AS type, folderId, COUNT(1) AS count
      FROM Document
      WHERE folderId IN (${inList})
      GROUP BY folderId
      UNION ALL
      SELECT 'json' AS type, folderId, COUNT(1) AS count
      FROM JsonFile
      WHERE folderId IN (${inList})
      GROUP BY folderId
      UNION ALL
      SELECT 'file3d' AS type, folderId, COUNT(1) AS count
      FROM File3D
      WHERE folderId IN (${inList})
      GROUP BY folderId
    `
	);

	for (const fid of folderIds) {
		result[fid] = {
			images: 0,
			videos: 0,
			audios: 0,
			documents: 0,
			jsonFiles: 0,
			file3Ds: 0,
		};
	}

	for (const r of rows) {
		const entry = result[r.folderId] ?? {
			images: 0,
			videos: 0,
			audios: 0,
			documents: 0,
			jsonFiles: 0,
			file3Ds: 0,
		};
		switch (r.type) {
			case 'image':
				entry.images = r.count;
				break;
			case 'video':
				entry.videos = r.count;
				break;
			case 'audio':
				entry.audios = r.count;
				break;
			case 'document':
				entry.documents = r.count;
				break;
			case 'json':
				entry.jsonFiles = r.count;
				break;
			case 'file3d':
				entry.file3Ds = r.count;
				break;
			default:
				break;
		}
		result[r.folderId] = entry;
	}

	return result;
}
/**
 * @file Servicio para la entidad Folder
 * @module services/folder/folder.service
 * @description Lógica de negocio y acceso a datos para las carpetas.
 */

/**
 * Obtiene todas las carpetas, opcionalmente filtrando por un ID de padre.
 * @param parentId - ID de la carpeta padre para obtener sus hijos.
 * @returns Una promesa que se resuelve con un array de carpetas completas.
 */
export async function getFolders(parentId?: string): Promise<FolderComplete[]> {
	const url = parentId ? `/api/folders?parentId=${parentId}` : '/api/folders';
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error('No se pudieron obtener las carpetas.');
	}
	return response.json();
}

/**
 * Obtiene una única carpeta por su ID.
 * @param id - El ID de la carpeta.
 * @returns Una promesa que se resuelve con la carpeta completa o null si no se encuentra.
 */
export async function getFolder(id: string): Promise<FolderComplete | null> {
	const response = await fetch(`/api/folders/${id}`);
	if (!response.ok) {
		if (response.status === 404) {
			return null;
		}
		throw new Error('No se pudo obtener la carpeta.');
	}
	return response.json();
}

/**
 * Crea una nueva carpeta.
 * @param data - Los datos para crear la nueva carpeta.
 * @returns Una promesa que se resuelve con la carpeta recién creada.
 */
export async function createFolder(data: FolderCreateInput): Promise<FolderComplete> {
	const response = await fetch('/api/folders', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('No se pudo crear la carpeta.');
	}
	return response.json();
}

/**
 * Actualiza una carpeta existente.
 * @param id - El ID de la carpeta a actualizar.
 * @param data - Los datos para actualizar la carpeta.
 * @returns Una promesa que se resuelve con la carpeta actualizada.
 */
export async function updateFolder(id: string, data: FolderUpdateInput): Promise<FolderComplete> {
	const response = await fetch(`/api/folders/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('No se pudo actualizar la carpeta.');
	}
	return response.json();
}

/**
 * Elimina una carpeta.
 * @param id - El ID de la carpeta a eliminar.
 */
export async function deleteFolder(id: string): Promise<void> {
	const response = await fetch(`/api/folders/${id}`, {
		method: 'DELETE',
	});
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		const errorMessage = errorData.error || 'No se pudo eliminar la carpeta.';
		throw new Error(errorMessage);
	}
}

/**
 * Obtiene todas las carpetas con estadísticas avanzadas, opcionalmente filtrando por un ID de padre.
 * @param parentId - ID de la carpeta padre para obtener sus hijos.
 * @returns Una promesa que se resuelve con un array de carpetas con estadísticas.
 */
export async function getFoldersWithStats(parentId?: string): Promise<FolderWithStats[]> {
	const url = parentId ? `/api/folders/stats?parentId=${parentId}` : '/api/folders/stats';
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error('No se pudieron obtener las carpetas con estadísticas.');
	}
	return response.json();
}

// Nota: La lógica de indexación y eventos complejos se ha movido a un sistema de colas (Queue/Jobs)
// para desacoplar la lógica de negocio del acceso a datos y mejorar la escalabilidad.
// Este servicio se centra únicamente en operaciones CRUD.
