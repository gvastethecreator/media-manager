/**
 * @file Tipos para items del File Browser
 * @module file-browser-new/types/item
 */

/**
 * Tipos de entidad soportados por el browser
 */
export type BrowserEntityType = 'folder' | 'image' | 'video' | 'audio' | 'document' | 'jsonFile' | 'file3d';

/**
 * Item base del browser - tipo canónico unificado
 */
export interface BrowserItem {
	/** Color personalizado (para folders) */
	color?: string | null;
	/** Fecha de creación */
	createdAt?: Date | string | number;
	/** Emoji personalizado (para folders) */
	emoji?: string | null;
	/** Tipo de entidad normalizado */
	entityType: BrowserEntityType;
	height?: number;
	/** ID único de la entidad */
	id: string;
	/** Flag para items sintéticos (como "..") */
	isSynthetic?: boolean;
	/** Tipo MIME (para archivos) */
	mimeType?: string | null;
	/** Nombre para mostrar */
	name: string;
	/** ID del padre (para folders) */
	parentId?: string | null;
	/** Ruta del archivo */
	path?: string;
	/** Previews recientes (principalmente para folders) */
	recentImages?: Array<{
		id?: string;
		name?: string;
		thumbnail?: string | null;
		thumbnailUrl?: string | null;
	}>;
	/** Entidad original (para integraciones/handlers que requieren el shape completo) */
	raw?: Record<string, unknown>;
	/** Tamaño en bytes (para archivos) */
	size?: number;
	/** URL del thumbnail (opcional) */
	thumbnailUrl?: string | null;
	/** Conteo de items (para folders) */
	totalItems?: number;
	/** Dimensiones (para imágenes/videos) */
	width?: number;
}

/**
 * Item con información de selección
 */
export interface SelectableBrowserItem extends BrowserItem {
	isActive: boolean;
	isSelected: boolean;
}

/**
 * Grupo de items para vistas agrupadas
 */
export interface BrowserItemGroup {
	/** Conteo total de items */
	count: number;
	/** Nombre para mostrar */
	displayName: string;
	/** Items del grupo */
	items: BrowserItem[];
	/** Clave única del grupo */
	key: string;
}

/**
 * Resultado de procesamiento de items
 */
export interface ProcessedItems {
	/** Grupos (si agrupación habilitada) */
	groups: BrowserItemGroup[] | null;
	/** Items después de búsqueda y sort */
	items: BrowserItem[];
	/** IDs lineales para navegación */
	linearIds: string[];
	/** Items sin sintéticos (para conteos) */
	realItems: BrowserItem[];
}

/**
 * Extrae width y height de múltiples fuentes posibles en la entidad
 */
function extractDimensions(entity: Record<string, unknown>): { width?: number; height?: number } {
	// 1. Campos directos width/height
	if (typeof entity.width === 'number' && typeof entity.height === 'number') {
		return { width: entity.width, height: entity.height };
	}

	// 2. Desde metadata.base.dimensions (endpoint /folders/:id/files)
	const metadata = entity.metadata as Record<string, unknown> | undefined;

	if (metadata?.base) {
		const base = metadata.base as Record<string, unknown>;
		const dimensions = base.dimensions as Record<string, unknown> | undefined;
		if (dimensions?.width && dimensions?.height) {
			return {
				width: Number(dimensions.width),
				height: Number(dimensions.height),
			};
		}
	}

	// 3. Desde stats.width/height
	const stats = entity.stats as Record<string, unknown> | undefined;
	if (stats?.width && stats?.height) {
		return {
			width: Number(stats.width),
			height: Number(stats.height),
		};
	}

	// 4. Desde _stats
	const _stats = entity._stats as Record<string, unknown> | undefined;
	if (_stats?.width && _stats?.height) {
		return {
			width: Number(_stats.width),
			height: Number(_stats.height),
		};
	}

	// 5. thumbnailWidth/thumbnailHeight
	if (typeof entity.thumbnailWidth === 'number' && typeof entity.thumbnailHeight === 'number') {
		return { width: entity.thumbnailWidth, height: entity.thumbnailHeight };
	}

	return { width: undefined, height: undefined };
}

