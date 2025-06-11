import type { EntityType } from '../entities';

/**
 * Tipo base para Note derivado del schema de Prisma
 */
export interface NoteBase {
        id: string;
        title: string;
        content: string;
        category: string;
        priority: number;
        status: string;
        featuredImage?: string | null;
        isFavorite: boolean;
        presetId?: string | null;
        createdAt: Date;
        updatedAt: Date;
}

/**
 * Interfaz para crear una nueva nota
 * @deprecated Usar NoteCreateInput de ./types.ts para evitar duplicación
 */
// export interface NoteCreateInput {
// 	title: string;
// 	content?: string;
// 	category?: string;
// 	priority?: number;
// 	status?: string;
// 	tags?: string;
// 	featuredImage?: string | null;
// 	isFavorite?: boolean;
// }

/**
 * Interfaz para actualizar una nota existente
 * @deprecated Usar NoteUpdateInput de ./types.ts para evitar duplicación
 */
// export interface NoteUpdateInput {
// 	id: string;
// 	title?: string;
// 	content?: string;
// 	category?: string;
// 	priority?: number;
// 	status?: string;
// 	tags?: string;
// 	featuredImage?: string | null;
// 	isFavorite?: boolean;
// }

/**
 * Tipo para la relación de nota con otras entidades
 */
export interface NoteRelation {
	entityId: string;
	entityType: EntityType;
	noteId: string;
}

/**
 * Interfaz para estadísticas de una nota
 */
export interface NoteStats {
	characters: number;
	places: number;
	worldItems: number;
	concepts: number;
	prompts: number;
	images: number;
	videos: number;
	albums: number;
	collections: number;
	tags: number;
	wildcards: number;
	properties: number;
	groups: number;
}

/**
 * Interfaz para nota con estadísticas básicas (solo _count)
 */
export interface NoteWithBasicStats extends NoteBase {
	_count: NoteStats;
}

/**
 * Interfaz completa para nota con estadísticas extendidas
 * Incluye todas las propiedades calculadas por el transformer
 */
export interface NoteWithStats extends NoteBase {
	_count: NoteStats;
	lastUpdated: Date;
	imageCount: number;
	videoCount: number;
	albumCount: number;
	tagCount: number;
	characterCount: number;
	conceptCount: number;
	importanceLevel: number;
	contentLength: number;
	relatedItemsCount: number;
	distribution: Array<{name: string, count: number}>;
}
