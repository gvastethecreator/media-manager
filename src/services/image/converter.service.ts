import { serverLogger } from '@/lib/logger/server-logger';
import { createDefaultEntityStats } from '@/lib/utils';
import type { ImageWithStats } from '@/types/entities/image';

const converterLogger = serverLogger.withContext('ImageConverter');

interface RelatedCollection {
	color: string;
	emoji: string;
	id: string;
	name: string;
}

interface RelatedTag {
	color: string;
	id: string;
	name: string;
}

interface RelatedAlbum {
	color: string;
	emoji: string;
	id: string;
	name: string;
}

interface RelatedCharacter {
	class?: string;
	color: string;
	emoji: string;
	id: string;
	level?: number;
	name: string;
	race?: string;
}

interface RelatedPlace {
	climate?: string;
	color: string;
	emoji: string;
	id: string;
	name: string;
	region?: string;
	type?: string;
}

interface RelatedWorldItem {
	color: string;
	emoji: string;
	id: string;
	name: string;
	rarity?: string;
	type?: string;
}

interface RelatedConcept {
	color: string;
	emoji: string;
	id: string;
	name: string;
}

interface RelatedPrompt {
	color: string;
	emoji: string;
	id: string;
	name: string;
}

interface RelatedNote {
	color: string;
	emoji: string;
	id: string;
	name: string;
}

interface RelatedGroup {
	color: string;
	emoji: string;
	id: string;
	name: string;
}

interface RelatedProperty {
	color: string;
	emoji: string;
	id: string;
	name: string;
}

interface RelatedWildcard {
	color: string;
	emoji: string;
	id: string;
	name: string;
}

export interface ServerImage {
	albums?: RelatedAlbum[];
	assetId?: string | null;
	canonicalDivergences?: string[];
	canonicalState?: 'canonical' | 'legacy_only' | 'diverged';
	characters?: RelatedCharacter[];
	collections?: RelatedCollection[];
	concepts?: RelatedConcept[];
	createdAt: Date;
	folderId: string;
	groups?: RelatedGroup[];
	height: number | null;
	id: string;
	legacyId?: string;

	isFavorite: boolean;
	metadata: string | null;
	name: string;
	notes?: RelatedNote[];
	path: string;
	places?: RelatedPlace[];
	prompts?: RelatedPrompt[];
	properties?: RelatedProperty[];
	size: number;
	tags?: RelatedTag[];
	thumbnail: Buffer | Uint8Array | null;
	thumbnailHeight: number | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	updatedAt: Date;
	width: number | null;
	wildcards?: RelatedWildcard[];
	worldItems?: RelatedWorldItem[];
}

export const convertServerImageToFileItem = (image: ServerImage): ImageWithStats => {
	try {
		// Manejar tanto Buffer (Node.js) como Uint8Array (navegador/Vite)
		const thumbnail = image.thumbnail
			? image.thumbnail instanceof Uint8Array
				? btoa(String.fromCharCode(...image.thumbnail))
				: Buffer.from(image.thumbnail).toString('base64')
			: null;

		// Crear ImageWithStats compatible
		const imageWithStats = {
			id: image.assetId ?? image.id,
			assetId: image.assetId ?? null,
			legacyId: image.legacyId ?? image.id,
			canonicalState: image.canonicalState ?? (image.assetId ? 'canonical' : 'legacy_only'),
			canonicalDivergences: image.canonicalDivergences ?? [],
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
				...createDefaultEntityStats({
					size: image.size,
					lastUpdated: image.updatedAt,
					mtime: image.updatedAt,
					birthtime: image.createdAt,
					type: 'file',
				}),
				// Conteos por relación
				imageCount: 1,
				videoCount: 0,
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
				// Totales
				totalItems: 1,
				totalAssociations:
					(image.tags?.length ?? 0) +
					(image.albums?.length ?? 0) +
					(image.collections?.length ?? 0) +
					(image.characters?.length ?? 0) +
					(image.places?.length ?? 0) +
					(image.worldItems?.length ?? 0) +
					(image.concepts?.length ?? 0) +
					(image.prompts?.length ?? 0) +
					(image.notes?.length ?? 0) +
					(image.wildcards?.length ?? 0) +
					(image.properties?.length ?? 0) +
					(image.groups?.length ?? 0),
				// Específico de imagen
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
