/**
 * @file Pruebas para los transformadores entre modelos Prisma y Drizzle
 * @module tests/migration/transformers
 */

import * as DrizzleToPrisma from '@/transformers/drizzle/drizzle-to-prisma';
import * as PrismaToDrizzle from '@/transformers/drizzle/prisma-to-drizzle';
import type { GroupEntity } from '@/types/drizzle';
import type { Group, Property, QueueJob, Wildcard } from '@/types/prisma';
import { describe, expect, it } from 'vitest';

// Fixture para Grupo
const prismaGroup: Group = {
  id: 'group-1',
  name: 'Grupo de prueba',
  description: 'Descripción del grupo de prueba',
  emoji: '🧪',
  color: '#ff0000',
  shortcut: 'test',
  category: 'Testing',
  sortBy: 'name',
  filters: '[]',
  featuredImage: 'image.jpg',
  isFavorite: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-02'),
};

// Fixture para Propiedad
const prismaProperty: Property = {
  id: 'prop-1',
  name: 'Propiedad de prueba',
  description: 'Descripción de la propiedad',
  emoji: '🔍',
  color: '#00ff00',
  shortcut: 'prop',
  category: 'Atributo',
  featuredImage: 'prop.jpg',
  isFavorite: false,
  createdAt: new Date('2023-02-01'),
  updatedAt: new Date('2023-02-02'),
};

// Fixture para Comodín
const prismaWildcard: Wildcard = {
  id: 'wild-1',
  name: 'Comodín de prueba',
  description: 'Descripción del comodín',
  emoji: '🃏',
  color: '#0000ff',
  shortcut: 'wild',
  category: 'Generación',
  children: '["wild-child-1","wild-child-2"]',
  featuredImage: 'wild.jpg',
  isFavorite: true,
  parentId: null,
  createdAt: new Date('2023-03-01'),
  updatedAt: new Date('2023-03-02'),
};

// Fixture para Trabajo en Cola
const prismaQueueJob: QueueJob = {
  id: 'job-1',
  queue: 'procesamiento-imagen',
  data: { imageId: 'img-1', process: 'resize' },
  status: 'pending',
  attempts: 0,
  maxAttempts: 3,
  error: null,
  progress: 0,
  startedAt: null,
  finishedAt: null,
  priority: 1,
  metadata: { source: 'upload', userId: 'user-1' },
  retryAt: null,
  createdAt: new Date('2023-04-01'),
  updatedAt: new Date('2023-04-01'),
};

// Fixture para Grupo en formato Drizzle
const drizzleGroup: GroupEntity = {
  id: 'group-1',
  name: 'Grupo de prueba',
  description: 'Descripción del grupo de prueba',
  emoji: '🧪',
  color: '#ff0000',
  shortcut: 'test',
  category: 'Testing',
  sortBy: 'name',
  filters: '[]',
  featuredImage: 'image.jpg',
  isFavorite: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-02'),
};

describe('Transformadores Prisma <-> Drizzle', () => {
  describe('Transformación de Group', () => {
    it('debe transformar correctamente Group de Prisma a Drizzle', () => {
      const result = PrismaToDrizzle.transformGroupToDrizzle(prismaGroup);

      expect(result).toEqual({
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
      });
    });

    it('debe transformar correctamente Group de Drizzle a Prisma', () => {
      const result = DrizzleToPrisma.transformGroupToPrisma(drizzleGroup);

      expect(result).toEqual({
        id: drizzleGroup.id,
        name: drizzleGroup.name,
        description: drizzleGroup.description,
        emoji: drizzleGroup.emoji,
        color: drizzleGroup.color,
        shortcut: drizzleGroup.shortcut,
        category: drizzleGroup.category,
        featuredImage: drizzleGroup.featuredImage,
        isFavorite: drizzleGroup.isFavorite,
        sortBy: drizzleGroup.sortBy,
        filters: drizzleGroup.filters,
        createdAt: drizzleGroup.createdAt,
        updatedAt: drizzleGroup.updatedAt,
      });
    });
  });

  describe('Transformación de Property', () => {
    it('debe mantener la consistencia en la conversión bidireccional', () => {
      // Prisma -> Drizzle
      const drizzleProperty = PrismaToDrizzle.transformPropertyToDrizzle(prismaProperty);

      // Drizzle -> Prisma (debe volver al original)
      const result = DrizzleToPrisma.transformPropertyToPrisma(drizzleProperty);

      // La única diferencia sería campos adicionales que Drizzle agrega con valores por defecto
      const expectedProperty = {
        ...prismaProperty,
        // Estos campos se agregan en la transformación a Drizzle con valores por defecto
        sortBy: 'name',
        filters: '[]',
      };

      expect(result).toMatchObject(expectedProperty);
    });
  });

  describe('Transformación de Wildcard', () => {
    it('debe manejar correctamente los children como JSON', () => {
      // Prisma -> Drizzle
      const drizzleWildcard = PrismaToDrizzle.transformWildcardToDrizzle(prismaWildcard);

      // Verificar que se conservan los children
      expect(drizzleWildcard.children).toEqual(prismaWildcard.children);

      // Drizzle -> Prisma
      const result = DrizzleToPrisma.transformWildcardToPrisma(drizzleWildcard);

      // Verificar que los children se mantienen en el formato correcto
      expect(result.children).toEqual(prismaWildcard.children);
    });
  });

  describe('Transformación de QueueJob', () => {
    it('debe manejar correctamente la serialización/deserialización de datos JSON', () => {
      // Prisma -> Drizzle (data y metadata deben serializarse)
      const drizzleQueueJob = PrismaToDrizzle.transformQueueJobToDrizzle(prismaQueueJob);

      // Verificar que los objetos se han convertido a strings JSON
      expect(typeof drizzleQueueJob.data).toBe('string');
      expect(typeof drizzleQueueJob.metadata).toBe('string');

      // Drizzle -> Prisma (data y metadata deben deserializarse)
      const result = DrizzleToPrisma.transformQueueJobToPrisma(drizzleQueueJob);

      // Verificar que los strings JSON se han convertido de nuevo a objetos
      expect(result.data).toEqual(prismaQueueJob.data);
      expect(result.metadata).toEqual(prismaQueueJob.metadata);
    });
  });

  describe('Casos especiales', () => {
    it('debe manejar valores nulos o indefinidos en campos opcionales', () => {
      const incompleteGroup: Partial<Group> = {
        id: 'incomplete-1',
        name: 'Grupo incompleto',
        description: null,
        emoji: undefined,
        color: '#cccccc',
        createdAt: new Date(),
        updatedAt: new Date(),
        isFavorite: false,
      };

      // No debería lanzar error al transformar un objeto incompleto
      expect(() => {
        // @ts-ignore - Ignoramos el error de TypeScript para probar el caso
        PrismaToDrizzle.transformGroupToDrizzle(incompleteGroup as Group);
      }).not.toThrow();
    });
  });
});