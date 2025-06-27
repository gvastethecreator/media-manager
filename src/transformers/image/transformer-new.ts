// Transformer optimizado para Image
import type { ImageStatistics, ImageWithStats, PrismaImageWithCounts } from '@/types/entities/image';

export function fromPrismaImageWithCounts(prismaImage: PrismaImageWithCounts): ImageWithStats {
	const statistics: ImageStatistics = {
		totalAlbums: prismaImage._count.albums,
		totalCollections: prismaImage._count.collections,
		totalTags: prismaImage._count.tags,
		totalCharacters: prismaImage._count.characters,
		totalPlaces: prismaImage._count.places,
		totalWorldItems: prismaImage._count.worldItems,
		totalConcepts: prismaImage._count.concepts,
		totalPrompts: prismaImage._count.prompts,
		totalNotes: prismaImage._count.notes,
		totalWildcards: prismaImage._count.wildcards,
		totalProperties: prismaImage._count.properties,
		totalGroups: prismaImage._count.groups,
		totalAssociations: Object.values(prismaImage._count).reduce((sum, count) => sum + count, 0),
		megapixels: Number(((prismaImage.width * prismaImage.height) / 1_000_000).toFixed(2)),
		aspectRatio: Number((prismaImage.width / prismaImage.height).toFixed(2)),
		fileSize: Number((prismaImage.size / (1024 * 1024)).toFixed(2)),
		dimensions: `${prismaImage.width}x${prismaImage.height}`,
		views: 0,
		likes: 0,
		downloads: 0,
		shares: 0,
		qualityScore: 85,
		technicalGrade: 'A',
		colorTemperature: 'neutral',
		aiConfidence: 75,
		autoTags: ['image'],
		duplicateStatus: 'unique',
		lastUpdated: new Date(),
	};

	return {
		...prismaImage,
		statistics,
		thumbnailUrl: `/api/images/${prismaImage.id}/thumbnail`,
		fullUrl: `/api/images/${prismaImage.id}/full`,
		displayName: prismaImage.name || `Image ${prismaImage.id.slice(-8)}`,
		parsedMetadata: null,
		formattedSize: `${statistics.fileSize} MB`,
		formattedDimensions: `${prismaImage.width} × ${prismaImage.height}`,
		aspectRatioLabel: `${statistics.aspectRatio}:1`,
	};
}
