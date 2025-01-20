'use server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import type { Concept, Image } from '@prisma/client'
import { eventsService, type EventType } from '@/services/events.service'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'
import type { FileItem } from '@/types/file-item'
import { convertServerImageToFileItem, type ServerImage } from '@/services/image-converter.service'

const conceptLogger = logger.withContext('ConceptActions')

const REVALIDATE_PATHS = [
  '/settings',
  '/concepts',
  '/concepts/[id]'
] as const;

const revalidateAllPaths = () => {
  REVALIDATE_PATHS.forEach(path => revalidatePath(path));
  conceptLogger.info('🔄 Rutas revalidadas');
};

class ConceptError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'ConceptError';
  }
}

export interface ConceptWithStats extends Omit<Concept, 'featuredImage'> {
  _count: {
    characters: number;
    places: number;
    objects: number;
  };
  totalSize: number;
  lastUpdated: Date;
  distribution?: Array<{
    name: string;
    count: number;
  }>;
  featuredImage: string | null;
  recentImages: string[];
}

export interface ConceptCreate {
  name: string;
  emoji: string;
  color: string;
  description?: string | null;
  content: string;
  category: string;
  tags: string;
  featuredImage?: string | null;
}

export interface ConceptUpdate extends Partial<ConceptCreate> {
  id: string;
}

export interface ConceptWithImages extends Concept {
  images: FileItem[];
}

export interface ExtendedConcept extends Concept {
  characters: {
    images: Image[];
  }[];
  places: {
    images: Image[];
  }[];
  objects: {
    images: Image[];
  }[];
}

export async function getConcepts() {
  try {
    conceptLogger.info('📚 Obteniendo lista de conceptos');
    const concepts = await prisma.concept.findMany({
      include: {
        _count: {
          select: {
            characters: true,
            places: true,
            objects: true,
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

    conceptLogger.info(`✅ ${concepts.length} conceptos obtenidos`);
    return concepts;
  } catch (error) {
    conceptLogger.error("❌ Error al obtener conceptos:", error);
    throw new ConceptError("No se pudieron obtener los conceptos", error);
  }
}

export async function getConceptById(id: string) {
  try {
    conceptLogger.info('🔍 Buscando concepto:', id);
    const concept = await prisma.concept.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            characters: true,
            places: true,
            objects: true,
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

    if (!concept) {
      throw new ConceptError("Concepto no encontrado");
    }

    conceptLogger.info('✅ Concepto encontrado:', concept.name);
    return concept;
  } catch (error) {
    conceptLogger.error("❌ Error al obtener concepto:", error);
    throw new ConceptError("No se pudo obtener el concepto", error);
  }
}

export async function createConcept(data: ConceptCreate) {
  try {
    conceptLogger.info('📝 Creando concepto:', data.name);
    const concept = await prisma.concept.create({
      data: {
        ...data,
        tags: data.tags || '[]',
        content: data.content || '',
        featuredImage: data.featuredImage || null,
      },
    });

    // Emitir eventos
    eventsService.emit('concepts:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

    conceptLogger.info('✅ Concepto creado:', concept.name);
    revalidateAllPaths();
    return concept;
  } catch (error) {
    conceptLogger.error("❌ Error al crear concepto:", error);
    throw new ConceptError("No se pudo crear el concepto", error);
  }
}

export async function updateConcept(id: string, data: ConceptUpdate) {
  try {
    conceptLogger.info('📝 Actualizando concepto:', id);
    const concept = await prisma.concept.update({
      where: { id },
      data,
    });

    // Emitir eventos
    eventsService.emit('concepts:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

    conceptLogger.info('✅ Concepto actualizado:', concept.name);
    revalidateAllPaths();
    return concept;
  } catch (error) {
    conceptLogger.error("❌ Error al actualizar concepto:", error);
    throw new ConceptError("No se pudo actualizar el concepto", error);
  }
}

export async function deleteConcept(id: string) {
  try {
    conceptLogger.info('🗑️ Eliminando concepto:', id);
    await prisma.concept.delete({
      where: { id },
    });

    // Emitir eventos
    eventsService.emit('concepts:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

    conceptLogger.info('✅ Concepto eliminado');
    revalidateAllPaths();
  } catch (error) {
    conceptLogger.error("❌ Error al eliminar concepto:", error);
    throw new ConceptError("No se pudo eliminar el concepto", error);
  }
}

export async function getConceptImages(id: string) {
  try {
    conceptLogger.info('🖼️ Obteniendo imágenes del concepto:', id);
    const concept = await prisma.concept.findUnique({
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
        places: {
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
        objects: {
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
    }) as ExtendedConcept | null;

    if (!concept) {
      throw new ConceptError("Concepto no encontrado");
    }

    const images = [
      ...concept.characters.flatMap(char => char.images),
      ...concept.places.flatMap(place => place.images),
      ...concept.objects.flatMap(obj => obj.images),
    ].map(img => convertServerImageToFileItem(img as ServerImage));

    conceptLogger.info(`✅ ${images.length} imágenes obtenidas`);
    return images;
  } catch (error) {
    conceptLogger.error("❌ Error al obtener imágenes del concepto:", error);
    throw new ConceptError("No se pudieron obtener las imágenes del concepto", error);
  }
}