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
	/** ID único de la entidad */
	id: string;
	/** Entidad original (para integraciones/handlers que requieren el shape completo) */
	raw?: Record<string, unknown>;
	/** Nombre para mostrar */
	name: string;
	/** Tipo de entidad normalizado */
	entityType: BrowserEntityType;
	/** URL del thumbnail (opcional) */
	thumbnailUrl?: string | null;
	/** Tipo MIME (para archivos) */
	mimeType?: string | null;
	/** Fecha de creación */
	createdAt?: Date | string | number;
	/** Tamaño en bytes (para archivos) */
	size?: number;
	/** Ruta del archivo */
	path?: string;
	/** Dimensiones (para imágenes/videos) */
	width?: number;
	height?: number;
	/** ID del padre (para folders) */
	parentId?: string | null;
	/** Conteo de items (para folders) */
	totalItems?: number;
	/** Emoji personalizado (para folders) */
	emoji?: string | null;
	/** Color personalizado (para folders) */
	color?: string | null;
	/** Flag para items sintéticos (como "..") */
	isSynthetic?: boolean;
}

/**
 * Item con información de selección
 */
export interface SelectableBrowserItem extends BrowserItem {
	isSelected: boolean;
	isActive: boolean;
}

/**
 * Grupo de items para vistas agrupadas
 */
export interface BrowserItemGroup {
	/** Clave única del grupo */
	key: string;
	/** Nombre para mostrar */
	displayName: string;
	/** Items del grupo */
	items: BrowserItem[];
	/** Conteo total de items */
	count: number;
}

/**
 * Resultado de procesamiento de items
 */
export interface ProcessedItems {
	/** Items después de búsqueda y sort */
	items: BrowserItem[];
	/** Items sin sintéticos (para conteos) */
	realItems: BrowserItem[];
	/** Grupos (si agrupación habilitada) */
	groups: BrowserItemGroup[] | null;
	/** IDs lineales para navegación */
	linearIds: string[];
}

/**
 * Convierte cualquier entidad a BrowserItem
 */
export function toBrowserItem(entity: Record<string, unknown>): BrowserItem {
	const entityType = String(entity.entityType ?? entity.type ?? 'unknown') as BrowserEntityType;

	return {
		id: String(entity.id),
		raw: entity,
		name: String(entity.name ?? entity.title ?? ''),
		entityType,
		thumbnailUrl: entity.thumbnailUrl as string | null | undefined,
		mimeType: entity.mimeType as string | null | undefined,
		createdAt: entity.createdAt as Date | string | number | undefined,
		size: entity.size as number | undefined,
		path: entity.path as string | undefined,
		width: entity.width as number | undefined,
		height: entity.height as number | undefined,
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
