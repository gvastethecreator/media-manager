import type { Album } from './albums';
import type { Character } from './characters';
import type { Collection } from './collections';
import type { Folder } from './folders';
import type { Place } from './places';
import type { Tag } from './tags';
import type { WorldItem } from './world-items';

export interface Image {
	id: string;
	hash: string;
	name: string;
	path: string;
	size: number;
	width: number;
	height: number;
	metadata?: string | null;
	thumbnail?: Buffer | null;
	thumbnailSize?: number | null;
	thumbnailWidth?: number | null;
	thumbnailHeight?: number | null;
	thumbnailError?: string | null;
	thumbnailErrorAt?: Date | string | null;
	thumbnailOptimizedAt?: Date | string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	folderId: string;
	folder?: Folder;
	createdAt: Date | string;
	updatedAt: Date | string;

	// Relaciones
	collections?: Collection[];
	tags?: Tag[];
	albums?: Album[];
	characters?: Character[];
	places?: Place[];
	worldItems?: WorldItem[];

	// Estadísticas
	stats?: {
		views: number;
		downloads: number;
		lastViewed: Date | string;
	};

	// Metadatos adicionales para UI
	blurDataUrl?: string;
}
