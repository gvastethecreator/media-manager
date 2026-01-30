import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import {
	// Entities with caches
	albums,
	audios,
	collections,
	documents,
	entityAggregates,
	file3Ds,
	folders,
	groupImages,
	groupVideos,
	// Relations
	imageAlbums,
	imageCollections,
	images,
	imageTags,
	jsonFiles,
	videoAlbums,
	videoCollections,
	videos,
	videoTags,
} from '@/lib/drizzle/schema/index';

type EntityType =
	| 'folder'
	| 'collection'
	| 'album'
	| 'tag'
	| 'character'
	| 'place'
	| 'concept'
	| 'worldItem'
	| 'prompt'
	| 'note'
	| 'group';

export async function recomputeAggregatesForFolder(folderId: string) {
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

	const totals = {
		totalImages: Number(imgAgg?.count ?? 0),
		totalVideos: Number(vidAgg?.count ?? 0),
		totalAudio: Number(audAgg?.count ?? 0),
		totalDocuments: Number(docAgg?.count ?? 0),
		totalJsonFiles: Number(jsonAgg?.count ?? 0),
		totalFile3D: Number(f3dAgg?.count ?? 0),
	};
	const totalFiles =
		totals.totalImages +
		totals.totalVideos +
		totals.totalAudio +
		totals.totalDocuments +
		totals.totalJsonFiles +
		totals.totalFile3D;
	const totalSize =
		Number(imgAgg?.size ?? 0) +
		Number(vidAgg?.size ?? 0) +
		Number(audAgg?.size ?? 0) +
		Number(docAgg?.size ?? 0) +
		Number(jsonAgg?.size ?? 0) +
		Number(f3dAgg?.size ?? 0);

	// Upsert en EntityAggregates
	await db
		.insert(entityAggregates)
		.values({
			entityType: 'folder',
			entityId: folderId,
			...totals,
			totalFiles,
			totalSize,
			lastIndexed: new Date(),
		})
		.onConflictDoUpdate({
			target: [entityAggregates.entityType, entityAggregates.entityId],
			set: { ...totals, totalFiles, totalSize, lastIndexed: new Date() },
		});

	// Write-through en Folder (cache de lectura existente)
	await db.update(folders).set({ totalFiles, totalSize, lastIndexed: new Date() }).where(eq(folders.id, folderId));

	return { ...totals, totalFiles, totalSize } as const;
}

/**
 * Recalcula agregados para una Collection y realiza upsert en EntityAggregates
 * Además, actualiza campos cache en la propia Collection (totalImages, totalVideos, totalSize, last*AddedAt)
 */
export async function recomputeAggregatesForCollection(collectionId: string) {
	// Imagenes en colección
	const [imgAgg] = await db
		.select({
			count: sql<number>`COALESCE(COUNT(1), 0)`,
			size: sql<number>`COALESCE(SUM(${images.size}), 0)`,
			last: sql<number | null>`MAX(${images.createdAt})`,
		})
		.from(images)
		.innerJoin(imageCollections, and(eq(imageCollections.A, images.id), eq(imageCollections.B, collectionId)));

	// Videos en colección
	const [vidAgg] = await db
		.select({
			count: sql<number>`COALESCE(COUNT(1), 0)`,
			size: sql<number>`COALESCE(SUM(${videos.size}), 0)`,
			last: sql<number | null>`MAX(${videos.createdAt})`,
		})
		.from(videos)
		.innerJoin(videoCollections, and(eq(videoCollections.A, videos.id), eq(videoCollections.B, collectionId)));

	const totals = {
		totalImages: Number(imgAgg?.count ?? 0),
		totalVideos: Number(vidAgg?.count ?? 0),
		totalAudio: 0,
		totalDocuments: 0,
		totalJsonFiles: 0,
		totalFile3D: 0,
	} as const;

	const totalFiles = totals.totalImages + totals.totalVideos;
	const totalSize = Number(imgAgg?.size ?? 0) + Number(vidAgg?.size ?? 0);

	await db
		.insert(entityAggregates)
		.values({
			entityType: 'collection',
			entityId: collectionId,
			...totals,
			totalFiles,
			totalSize,
			lastIndexed: new Date(),
		})
		.onConflictDoUpdate({
			target: [entityAggregates.entityType, entityAggregates.entityId],
			set: { ...totals, totalFiles, totalSize, lastIndexed: new Date() },
		});

	// Write-through en colección
	await db
		.update(collections)
		.set({
			totalImages: totals.totalImages,
			totalVideos: totals.totalVideos,
			totalSize,
			lastImageAddedAt: imgAgg?.last ? new Date(Number(imgAgg.last)) : null,
			lastVideoAddedAt: vidAgg?.last ? new Date(Number(vidAgg.last)) : null,
			updatedAt: new Date(),
		})
		.where(eq(collections.id, collectionId));

	return { ...totals, totalFiles, totalSize } as const;
}

/**
 * Recalcula agregados para un Album y realiza upsert en EntityAggregates
 * Además, actualiza campos cache en el propio Album (totalImages, totalVideos, totalSize, last*AddedAt)
 */
