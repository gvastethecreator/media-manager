/**
 * Tipo de vista para archivos
 */
export type ViewType = 'grid' | 'list' | 'masonry';

/**
 * Etiqueta relacionada para archivos
 */
export interface RelatedTag {
	id: string;
	name: string;
	color: string;
	count?: number;
}

export interface FileItem {
	id: string;
	name: string;
	path: string;
	type: 'image';
	size: number;
	width: number;
	height: number;
	mimeType?: string;
	metadata?: {
		dimensions?: {
			width: number;
			height: number;
		};
		colorSpace?: string;
		hasAlpha?: boolean;
		isAnimated?: boolean;
		exif?: {
			make?: string;
			model?: string;
			software?: string;
			dateTime?: string | Date;
			exposureTime?: number;
			fNumber?: number;
			iso?: number;
			focalLength?: number;
			lens?: string;
			copyright?: string;
			artist?: string;
			description?: string;
			gps?: {
				latitude: number;
				longitude: number;
				altitude?: number;
			};
		};
		xmp?: {
			title?: string;
			creator?: string;
			rights?: string;
			subject?: string[];
			rating?: number;
		};
		iptc?: {
			headline?: string;
			caption?: string;
			keywords?: string[];
			copyright?: string;
			source?: string;
		};
		generation?: {
			type?: string;
			prompt?: string;
			negative_prompt?: string;
			model?: string;
			steps?: number;
			cfg_scale?: number;
			seed?: number | string;
			sampler?: string;
			extra_params?: Record<string, string | number | boolean | null | undefined | string[]>;
		};
	};
	thumbnail?: string;
	thumbnailSize?: number;
	thumbnailWidth?: number;
	thumbnailHeight?: number;
	src: string;
	tags: Array<{
		id: string;
		name: string;
		color: string;
	}>;
	collections: Array<{
		id: string;
		name: string;
		emoji: string;
		color: string;
	}>;
	isPublic: boolean;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	stats?: {
		views: number;
		// downloads: number; // ❌ ELIMINADO - No existe en esquema Prisma ImageStats
		lastViewed: Date;
	};
}
