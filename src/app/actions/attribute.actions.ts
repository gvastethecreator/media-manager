'use server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import type { Attribute, Image, Character } from '@prisma/client'
import { eventsService, type EventType } from '@/services/events.service'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'
import type { FileItem } from '@/types/file-item'
import { convertServerImageToFileItem, type ServerImage } from '@/services/image-converter.service'

const attributeLogger = logger.withContext('AttributeActions')

const REVALIDATE_PATHS = [
  '/settings',
  '/attributes',
  '/attributes/[id]'
] as const;

const revalidateAllPaths = () => {
  REVALIDATE_PATHS.forEach(path => revalidatePath(path));
  attributeLogger.info('🔄 Rutas revalidadas');
};

class AttributeError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'AttributeError';
  }
}

export interface AttributeWithStats extends Omit<Attribute, 'featuredImage'> {
  _count: {
    characters: number;
    places: number;
    objects: number;
    concepts: number;
    prompts: number;
    notes: number;
  };
  totalSize: number;
  lastUpdated: Date;
  distribution?: Array<{
    name: string;
    count: number;
  }>;
  featuredImage?: string | null;
  recentImages?: (string | null)[];
}

export interface AttributeCreate {
  name: string;
  type: string;
  value: string;
  category: string;
  description?: string | null;
  metadata: string;
  featuredImage?: string | null;
}

export interface AttributeUpdate extends Partial<AttributeCreate> {
  id: string;
}

export interface AttributeWithImages extends Attribute {
  images: FileItem[];
}

export interface ExtendedAttribute extends Attribute {
  characters: (Character & {
    images: Image[];
  })[];
}

export async function getAttributes() {
  try {
    attributeLogger.info('📚 Obteniendo lista de atributos');
    const attributes = await prisma.attribute.findMany({
      include: {
        _count: {
          select: {
            characters: true,
            places: true,
            objects: true,
            concepts: true,
            prompts: true,
            notes: true,
          },
        },
        characters: {
          take: 1,
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    attributeLogger.info(`✅ ${attributes.length} atributos obtenidos`);
    return attributes;
  } catch (error) {
    attributeLogger.error("❌ Error al obtener atributos:", error);
    throw new AttributeError("No se pudieron obtener los atributos", error);
  }
}

export async function getAttributeById(id: string) {
  try {
    attributeLogger.info('🔍 Buscando atributo:', id);
    const attribute = await prisma.attribute.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            characters: true,
            places: true,
            objects: true,
            concepts: true,
            prompts: true,
            notes: true,
          },
        },
        characters: {
          take: 5,
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!attribute) {
      throw new AttributeError("Atributo no encontrado");
    }

    attributeLogger.info('✅ Atributo encontrado:', attribute.name);
    return attribute;
  } catch (error) {
    attributeLogger.error("❌ Error al obtener atributo:", error);
    throw new AttributeError("No se pudo obtener el atributo", error);
  }
}

export async function createAttribute(data: AttributeCreate) {
  try {
    attributeLogger.info('📝 Creando atributo:', data.name);
    const attribute = await prisma.attribute.create({
      data: {
        ...data,
        metadata: data.metadata || '{}',
        featuredImage: data.featuredImage || null,
      },
    });

    // Emitir eventos
    eventsService.emit('attributes:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

    attributeLogger.info('✅ Atributo creado:', attribute.name);
    revalidateAllPaths();
    return attribute;
  } catch (error) {
    attributeLogger.error("❌ Error al crear atributo:", error);
    throw new AttributeError("No se pudo crear el atributo", error);
  }
}

export async function updateAttribute(id: string, data: AttributeUpdate) {
  try {
    attributeLogger.info('📝 Actualizando atributo:', id);
    const attribute = await prisma.attribute.update({
      where: { id },
      data,
    });

    // Emitir eventos
    eventsService.emit('attributes:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

    attributeLogger.info('✅ Atributo actualizado:', attribute.name);
    revalidateAllPaths();
    return attribute;
  } catch (error) {
    attributeLogger.error("❌ Error al actualizar atributo:", error);
    throw new AttributeError("No se pudo actualizar el atributo", error);
  }
}

export async function deleteAttribute(id: string) {
  try {
    attributeLogger.info('🗑️ Eliminando atributo:', id);
    await prisma.attribute.delete({
      where: { id },
    });

    // Emitir eventos
    eventsService.emit('attributes:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

    attributeLogger.info('✅ Atributo eliminado');
    revalidateAllPaths();
  } catch (error) {
    attributeLogger.error("❌ Error al eliminar atributo:", error);
    throw new AttributeError("No se pudo eliminar el atributo", error);
  }
}

export async function getAttributeImages(id: string) {
  try {
    attributeLogger.info('🖼️ Obteniendo imágenes del atributo:', id);
    const attribute = await prisma.attribute.findUnique({
      where: { id },
      include: {
        characters: {
          include: {
            images: {
              include: {
                tags: true,
                collections: true,
                albums: true,
                stats: true,
              },
            },
          },
        },
      },
    }) as ExtendedAttribute | null;

    if (!attribute) {
      throw new AttributeError("Atributo no encontrado");
    }

    const images = attribute.characters.flatMap(char =>
      char.images.map(img => convertServerImageToFileItem(img as ServerImage))
    );

    attributeLogger.info(`✅ ${images.length} imágenes obtenidas`);
    return images;
  } catch (error) {
    attributeLogger.error("❌ Error al obtener imágenes del atributo:", error);
    throw new AttributeError("No se pudieron obtener las imágenes del atributo", error);
  }
}