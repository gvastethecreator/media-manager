'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import { revalidatePath } from 'next/cache';
// Importaciones de tipos y transformers
import { convertServerImageToFileItem } from '@/services/image-converter.service';
import { mapCreatePropertyDataToPrisma, mapPropertyFiltersToPrisma, mapUpdatePropertyDataToPrisma } from '@/transformers/property';
import type { CreatePropertyData, PropertyBase, PropertyFilters, PropertyWithRelations, UpdatePropertyData } from '@/types/entities/property';

// Utilidades y logging
const propertyLogger = serverLogger.withContext('PropertyActions');

const REVALIDATE_PATHS = ['/settings', '/properties', '/properties/[id]'] as const;

const revalidateAllPaths = async () => {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  propertyLogger.info('🔄 Rutas revalidadas');
};

// Notificar cambios en propiedades
const notifyPropertyChange = async (action: 'create' | 'update' | 'delete', property: PropertyBase | { id: string }) => {
  // Emitir eventos usando el sistema del servidor
  await emit({
    type: 'properties:modified',
    data: { action, property },
  });
  statsEventEmitter.emit(STATS_EVENTS.PROPERTY_CHANGE);
};

// Manejo de errores - enfoque funcional
enum PropertyErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  OPERATION_FAILED = 'OPERATION_FAILED',
}

const createPropertyError = (message: string, code: PropertyErrorCode = PropertyErrorCode.OPERATION_FAILED, cause?: unknown) => {
  const error = new Error(message);
  error.name = 'PropertyError';
  Object.assign(error, { code, cause });
  return error;
};

// Interfaces para resultados
export interface PropertyWithStats {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  shortcut: string | null;
  category: string | null;
  featuredImage: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    images: number;
    videos: number;
    albums: number;
    collections: number;
    tags: number;
    characters: number;
    places: number;
    worldItems: number;
    concepts: number;
    prompts: number;
    notes: number;
    wildcards: number;
    groups: number;
  };
  totalEntities: number;
  lastUpdated: Date;
}

export interface PropertyWithImages extends PropertyBase {
  images: FileItem[];
}

// Acciones del servidor
export async function getProperties(filters?: PropertyFilters): Promise<PropertyWithStats[]> {
  try {
    propertyLogger.info('🔍 Obteniendo propiedades con estadísticas');

    // Aplicar filtros si se proporcionan
    const where = filters ? mapPropertyFiltersToPrisma(filters).where : {};

    // Obtener propiedades con conteos
    const properties = await prisma.property.findMany({
      where,
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
      orderBy: [
        {
          name: 'asc',
        },
      ],
    });

    // Calcular estadísticas adicionales
    const propertiesWithStats = properties.map((property) => {
      // Calcular total de entidades
      const totalEntities =
        (property._count.images || 0) +
        (property._count.videos || 0) +
        (property._count.albums || 0) +
        (property._count.collections || 0) +
        (property._count.tags || 0) +
        (property._count.characters || 0) +
        (property._count.places || 0) +
        (property._count.worldItems || 0) +
        (property._count.concepts || 0) +
        (property._count.prompts || 0) +
        (property._count.notes || 0) +
        (property._count.wildcards || 0) +
        (property._count.groups || 0);

      return {
        ...property,
        totalEntities,
        lastUpdated: property.updatedAt,
      };
    });

    propertyLogger.info('✅ Propiedades obtenidas:', propertiesWithStats.length);
    return propertiesWithStats;
  } catch (error) {
    propertyLogger.error('❌ Error al obtener propiedades:', error);
    throw createPropertyError('No se pudieron obtener las propiedades', PropertyErrorCode.OPERATION_FAILED, error);
  }
}

export async function getProperty(id: string): Promise<PropertyWithRelations> {
  try {
    propertyLogger.info('🔍 Obteniendo propiedad:', id);

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
      throw createPropertyError(`Propiedad con id ${id} no encontrada`, PropertyErrorCode.NOT_FOUND);
    }

    propertyLogger.info('✅ Propiedad obtenida:', property.name);
    return property as unknown as PropertyWithRelations;
  } catch (error) {
    propertyLogger.error('❌ Error al obtener propiedad:', error);
    if ((error as any).code === PropertyErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createPropertyError(`No se pudo obtener la propiedad con id ${id}`, PropertyErrorCode.OPERATION_FAILED, error);
  }
}

export async function createProperty(data: CreatePropertyData): Promise<PropertyBase> {
  try {
    propertyLogger.info('📝 Creando propiedad:', data.name);

    // Mapear datos para Prisma
    const propertyData = mapCreatePropertyDataToPrisma(data);

    // Crear propiedad
    const property = await prisma.property.create({
      data: propertyData,
    });

    // Notificar cambio
    await notifyPropertyChange('create', property);

    // Revalidar rutas
    await revalidateAllPaths();

    propertyLogger.info('✅ Propiedad creada:', property.name);
    return property;
  } catch (error) {
    propertyLogger.error('❌ Error al crear propiedad:', error);
    throw createPropertyError('No se pudo crear la propiedad', PropertyErrorCode.OPERATION_FAILED, error);
  }
}

