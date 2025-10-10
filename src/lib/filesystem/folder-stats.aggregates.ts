/**
 * 📊 FOLDER STATS - CÁLCULOS SQL AGREGADOS
 *
 * Funciones para recalcular y obtener estadísticas de carpetas mediante SQL directo
 */

import type { AggregateResult } from './folder-stats.types';

/**
 * Recalcula y persiste agregados de carpeta (totalFiles, totalSize)
 * Ejecuta 6 queries SQL (una por tipo de entidad) y actualiza la tabla folders
 */
export async function recomputeAndPersistFolderAggregates(
	folderId: string
): Promise<{ totalFiles: number; totalSize: number }> {
	const { db } = await import('@/lib/drizzle');
	const { folders, images, videos, audios, documents, jsonFiles, file3Ds } = await import('@/lib/drizzle/schema/index');
	const { recomputeAggregatesForFolder } = await import('@/server/services/aggregates.service');
	const { eq, sql } = await import('drizzle-orm');

	const [imgAgg] = await db
		.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${images.size}), 0)` })
		.from(images)
		.where(eq(images.folderId, folderId));
	const [vidAgg] = await db
		.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${videos.size}), 0)` })
		.from(videos)
		.where(eq(videos.folderId, folderId));
	const [audAgg] = await db
		.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${audios.size}), 0)` })
		.from(audios)
		.where(eq(audios.folderId, folderId));
	const [docAgg] = await db
		.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${documents.size}), 0)` })
		.from(documents)
		.where(eq(documents.folderId, folderId));
	const [jsonAgg] = await db
		.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${jsonFiles.size}), 0)` })
		.from(jsonFiles)
		.where(eq(jsonFiles.folderId, folderId));
	const [f3dAgg] = await db
		.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${file3Ds.size}), 0)` })
		.from(file3Ds)
		.where(eq(file3Ds.folderId, folderId));

	const totalFiles =
		Number(imgAgg?.count ?? 0) +
		Number(vidAgg?.count ?? 0) +
		Number(audAgg?.count ?? 0) +
		Number(docAgg?.count ?? 0) +
		Number(jsonAgg?.count ?? 0) +
		Number(f3dAgg?.count ?? 0);
	const totalSize =
		Number(imgAgg?.size ?? 0) +
		Number(vidAgg?.size ?? 0) +
		Number(audAgg?.size ?? 0) +
		Number(docAgg?.size ?? 0) +
		Number(jsonAgg?.size ?? 0) +
		Number(f3dAgg?.size ?? 0);

	await db.update(folders).set({ totalFiles, totalSize, lastIndexed: new Date() }).where(eq(folders.id, folderId));
	// Sincroniza agregados genéricos (upsert)
	try {
		await recomputeAggregatesForFolder(folderId);
	} catch {
		// No bloquear si falla la ruta genérica; el cache de Folder sigue actualizado
	}

	return { totalFiles, totalSize };
}

/**
 * Obtiene estadísticas de una carpeta (conteos + tamaño total)
 */
export async function getFolderStats(folderId: string): Promise<AggregateResult> {
	const { db } = await import('@/lib/drizzle');
	const { folders, images, videos, audios, documents, jsonFiles, file3Ds } = await import('@/lib/drizzle/schema/index');
	const { eq, sql } = await import('drizzle-orm');

	const [imgAgg] = await db
		.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${images.size}), 0)` })
		.from(images)
		.where(eq(images.folderId, folderId));
	const [vidAgg] = await db
		.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${videos.size}), 0)` })
		.from(videos)
		.where(eq(videos.folderId, folderId));
	const [audAgg] = await db
		.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${audios.size}), 0)` })
		.from(audios)
		.where(eq(audios.folderId, folderId));
	const [docAgg] = await db
		.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${documents.size}), 0)` })
		.from(documents)
		.where(eq(documents.folderId, folderId));
	const [jsonAgg] = await db
		.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${jsonFiles.size}), 0)` })
		.from(jsonFiles)
		.where(eq(jsonFiles.folderId, folderId));
	const [f3dAgg] = await db
		.select({ count: sql<number>`COALESCE(COUNT(1), 0)`, size: sql<number>`COALESCE(SUM(${file3Ds.size}), 0)` })
		.from(file3Ds)
		.where(eq(file3Ds.folderId, folderId));

	const totalFiles =
		Number(imgAgg?.count ?? 0) +
		Number(vidAgg?.count ?? 0) +
		Number(audAgg?.count ?? 0) +
		Number(docAgg?.count ?? 0) +
		Number(jsonAgg?.count ?? 0) +
		Number(f3dAgg?.count ?? 0);
	const totalSize =
		Number(imgAgg?.size ?? 0) +
		Number(vidAgg?.size ?? 0) +
		Number(audAgg?.size ?? 0) +
		Number(docAgg?.size ?? 0) +
		Number(jsonAgg?.size ?? 0) +
		Number(f3dAgg?.size ?? 0);

	const row = await db
		.select({ lastIndexed: folders.lastIndexed })
		.from(folders)
		.where(eq(folders.id, folderId))
		.limit(1);

	return {
		totalFiles,
		totalSize,
		lastIndexed: row[0]?.lastIndexed as Date | undefined,
		imageCount: Number(imgAgg?.count ?? 0),
	};
}
