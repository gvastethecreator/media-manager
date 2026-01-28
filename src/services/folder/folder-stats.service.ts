/**
 * @file Servicio de estadísticas para Folder
 * @module services/folder/folder-stats.service
 * @description Lógica de conteo de media usando SQL directo para optimización de rendimiento
 */

import { sql } from 'drizzle-orm';
import { instrumentedAll } from '@/lib/drizzle/instrumentation';

/**
 * Conteos de archivos por tipo para una carpeta
 */
export type FolderMediaCounts = {
	images: number;
	videos: number;
	audios: number;
	documents: number;
	jsonFiles: number;
	file3Ds: number;
};

/**
 * Mapa de conteos de archivos por ID de carpeta
 */
export type FolderMediaCountsMap = Record<string, FolderMediaCounts>;

/**
 * Devuelve conteos de archivos por tipo para un conjunto de carpetas.
 * Implementación en una única consulta (UNION ALL) para evitar N+1.
 * @param folderIds - Array de IDs de carpetas para obtener conteos
 * @returns Mapa con conteos de media por cada ID de carpeta
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
      SELECT 'jsonFile' AS type, folderId, COUNT(1) AS count
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

	// Inicializar conteos en 0 para todas las carpetas
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

	// Procesar resultados y asignar conteos
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
			case 'jsonFile':
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
