'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type { Property } from '@prisma/client';

const logger = serverLogger.withContext('PropertyActions');

/**
 * Obtiene todas las propiedades con sus estadísticas
 */
export async function getProperties() {
  try {
    const properties = await prisma.property.findMany({
      include: {
        _count: {
          select: {
            images: true,
            videos: true,
            albums: true,
            collections: true,
            tags: true,
            characters: true,
            places: true,
            worldItems: true,
            concepts: true,
            prompts: true,
            notes: true,
            wildcards: true,
            groups: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    logger.info(`✅ Se obtuvieron ${properties.length} propiedades`);
    return properties;
  } catch (error) {
    logger.error('❌ Error al obtener propiedades:', error);
    throw error;
  }
}

/**
 * Obtiene una propiedad por su ID
 */
export async function getProperty(id: string) {
  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
            videos: true,
            albums: true,
            collections: true,
            tags: true,
            characters: true,
            places: true,
            worldItems: true,
            concepts: true,
            prompts: true,
            notes: true,
            wildcards: true,
            groups: true,
          },
        },
      },
    });

    if (!property) {
      throw new Error(`No se encontró la propiedad con ID ${id}`);
    }

    logger.info('✅ Propiedad obtenida:', property.name);
    return property;
  } catch (error) {
    logger.error('❌ Error al obtener propiedad:', error);
    throw error;
  }
}

/**
 * Crea una nueva propiedad
 */
export async function createProperty(data: Partial<Property>) {
  try {
    const property = await prisma.property.create({
      data: {
        name: data.name!,
        emoji: data.emoji || '🔍',
        color: data.color || '#3b82f6',
        description: data.description,
        shortcut: data.shortcut,
        category: data.category || 'general',
        featuredImage: data.featuredImage,
        isFavorite: data.isFavorite || false,
      },
      include: {
        _count: {
          select: {
            images: true,
            videos: true,
            albums: true,
            collections: true,
            tags: true,
            characters: true,
            places: true,
            worldItems: true,
            concepts: true,
            prompts: true,
            notes: true,
            wildcards: true,
            groups: true,
          },
        },
      },
    });

    logger.info('✅ Propiedad creada:', property.name);
    return property;
  } catch (error) {
    logger.error('❌ Error al crear propiedad:', error);
    throw error;
  }
}

/**
 * Actualiza una propiedad existente
 */
export async function updateProperty(id: string, data: Partial<Property>) {
  try {
    const property = await prisma.property.update({
      where: { id },
      data: {
        name: data.name,
        emoji: data.emoji,
        color: data.color,
        description: data.description,
        shortcut: data.shortcut,
        category: data.category,
        featuredImage: data.featuredImage,
        isFavorite: data.isFavorite,
      },
      include: {
        _count: {
          select: {
            images: true,
            videos: true,
            albums: true,
            collections: true,
            tags: true,
            characters: true,
            places: true,
            worldItems: true,
            concepts: true,
            prompts: true,
            notes: true,
            wildcards: true,
            groups: true,
          },
        },
      },
    });

    logger.info('✅ Propiedad actualizada:', property.name);
    return property;
  } catch (error) {
    logger.error('❌ Error al actualizar propiedad:', error);
    throw error;
  }
}

/**
 * Elimina una propiedad
 */
export async function deleteProperty(id: string) {
  try {
    await prisma.property.delete({
      where: { id },
    });

    logger.info('✅ Propiedad eliminada:', id);
    return true;
  } catch (error) {
    logger.error('❌ Error al eliminar propiedad:', error);
    throw error;
  }
}

/**
 * Cambia el estado de favorito de una propiedad
 */
export async function togglePropertyFavorite(id: string) {
  try {
    const property = await prisma.property.findUnique({
      where: { id },
      select: { isFavorite: true },
    });

    if (!property) {
      throw new Error(`No se encontró la propiedad con ID ${id}`);
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        isFavorite: !property.isFavorite,
      },
      include: {
        _count: {
          select: {
            images: true,
            videos: true,
            albums: true,
            collections: true,
            tags: true,
            characters: true,
            places: true,
            worldItems: true,
            concepts: true,
            prompts: true,
            notes: true,
            wildcards: true,
            groups: true,
          },
        },
      },
    });

    logger.info('✅ Estado favorito actualizado:', !property.isFavorite);
    return updatedProperty;
  } catch (error) {
    logger.error('❌ Error al actualizar estado favorito:', error);
    throw error;
  }
}