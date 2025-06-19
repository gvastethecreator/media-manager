/**
 * @file Transformador principal para la entidad Album
 * @module transformers/album/transformer
 * @description Contiene la lógica para convertir un objeto Album de Prisma a nuestro tipo canónico.
 */
import { serverLogger } from '@/lib/logger/server-logger';
import type { AlbumWithRelations } from '@/types/entities/album';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('AlbumTransformer');

// Define el tipo de payload de Prisma que esperamos, con las relaciones y conteos.
export interface AlbumFromPrisma {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string | null;
	sortBy: string;
	filters: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	// Relaciones (solo las que realmente existen en Prisma)
	images: any[];
	// videos: any[]; // ❌ ELIMINADO - No existe relación Album-Video en Prisma
	collections: any[];
	tags: any[];
	// characters: any[]; // ❌ ELIMINADO - No existe relación Album-Character en Prisma
	places: any[];
	worldItems: any[];
	concepts: any[];
	prompts: any[];
	notes: any[];
	wildcards: any[];
	properties: any[];
	groups: any[];
	_count?: {
		images?: number;
		// videos?: number; // ❌ ELIMINADO - No existe relación Album-Video en Prisma
		collections?: number;
		tags?: number;
		// characters?: number; // ❌ ELIMINADO - No existe relación Album-Character en Prisma
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
}

/**
 * 🔄 Transforma un objeto Album de Prisma a nuestro tipo canónico AlbumWithRelations.
 *
 * @param prismaAlbum - El objeto Album obtenido de Prisma.
 * @returns Un objeto AlbumWithRelations compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaAlbum(prismaAlbum: AlbumFromPrisma | null): AlbumWithRelations {
	if (!prismaAlbum) {
		throw new TransformerError('El objeto de álbum de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...baseData } = prismaAlbum;

		return {
			...baseData,
			category: baseData.category ?? 'general',
			images: baseData.images ?? [],
			// videos: baseData.videos ?? [], // ❌ ELIMINADO - No existe relación Album-Video en Prisma
			collections: baseData.collections ?? [],
			tags: baseData.tags ?? [],
			// characters: baseData.characters ?? [], // ❌ ELIMINADO - No existe relación Album-Character en Prisma
			places: baseData.places ?? [],
			worldItems: baseData.worldItems ?? [],
			concepts: baseData.concepts ?? [],
			prompts: baseData.prompts ?? [],
			notes: baseData.notes ?? [],
			wildcards: baseData.wildcards ?? [],
			properties: baseData.properties ?? [],
			groups: baseData.groups ?? [],
			_count: {
				images: _count?.images ?? 0,
				// videos: _count?.videos ?? 0, // ❌ ELIMINADO - No existe en esquema Prisma Album
				collections: _count?.collections ?? 0,
				tags: _count?.tags ?? 0,
				// characters: _count?.characters ?? 0, // ❌ ELIMINADO - No existe en esquema Prisma Album
				places: _count?.places ?? 0,
				worldItems: _count?.worldItems ?? 0,
				concepts: _count?.concepts ?? 0,
				prompts: _count?.prompts ?? 0,
				notes: _count?.notes ?? 0,
				wildcards: _count?.wildcards ?? 0,
				properties: _count?.properties ?? 0,
				groups: _count?.groups ?? 0,
			},
		};
	} catch (error) {
		logger.error('Error transformando álbum desde Prisma', {
			error,
			albumId: prismaAlbum.id,
		});
		throw new TransformerError(`Error al transformar el álbum: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de álbumes de Prisma a una lista de AlbumWithRelations.
 *
 * @param prismaAlbums - Un array de objetos Album de Prisma.
 * @returns Un array de objetos AlbumWithRelations.
 */
export function fromPrismaAlbums(prismaAlbums: AlbumFromPrisma[]): AlbumWithRelations[] {
	return prismaAlbums.map(fromPrismaAlbum);
}
