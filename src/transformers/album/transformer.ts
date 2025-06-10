/**
 * @file Transformadores principales para la entidad Album
 * @module transformers/album/transformer
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { AlbumBase, AlbumComplete } from '@/types/entities/album/types';
import { TransformerError } from '@/utils/transformers/errors';
import { fromPrismaAlbum } from './serializers';

// 📊 Interfaz local para álbum con estadísticas (usar la correcta)
interface AlbumWithStatsLocal extends AlbumBase {
	_count: {
		images: number;
		videos: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
	totalSize: number;
	lastUpdated: Date;
	itemCount: number;
	itemDistribution: {
		images: number;
		videos: number;
	};
}

const logger = serverLogger.withContext('AlbumTransformer');

/**
 * 🔄 Transforma un objeto a Album, validando su estructura
 * @param album Objeto a transformar
 * @returns Album validado y estructurado
 * @throws TransformerError si la validación falla
 */
export function transformAlbum(album: unknown): AlbumBase {
	try {
		if (!album) {
			throw new Error('El objeto de álbum es nulo o indefinido');
		}

		// 🔧 FIX: Primero verificar si viene de Prisma, ANTES de validar
		// Si el álbum viene de Prisma, transformarlo directamente
		if (
			typeof album === 'object' &&
			album !== null &&
			'images' in album &&
			'videos' in album &&
			'collections' in album
		) {
			const prismaAlbum = fromPrismaAlbum(album as any);
			// Convertir AlbumComplete a AlbumBase extrayendo solo los campos base
			const baseAlbum: AlbumBase = {
				id: prismaAlbum.id,
				name: prismaAlbum.name,
				emoji: prismaAlbum.emoji,
				color: prismaAlbum.color,
				description: prismaAlbum.description,
				shortcut: prismaAlbum.shortcut,
				category: prismaAlbum.category,
				sortBy: prismaAlbum.sortBy,
				filters: prismaAlbum.filters,
				featuredImage: prismaAlbum.featuredImage,
				isFavorite: prismaAlbum.isFavorite,
				createdAt: prismaAlbum.createdAt,
				updatedAt: prismaAlbum.updatedAt,
			};
			return baseAlbum;
		}

		// Si no funciona, procesar como objeto genérico
		logger.debug('🔄 Procesando como objeto genérico');

		// Validar que el álbum tenga las propiedades mínimas
		if (!album || typeof album !== 'object') {
			throw new Error('El álbum no es un objeto válido');
		}

		const albumObj = album as any;

		// Crear AlbumBase a partir del objeto genérico
		const baseAlbum: AlbumBase = {
			id: albumObj.id || '',
			name: albumObj.name || '',
			emoji: albumObj.emoji || '📁',
			color: albumObj.color || '#666666',
			description: albumObj.description || null,
			shortcut: albumObj.shortcut || null,
			category: albumObj.category || 'default',
			sortBy: albumObj.sortBy || 'name',
			filters: albumObj.filters || '',
			featuredImage: albumObj.featuredImage || null,
			isFavorite: albumObj.isFavorite || false,
			createdAt: albumObj.createdAt ? new Date(albumObj.createdAt) : new Date(),
			updatedAt: albumObj.updatedAt ? new Date(albumObj.updatedAt) : new Date(),
		};

		logger.debug('✅ Álbum transformado exitosamente:', { id: baseAlbum.id });
		return baseAlbum;
	} catch (error) {
		logger.error('Error transformando álbum:', error);
		throw new TransformerError(`Error al transformar álbum: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * 🔄 Transforma una lista de objetos a Albums
 * @param albums Array de objetos a transformar
 * @returns Array de Albums validados
 * @throws TransformerError si la validación falla para algún elemento
 */
export function transformAlbums(albums: unknown[]): AlbumBase[] {
	try {
		if (!Array.isArray(albums)) {
			throw new Error('El parámetro no es un array');
		}

		return albums.map((album) => transformAlbum(album));
	} catch (error) {
		logger.error('Error transformando lista de álbumes:', error);
		throw new TransformerError(
			`Error al transformar lista de álbumes: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * 🔄 Transforma un Album a su versión extendida con propiedades para UI
 * @param album Album base o datos de Prisma a extender
 * @returns Album extendido con propiedades adicionales
 */
export function transformAlbumToExtended(album: AlbumBase | any): AlbumComplete {
	try {
		// 🛡️ Validación robusta de entrada
		if (!album) {
			throw new Error('El álbum de entrada es nulo o indefinido');
		}

		// Verificar que album es un objeto válido con id
		if (typeof album !== 'object' || !album.id) {
			throw new Error('El álbum debe ser un objeto válido con un ID');
		}

		// 🔍 Detectar si viene directamente de Prisma (tiene relaciones)
		const hasPrismaRelations = album && (
			'images' in album ||
			'videos' in album ||
			'collections' in album ||
			'_count' in album
		);

		let baseAlbum: AlbumBase;
		let albumComplete: AlbumComplete;

		if (hasPrismaRelations) {
			// 🔄 Transformar desde Prisma usando el serializer
			logger.debug('🔄 Transformando álbum desde datos de Prisma');
			albumComplete = fromPrismaAlbum(album);
			baseAlbum = {
				id: albumComplete.id,
				name: albumComplete.name,
				emoji: albumComplete.emoji,
				color: albumComplete.color,
				description: albumComplete.description,
				shortcut: albumComplete.shortcut,
				category: albumComplete.category,
				sortBy: albumComplete.sortBy,
				filters: albumComplete.filters,
				featuredImage: albumComplete.featuredImage,
				isFavorite: albumComplete.isFavorite,
				createdAt: albumComplete.createdAt,
				updatedAt: albumComplete.updatedAt,
			};
		} else {
			// 🔄 Transformar desde AlbumBase
			logger.debug('🔄 Transformando álbum desde AlbumBase');
			baseAlbum = transformAlbum(album);

			// Crear AlbumComplete con estructuras vacías para relaciones
			albumComplete = {
				...baseAlbum,
				images: [],
				videos: [],
				collections: [],
				tags: [],
				characters: [],
				places: [],
				worldItems: [],
				concepts: [],
				prompts: [],
				notes: [],
				wildcards: [],
				properties: [],
				groups: [],
				_count: {
					images: 0,
					videos: 0,
					collections: 0,
					tags: 0,
					characters: 0,
					places: 0,
					worldItems: 0,
					concepts: 0,
					prompts: 0,
					notes: 0,
					wildcards: 0,
					properties: 0,
					groups: 0,
				}
			};
		}

		// ✅ Verificar que la transformación fue exitosa
		if (!albumComplete || !albumComplete.id) {
			throw new Error('La transformación del álbum extendido falló');
		}

		logger.debug('✅ Álbum transformado a versión extendida:', { id: albumComplete.id });
		return albumComplete;
	} catch (error) {
		logger.error('❌ Error transformando álbum a versión extendida:', {
			error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
			albumId: (album as any)?.id,
			albumType: typeof album,
		});
		throw new TransformerError(
			`Error al transformar álbum a versión extendida: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * 🔄 Transforma un Album a su versión con estadísticas
 * @param album Album base con datos de relaciones o datos de Prisma
 * @returns Album con estadísticas calculadas
 */
export function transformAlbumToWithStats(album: any): AlbumWithStatsLocal {
	try {
		// 🛡️ Validar entrada
		if (!album) {
			throw new Error('El álbum de entrada es nulo o indefinido');
		}

		// 🔄 Primero convertir a AlbumComplete para obtener estructura consistente
		const albumComplete = transformAlbumToExtended(album);

		// 📊 Helper para obtener conteos seguros
		const getSafeCount = (value: unknown): number => {
			if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
				return value;
			}
			return 0;
		};

		// 📊 Obtener estadísticas desde el álbum transformado
		const counts = albumComplete._count || {};
		const imageCount = getSafeCount(counts.images);
		const videoCount = getSafeCount(counts.videos);
		const tagCount = getSafeCount(counts.tags);
		const groupCount = getSafeCount(counts.groups);

		// 📏 Calcular tamaño total estimado
		const totalSize =
			imageCount * 5 * 1024 * 1024 + // 5MB promedio por imagen
			videoCount * 20 * 1024 * 1024; // 20MB promedio por video

		// 🕒 Determinar la última actualización
		const lastUpdated = albumComplete.updatedAt || new Date();

		// 🏗️ Construir y devolver el objeto con estadísticas
		const albumWithStats: AlbumWithStatsLocal = {
			id: albumComplete.id,
			name: albumComplete.name,
			emoji: albumComplete.emoji,
			color: albumComplete.color,
			description: albumComplete.description,
			shortcut: albumComplete.shortcut,
			category: albumComplete.category,
			sortBy: albumComplete.sortBy,
			filters: albumComplete.filters,
			featuredImage: albumComplete.featuredImage,
			isFavorite: albumComplete.isFavorite,
			createdAt: albumComplete.createdAt,
			updatedAt: albumComplete.updatedAt,
			totalSize,
			lastUpdated,
			itemCount: imageCount + videoCount,
			itemDistribution: {
				images: imageCount,
				videos: videoCount,
			},
			_count: {
				images: imageCount,
				videos: videoCount,
				collections: getSafeCount(counts.collections),
				tags: tagCount,
				characters: getSafeCount(counts.characters),
				places: getSafeCount(counts.places),
				worldItems: getSafeCount(counts.worldItems),
				concepts: getSafeCount(counts.concepts),
				prompts: getSafeCount(counts.prompts),
				notes: getSafeCount(counts.notes),
				wildcards: getSafeCount(counts.wildcards),
				properties: getSafeCount(counts.properties),
				groups: groupCount,
			},
		};

		logger.debug('✅ Álbum transformado a versión con estadísticas:', {
			id: albumWithStats.id,
			itemCount: albumWithStats.itemCount
		});

		return albumWithStats;
	} catch (error) {
		logger.error('❌ Error transformando álbum a versión con estadísticas:', error);
		throw new TransformerError(
			`Error al transformar álbum a versión con estadísticas: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