export async function updateProperty(id: string, data: UpdatePropertyData): Promise<PropertyBase> {
  try {
    propertyLogger.info('🔄 Actualizando propiedad:', id);

    // Verificar que la propiedad exista
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      throw createPropertyError(`Propiedad con id ${id} no encontrada`, PropertyErrorCode.NOT_FOUND);
    }

    // Mapear datos para Prisma
    const propertyData = mapUpdatePropertyDataToPrisma(data);

    // Actualizar propiedad
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: propertyData,
    });

    // Notificar cambio
    await notifyPropertyChange('update', updatedProperty);

    // Revalidar rutas
    await revalidateAllPaths();

    propertyLogger.info('✅ Propiedad actualizada:', updatedProperty.name);
    return updatedProperty;
  } catch (error) {
    propertyLogger.error('❌ Error al actualizar propiedad:', error);
    if ((error as any).code === PropertyErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createPropertyError(`No se pudo actualizar la propiedad con id ${id}`, PropertyErrorCode.OPERATION_FAILED, error);
  }
}

export async function deleteProperty(id: string): Promise<void> {
  try {
    propertyLogger.info('🗑️ Eliminando propiedad:', id);

    // Verificar que la propiedad exista
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      throw createPropertyError(`Propiedad con id ${id} no encontrada`, PropertyErrorCode.NOT_FOUND);
    }

    // Eliminar propiedad
    await prisma.property.delete({
      where: { id },
    });

    // Notificar cambio
    await notifyPropertyChange('delete', { id });

    // Revalidar rutas
    await revalidateAllPaths();

    propertyLogger.info('✅ Propiedad eliminada:', id);
  } catch (error) {
    propertyLogger.error('❌ Error al eliminar propiedad:', error);
    if ((error as any).code === PropertyErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createPropertyError(`No se pudo eliminar la propiedad con id ${id}`, PropertyErrorCode.OPERATION_FAILED, error);
  }
}

export async function getPropertyImages(id: string): Promise<FileItem[]> {
  try {
    propertyLogger.info('🖼️ Obteniendo imágenes de la propiedad:', id);

    // Verificar que la propiedad exista
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      throw createPropertyError(`Propiedad con id ${id} no encontrada`, PropertyErrorCode.NOT_FOUND);
    }

    // Obtener imágenes relacionadas
    const images = await prisma.image.findMany({
      where: {
        properties: {
          some: {
            id,
          },
        },
      },
      include: {
        folder: true,
        tags: true,
      },
    });

    // Convertir a FileItem
    const fileItems = images.map((image) => convertServerImageToFileItem(image as any));

    propertyLogger.info('✅ Imágenes de la propiedad obtenidas:', fileItems.length);
    return fileItems;
  } catch (error) {
    propertyLogger.error('❌ Error al obtener imágenes de la propiedad:', error);
    if ((error as any).code === PropertyErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createPropertyError(`No se pudieron obtener las imágenes de la propiedad con id ${id}`, PropertyErrorCode.OPERATION_FAILED, error);
  }
}

export async function addImageToProperty(propertyId: string, imageId: string): Promise<void> {
  try {
    propertyLogger.info('➕ Añadiendo imagen a la propiedad:', { propertyId, imageId });

    // Verificar que la propiedad exista
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!existingProperty) {
      throw createPropertyError(`Propiedad con id ${propertyId} no encontrada`, PropertyErrorCode.NOT_FOUND);
    }

    // Verificar que la imagen exista
    const existingImage = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!existingImage) {
      throw createPropertyError(`Imagen con id ${imageId} no encontrada`, PropertyErrorCode.NOT_FOUND);
    }

    // Conectar imagen con propiedad
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        images: {
          connect: { id: imageId },
        },
      },
    });

    // Notificar cambio
    await notifyPropertyChange('update', { id: propertyId });

    // Revalidar rutas
    await revalidateAllPaths();

    propertyLogger.info('✅ Imagen añadida a la propiedad');
  } catch (error) {
    propertyLogger.error('❌ Error al añadir imagen a la propiedad:', error);
    if ((error as any).code === PropertyErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createPropertyError(`No se pudo añadir la imagen ${imageId} a la propiedad ${propertyId}`, PropertyErrorCode.OPERATION_FAILED, error);
  }
}

export async function removeImageFromProperty(propertyId: string, imageId: string): Promise<void> {
  try {
    propertyLogger.info('➖ Quitando imagen de la propiedad:', { propertyId, imageId });

    // Verificar que la propiedad exista
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!existingProperty) {
      throw createPropertyError(`Propiedad con id ${propertyId} no encontrada`, PropertyErrorCode.NOT_FOUND);
    }

    // Verificar que la imagen exista
    const existingImage = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!existingImage) {
      throw createPropertyError(`Imagen con id ${imageId} no encontrada`, PropertyErrorCode.NOT_FOUND);
    }

    // Desconectar imagen de propiedad
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        images: {
          disconnect: { id: imageId },
        },
      },
    });

    // Notificar cambio
    await notifyPropertyChange('update', { id: propertyId });

    // Revalidar rutas
    await revalidateAllPaths();

    propertyLogger.info('✅ Imagen quitada de la propiedad');
  } catch (error) {
    propertyLogger.error('❌ Error al quitar imagen de la propiedad:', error);
    if ((error as any).code === PropertyErrorCode.NOT_FOUND) {
      throw error;
    }
    throw createPropertyError(`No se pudo quitar la imagen ${imageId} de la propiedad ${propertyId}`, PropertyErrorCode.OPERATION_FAILED, error);
  }
}