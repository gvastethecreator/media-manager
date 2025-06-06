/**
 * @file Transformadores principales para la entidad Album
 * @module transformers/album/transformer
 */

import { TransformerError } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import type { AlbumBase, AlbumComplete, AlbumWithStats } from '@/types/entities/album';
import { fromPrismaAlbum } from './serializers';

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
		if (typeof album === 'object' && album !== null && 'images' in album && 'videos' in album && 'collections' in album) {
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
		throw new TransformerError(`Error al transformar lista de álbumes: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * 🔄 Transforma un Album a su versión extendida con propiedades para UI
 * @param album Album base a extender
 * @returns Album extendido con propiedades adicionales
 */
export function transformAlbumToExtended(album: AlbumBase): AlbumComplete {
	try {
		// Validación de entrada
		if (!album) {
			throw new Error('El álbum de entrada es nulo o indefinido');
		}

		// Verificar que album es un objeto válido con id
		if (typeof album !== 'object' || !album.id) {
			throw new Error('El álbum debe ser un objeto válido con un ID');
		}

		// Transformar el álbum base con validaciones adicionales
		const baseAlbum = transformAlbum(album);

		// Verificar que la transformación fue exitosa
		if (!baseAlbum || !baseAlbum.id) {
			throw new Error('La transformación del álbum base falló');
		}

		// Extender el álbum con propiedades para UI
		return {
			...baseAlbum,
			// Propiedades adicionales para AlbumComplete
			filters: {}, // Filtros deserializados
			sortBy: 'name:asc' as any, // Usar enum value correcto
		} as AlbumComplete;
	} catch (error) {
		logger.error('Error transformando álbum a versión extendida:', {
			error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
			albumId: (album as any)?.id,
			albumType: typeof album
		});
		throw new TransformerError(`Error al transformar álbum a versión extendida: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * 🔄 Transforma un Album a su versión con estadísticas
 * @param album Album base con datos de relaciones
 * @returns Album con estadísticas calculadas
 */
export function transformAlbumToWithStats(album: any): AlbumWithStats {
	try {
		// Validar entrada
		if (!album) {
			throw new Error('El álbum de entrada es nulo o indefinido');
		}

		const baseAlbum = transformAlbum(album);

		// Para AlbumWithStats necesitamos acceder a los contadores de Prisma
		// que no están disponibles en AlbumBase, así que accedemos al album original
		const albumWithCounts = album as any;

		// Asegurarse de que _count y las relaciones existan antes de acceder a ellas
		const counts = albumWithCounts._count || {};
		const images = Array.isArray(albumWithCounts.images) ? albumWithCounts.images : [];
		const videos = Array.isArray(albumWithCounts.videos) ? albumWithCounts.videos : [];

		// Helper para obtener conteos seguros
		const getSafeCount = (value: unknown): number => {
			if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
				return value;
			}
			return 0;
		};

		const imageCount = getSafeCount(counts.images);
		const videoCount = getSafeCount(counts.videos);
		const tagCount = getSafeCount(counts.tags);
		const groupCount = getSafeCount(counts.groups);

		// Calcular tamaño total (simulado)
		const totalSize =
			(images.length || 0) * 5 * 1024 * 1024 + // 5MB promedio por imagen
			(videos.length || 0) * 20 * 1024 * 1024; // 20MB promedio por video

		// Determinar la última actualización
		const lastUpdated = baseAlbum.updatedAt || new Date();

		// Construir y devolver el objeto extendido
		return {
			...baseAlbum,
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
	} catch (error) {
		logger.error('Error transformando álbum a versión con estadísticas:', error);
		throw new TransformerError(`Error al transformar álbum a versión con estadísticas: ${error instanceof Error ? error.message : String(error)}`);
	}
}
