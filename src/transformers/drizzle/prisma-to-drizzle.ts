/**
 * @file Funciones para transformar entidades de Prisma a Drizzle
 * @module transformers/drizzle/prisma-to-drizzle
 */

import type * as DrizzleTypes from '@/types/drizzle';
import type * as PrismaTypes from '@/types/entities';

/**
 * Transforma un grupo de Prisma a formato Drizzle
 * @param prismaGroup Grupo en formato Prisma
 * @returns Grupo en formato Drizzle
 */
export function transformGroupToDrizzle(
  prismaGroup: PrismaTypes.Group
): DrizzleTypes.GroupEntity {
  return {
    id: prismaGroup.id,
    name: prismaGroup.name,
    description: prismaGroup.description,
    emoji: prismaGroup.emoji,
    color: prismaGroup.color,
    shortcut: prismaGroup.shortcut,
    category: prismaGroup.category,
    featuredImage: prismaGroup.featuredImage,
    isFavorite: prismaGroup.isFavorite,
    sortBy: prismaGroup.sortBy || 'name',
    filters: prismaGroup.filters || '[]',
    createdAt: prismaGroup.createdAt,
    updatedAt: prismaGroup.updatedAt,
  };
}

/**
 * Transforma una propiedad de Prisma a formato Drizzle
 * @param prismaProperty Propiedad en formato Prisma
 * @returns Propiedad en formato Drizzle
 */
export function transformPropertyToDrizzle(
  prismaProperty: PrismaTypes.Property
): DrizzleTypes.PropertyEntity {
  return {
    id: prismaProperty.id,
    name: prismaProperty.name,
    description: prismaProperty.description,
    emoji: prismaProperty.emoji,
    color: prismaProperty.color,
    shortcut: prismaProperty.shortcut,
    category: prismaProperty.category,
    featuredImage: prismaProperty.featuredImage,
    isFavorite: prismaProperty.isFavorite,
    sortBy: 'name', // Valor por defecto ya que no existe en Prisma
    filters: '[]', // Valor por defecto ya que no existe en Prisma
    createdAt: prismaProperty.createdAt,
    updatedAt: prismaProperty.updatedAt,
  };
}

/**
 * Transforma un comodín de Prisma a formato Drizzle
 * @param prismaWildcard Comodín en formato Prisma
 * @returns Comodín en formato Drizzle
 */
export function transformWildcardToDrizzle(
  prismaWildcard: PrismaTypes.Wildcard
): DrizzleTypes.WildcardEntity {
  return {
    id: prismaWildcard.id,
    name: prismaWildcard.name,
    description: prismaWildcard.description,
    emoji: prismaWildcard.emoji,
    color: prismaWildcard.color,
    shortcut: prismaWildcard.shortcut,
    category: prismaWildcard.category,
    featuredImage: prismaWildcard.featuredImage,
    isFavorite: prismaWildcard.isFavorite,
    sortBy: 'name', // Valor por defecto ya que no existe en Prisma
    filters: '[]', // Valor por defecto ya que no existe en Prisma
    children: prismaWildcard.children,
    parentId: prismaWildcard.parentId,
    createdAt: prismaWildcard.createdAt,
    updatedAt: prismaWildcard.updatedAt,
  };
}

/**
 * Transforma un trabajo en cola de Prisma a formato Drizzle
 * @param prismaQueueJob Trabajo en cola en formato Prisma
 * @returns Trabajo en cola en formato Drizzle
 */
export function transformQueueJobToDrizzle(
  prismaQueueJob: PrismaTypes.QueueJob
): DrizzleTypes.QueueJobEntity {
  return {
    id: prismaQueueJob.id,
    queue: prismaQueueJob.queue,
    data: typeof prismaQueueJob.data === 'string'
      ? prismaQueueJob.data
      : JSON.stringify(prismaQueueJob.data),
    status: prismaQueueJob.status,
    attempts: prismaQueueJob.attempts,
    maxAttempts: prismaQueueJob.maxAttempts,
    error: prismaQueueJob.error,
    progress: prismaQueueJob.progress || 0,
    startedAt: prismaQueueJob.startedAt,
    finishedAt: prismaQueueJob.finishedAt,
    priority: prismaQueueJob.priority,
    metadata: prismaQueueJob.metadata ? (
      typeof prismaQueueJob.metadata === 'string'
        ? prismaQueueJob.metadata
        : JSON.stringify(prismaQueueJob.metadata)
    ) : null,
    retryAt: prismaQueueJob.retryAt,
    createdAt: prismaQueueJob.createdAt,
    updatedAt: prismaQueueJob.updatedAt,
  };
}