export async function recomputeAggregatesForAlbum(albumId: string) {
	// Imagenes en álbum
	const [imgAgg] = await db
		.select({
			count: sql<number>`COALESCE(COUNT(1), 0)`,
			size: sql<number>`COALESCE(SUM(${images.size}), 0)`,
			last: sql<number | null>`MAX(${images.createdAt})`,
		})
		.from(images)
		.innerJoin(imageAlbums, and(eq(imageAlbums.A, images.id), eq(imageAlbums.B, albumId)));

	// Videos en álbum
	const [vidAgg] = await db
		.select({
			count: sql<number>`COALESCE(COUNT(1), 0)`,
			size: sql<number>`COALESCE(SUM(${videos.size}), 0)`,
			last: sql<number | null>`MAX(${videos.createdAt})`,
		})
		.from(videos)
		.innerJoin(videoAlbums, and(eq(videoAlbums.A, videos.id), eq(videoAlbums.B, albumId)));

	const totals = {
		totalImages: Number(imgAgg?.count ?? 0),
		totalVideos: Number(vidAgg?.count ?? 0),
		totalAudio: 0,
		totalDocuments: 0,
		totalJsonFiles: 0,
		totalFile3D: 0,
	} as const;

	const totalFiles = totals.totalImages + totals.totalVideos;
	const totalSize = Number(imgAgg?.size ?? 0) + Number(vidAgg?.size ?? 0);

	await db
		.insert(entityAggregates)
		.values({
			entityType: 'album',
			entityId: albumId,
			...totals,
			totalFiles,
			totalSize,
			lastIndexed: new Date(),
		})
		.onConflictDoUpdate({
			target: [entityAggregates.entityType, entityAggregates.entityId],
			set: { ...totals, totalFiles, totalSize, lastIndexed: new Date() },
		});

	// Write-through en álbum
	await db
		.update(albums)
		.set({
			totalImages: totals.totalImages,
			totalVideos: totals.totalVideos,
			totalSize,
			lastImageAddedAt: imgAgg?.last ? new Date(Number(imgAgg.last)) : null,
			lastVideoAddedAt: vidAgg?.last ? new Date(Number(vidAgg.last)) : null,
			updatedAt: new Date(),
		})
		.where(eq(albums.id, albumId));

	return { ...totals, totalFiles, totalSize } as const;
}

/**
 * Recalcula agregados para un Tag (basado en relaciones imageTags y videoTags)
 * y realiza upsert en EntityAggregates. No hay write-through porque Tag no tiene
 * campos de caché de conteos/tamaños.
 */
export async function recomputeAggregatesForTag(tagId: string) {
	// Imágenes etiquetadas
	const [imgAgg] = await db
		.select({
			count: sql<number>`COALESCE(COUNT(1), 0)`,
			size: sql<number>`COALESCE(SUM(${images.size}), 0)`,
		})
		.from(images)
		.innerJoin(imageTags, and(eq(imageTags.A, images.id), eq(imageTags.B, tagId)));

	// Videos etiquetados
	const [vidAgg] = await db
		.select({
			count: sql<number>`COALESCE(COUNT(1), 0)`,
			size: sql<number>`COALESCE(SUM(${videos.size}), 0)`,
		})
		.from(videos)
		.innerJoin(videoTags, and(eq(videoTags.A, videos.id), eq(videoTags.B, tagId)));

	const totals = {
		totalImages: Number(imgAgg?.count ?? 0),
		totalVideos: Number(vidAgg?.count ?? 0),
		totalAudio: 0,
		totalDocuments: 0,
		totalJsonFiles: 0,
		totalFile3D: 0,
	} as const;

	const totalFiles = totals.totalImages + totals.totalVideos;
	const totalSize = Number(imgAgg?.size ?? 0) + Number(vidAgg?.size ?? 0);

	await db
		.insert(entityAggregates)
		.values({
			entityType: 'tag',
			entityId: tagId,
			...totals,
			totalFiles,
			totalSize,
			lastIndexed: new Date(),
		})
		.onConflictDoUpdate({
			target: [entityAggregates.entityType, entityAggregates.entityId],
			set: { ...totals, totalFiles, totalSize, lastIndexed: new Date() },
		});

	return { ...totals, totalFiles, totalSize } as const;
}

/**
 * Recalcula agregados para un Group (suma imágenes y videos asociados) y upsert.
 * Ignoramos albums porque no representan archivos de contenido directo.
 */
export async function recomputeAggregatesForGroup(groupId: string) {
	// Imágenes del grupo
	const [imgAgg] = await db
		.select({
			count: sql<number>`COALESCE(COUNT(1), 0)`,
			size: sql<number>`COALESCE(SUM(${images.size}), 0)`,
		})
		.from(images)
		.innerJoin(groupImages, and(eq(groupImages.B, images.id), eq(groupImages.A, groupId)));

	// Videos del grupo
	const [vidAgg] = await db
		.select({
			count: sql<number>`COALESCE(COUNT(1), 0)`,
			size: sql<number>`COALESCE(SUM(${videos.size}), 0)`,
		})
		.from(videos)
		.innerJoin(groupVideos, and(eq(groupVideos.B, videos.id), eq(groupVideos.A, groupId)));

	const totals = {
		totalImages: Number(imgAgg?.count ?? 0),
		totalVideos: Number(vidAgg?.count ?? 0),
		totalAudio: 0,
		totalDocuments: 0,
		totalJsonFiles: 0,
		totalFile3D: 0,
	} as const;

	const totalFiles = totals.totalImages + totals.totalVideos;
	const totalSize = Number(imgAgg?.size ?? 0) + Number(vidAgg?.size ?? 0);

	await db
		.insert(entityAggregates)
		.values({
			entityType: 'group',
			entityId: groupId,
			...totals,
			totalFiles,
			totalSize,
			lastIndexed: new Date(),
		})
		.onConflictDoUpdate({
			target: [entityAggregates.entityType, entityAggregates.entityId],
			set: { ...totals, totalFiles, totalSize, lastIndexed: new Date() },
		});

	return { ...totals, totalFiles, totalSize } as const;
}
