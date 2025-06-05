/**
 * @file Transformadores principales para la entidad Album
 * @module transformers/album/transformer
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { Album, AlbumExtended, AlbumWithStats } from '@/types/entities/album/types';
import { TransformerError } from '@/utils/transformers/errors';
import { fromPrismaAlbum, validateAlbum } from './serializers';

const logger = serverLogger.withContext('AlbumTransformer');

/**
 * 🔄 Transforma un objeto a Album, validando su estructura
 * @param album Objeto a transformar
 * @returns Album validado y estructurado
 * @throws TransformerError si la validación falla
 */
export function transformAlbum(album: unknown): Album {
	try {
		if (!album) {
			throw new Error('El objeto de álbum es nulo o indefinido');
		}

		// Validar la estructura del objeto
		const validatedAlbum = validateAlbum(album);

		// Si el álbum viene de Prisma, transformarlo
		if ('images' in album && 'videos' in album && 'collections' in album) {
			return fromPrismaAlbum(album as any);
		}

		// Si es un objeto simple, devolverlo como está
		return validatedAlbum as Album;
	} catch (error) {
		logger.error('Error transformando álbum:', { error });
		throw new TransformerError('Error al transformar álbum', { cause: error });
	}
}

/**
 * 🔄 Transforma una lista de objetos a Albums
 * @param albums Array de objetos a transformar
 * @returns Array de Albums validados
 * @throws TransformerError si la validación falla para algún elemento
 */
export function transformAlbums(albums: unknown[]): Album[] {
	try {
		if (!Array.isArray(albums)) {
			throw new Error('El parámetro no es un array');
		}

		return albums.map((album) => transformAlbum(album));
	} catch (error) {
		logger.error('Error transformando lista de álbumes:', { error });
		throw new TransformerError('Error al transformar lista de álbumes', { cause: error });
	}
}

/**
 * 🔄 Transforma un Album a su versión extendida con propiedades para UI
 * @param album Album base a extender
 * @returns Album extendido con propiedades adicionales
 */
export function transformAlbumToExtended(album: Album): AlbumExtended {
	try {
		const baseAlbum = transformAlbum(album);

		// Extender el álbum con propiedades para UI
		return {
			...baseAlbum,
			isSelected: false,
			isHighlighted: false,
			isExpanded: false,
			isEditing: false,
			displayOrder: 0,
		};
	} catch (error) {
		logger.error('Error transformando álbum a versión extendida:', { error, albumId: (album as any)?.id });
		throw new TransformerError('Error al transformar álbum a versión extendida', { cause: error });
	}
}

/**
 * 🔄 Transforma un Album a su versión con estadísticas
 * @param album Album base
 * @returns Album con estadísticas calculadas
 */
export function transformAlbumToWithStats(album: Album): AlbumWithStats {
	try {
		const baseAlbum = transformAlbum(album);

		// Calcular totales para las estadísticas
		const counts = baseAlbum._count || {
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
		};

		// Calcular tamaño total (simulado)
		const totalSize =
			(baseAlbum.images?.length || 0) * 5 * 1024 * 1024 + // 5MB promedio por imagen
			(baseAlbum.videos?.length || 0) * 20 * 1024 * 1024; // 20MB promedio por video

		// Determinar la última actualización
		const lastUpdated = baseAlbum.updatedAt || new Date();

		// Construir y devolver el objeto extendido
		return {
			...baseAlbum,
			totalSize,
			lastUpdated,
			imageCount: counts.images,
			videoCount: counts.videos,
			albumCount: 0, // Los álbumes no contienen otros álbumes
			tagCount: counts.tags,
			groupCount: counts.groups,
			distribution: [
				{ name: 'images', count: counts.images },
				{ name: 'videos', count: counts.videos },
				{ name: 'tags', count: counts.tags },
				{ name: 'groups', count: counts.groups },
			],
		};
	} catch (error) {
		logger.error('Error transformando álbum a versión con estadísticas:', { error, albumId: (album as any)?.id });
		throw new TransformerError('Error al transformar álbum a versión con estadísticas', { cause: error });
	}
}
