/**
 * @file Pruebas de integración para la migración de Prisma a Drizzle
 * @module tests/migration/integration
 */

import { DrizzleRepository } from '@/drizzle';
import * as DrizzleToPrisma from '@/transformers/drizzle/drizzle-to-prisma';
import * as PrismaToDrizzle from '@/transformers/drizzle/prisma-to-drizzle';

// Mock para los repositorios y transformadores
jest.mock('@/drizzle', () => {
  return {
    DrizzleRepository: {
      groups: {
        create: jest.fn(),
        getById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      properties: {
        create: jest.fn(),
        getById: jest.fn(),
        getByGroupId: jest.fn(),
      },
      wildcards: {
        create: jest.fn(),
        getById: jest.fn(),
        getByParentId: jest.fn(),
        update: jest.fn(),
      },
      queueJobs: {
        create: jest.fn(),
        getById: jest.fn(),
        update: jest.fn(),
      },
      groupsToProperties: {
        create: jest.fn(),
        getByGroupId: jest.fn(),
      },
      imagesToProperties: {
        create: jest.fn(),
        getByImageId: jest.fn(),
      },
      folders: {
        create: jest.fn(),
        getById: jest.fn(),
        update: jest.fn(),
      },
    },
  };
});

jest.mock('@/transformers/drizzle/drizzle-to-prisma', () => {
  return {
    transformGroupToPrisma: jest.fn(),
    transformPropertyToPrisma: jest.fn(),
    transformWildcardToPrisma: jest.fn(),
    transformQueueJobToPrisma: jest.fn(),
    transformFolderToPrisma: jest.fn(),
  };
});

jest.mock('@/transformers/drizzle/prisma-to-drizzle', () => {
  return {
    transformGroupToDrizzle: jest.fn(),
    transformPropertyToDrizzle: jest.fn(),
    transformWildcardToDrizzle: jest.fn(),
    transformQueueJobToDrizzle: jest.fn(),
    transformFolderToDrizzle: jest.fn(),
  };
});

describe('Integración de la migración Prisma a Drizzle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Flujo completo de Group con Properties', () => {
    it('debe crear, relacionar y obtener un grupo con propiedades', async () => {
      // Datos de prueba
      const groupData = {
        name: 'Grupo de prueba',
        emoji: '🔍',
        color: '#ff0000',
        isFavorite: true,
      };

      const propertyData = {
        name: 'Propiedad de prueba',
        emoji: '🏷️',
        color: '#00ff00',
        isFavorite: false,
      };

      const mockDrizzleGroup = {
        id: 'group-1',
        ...groupData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPrismaGroup = {
        id: 'group-1',
        ...groupData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDrizzleProperty = {
        id: 'prop-1',
        ...propertyData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPrismaProperty = {
        id: 'prop-1',
        ...propertyData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRelation = {
        id: 'rel-1',
        groupId: 'group-1',
        propertyId: 'prop-1',
      };

      // Configurar mocks
      (PrismaToDrizzle.transformGroupToDrizzle as jest.Mock).mockReturnValue(mockDrizzleGroup);
      (DrizzleToPrisma.transformGroupToPrisma as jest.Mock).mockReturnValue(mockPrismaGroup);
      (PrismaToDrizzle.transformPropertyToDrizzle as jest.Mock).mockReturnValue(mockDrizzleProperty);
      (DrizzleToPrisma.transformPropertyToPrisma as jest.Mock).mockReturnValue(mockPrismaProperty);

      (DrizzleRepository.groups.create as jest.Mock).mockResolvedValue(mockDrizzleGroup);
      (DrizzleRepository.properties.create as jest.Mock).mockResolvedValue(mockDrizzleProperty);
      (DrizzleRepository.groupsToProperties.create as jest.Mock).mockResolvedValue(mockRelation);
      (DrizzleRepository.properties.getByGroupId as jest.Mock).mockResolvedValue([mockDrizzleProperty]);

      // Flujo de prueba
      async function testGroupPropertyFlow() {
        // 1. Crear un grupo (Prisma -> Drizzle -> DB -> Drizzle -> Prisma)
        const drizzleGroup = PrismaToDrizzle.transformGroupToDrizzle(mockPrismaGroup);
        const createdDrizzleGroup = await DrizzleRepository.groups.create(drizzleGroup);
        const createdPrismaGroup = DrizzleToPrisma.transformGroupToPrisma(createdDrizzleGroup);

        // 2. Crear una propiedad
        const drizzleProperty = PrismaToDrizzle.transformPropertyToDrizzle(mockPrismaProperty);
        const createdDrizzleProperty = await DrizzleRepository.properties.create(drizzleProperty);
        const createdPrismaProperty = DrizzleToPrisma.transformPropertyToPrisma(createdDrizzleProperty);

        // 3. Asociar la propiedad al grupo
        const relationship = await DrizzleRepository.groupsToProperties.create({
          groupId: createdDrizzleGroup.id,
          propertyId: createdDrizzleProperty.id,
        });

        // 4. Obtener las propiedades del grupo
        const groupProperties = await DrizzleRepository.properties.getByGroupId(createdDrizzleGroup.id);

        return {
          group: createdPrismaGroup,
          property: createdPrismaProperty,
          relationship,
          groupProperties,
        };
      }

      // Ejecutar el flujo
      const result = await testGroupPropertyFlow();

      // Verificaciones
      expect(PrismaToDrizzle.transformGroupToDrizzle).toHaveBeenCalledWith(mockPrismaGroup);
      expect(DrizzleRepository.groups.create).toHaveBeenCalledWith(mockDrizzleGroup);
      expect(DrizzleToPrisma.transformGroupToPrisma).toHaveBeenCalledWith(mockDrizzleGroup);

      expect(PrismaToDrizzle.transformPropertyToDrizzle).toHaveBeenCalledWith(mockPrismaProperty);
      expect(DrizzleRepository.properties.create).toHaveBeenCalledWith(mockDrizzleProperty);
      expect(DrizzleToPrisma.transformPropertyToPrisma).toHaveBeenCalledWith(mockDrizzleProperty);

      expect(DrizzleRepository.groupsToProperties.create).toHaveBeenCalledWith({
        groupId: 'group-1',
        propertyId: 'prop-1',
      });

      expect(DrizzleRepository.properties.getByGroupId).toHaveBeenCalledWith('group-1');

      expect(result.group).toEqual(mockPrismaGroup);
      expect(result.property).toEqual(mockPrismaProperty);
      expect(result.relationship).toEqual(mockRelation);
      expect(result.groupProperties).toEqual([mockDrizzleProperty]);
    });
  });

  describe('Flujo completo de Wildcard con jerarquía', () => {
    it('debe crear, relacionar y obtener wildcards jerárquicos', async () => {
      // Datos de prueba
      const parentData = {
        name: 'Comodín padre',
        emoji: '🃏',
        color: '#ff00ff',
        children: '[]',
        parentId: null,
        isFavorite: true,
      };

      const childData = {
        name: 'Comodín hijo',
        emoji: '🎭',
        color: '#00ffff',
        children: '[]',
        parentId: 'parent-1',
        isFavorite: false,
      };

      const mockDrizzleParent = {
        id: 'parent-1',
        ...parentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPrismaParent = {
        id: 'parent-1',
        ...parentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDrizzleChild = {
        id: 'child-1',
        ...childData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPrismaChild = {
        id: 'child-1',
        ...childData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Configurar mocks
      (PrismaToDrizzle.transformWildcardToDrizzle as jest.Mock)
        .mockReturnValueOnce(mockDrizzleParent)
        .mockReturnValueOnce(mockDrizzleChild);

      (DrizzleToPrisma.transformWildcardToPrisma as jest.Mock)
        .mockReturnValueOnce(mockPrismaParent)
        .mockReturnValueOnce(mockPrismaChild);

      (DrizzleRepository.wildcards.create as jest.Mock)
        .mockResolvedValueOnce(mockDrizzleParent)
        .mockResolvedValueOnce(mockDrizzleChild);

      (DrizzleRepository.wildcards.getByParentId as jest.Mock)
        .mockResolvedValue([mockDrizzleChild]);

      (DrizzleRepository.wildcards.update as jest.Mock)
        .mockImplementation(async (id, data) => ({ ...mockDrizzleParent, ...data }));

      // Flujo de prueba
      async function testWildcardHierarchyFlow() {
        // 1. Crear un wildcard padre
        const drizzleParent = PrismaToDrizzle.transformWildcardToDrizzle(mockPrismaParent);
        const createdDrizzleParent = await DrizzleRepository.wildcards.create(drizzleParent);
        const createdPrismaParent = DrizzleToPrisma.transformWildcardToPrisma(createdDrizzleParent);

        // 2. Crear un wildcard hijo
        const childWithParent = { ...mockPrismaChild, parentId: createdPrismaParent.id };
        const drizzleChild = PrismaToDrizzle.transformWildcardToDrizzle(childWithParent);
        const createdDrizzleChild = await DrizzleRepository.wildcards.create(drizzleChild);
        const createdPrismaChild = DrizzleToPrisma.transformWildcardToPrisma(createdDrizzleChild);

        // 3. Actualizar la referencia de los hijos en el padre
        const updatedParent = await DrizzleRepository.wildcards.update(createdDrizzleParent.id, {
          children: JSON.stringify([createdDrizzleChild.id]),
        });

        // 4. Obtener los hijos del padre
        const children = await DrizzleRepository.wildcards.getByParentId(createdDrizzleParent.id);

        return {
          parent: createdPrismaParent,
          child: createdPrismaChild,
          updatedParent,
          children,
        };
      }

      // Ejecutar el flujo
      const result = await testWildcardHierarchyFlow();

      // Verificaciones
      expect(PrismaToDrizzle.transformWildcardToDrizzle).toHaveBeenCalledTimes(2);
      expect(DrizzleRepository.wildcards.create).toHaveBeenCalledTimes(2);
      expect(DrizzleToPrisma.transformWildcardToPrisma).toHaveBeenCalledTimes(2);

      expect(DrizzleRepository.wildcards.update).toHaveBeenCalledWith(
        'parent-1',
        { children: JSON.stringify(['child-1']) }
      );

      expect(DrizzleRepository.wildcards.getByParentId).toHaveBeenCalledWith('parent-1');

      expect(result.updatedParent.children).toBe(JSON.stringify(['child-1']));
      expect(result.children).toEqual([mockDrizzleChild]);
    });
  });

  describe('Verificación de entidades existentes sin referencias obsoletas', () => {
    it('debe manejar correctamente la entidad Folder sin propiedades visuales obsoletas', async () => {
      // Datos de prueba para Folder sin configuraciones visuales
      const folderData = {
        name: 'Carpeta de prueba',
        description: 'Descripción de la carpeta',
        emoji: '📁',
        color: '#ffcc00',
        parentId: null,
        isFavorite: true,
        // No debe incluir propiedades visuales obsoletas como visualConfig o effects3D
      };

      const mockDrizzleFolder = {
        id: 'folder-1',
        ...folderData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPrismaFolder = {
        id: 'folder-1',
        ...folderData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Configurar mocks
      (PrismaToDrizzle.transformFolderToDrizzle as jest.Mock).mockReturnValue(mockDrizzleFolder);
      (DrizzleToPrisma.transformFolderToPrisma as jest.Mock).mockReturnValue(mockPrismaFolder);
      (DrizzleRepository.folders.create as jest.Mock).mockResolvedValue(mockDrizzleFolder);

      // Flujo de prueba
      async function testFolderWithoutVisualConfig() {
        // Transformar y crear un folder
        const drizzleFolder = PrismaToDrizzle.transformFolderToDrizzle(mockPrismaFolder);
        const createdDrizzleFolder = await DrizzleRepository.folders.create(drizzleFolder);
        const createdPrismaFolder = DrizzleToPrisma.transformFolderToPrisma(createdDrizzleFolder);

        return {
          folder: createdPrismaFolder,
        };
      }

      // Ejecutar el flujo
      const result = await testFolderWithoutVisualConfig();

      // Verificaciones
      expect(PrismaToDrizzle.transformFolderToDrizzle).toHaveBeenCalledWith(mockPrismaFolder);
      expect(DrizzleRepository.folders.create).toHaveBeenCalledWith(mockDrizzleFolder);
      expect(DrizzleToPrisma.transformFolderToPrisma).toHaveBeenCalledWith(mockDrizzleFolder);

      // Verificar que no contiene propiedades obsoletas
      expect(result.folder).not.toHaveProperty('visualConfig');
      expect(result.folder).not.toHaveProperty('effects3D');
      expect(result.folder).not.toHaveProperty('visualPreset');

      // Verificar que contiene todas las propiedades esperadas
      expect(result.folder).toHaveProperty('id');
      expect(result.folder).toHaveProperty('name');
      expect(result.folder).toHaveProperty('description');
      expect(result.folder).toHaveProperty('emoji');
      expect(result.folder).toHaveProperty('color');
      expect(result.folder).toHaveProperty('parentId');
      expect(result.folder).toHaveProperty('isFavorite');
      expect(result.folder).toHaveProperty('createdAt');
      expect(result.folder).toHaveProperty('updatedAt');
    });
  });

  describe('Procesamiento de trabajos en cola con QueueJob', () => {
    it('debe crear y actualizar QueueJob correctamente', async () => {
      // Datos de prueba
      const jobData = {
        queue: 'procesamiento-imagen',
        data: { imageId: 'img-1', process: 'resize' },
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
        priority: 1,
        metadata: { source: 'upload', userId: 'user-1' },
      };

      const mockDrizzleJob = {
        id: 'job-1',
        ...jobData,
        error: null,
        progress: 0,
        startedAt: null,
        finishedAt: null,
        retryAt: null,
        // En Drizzle los objetos JSON se serializan
        data: JSON.stringify(jobData.data),
        metadata: JSON.stringify(jobData.metadata),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPrismaJob = {
        id: 'job-1',
        ...jobData,
        error: null,
        progress: 0,
        startedAt: null,
        finishedAt: null,
        retryAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedDrizzleJob = {
        ...mockDrizzleJob,
        status: 'processing',
        progress: 50,
        startedAt: new Date(),
      };

      // Configurar mocks
      (PrismaToDrizzle.transformQueueJobToDrizzle as jest.Mock).mockReturnValue(mockDrizzleJob);
      (DrizzleToPrisma.transformQueueJobToPrisma as jest.Mock)
        .mockReturnValueOnce(mockPrismaJob)
        .mockReturnValueOnce({
          ...mockPrismaJob,
          status: 'processing',
          progress: 50,
          startedAt: mockUpdatedDrizzleJob.startedAt,
        });

      (DrizzleRepository.queueJobs.create as jest.Mock).mockResolvedValue(mockDrizzleJob);
      (DrizzleRepository.queueJobs.update as jest.Mock).mockResolvedValue(mockUpdatedDrizzleJob);
      (DrizzleRepository.queueJobs.getById as jest.Mock).mockResolvedValue(mockDrizzleJob);

      // Flujo de prueba
      async function testQueueJobFlow() {
        // 1. Crear un trabajo en cola
        const drizzleJob = PrismaToDrizzle.transformQueueJobToDrizzle(mockPrismaJob);
        const createdDrizzleJob = await DrizzleRepository.queueJobs.create(drizzleJob);
        const createdPrismaJob = DrizzleToPrisma.transformQueueJobToPrisma(createdDrizzleJob);

        // 2. Actualizar el estado del trabajo
        const updatedDrizzleJob = await DrizzleRepository.queueJobs.update(createdDrizzleJob.id, {
          status: 'processing',
          progress: 50,
          startedAt: new Date(),
        });
        const updatedPrismaJob = DrizzleToPrisma.transformQueueJobToPrisma(updatedDrizzleJob);

        return {
          job: createdPrismaJob,
          updatedJob: updatedPrismaJob,
        };
      }

      // Ejecutar el flujo
      const result = await testQueueJobFlow();

      // Verificaciones
      expect(PrismaToDrizzle.transformQueueJobToDrizzle).toHaveBeenCalledWith(mockPrismaJob);
      expect(DrizzleRepository.queueJobs.create).toHaveBeenCalledWith(mockDrizzleJob);
      expect(DrizzleToPrisma.transformQueueJobToPrisma).toHaveBeenCalledWith(mockDrizzleJob);

      expect(DrizzleRepository.queueJobs.update).toHaveBeenCalledWith(
        'job-1',
        {
          status: 'processing',
          progress: 50,
          startedAt: expect.any(Date),
        }
      );

      expect(result.job).toEqual(mockPrismaJob);
      expect(result.updatedJob.status).toBe('processing');
      expect(result.updatedJob.progress).toBe(50);
      expect(result.updatedJob.startedAt).toEqual(mockUpdatedDrizzleJob.startedAt);
    });
  });
});