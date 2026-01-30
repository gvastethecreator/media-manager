/**
 * @file Adaptador para convertir UploadedImageResult (API) a UploadedImageWithStats (canónico)
 */

import type { UploadedImageStatistics, UploadedImageWithStats } from '@/types/entities/uploaded-image';
import type { UploadedImageResult } from '@/types/uploaded-images';

/**
 * Crea estadísticas por defecto para una UploadedImage
 */
function defaultUploadedImageStats(partial?: Partial<UploadedImageStatistics>): UploadedImageStatistics {
	const now = new Date();
	return {
		// Conteos base heredados de EntityStats
		imageCount: 0,
		videoCount: 0,
		albumCount: 0,
		collectionCount: 0,
		tagCount: 0,
		characterCount: 0,
		placeCount: 0,
		worldItemCount: 0,
		conceptCount: 0,
		promptCount: 0,
		noteCount: 0,
		wildcardCount: 0,
		propertyCount: 0,
		groupCount: 0,
		totalItems: 1,
		totalAssociations: 0,
		lastUpdated: now,
		size: partial?.size ?? 0,
		mtime: now,
		birthtime: now,
		type: 'uploaded-image',
		// Específicos
		totalViews: partial?.totalViews ?? 0,
		lastAccessed: partial?.lastAccessed ?? now.toISOString(),
		processingTime: partial?.processingTime,
		// Métricas opcionales
		viewCount: partial?.viewCount,
		downloadCount: partial?.downloadCount,
		likeCount: partial?.likeCount,
		commentCount: partial?.commentCount,
		qualityScore: partial?.qualityScore,
		completenessScore: partial?.completenessScore,
		isDuplicate: partial?.isDuplicate,
		isOrphaned: partial?.isOrphaned,
		needsAttention: partial?.needsAttention,
	};
}

/**
 * Adaptador: UploadedImageResult (API) -> UploadedImageWithStats (UI)
 */
export function adaptUploadedImageResultToWithStats(data: UploadedImageResult): UploadedImageWithStats {
	const stats = defaultUploadedImageStats({ size: data.size });
	return {
		id: data.id,
		name: data.name,
		path: data.path,
		size: data.size,
		hash: data.hash,
		metadata: data.metadata ? JSON.stringify(data.metadata) : null,
		imageId: data.imageId,
		type: data.type,
		category: data.category,
		width: data.width,
		height: data.height,
		isFavorite: false,
		createdAt: new Date(data.createdAt),
		updatedAt: new Date(data.updatedAt),
		// Extended
		uploadedAt: new Date(data.createdAt),
		dimensions: data.dimensions,
		url: data.url,
		thumbnailUrl: data.thumbnailUrl,
		// WithStats
		entityType: 'uploaded-image',
		stats,
	};
}