/**
 * Convierte cualquier entidad a BrowserItem
 */
export function toBrowserItem(entity: Record<string, unknown>): BrowserItem {
	const entityType = String(entity.entityType ?? entity.type ?? 'unknown') as BrowserEntityType;
	const id = String(entity.id);

	// Extraer dimensiones de todas las fuentes posibles
	const { width, height } = extractDimensions(entity);

	// Generar thumbnailUrl automáticamente si no está presente
	let thumbnailUrl = entity.thumbnailUrl as string | null | undefined;

	if (!thumbnailUrl && entityType && id && id !== 'undefined') {
		// Generar URL basada en el tipo de entidad
		switch (entityType) {
			case 'image':
				thumbnailUrl = `/api/images/${encodeURIComponent(id)}/thumbnail`;
				break;
			case 'video':
				thumbnailUrl = `/api/videos/${encodeURIComponent(id)}/thumbnail`;
				break;
			case 'audio':
				thumbnailUrl = `/api/audio/${encodeURIComponent(id)}/waveform`;
				break;
			case 'document':
				thumbnailUrl = `/api/thumbnails/unified/document/${encodeURIComponent(id)}`;
				break;
			case 'jsonFile':
				thumbnailUrl = `/api/thumbnails/unified/json/${encodeURIComponent(id)}`;
				break;
			case 'file3d':
				thumbnailUrl = `/api/thumbnails/unified/3d/${encodeURIComponent(id)}`;
				break;
			case 'folder':
				thumbnailUrl = `/api/folders/${encodeURIComponent(id)}/preview?max=4&layout=grid&v=${encodeURIComponent(String(entity.updatedAt ?? entity.createdAt ?? entity.totalItems ?? '1'))}`;
				break;
			default:
				// No generar URL para tipos desconocidos
				break;
		}
	}

	return {
		id,
		raw: entity,
		name: String(entity.name ?? entity.title ?? ''),
		entityType,
		thumbnailUrl,
		mimeType: entity.mimeType as string | null | undefined,
		createdAt: entity.createdAt as Date | string | number | undefined,
		size: entity.size as number | undefined,
		path: entity.path as string | undefined,
		recentImages: Array.isArray(entity.recentImages)
			? (entity.recentImages as Array<{
					id?: string;
					name?: string;
					thumbnail?: string | null;
					thumbnailUrl?: string | null;
				}>)
			: undefined,
		width,
		height,
		parentId: entity.parentId as string | null | undefined,
		totalItems: entity.totalItems as number | undefined,
		emoji: entity.emoji as string | null | undefined,
		color: entity.color as string | null | undefined,
	};
}

/**
 * Crea item sintético de navegación a padre
 */
export function createParentNavItem(parentId: string): BrowserItem {
	return {
		id: parentId,
		name: '..',
		entityType: 'folder',
		isSynthetic: true,
	};
}

// ============================================================================
// TIPOS ESPECÍFICOS POR ENTIDAD (para TCG Cards)
// ============================================================================

/**
 * Browser item con datos específicos de imagen
 */
export interface ImageBrowserItem extends BrowserItem {
	data: {
		id: string;
		name: string;
		path?: string;
		size?: number | null;
		mimeType?: string | null;
		extension?: string | null;
		width?: number | null;
		height?: number | null;
		thumbnailUrl?: string | null;
		isFavorite?: boolean;
		rating?: number | null;
		// EXIF
		cameraMake?: string | null;
		cameraModel?: string | null;
		fNumber?: number | null;
		exposureTime?: number | null;
		iso?: number | null;
		focalLength?: number | null;
		dateTaken?: string | null;
	};
	entityType: 'image';
}

/**
 * Browser item con datos específicos de video
 */
