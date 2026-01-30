/**
 * Utilidades para trabajar con carpetas y rutas
 */

import { dirname } from 'path';

/**
 * Obtiene el ID de carpeta a partir de una ruta de archivo
 * Busca la carpeta que contiene el archivo especificado
 */
export async function getFolderIdFromPath(filePath: string): Promise<{ id: string; path: string } | null> {
	try {
		const { db } = await import('@/lib/drizzle');
		const { folders } = await import('@/lib/drizzle/schema');
		const { eq } = await import('drizzle-orm');

		const directoryPath = dirname(filePath);

		// Buscar carpeta exacta primero
		const folder = await db.query.folders.findFirst({
			where: eq(folders.path, directoryPath),
			columns: { id: true, path: true },
		});

		if (folder) {
			return folder;
		}

		// Si no encontramos carpeta exacta, buscar carpeta padre que contenga el archivo
		const allFolders = await db.select({ id: folders.id, path: folders.path }).from(folders);

		// Ordenar por longitud descendente para encontrar la carpeta más específica
		const sortedFolders = allFolders
			.filter((f: { id: string; path: string }) => filePath.startsWith(f.path))
			.sort((a: { path: string }, b: { path: string }) => b.path.length - a.path.length);

		return sortedFolders[0] || null;
	} catch (error) {
		console.error('Error obteniendo folderId desde ruta:', error);
		return null;
	}
}

/**
 * Normaliza una ruta para comparaciones consistentes
 */
export function normalizePath(path: string): string {
	return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}
