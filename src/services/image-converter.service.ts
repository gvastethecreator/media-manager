import { serverLogger } from '@/lib/logger/server-logger';
import type { Dimensions, FileItem } from '@/types/file-item';

const converterLogger = serverLogger.withContext('ImageConverter');

interface RelatedCollection {
	id: string;
	name: string;
	emoji: string;
	color: string;
}

interface RelatedTag {
	id: string;
	name: string;
	color: string;
}

interface RelatedAlbum {
	id: string;
	name: string;
	emoji: string;
	color: string;
}

interface RelatedCharacter {
	id: string;
	name: string;
	emoji: string;
	color: string;
	level?: number;
	class?: string;
	race?: string;
}

interface RelatedPlace {
	id: string;
	name: string;
	emoji: string;
	color: string;
	region?: string;
	type?: string;
	climate?: string;
}

interface RelatedWorldItem {
	id: string;
	name: string;
	emoji: string;
	color: string;
	type?: string;
	rarity?: string;
}

export interface ServerImage {
	id: string;
	name: string;
	path: string;
	size: number;
	width: number | null;
	height: number | null;
	metadata: string | null;
	thumbnail: Buffer | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	isPublic: boolean;
	isFavorite: boolean;
	folderId: string;
	createdAt: Date;
	updatedAt: Date;
	collections?: RelatedCollection[];
	tags?: RelatedTag[];
	albums?: RelatedAlbum[];
	characters?: RelatedCharacter[];
	places?: RelatedPlace[];
	worldItems?: RelatedWorldItem[];
}

export const convertServerImageToFileItem = (image: ServerImage): FileItem => {
	try {
		const thumbnail = image.thumbnail ? Buffer.from(image.thumbnail).toString('base64') : null;

		return {
			id: image.id,
			name: image.name,
			path: image.path,
			type: 'image',
			size: image.size,
			width: image.width ?? 0,
			height: image.height ?? 0,
			metadata: image.metadata,
			thumbnail,
			thumbnailSize: image.thumbnailSize,
			thumbnailWidth: image.thumbnailWidth,
			thumbnailHeight: image.thumbnailHeight,
			thumbnailError: null,
			thumbnailErrorAt: null,
			thumbnailOptimizedAt: null,
			isPublic: image.isPublic ?? false,
			isFavorite: image.isFavorite ?? false,
			folderId: image.folderId,
			createdAt: image.createdAt,
			updatedAt: image.updatedAt,
			collections: image.collections ?? [],
			tags: image.tags ?? [],
			albums: image.albums ?? [],
			characters: image.characters ?? [],
			places: image.places ?? [],
			worldItems: image.worldItems ?? [],
			concepts: [],
			prompts: [],
			notes: [],
			hash: '',
			stats: null,
		};
	} catch (error) {
		converterLogger.error('❌ Error al convertir imagen del servidor:', { error, image });
		throw new Error('Error al procesar imagen del servidor');
	}
};

export const imageConverterService = {
	convertServerImageToFileItem,
};