export interface VideoBrowserItem extends BrowserItem {
	data: {
		id: string;
		name: string;
		path?: string;
		size?: number | null;
		mimeType?: string | null;
		extension?: string | null;
		width?: number | null;
		height?: number | null;
		thumbnailUrl?: string | null;
		isFavorite?: boolean;
		rating?: number | null;
		// Video specific
		duration?: number | null;
		frameRate?: number | null;
		bitRate?: number | null;
		videoCodec?: string | null;
		audioCodec?: string | null;
	};
	entityType: 'video';
}

/**
 * Browser item con datos específicos de audio
 */
export interface AudioBrowserItem extends BrowserItem {
	data: {
		id: string;
		name: string;
		path?: string;
		size?: number | null;
		mimeType?: string | null;
		extension?: string | null;
		thumbnailUrl?: string | null;
		isFavorite?: boolean;
		rating?: number | null;
		// Audio specific
		duration?: number | null;
		bitRate?: number | null;
		sampleRate?: number | null;
		channels?: number | null;
		title?: string | null;
		artist?: string | null;
		album?: string | null;
		albumArtist?: string | null;
		genre?: string | null;
		year?: number | null;
		trackNumber?: number | null;
	};
	entityType: 'audio';
}

/**
 * Browser item con datos específicos de documento
 */
export interface DocumentBrowserItem extends BrowserItem {
	data: {
		id: string;
		name: string;
		path?: string;
		size?: number | null;
		mimeType?: string | null;
		extension?: string | null;
		thumbnailUrl?: string | null;
		isFavorite?: boolean;
		rating?: number | null;
		// Document specific
		title?: string | null;
		author?: string | null;
		pageCount?: number | null;
	};
	entityType: 'document';
}

/**
 * Browser item con datos específicos de archivo JSON
 */
export interface JsonFileBrowserItem extends BrowserItem {
	data: {
		id: string;
		name: string;
		path?: string;
		size?: number | null;
		thumbnailUrl?: string | null;
		isFavorite?: boolean;
		rating?: number | null;
		// JSON specific
		isValid?: boolean;
		rootType?: string | null;
		keyCount?: number | null;
		depth?: number | null;
		schemaType?: string | null;
		errorMessage?: string | null;
	};
	entityType: 'jsonFile';
}

/**
 * Browser item con datos específicos de archivo 3D
 */
export interface File3DBrowserItem extends BrowserItem {
	data: {
		id: string;
		name: string;
		path?: string;
		size?: number | null;
		mimeType?: string | null;
		extension?: string | null;
		thumbnailUrl?: string | null;
		isFavorite?: boolean;
		rating?: number | null;
		// 3D specific
		polygonCount?: number | null;
		vertexCount?: number | null;
		materialCount?: number | null;
		meshCount?: number | null;
		hasAnimations?: boolean;
	};
	entityType: 'file3d';
}

/**
 * Browser item con datos específicos de carpeta
 */
export interface FolderBrowserItem extends BrowserItem {
	data: {
		id: string;
		name: string;
		path?: string;
		emoji?: string | null;
		color?: string | null;
		isFavorite?: boolean;
		rating?: number | null;
		recentImages?: Array<{
			id?: string;
			name?: string;
			thumbnail?: string | null;
			thumbnailUrl?: string | null;
		}>;
		_count?: {
			images?: number;
			videos?: number;
			audios?: number;
			documents?: number;
			jsonFiles?: number;
			file3ds?: number;
			children?: number;
		};
	};
	entityType: 'folder';
}

/**
 * Mapeo de tipos de entidad a sus tipos específicos
 */
export interface EntityTypeMapping {
	audio: AudioBrowserItem;
	document: DocumentBrowserItem;
	file3d: File3DBrowserItem;
	folder: FolderBrowserItem;
	image: ImageBrowserItem;
	jsonFile: JsonFileBrowserItem;
	video: VideoBrowserItem;
}

/**
 * Convierte un BrowserItem genérico a un item tipado con data
 */
export function toTypedBrowserItem<T extends BrowserEntityType>(
	item: BrowserItem,
	entityType: T
): EntityTypeMapping[T] {
	return {
		...item,
		entityType,
		data: item.raw ?? {},
	} as EntityTypeMapping[T];
}
