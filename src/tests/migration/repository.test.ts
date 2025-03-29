/**
 * @file Pruebas para el repositorio de Drizzle
 * @module tests/migration/repository
 */

import { DrizzleRepository } from '@/drizzle';
import { db } from '@/drizzle/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock para la base de datos de Drizzle
vi.mock('@/drizzle/db', () => {
  const mockDb = {
    select: vi.fn(() => mockDb),
    from: vi.fn(() => mockDb),
    where: vi.fn(() => mockDb),
    insert: vi.fn(() => mockDb),
    update: vi.fn(() => mockDb),
    set: vi.fn(() => mockDb),
    delete: vi.fn(() => mockDb),
    values: vi.fn(() => mockDb),
    returning: vi.fn(() => []),
    raw: vi.fn((text) => text),
  };

  return {
    db: mockDb,
  };
});

describe('DrizzleRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Tests para Group
  describe('Group', () => {
    it('debe obtener todos los grupos correctamente', async () => {
      const mockGroups = [
        {
          id: 'group-1',
          name: 'Grupo de test 1',
          description: 'Descripción 1',
          emoji: '🔍',
          color: '#ff0000',
          createdAt: new Date(),
          updatedAt: new Date(),
          isFavorite: true,
        },
        {
          id: 'group-2',
          name: 'Grupo de test 2',
          description: 'Descripción 2',
          emoji: '🧪',
          color: '#00ff00',
          createdAt: new Date(),
          updatedAt: new Date(),
          isFavorite: false,
        },
      ];

      // Configurar el mock para devolver datos de prueba
      (db.returning as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockGroups);

      // Ejecutar la función que queremos probar
      const result = await DrizzleRepository.groups.getAll();

      // Verificar que las funciones del db fueron llamadas correctamente
      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalled();
      expect(result).toEqual(mockGroups);
    });

    it('debe obtener un grupo por ID correctamente', async () => {
      const mockGroup = {
        id: 'group-1',
        name: 'Grupo de test',
        description: 'Descripción',
        emoji: '🔍',
        color: '#ff0000',
        createdAt: new Date(),
        updatedAt: new Date(),
        isFavorite: true,
      };

      // Configurar el mock para devolver datos de prueba
      (db.returning as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockGroup]);

      // Ejecutar la función que queremos probar
      const result = await DrizzleRepository.groups.getById('group-1');

      // Verificar que las funciones del db fueron llamadas correctamente
      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(result).toEqual(mockGroup);
    });

    it('debe crear un grupo correctamente', async () => {
      const newGroup = {
        name: 'Nuevo grupo',
        description: 'Descripción del nuevo grupo',
        emoji: '⭐',
        color: '#0000ff',
        isFavorite: false,
      };

      const mockCreatedGroup = {
        id: 'new-group-1',
        ...newGroup,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Configurar el mock para devolver datos de prueba
      (db.returning as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockCreatedGroup]);

      // Ejecutar la función que queremos probar
      const result = await DrizzleRepository.groups.create(newGroup);

      // Verificar que las funciones del db fueron llamadas correctamente
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(newGroup);
      expect(db.returning).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedGroup);
    });

    it('debe actualizar un grupo correctamente', async () => {
      const groupId = 'group-1';
      const updateData = {
        name: 'Nombre actualizado',
        description: 'Descripción actualizada',
      };

      const mockUpdatedGroup = {
        id: groupId,
        name: 'Nombre actualizado',
        description: 'Descripción actualizada',
        emoji: '🔍',
        color: '#ff0000',
        createdAt: new Date(),
        updatedAt: new Date(),
        isFavorite: true,
      };

      // Configurar el mock para devolver datos de prueba
      (db.returning as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockUpdatedGroup]);

      // Ejecutar la función que queremos probar
      const result = await DrizzleRepository.groups.update(groupId, updateData);

      // Verificar que las funciones del db fueron llamadas correctamente
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(db.returning).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedGroup);
    });

    it('debe eliminar un grupo correctamente', async () => {
      const groupId = 'group-1';

      // Configurar el mock para devolver éxito
      (db.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);

      // Ejecutar la función que queremos probar
      const result = await DrizzleRepository.groups.delete(groupId);

      // Verificar que las funciones del db fueron llamadas correctamente
      expect(db.delete).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  // Tests para Property
  describe('Property', () => {
    it('debe manejar correctamente campos JSON en propiedades', async () => {
      const newProperty = {
        name: 'Propiedad con JSON',
        description: 'Descripción',
        emoji: '🔧',
        color: '#ff00ff',
        isFavorite: false,
        validation: { type: 'string', minLength: 2 },
        constraints: { required: true },
        options: ['opción 1', 'opción 2'],
        metadata: { key: 'value' },
      };

      const mockCreatedProperty = {
        id: 'prop-1',
        ...newProperty,
        // Aquí los campos JSON ya estarían serializados
        validation: JSON.stringify(newProperty.validation),
        constraints: JSON.stringify(newProperty.constraints),
        options: JSON.stringify(newProperty.options),
        metadata: JSON.stringify(newProperty.metadata),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Configurar el mock para devolver datos de prueba
      (db.returning as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockCreatedProperty]);

      // Ejecutar la función que queremos probar
      const result = await DrizzleRepository.properties.create(newProperty);

      // Verificar que las funciones del db fueron llamadas correctamente
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalled();
      expect(db.returning).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedProperty);
    });
  });

  // Tests para Wildcard
  describe('Wildcard', () => {
    it('debe gestionar correctamente las relaciones jerárquicas', async () => {
      // Crear un wildcard padre
      const parentWildcard = {
        id: 'parent-1',
        name: 'Comodín padre',
        description: 'Descripción del padre',
        emoji: '🃏',
        color: '#ff00ff',
        children: '[]', // Inicialmente sin hijos
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isFavorite: false,
      };

      // Crear un wildcard hijo
      const childWildcard = {
        name: 'Comodín hijo',
        description: 'Descripción del hijo',
        emoji: '🎭',
        color: '#00ffff',
        parentId: 'parent-1',
        isFavorite: false,
      };

      const mockCreatedChild = {
        id: 'child-1',
        ...childWildcard,
        children: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock para obtener el padre
      (db.returning as ReturnType<typeof vi.fn>).mockResolvedValueOnce([parentWildcard]);

      // Mock para crear el hijo
      (db.returning as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockCreatedChild]);

      // Mock para actualizar el padre con el nuevo hijo
      const updatedParent = {
        ...parentWildcard,
        children: '["child-1"]',
        updatedAt: new Date(),
      };
      (db.returning as ReturnType<typeof vi.fn>).mockResolvedValueOnce([updatedParent]);

      // Ejecutar la función que queremos probar
      await DrizzleRepository.wildcards.getById('parent-1');
      const childResult = await DrizzleRepository.wildcards.create(childWildcard);
      await DrizzleRepository.wildcards.update('parent-1', {
        children: '["child-1"]'
      });

      // Verificar que las funciones del db fueron llamadas correctamente
      expect(db.select).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalled();
      expect(childResult).toEqual(mockCreatedChild);
    });
  });

  // Tests para QueueJob
  describe('QueueJob', () => {
    it('debe gestionar correctamente jobs con datos complejos', async () => {
      const newJob = {
        queue: 'image-processing',
        data: {
          imageId: 'img-1',
          actions: [
            { type: 'resize', width: 800, height: 600 },
            { type: 'filter', name: 'sepia' }
          ],
          priority: 'high'
        },
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
        progress: 0,
        priority: 5,
        metadata: {
          source: 'user-upload',
          userId: 'user-123',
          timestamp: Date.now()
        }
      };

      const mockCreatedJob = {
        id: 'job-1',
        ...newJob,
        data: JSON.stringify(newJob.data),
        metadata: JSON.stringify(newJob.metadata),
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        finishedAt: null,
        retryAt: null,
        error: null,
      };

      // Configurar el mock para devolver datos de prueba
      (db.returning as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockCreatedJob]);

      // Ejecutar la función que queremos probar
      const result = await DrizzleRepository.queueJobs.create(newJob);

      // Verificar que las funciones del db fueron llamadas correctamente
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalled();
      expect(db.returning).toHaveBeenCalled();
      expect(result.id).toEqual(mockCreatedJob.id);
      expect(result.queue).toEqual(mockCreatedJob.queue);
      expect(result.status).toEqual(mockCreatedJob.status);
    });

    it('debe actualizar el progreso de un job correctamente', async () => {
      const jobId = 'job-1';
      const updateData = {
        progress: 50,
        status: 'processing',
      };

      const mockUpdatedJob = {
        id: jobId,
        queue: 'image-processing',
        data: '{"imageId":"img-1","actions":[{"type":"resize","width":800,"height":600},{"type":"filter","name":"sepia"}],"priority":"high"}',
        status: 'processing',
        attempts: 1,
        maxAttempts: 3,
        progress: 50,
        startedAt: new Date(),
        finishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        retryAt: null,
        error: null,
      };

      // Configurar el mock para devolver datos de prueba
      (db.returning as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockUpdatedJob]);

      // Ejecutar la función que queremos probar
      const result = await DrizzleRepository.queueJobs.update(jobId, updateData);

      // Verificar que las funciones del db fueron llamadas correctamente
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(db.returning).toHaveBeenCalled();
      expect(result.progress).toEqual(updateData.progress);
      expect(result.status).toEqual(updateData.status);
    });
  });

  // Tests para operaciones en lote
  describe('Operaciones en lote', () => {
    it('debe crear múltiples registros en una sola operación', async () => {
      const items = [
        { name: 'Item 1', description: 'Descripción 1' },
        { name: 'Item 2', description: 'Descripción 2' },
        { name: 'Item 3', description: 'Descripción 3' },
      ];

      const mockTable = {}; // Simulación de una tabla

      // Configurar el mock para devolver éxito
      (db.insert as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);

      // Ejecutar la función que queremos probar
      const result = await DrizzleRepository.batch.createMany(mockTable, items);

      // Verificar que las funciones del db fueron llamadas correctamente
      expect(db.insert).toHaveBeenCalledWith(mockTable);
      expect(db.values).toHaveBeenCalledWith(items);
      expect(result).toBe(true);
    });
  });
});