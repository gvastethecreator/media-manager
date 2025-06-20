import { type BaseEntity } from '@/types/common/transformer';

/**
 * 🎵 Tipo canónico para un archivo de Audio.
 * Este es el tipo principal que se usa en toda la aplicación.
 * Basado en el schema real de Prisma.
 */
export interface Audio extends BaseEntity {
	id: string;
	name: string;
	filePath: string;
	format: string;
	duration: number | null;
	size: number;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🧱 Tipo base para un archivo de Audio, sin relaciones.
 * Alias del tipo canónico para compatibilidad.
 */
export type AudioBase = Audio;

/**
 * 📊 Conteos de relaciones de Audio (actualmente vacío porque no tiene relaciones en Prisma)
 */
export interface AudioCounts {
	_count: Record<string, never>; // Audio no tiene relaciones en el schema actual
}

/**
 * 💾 Datos para crear o actualizar un archivo de Audio.
 */
export type AudioFormData = Omit<Audio, 'id' | 'createdAt' | 'updatedAt'> & {
	// Campos opcionales para compatibilidad con formularios
	description?: string | null;
	isFavorite?: boolean;
	hash?: string;
	// Relaciones legacy que se ignoran pero se mantienen para compatibilidad
	images?: { id: string }[];
	videos?: { id: string }[];
	albums?: { id: string }[];
	collections?: { id: string }[];
	tags?: { id: string }[];
	characters?: { id: string }[];
	places?: { id: string }[];
	worldItems?: { id: string }[];
	concepts?: { id: string }[];
	prompts?: { id: string }[];
	notes?: { id: string }[];
	wildcards?: { id: string }[];
	properties?: { id: string }[];
	groups?: { id: string }[];
	file3d?: { id: string }[];
};

/**
 * 📝 Datos para crear un Audio
 */
export type AudioCreateInput = Omit<AudioBase, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 📝 Datos para actualizar un Audio
 */
export type AudioUpdateInput = Partial<Omit<AudioBase, 'id'>>;

/**
 * 🔢 Tipo de un archivo de Audio con los conteos de sus relaciones.
 */
export type AudioWithCounts = Audio & AudioCounts;

/**
 * 🔄 Tipo completo de Audio (actualmente igual a AudioWithCounts)
 */
export type AudioComplete = AudioWithCounts;

/**
 * 🎯 Filtros específicos para Audio
 */
export interface AudioFilters {
	search?: string;
	format?: string;
	durationMin?: number;
	durationMax?: number;
	sizeMin?: number;
	sizeMax?: number;
	dateRange?: {
		start?: Date;
		end?: Date;
	};
}

/**
 * 🔍 Opciones de búsqueda para Audio
 */
export interface AudioSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: {
		[key in keyof Audio]?: 'asc' | 'desc';
	};
	where?: AudioFilters;
}

/**
 * 📊 Resultado de búsqueda de Audios
 */
export interface AudioSearchResult {
	items: AudioComplete[];
	total: number;
	hasMore: boolean;
}
