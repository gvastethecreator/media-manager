/**
 * @file Funciones para serializar y deserializar datos de álbumes
 * @module transformers/album/serializers
 */

import {
    type Album,
    type AlbumBase,
    type AlbumMetadata,
    type AlbumViewConfig,
    AlbumPrivacyLevel
} from '../../types/entities/album';

/**
 * Convierte un objeto AlbumBase a Album con propiedades extendidas
 * @param album Objeto básico de álbum
 * @returns Objeto Album completo
 */
export function extendAlbum(album: AlbumBase): Album {
  return {
    ...album,
    privacyLevel: AlbumPrivacyLevel.PRIVATE, // valor por defecto
    isExpanded: false,
    isSelected: false,
  };
}

/**
 * Convierte un array de objetos AlbumBase a array de Album con propiedades extendidas
 * @param albums Array de objetos básicos de álbum
 * @returns Array de objetos Album completos
 */
export function extendAlbums(albums: AlbumBase[]): Album[] {
  return albums.map(extendAlbum);
}

/**
 * Parsea los metadatos de un álbum si están en formato string
 * @param album Objeto de álbum
 * @returns Metadatos parseados o undefined
 */
export function parseAlbumMetadata(album: AlbumBase): AlbumMetadata | undefined {
  if (!album.metadata) return undefined;

  if (typeof album.metadata === 'string') {
    try {
      return JSON.parse(album.metadata) as AlbumMetadata;
    } catch (error) {
      console.error('Error parsing album metadata', error);
      return undefined;
    }
  }

  return album.metadata as unknown as AlbumMetadata;
}

/**
 * Serializa los metadatos de un álbum para guardarlos
 * @param metadata Objeto de metadatos de álbum
 * @returns String serializado o undefined
 */
export function serializeAlbumMetadata(metadata?: AlbumMetadata): string | undefined {
  if (!metadata) return undefined;

  try {
    return JSON.stringify(metadata);
  } catch (error) {
    console.error('Error serializing album metadata', error);
    return undefined;
  }
}

/**
 * Parsea la configuración de visualización de un álbum si está en formato string
 * @param album Objeto de álbum
 * @returns Configuración parseada o undefined
 */
export function parseAlbumViewConfig(album: AlbumBase): AlbumViewConfig | undefined {
  if (!album.viewConfig) return undefined;

  if (typeof album.viewConfig === 'string') {
    try {
      return JSON.parse(album.viewConfig) as AlbumViewConfig;
    } catch (error) {
      console.error('Error parsing album view config', error);
      return undefined;
    }
  }

  return album.viewConfig as unknown as AlbumViewConfig;
}

/**
 * Serializa la configuración de visualización de un álbum para guardarla
 * @param viewConfig Objeto de configuración de visualización
 * @returns String serializado o undefined
 */
export function serializeAlbumViewConfig(viewConfig?: AlbumViewConfig): string | undefined {
  if (!viewConfig) return undefined;

  try {
    return JSON.stringify(viewConfig);
  } catch (error) {
    console.error('Error serializing album view config', error);
    return undefined;
  }
}

/**
 * Genera una URL amigable (slug) para el álbum
 * @param name Nombre del álbum
 * @param id ID del álbum (opcional, para garantizar unicidad)
 * @returns Slug generado
 */
export function generateAlbumSlug(name: string, id?: string): string {
  // Convertir a minúsculas y reemplazar espacios y caracteres especiales
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Si se proporciona ID, añadir un fragmento al final para garantizar unicidad
  if (id) {
    const shortId = id.substring(0, 8);
    return `${baseSlug}-${shortId}`;
  }

  return baseSlug;
}