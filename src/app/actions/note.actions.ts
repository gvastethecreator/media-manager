'use server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import type { Note, Image } from '@prisma/client'
import { eventsService, type EventType } from '@/services/events.service'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'
import type { FileItem } from '@/types/file-item'
import { convertServerImageToFileItem, type ServerImage } from '@/services/image-converter.service'

const noteLogger = logger.withContext('NoteActions')

const REVALIDATE_PATHS = [
  '/settings',
  '/notes',
  '/notes/[id]'
] as const;

const revalidateAllPaths = () => {
  REVALIDATE_PATHS.forEach(path => revalidatePath(path));
  noteLogger.info('🔄 Rutas revalidadas');
};

class NoteError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'NoteError';
  }
}

export interface NoteWithStats extends Omit<Note, 'featuredImage'> {
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

export interface NoteCreate {
  title: string;
  content: string;
  category: string;
  priority: number;
  status: string;
  tags: string;
  featuredImage?: string | null;
}

export interface NoteUpdate extends Partial<NoteCreate> {
  id: string;
}

export interface NoteWithImages extends Note {
  images: FileItem[];
}

export interface ExtendedNote extends Note {
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

export async function getNotes() {
  try {
    noteLogger.info('📚 Obteniendo lista de notas');
    const notes = await prisma.note.findMany({
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

    noteLogger.info(`✅ ${notes.length} notas obtenidas`);
    return notes;
  } catch (error) {
    noteLogger.error("❌ Error al obtener notas:", error);
    throw new NoteError("No se pudieron obtener las notas", error);
  }
}

export async function getNoteById(id: string) {
  try {
    noteLogger.info('🔍 Buscando nota:', id);
    const note = await prisma.note.findUnique({
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

    if (!note) {
      throw new NoteError("Nota no encontrada");
    }

    noteLogger.info('✅ Nota encontrada:', note.title);
    return note;
  } catch (error) {
    noteLogger.error("❌ Error al obtener nota:", error);
    throw new NoteError("No se pudo obtener la nota", error);
  }
}

export async function createNote(data: NoteCreate) {
  try {
    noteLogger.info('📝 Creando nota:', data.title);
    const note = await prisma.note.create({
      data: {
        ...data,
        tags: data.tags || '[]',
        content: data.content || '',
        status: data.status || 'active',
        priority: data.priority || 0,
        featuredImage: data.featuredImage || null,
      },
    });

    // Emitir eventos
    eventsService.emit('notes:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

    noteLogger.info('✅ Nota creada:', note.title);
    revalidateAllPaths();
    return note;
  } catch (error) {
    noteLogger.error("❌ Error al crear nota:", error);
    throw new NoteError("No se pudo crear la nota", error);
  }
}

export async function updateNote(id: string, data: NoteUpdate) {
  try {
    noteLogger.info('📝 Actualizando nota:', id);
    const note = await prisma.note.update({
      where: { id },
      data,
    });

    // Emitir eventos
    eventsService.emit('notes:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

    noteLogger.info('✅ Nota actualizada:', note.title);
    revalidateAllPaths();
    return note;
  } catch (error) {
    noteLogger.error("❌ Error al actualizar nota:", error);
    throw new NoteError("No se pudo actualizar la nota", error);
  }
}

export async function deleteNote(id: string) {
  try {
    noteLogger.info('🗑️ Eliminando nota:', id);
    await prisma.note.delete({
      where: { id },
    });

    // Emitir eventos
    eventsService.emit('notes:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

    noteLogger.info('✅ Nota eliminada');
    revalidateAllPaths();
  } catch (error) {
    noteLogger.error("❌ Error al eliminar nota:", error);
    throw new NoteError("No se pudo eliminar la nota", error);
  }
}

export async function getNoteImages(id: string) {
  try {
    noteLogger.info('🖼️ Obteniendo imágenes de la nota:', id);
    const note = await prisma.note.findUnique({
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
    }) as ExtendedNote | null;

    if (!note) {
      throw new NoteError("Nota no encontrada");
    }

    const images = [
      ...note.characters.flatMap(char => char.images),
      ...note.places.flatMap(place => place.images),
      ...note.objects.flatMap(obj => obj.images),
    ].map(img => convertServerImageToFileItem(img as ServerImage));

    noteLogger.info(`✅ ${images.length} imágenes obtenidas`);
    return images;
  } catch (error) {
    noteLogger.error("❌ Error al obtener imágenes de la nota:", error);
    throw new NoteError("No se pudieron obtener las imágenes de la nota", error);
  }
}