import { serverLogger } from '@/lib/logger/server-logger';
import type { FileItem } from '@/types/files';

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

interface RelatedConcept {
	id: string;
	name: string;
	emoji: string;
	color: string;
}

interface RelatedPrompt {
	id: string;
	name: string;
	emoji: string;
	color: string;
}

interface RelatedNote {
	id: string;
	name: string;
	emoji: string;
	color: string;
}

interface RelatedGroup {
	id: string;
	name: string;
	emoji: string;
	color: string;
}

interface RelatedProperty {
	id: string;
	name: string;
	emoji: string;
	color: string;
}

interface RelatedWildcard {
	id: string;
	name: string;
	emoji: string;
	color: string;
}

export interface ServerImage {
	id: string;
	name: string;
	path: string;
	size: number;
	width: number | null;
	height: number | null;
	metadata: string | null;
	thumbnail: Buffer | Uint8Array | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;

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
	concepts?: RelatedConcept[];
	prompts?: RelatedPrompt[];
	notes?: RelatedNote[];
	groups?: RelatedGroup[];
	properties?: RelatedProperty[];
	wildcards?: RelatedWildcard[];
}

export const convertServerImageToFileItem = (image: ServerImage): FileItem => {
	try {
		// Manejar tanto Buffer (Node.js) como Uint8Array (navegador/Vite)
		const thumbnail = image.thumbnail
			? image.thumbnail instanceof Uint8Array
				? btoa(String.fromCharCode(...image.thumbnail))
				: Buffer.from(image.thumbnail).toString('base64')
			: null;

		// Crear ImageWithStats compatible
		const imageWithStats = {
			id: image.id,
			name: image.name,
			description: null,
			path: image.path,
			hash: '',
			size: image.size,
			width: image.width ?? 0,
			height: image.height ?? 0,
			metadata: image.metadata,
			thumbnail,
			thumbnailSize: image.thumbnailSize ?? null,
			thumbnailWidth: image.thumbnailWidth ?? null,
			thumbnailHeight: image.thumbnailHeight ?? null,
			thumbnailMimeType: null,
			thumbnailError: null,
			thumbnailErrorAt: null,
			thumbnailOptimizedAt: null,
			isFavorite: image.isFavorite ?? false,
			folderId: image.folderId,
			noteId: null,
			createdAt: image.createdAt,
			updatedAt: image.updatedAt,
			addedAt: image.createdAt,
			entityType: 'image' as const,
			stats: {
				viewCount: 0,
				downloadCount: 0,
				likeCount: 0,
				commentCount: 0,
				tagCount: image.tags?.length ?? 0,
				albumCount: image.albums?.length ?? 0,
				collectionCount: image.collections?.length ?? 0,
				characterCount: image.characters?.length ?? 0,
				placeCount: image.places?.length ?? 0,
				worldItemCount: image.worldItems?.length ?? 0,
				conceptCount: image.concepts?.length ?? 0,
				promptCount: image.prompts?.length ?? 0,
				noteCount: image.notes?.length ?? 0,
				wildcardCount: image.wildcards?.length ?? 0,
				propertyCount: image.properties?.length ?? 0,
				groupCount: image.groups?.length ?? 0,
				aspectRatio: image.width && image.height ? image.width / image.height : 1,
			},
			thumbnailUrl: thumbnail ? `data:image/jpeg;base64,${thumbnail}` : '',
			fullUrl: image.path,
			_count: {
				albums: image.albums?.length ?? 0,
				collections: image.collections?.length ?? 0,
				tags: image.tags?.length ?? 0,
				characters: image.characters?.length ?? 0,
				places: image.places?.length ?? 0,
				worldItems: image.worldItems?.length ?? 0,
				concepts: image.concepts?.length ?? 0,
				prompts: image.prompts?.length ?? 0,
				notes: image.notes?.length ?? 0,
				wildcards: image.wildcards?.length ?? 0,
				properties: image.properties?.length ?? 0,
				groups: image.groups?.length ?? 0,
			},
		};

		return imageWithStats;
	} catch (error) {
		converterLogger.error('❌ Error al convertir imagen del servidor:', { error, image });
		throw new Error('Error al procesar imagen del servidor');
	}
};

export const imageConverterService = {
	convertServerImageToFileItem,
};
