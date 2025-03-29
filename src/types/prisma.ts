import type { Prisma } from '@prisma/client';

// Definir tipos para las entidades basados en los modelos de Prisma
export type Note = Prisma.NoteGetPayload<Record<string, never>>;
export type Album = Prisma.AlbumGetPayload<Record<string, never>>;
export type Collection = Prisma.CollectionGetPayload<Record<string, never>>;
export type Concept = Prisma.ConceptGetPayload<Record<string, never>>;
export type Folder = Prisma.FolderGetPayload<Record<string, never>>;
export type Character = Prisma.CharacterGetPayload<Record<string, never>>;
export type Place = Prisma.PlaceGetPayload<Record<string, never>>;
export type WorldItem = Prisma.WorldItemGetPayload<Record<string, never>>;
export type Prompt = Prisma.PromptGetPayload<Record<string, never>>;
export type Tag = Prisma.TagGetPayload<Record<string, never>>;
export type Image = Prisma.ImageGetPayload<Record<string, never>>;
export type Video = Prisma.VideoGetPayload<Record<string, never>>;
export type Profile = Prisma.ProfileGetPayload<Record<string, never>>;
export type Settings = Prisma.SettingsGetPayload<Record<string, never>>;

// Nuevas entidades
export type Group = Prisma.GroupGetPayload<Record<string, never>>;
export type Property = Prisma.PropertyGetPayload<Record<string, never>>;
export type Wildcard = Prisma.WildcardGetPayload<Record<string, never>>;
export type QueueJob = Prisma.QueueJobGetPayload<Record<string, never>>;

// Tipos extendidos para incluir estadísticas y datos adicionales
export type NoteWithStats = Note & {
	_count?: {
		images: number;
		videos?: number;
	};
	totalSize?: number;
	coverImage?: string;
	recentImages?: string[];
};

export type AlbumWithStats = Album & {
	_count?: {
		images: number;
		videos?: number;
	};
	totalSize?: number;
	coverImage?: string;
	recentImages?: string[];
};

export type CollectionWithStats = Collection & {
	_count?: {
		images: number;
		videos?: number;
	};
	totalSize?: number;
	recentImages?: string[];
	topTags?: { name: string; count: number }[];
};

export type GroupWithStats = Group & {
	_count?: {
		images: number;
		videos?: number;
		albums?: number;
		collections?: number;
	};
	totalSize?: number;
	recentImages?: string[];
	topTags?: { name: string; count: number }[];
};

export type PropertyWithStats = Property & {
	_count?: {
		images: number;
		videos?: number;
	};
	usage?: number;
};

export type WildcardWithStats = Wildcard & {
	_count?: {
		images: number;
		videos?: number;
		childWildcards?: number;
	};
};

// Tipos específicos para Character
export interface CharacterStats {
	strength?: number;
	dexterity?: number;
	intelligence?: number;
	charisma?: number;
	vitality?: number;
	[key: string]: number | undefined;
}

// Definimos un tipo manual para Character extendido para evitar conflictos
export interface ExtendedCharacter {
	// Campos base
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;

	// Campos específicos de Character
	level: number;
	class: string;
	race: string;
	type: string | null;
	alignment: string;
	backstory: string;
	stats: string;
	psychologicalProfile: string;
	socialProfile: string;
	relationships: string;
	goals: string;
	fears: string;
	beliefs: string;
	personality: string;
	skills: string;
	abilities: string;
	sortBy: string;
	filters: string;

	// Campos extendidos adicionales
	featuredImage?: string;
	statsObj?: CharacterStats;
	background?: string;
}
