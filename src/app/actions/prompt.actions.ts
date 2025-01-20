'use server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import type { Prompt, Image } from '@prisma/client'
import { eventsService, type EventType } from '@/services/events.service'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'
import type { FileItem } from '@/types/file-item'
import { convertServerImageToFileItem, type ServerImage } from '@/services/image-converter.service'

const promptLogger = logger.withContext('PromptActions')

const REVALIDATE_PATHS = [
  '/settings',
  '/prompts',
  '/prompts/[id]'
] as const;

const revalidateAllPaths = () => {
  REVALIDATE_PATHS.forEach(path => revalidatePath(path));
  promptLogger.info('🔄 Rutas revalidadas');
};

class PromptError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'PromptError';
  }
}

export interface PromptWithStats extends Omit<Prompt, 'featuredImage'> {
  _count: {
    images: number
  }
  totalSize: number
  lastUpdated: Date
  distribution?: Array<{
    name: string
    count: number
  }>
  featuredImage: string | null
  recentImages: string[]
}

export interface PromptCreate {
  name: string;
  emoji: string;
  color: string;
  description?: string | null;
  content: string;
  category: string;
  parameters: string;
  tags: string;
  featuredImage?: string | null;
}

export interface PromptUpdate extends Partial<PromptCreate> {
  id: string;
}

export interface PromptWithImages extends Prompt {
  images: FileItem[]
}

export interface ExtendedPrompt extends Prompt {
  images: Image[];
}

export async function getPrompts() {
  try {
    promptLogger.info('📚 Obteniendo lista de prompts');
    const prompts = await prisma.prompt.findMany({
      include: {
        _count: true,
      },
    });

    promptLogger.info(`✅ ${prompts.length} prompts obtenidos`);
    return prompts;
  } catch (error) {
    promptLogger.error("❌ Error al obtener prompts:", error);
    throw new PromptError("No se pudieron obtener los prompts", error);
  }
}

export async function getPromptById(id: string) {
  try {
    promptLogger.info('🔍 Buscando prompt:', id);
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        _count: true,
      },
    });

    if (!prompt) {
      throw new PromptError("Prompt no encontrado");
    }

    promptLogger.info('✅ Prompt encontrado:', prompt.name);
    return prompt;
  } catch (error) {
    promptLogger.error("❌ Error al obtener prompt:", error);
    throw new PromptError("No se pudo obtener el prompt", error);
  }
}

export async function createPrompt(data: PromptCreate) {
  try {
    promptLogger.info('📝 Creando prompt:', data.name);
    const prompt = await prisma.prompt.create({
      data: {
        ...data,
        tags: data.tags || '[]',
        parameters: data.parameters || '{}',
        content: data.content || '',
        featuredImage: data.featuredImage || null,
      },
    });

    // Emitir eventos
    eventsService.emit('prompts:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

    promptLogger.info('✅ Prompt creado:', prompt.name);
    revalidateAllPaths();
    return prompt;
  } catch (error) {
    promptLogger.error("❌ Error al crear prompt:", error);
    throw new PromptError("No se pudo crear el prompt", error);
  }
}

export async function updatePrompt(id: string, data: PromptUpdate) {
  try {
    promptLogger.info('📝 Actualizando prompt:', id);
    const prompt = await prisma.prompt.update({
      where: { id },
      data,
    });

    // Emitir eventos
    eventsService.emit('prompts:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

    promptLogger.info('✅ Prompt actualizado:', prompt.name);
    revalidateAllPaths();
    return prompt;
  } catch (error) {
    promptLogger.error("❌ Error al actualizar prompt:", error);
    throw new PromptError("No se pudo actualizar el prompt", error);
  }
}

export async function deletePrompt(id: string) {
  try {
    promptLogger.info('🗑️ Eliminando prompt:', id);
    await prisma.prompt.delete({
      where: { id },
    });

    // Emitir eventos
    eventsService.emit('prompts:modified' as EventType);
    statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

    promptLogger.info('✅ Prompt eliminado');
    revalidateAllPaths();
  } catch (error) {
    promptLogger.error("❌ Error al eliminar prompt:", error);
    throw new PromptError("No se pudo eliminar el prompt", error);
  }
}

export async function getPromptImages(id: string) {
  try {
    promptLogger.info('🖼️ Obteniendo imágenes del prompt:', id);
    const prompt = await prisma.prompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new PromptError("Prompt no encontrado");
    }

    const images: FileItem[] = [];
    promptLogger.info(`✅ ${images.length} imágenes obtenidas`);
    return images;
  } catch (error) {
    promptLogger.error("❌ Error al obtener imágenes del prompt:", error);
    throw new PromptError("No se pudieron obtener las imágenes del prompt", error);
  }
}