import { and, count, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { audios, documents, file3Ds, images, jsonFiles, videos } from '@/lib/drizzle/schema';
import { visibleImageLifecycleCondition } from '@/services/image/image-lifecycle-query';

export interface PublicFolderFileTotals {
	totalFiles: number;
	totalImages: number;
	totalSize: number;
	totalVideos: number;
}

type MediaAggregate = { count: number; folderId: string; totalSize: number };

export async function getPublicFolderFileTotals(
	folderIds: readonly string[]
): Promise<Map<string, PublicFolderFileTotals>> {
	const totals = new Map<string, PublicFolderFileTotals>();
	for (const folderId of folderIds) {
		totals.set(folderId, { totalFiles: 0, totalImages: 0, totalSize: 0, totalVideos: 0 });
	}
	if (folderIds.length === 0) return totals;

	const [imageRows, videoRows, audioRows, documentRows, jsonRows, file3DRows] = await Promise.all([
		db
			.select({ count: count(), folderId: images.folderId, totalSize: sql<number>`COALESCE(SUM(${images.size}), 0)` })
			.from(images)
			.where(and(inArray(images.folderId, [...folderIds]), visibleImageLifecycleCondition()))
			.groupBy(images.folderId),
		db
			.select({ count: count(), folderId: videos.folderId, totalSize: sql<number>`COALESCE(SUM(${videos.size}), 0)` })
			.from(videos)
			.where(inArray(videos.folderId, [...folderIds]))
			.groupBy(videos.folderId),
		db
			.select({ count: count(), folderId: audios.folderId, totalSize: sql<number>`COALESCE(SUM(${audios.size}), 0)` })
			.from(audios)
			.where(inArray(audios.folderId, [...folderIds]))
			.groupBy(audios.folderId),
		db
			.select({
				count: count(),
				folderId: documents.folderId,
				totalSize: sql<number>`COALESCE(SUM(${documents.size}), 0)`,
			})
			.from(documents)
			.where(inArray(documents.folderId, [...folderIds]))
			.groupBy(documents.folderId),
		db
			.select({
				count: count(),
				folderId: jsonFiles.folderId,
				totalSize: sql<number>`COALESCE(SUM(${jsonFiles.size}), 0)`,
			})
			.from(jsonFiles)
			.where(inArray(jsonFiles.folderId, [...folderIds]))
			.groupBy(jsonFiles.folderId),
		db
			.select({
				count: count(),
				folderId: file3Ds.folderId,
				totalSize: sql<number>`COALESCE(SUM(${file3Ds.size}), 0)`,
			})
			.from(file3Ds)
			.where(inArray(file3Ds.folderId, [...folderIds]))
			.groupBy(file3Ds.folderId),
	]);

	const addRows = (rows: MediaAggregate[], type: 'image' | 'video' | 'other') => {
		for (const row of rows) {
			const current = totals.get(row.folderId);
			if (!current) continue;
			current.totalFiles += Number(row.count);
			current.totalSize += Number(row.totalSize);
			if (type === 'image') current.totalImages += Number(row.count);
			if (type === 'video') current.totalVideos += Number(row.count);
		}
	};

	addRows(imageRows, 'image');
	addRows(videoRows, 'video');
	for (const rows of [audioRows, documentRows, jsonRows, file3DRows]) addRows(rows, 'other');
	return totals;
}
