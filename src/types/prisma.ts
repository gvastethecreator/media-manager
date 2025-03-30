/**
 * @file Tipos para integración con Prisma
 * @module types/prisma
 */

import type { Prisma } from '@prisma/client';
import { z } from 'zod';

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

/**
 * Tipo de dato Prisma
 */
export enum PrismaFieldType {
    STRING = 'String',
    INT = 'Int',
    FLOAT = 'Float',
    BOOLEAN = 'Boolean',
    DATETIME = 'DateTime',
    JSON = 'Json',
    ENUM = 'Enum',
    RELATION = 'Relation'
}

/**
 * Tipo de relación Prisma
 */
export enum PrismaRelationType {
    ONE_TO_ONE = '1-1',
    ONE_TO_MANY = '1-n',
    MANY_TO_ONE = 'n-1',
    MANY_TO_MANY = 'm-n'
}

/**
 * Campo de modelo Prisma
 */
export interface PrismaField {
    name: string;
    type: PrismaFieldType;
    isRequired: boolean;
    isUnique: boolean;
    isId: boolean;
    isList: boolean;
    hasDefaultValue: boolean;
    defaultValue?: any;
    relationName?: string;
    relationType?: PrismaRelationType;
    relationToModelName?: string;
}

/**
 * Modelo Prisma
 */
export interface PrismaModel {
    name: string;
    tableName: string;
    fields: PrismaField[];
    uniqueFields: string[][];
    relations: Record<string, PrismaRelationType>;
}

/**
 * Opciones de consulta Prisma
 */
export interface PrismaQueryOptions {
    select?: Record<string, boolean>;
    include?: Record<string, boolean>;
    where?: Record<string, any>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    skip?: number;
    take?: number;
    distinct?: string[];
}

/**
 * Resultado de operación Prisma
 */
export interface PrismaResult<T = any> {
    success: boolean;
    data?: T;
    count?: number;
    error?: Error;
}

// Validaciones Zod
export const prismaFieldTypeSchema = z.nativeEnum(PrismaFieldType);
export const prismaRelationTypeSchema = z.nativeEnum(PrismaRelationType);

export const prismaFieldSchema = z.object({
    name: z.string(),
    type: prismaFieldTypeSchema,
    isRequired: z.boolean(),
    isUnique: z.boolean(),
    isId: z.boolean(),
    isList: z.boolean(),
    hasDefaultValue: z.boolean(),
    defaultValue: z.any().optional(),
    relationName: z.string().optional(),
    relationType: prismaRelationTypeSchema.optional(),
    relationToModelName: z.string().optional()
});

export const prismaModelSchema = z.object({
    name: z.string(),
    tableName: z.string(),
    fields: z.array(prismaFieldSchema),
    uniqueFields: z.array(z.array(z.string())),
    relations: z.record(prismaRelationTypeSchema)
});

export const prismaQueryOptionsSchema = z.object({
    select: z.record(z.boolean()).optional(),
    include: z.record(z.boolean()).optional(),
    where: z.record(z.any()).optional(),
    orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
    skip: z.number().nonnegative().optional(),
    take: z.number().positive().optional(),
    distinct: z.array(z.string()).optional()
});

// Tipos inferidos
export type PrismaFieldValidated = z.infer<typeof prismaFieldSchema>;
export type PrismaModelValidated = z.infer<typeof prismaModelSchema>;
export type PrismaQueryOptionsValidated = z.infer<typeof prismaQueryOptionsSchema>;
