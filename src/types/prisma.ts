import { Prisma } from '@prisma/client';

// Definir tipos para las entidades basados en los modelos de Prisma
export type Note = Prisma.NoteGetPayload<Record<string, never>>;
export type Album = Prisma.AlbumGetPayload<Record<string, never>>;
export type Collection = Prisma.CollectionGetPayload<Record<string, never>>;
export type Concept = Prisma.ConceptGetPayload<Record<string, never>>;
export type Folder = Prisma.FolderGetPayload<Record<string, never>>;
export type Character = Prisma.CharacterGetPayload<Record<string, never>>;

// Tipos extendidos para incluir estadísticas y datos adicionales
export type NoteWithStats = Note & {
	_count?: {
		images: number;
	};
	totalSize?: number;
	coverImage?: string;
	recentImages?: string[];
};

export type AlbumWithStats = Album & {
	_count?: {
		images: number;
	};
	totalSize?: number;
	coverImage?: string;
	recentImages?: string[];
};

export type CollectionWithStats = Collection & {
	_count?: {
		images: number;
	};
	totalSize?: number;
	recentImages?: string[];
	topTags?: { name: string; count: number }[];
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

export interface ExtendedCharacter extends Character {
	stats?: CharacterStats;
	featuredImage?: string;
	level?: number;
	race?: string;
	class?: string;
	alignment?: string;
	background?: string;
}
