export type ViewType =
	| 'all-images'
	| 'favorites'
	| 'collections'
	| 'collection-content'
	| 'folders'
	| 'folder-content'
	| 'tags'
	| 'tag-content'
	| 'search'
	| 'files'
	| 'settings'
	| 'development'
	| 'loading'
	| 'albums'
	| 'album-content'
	| 'characters'
	| 'character-content'
	| 'places'
	| 'place-content'
	| 'world-items'
	| 'world-item-content'
	| 'concepts'
	| 'concept-content'
	| 'prompts'
	| 'prompt-content'
	| 'notes'
	| 'note-content'
	| 'groups'
	| 'group-content'
	| 'properties'
	| 'property-content'
	| 'wildcards'
	| 'wildcard-content'
	| 'entity-cards'
	| 'canvas'
	| 'chat';

export interface BaseItem {
	id: string;
	name: string;
	count: number;
	emoji?: string;
}

export interface Dimensions {
	width: number;
	height: number;
}

export interface ExifData {
	Make?: string;
	Model?: string;
	Software?: string;
	DateTime?: string;
	ExposureTime?: number;
	FNumber?: number;
	ISO?: number;
	FocalLength?: number;
}

export interface GenerationData {
	prompt?: string;
	negative_prompt?: string;
	model?: string;
	steps?: number;
	cfg_scale?: number;
	seed?: number;
	sampler?: string;
}

export interface FileMetadata {
	mimeType?: string;
	dimensions?: {
		width: number;
		height: number;
	};
	colorSpace?: string;
	hasAlpha?: boolean;
	isAnimated?: boolean;

	// EXIF metadata
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

	// XMP metadata
	xmp?: {
		title?: string;
		creator?: string;
		rights?: string;
		subject?: string[];
		rating?: number;
	};

	// IPTC metadata
	iptc?: {
		headline?: string;
		caption?: string;
		keywords?: string[];
		copyright?: string;
		source?: string;
	};

	// AI Generation metadata
	generation?: {
		type: 'stable-diffusion' | 'comfyui' | 'midjourney' | 'dalle' | string;
		prompt?: string;
		negative_prompt?: string;
		model?: string;
		steps?: number;
		cfg_scale?: number;
		cfg?: number; // Para ComfyUI
		seed?: number | string;
		sampler?: string;
		scheduler?: string;
		clip_skip?: number;
		workflow?: string; // Para ComfyUI
		extra_params?: Record<string, string | number | boolean | null | undefined | string[]>;
	};
}

export interface FileItem {
	id: string;
	hash: string;
	name: string;
	path: string;
	type: 'file' | 'folder' | 'image';
	size: number;
	width: number;
	height: number;
	metadata: string | null;
	thumbnail: string | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	thumbnailError: string | null;
	thumbnailErrorAt: Date | null;
	thumbnailOptimizedAt: Date | null;
	isPublic: boolean;
	isFavorite: boolean;
	folderId: string;
	createdAt: Date;
	updatedAt: Date;
	collections: RelatedCollection[];
	tags: RelatedTag[];
	albums: RelatedAlbum[];
	characters: RelatedCharacter[];
	places: RelatedPlace[];
	worldItems: RelatedWorldItem[];
	concepts: RelatedConcept[];
	prompts: RelatedPrompt[];
	notes: RelatedNote[];
	groups?: RelatedGroup[];
	properties?: RelatedProperty[];
	wildcards?: RelatedWildcard[];
	stats?: ImageStats | null;
}

export interface ImageStats {
	id: string;
	imageId: string;
	views: number;
	downloads: number;
	lastViewed: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface RelatedCollection {
	id: string;
	name: string;
}

export interface RelatedTag {
	id: string;
	name: string;
	color: string;
}

export interface RelatedAlbum {
	id: string;
	name: string;
}

export interface RelatedCharacter {
	id: string;
	name: string;
}

export interface RelatedPlace {
	id: string;
	name: string;
}

export interface RelatedWorldItem {
	id: string;
	name: string;
}

export interface RelatedConcept {
	id: string;
	name: string;
}

export interface RelatedPrompt {
	id: string;
	name: string;
}

export interface RelatedNote {
	id: string;
	title: string;
}

export interface RelatedGroup {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
}

export interface RelatedProperty {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
}

export interface RelatedWildcard {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
}

export interface ImageItem extends FileItem {
	url?: string;
	src: string;
	alt: string;
	mimeType?: string;
}

export interface ThumbnailResponse {
	thumbnail: string;
	width?: number;
	height?: number;
	size?: number;
	mimeType?: string;
}

export interface ViewProps {
	isResizing?: boolean;
}

export interface ViewContainerProps {
	isResizing?: boolean;
}
