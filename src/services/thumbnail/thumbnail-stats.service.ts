import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import {
	assets,
	audios,
	documents,
	file3Ds,
	images,
	jsonFiles,
	metadatas,
	sourceFiles,
	videos,
} from '@/lib/drizzle/schema';
import { visibleAssetLifecycleCondition } from '@/services/media-core/canonical-media-persistence';

export type ThumbnailStatRow = {
	assetId: string | null;
	id: string;
	path: string;
	relativePath: string | null;
	rootId: string | null;
	sourceAssetId: string | null;
	withDerived: number;
};

export async function loadThumbnailStatRows(): Promise<{
	audioRows: ThumbnailStatRow[];
	documentRows: ThumbnailStatRow[];
	file3dRows: ThumbnailStatRow[];
	imageRows: ThumbnailStatRow[];
	jsonRows: ThumbnailStatRow[];
	videoRows: ThumbnailStatRow[];
}> {
	const [imageRows, videoRows, audioRows, documentRows, jsonRows, file3dRows] = await Promise.all([
		db
			.select({
				assetId: images.assetId,
				id: images.id,
				path: images.path,
				relativePath: sourceFiles.relativePath,
				rootId: sourceFiles.rootId,
				sourceAssetId: sourceFiles.assetId,
				withDerived: sql<number>`CASE WHEN ${images.thumbnail} IS NOT NULL THEN 1 ELSE 0 END`,
			})
			.from(images)
			.leftJoin(assets, eq(images.assetId, assets.id))
			.leftJoin(sourceFiles, eq(assets.primarySourceFileId, sourceFiles.id))
			.where(visibleAssetLifecycleCondition(images.assetId)),
		db
			.select({
				assetId: videos.assetId,
				id: videos.id,
				path: videos.path,
				relativePath: sourceFiles.relativePath,
				rootId: sourceFiles.rootId,
				sourceAssetId: sourceFiles.assetId,
				withDerived: sql<number>`CASE WHEN ${videos.thumbnail} IS NOT NULL THEN 1 ELSE 0 END`,
			})
			.from(videos)
			.leftJoin(assets, eq(videos.assetId, assets.id))
			.leftJoin(sourceFiles, eq(assets.primarySourceFileId, sourceFiles.id))
			.where(visibleAssetLifecycleCondition(videos.assetId)),
		db
			.select({
				assetId: audios.assetId,
				id: audios.id,
				path: audios.path,
				relativePath: sourceFiles.relativePath,
				rootId: sourceFiles.rootId,
				sourceAssetId: sourceFiles.assetId,
				withDerived: sql<number>`CASE WHEN json_valid(${audios.metadata}) THEN
					json_type(${audios.metadata}, '$.waveform') IS NOT NULL OR
					json_type(${audios.metadata}, '$.waveformBase64') IS NOT NULL
				ELSE 0 END`,
			})
			.from(audios)
			.leftJoin(assets, eq(audios.assetId, assets.id))
			.leftJoin(sourceFiles, eq(assets.primarySourceFileId, sourceFiles.id))
			.where(visibleAssetLifecycleCondition(audios.assetId)),
		db
			.select({
				assetId: documents.assetId,
				id: documents.id,
				path: documents.path,
				relativePath: sourceFiles.relativePath,
				rootId: sourceFiles.rootId,
				sourceAssetId: sourceFiles.assetId,
				withDerived: sql<number>`CASE WHEN ${documents.thumbnail} IS NOT NULL OR EXISTS (
					SELECT 1 FROM ${metadatas}
					WHERE ${metadatas.entityId} = ${documents.id}
						AND ${metadatas.entityType} = 'document'
						AND ${metadatas.key} = 'thumbnail'
						AND ${metadatas.value} IS NOT NULL
				) THEN 1 ELSE 0 END`,
			})
			.from(documents)
			.leftJoin(assets, eq(documents.assetId, assets.id))
			.leftJoin(sourceFiles, eq(assets.primarySourceFileId, sourceFiles.id))
			.where(visibleAssetLifecycleCondition(documents.assetId)),
		db
			.select({
				assetId: jsonFiles.assetId,
				id: jsonFiles.id,
				path: jsonFiles.path,
				relativePath: sourceFiles.relativePath,
				rootId: sourceFiles.rootId,
				sourceAssetId: sourceFiles.assetId,
				withDerived: sql<number>`0`,
			})
			.from(jsonFiles)
			.leftJoin(assets, eq(jsonFiles.assetId, assets.id))
			.leftJoin(sourceFiles, eq(assets.primarySourceFileId, sourceFiles.id))
			.where(visibleAssetLifecycleCondition(jsonFiles.assetId)),
		db
			.select({
				assetId: file3Ds.assetId,
				id: file3Ds.id,
				path: file3Ds.path,
				relativePath: sourceFiles.relativePath,
				rootId: sourceFiles.rootId,
				sourceAssetId: sourceFiles.assetId,
				withDerived: sql<number>`0`,
			})
			.from(file3Ds)
			.leftJoin(assets, eq(file3Ds.assetId, assets.id))
			.leftJoin(sourceFiles, eq(assets.primarySourceFileId, sourceFiles.id))
			.where(visibleAssetLifecycleCondition(file3Ds.assetId)),
	]);

	return { audioRows, documentRows, file3dRows, imageRows, jsonRows, videoRows };
}
