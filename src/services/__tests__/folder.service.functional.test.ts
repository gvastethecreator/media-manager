/**
 * @jest-environment node
 */

import {
    FOLDER_ERROR_CODES,
    createFolderError,
    folderErrorToResponse,
    fromError as folderFromError
} from '@/app/actions/folders/folder-types';

import { folderService } from '@/services/folder.service.functional';

// Mock de las acciones del servidor
jest.mock('@/app/actions/folders', () => ({
  getFolders: jest.fn(),
  createFolder: jest.fn(),
  deleteFolder: jest.fn(),
  indexFolder: jest.fn(),
  reindexFolder: jest.fn()
}));

// Mock del módulo de eventos
jest.mock('@/lib/server/events.server', () => ({
  emit: jest.fn().mockResolvedValue(undefined)
}));

describe('Folder Service Functional', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Limpiar estado entre pruebas
    folderService.offAll();
  });

  describe('Manejo de errores funcional', () => {
    test('createFolderError crea un objeto de error correctamente', () => {
      const error = createFolderError(
        'Mensaje de error',
        FOLDER_ERROR_CODES.NOT_FOUND,
        'Detalles adicionales',
        'folder-123'
      );

      expect(error).toMatchObject({
        name: 'FolderServiceError',
        message: 'Mensaje de error',
        code: FOLDER_ERROR_CODES.NOT_FOUND,
        details: 'Detalles adicionales',
        folderId: 'folder-123'
      });
      expect(error.timestamp).toBeDefined();
      expect(error.stack).toBeDefined();
    });

    test('folderFromError convierte Error estándar a FolderError', () => {
      const originalError = new Error('Error estándar');
      const folderError = folderFromError(originalError, 'folder-123');

      expect(folderError).toMatchObject({
        name: 'FolderServiceError',
        message: 'Error estándar',
        code: FOLDER_ERROR_CODES.UNEXPECTED_ERROR,
        folderId: 'folder-123'
      });
      expect(folderError.stack).toBeDefined();
    });

    test('folderFromError devuelve el mismo objeto si ya es un FolderError', () => {
      const originalError = createFolderError(
        'Error original',
        FOLDER_ERROR_CODES.PATH_INVALID
      );
      const folderError = folderFromError(originalError);

      expect(folderError).toBe(originalError);
    });

    test('folderErrorToResponse convierte FolderError a ErrorResponse', () => {
      const error = createFolderError(
        'Error de prueba',
        FOLDER_ERROR_CODES.NOT_FOUND,
        'Detalles',
        'folder-123'
      );
      const response = folderErrorToResponse(error);

      expect(response).toMatchObject({
        message: 'Error de prueba',
        details: 'Detalles',
        folderId: 'folder-123',
        code: FOLDER_ERROR_CODES.NOT_FOUND,
        timestamp: error.timestamp
      });
    });
  });

  describe('Sistema de eventos', () => {
    test('on/off registra y elimina callbacks correctamente', () => {
      const callback = jest.fn();

      folderService.on('test-event', callback);

      // Acceder al estado interno para verificar
      const callbacks = (folderService as any).state?.eventCallbacks;
      expect(callbacks.get('test-event')?.has(callback)).toBe(true);

      folderService.off('test-event', callback);
      expect(callbacks.get('test-event')?.has(callback)).toBe(false);
    });

    test('offAll limpia todos los callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      folderService.on('event1', callback1);
      folderService.on('event2', callback2);

      folderService.offAll();

      const callbacks = (folderService as any).state?.eventCallbacks;
      expect(callbacks.size).toBe(0);
    });

    test('onProgress/offProgress manejan callbacks de progreso', () => {
      const progressCallback = jest.fn();

      folderService.onProgress(progressCallback);

      const callbacks = (folderService as any).state?.eventCallbacks;
      expect(callbacks.get('folder:progress')?.has(progressCallback)).toBe(true);

      folderService.offProgress(progressCallback);
      expect(callbacks.get('folder:progress')?.has(progressCallback)).toBe(false);
    });
  });

  describe('Control de concurrencia', () => {
    test('withConcurrencyControl previene operaciones concurrentes duplicadas', async () => {
      // Mock de función async
      const mockOperation = jest.fn().mockResolvedValue('result');

      // Crear referencias para acceder a métodos internos
      const withConcurrencyControl = (folderService as any).withConcurrencyControl;

      // Primera operación
      const promise1 = withConcurrencyControl('test-op', mockOperation);

      // Segunda operación con misma clave (debería rechazarse)
      const promise2 = withConcurrencyControl('test-op', mockOperation);

      await expect(promise1).resolves.toBe('result');
      await expect(promise2).rejects.toThrow('Operación test-op en progreso');

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    test('withConcurrencyControl permite operaciones con claves diferentes', async () => {
      // Mock de funciones async
      const mockOp1 = jest.fn().mockResolvedValue('result1');
      const mockOp2 = jest.fn().mockResolvedValue('result2');

      // Crear referencias para acceder a métodos internos
      const withConcurrencyControl = (folderService as any).withConcurrencyControl;

      // Operaciones con claves diferentes
      const promise1 = withConcurrencyControl('op1', mockOp1);
      const promise2 = withConcurrencyControl('op2', mockOp2);

      const results = await Promise.all([promise1, promise2]);

      expect(results).toEqual(['result1', 'result2']);
      expect(mockOp1).toHaveBeenCalledTimes(1);
      expect(mockOp2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cancelación de operaciones', () => {
    beforeEach(() => {
      // Limpiar cualquier estado o evento previo
      folderService.offAll();
    });

    test('Debe permitir cancelar una operación de reindexación', async () => {
      // Mock de la función de indexación
      const mockResult = { id: 'folder1', success: true };
      const mockReindexFolderAction = jest.fn().mockResolvedValue(mockResult);
      const originalReindexAction = reindexFolderAction;

      // Reemplazar temporalmente la función real
      (reindexFolderAction as any) = mockReindexFolderAction;

      // Crear mocks para callbacks
      const onProgress = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();
      const onCancel = jest.fn();

      // Iniciar operación en segundo plano
      const indexPromise = folderService.reindexFolder('folder1', {
        onProgress,
        onComplete,
        onError,
        onCancel
      });

      // Simular un poco de tiempo para que la operación comience
      await new Promise(resolve => setTimeout(resolve, 50));

      // Emitir evento de cancelación
      folderService.emit('folder:cancel', {});

      // Esperar a que la promesa se resuelva o rechace
      try {
        await indexPromise;
        fail('La promesa debería haber sido rechazada');
      } catch (error: any) {
        // Verificar que se llamó al callback de cancelación
        expect(onCancel).toHaveBeenCalled();
        expect(error.code).toBe(FOLDER_ERROR_CODES.OPERATION_IN_PROGRESS);
        expect(error.message).toContain('cancel');
      }

      // Restaurar la función original
      (reindexFolderAction as any) = originalReindexAction;
    });

    test('Debe permitir cancelar reindexAll', async () => {
      // Mock de getFolders para devolver carpetas de prueba
      const mockFolders = [
        { id: 'folder1', name: 'Folder 1', path: '/test/folder1' },
        { id: 'folder2', name: 'Folder 2', path: '/test/folder2' }
      ];
      const originalGetFolders = getFolders;
      (getFolders as any) = jest.fn().mockResolvedValue(mockFolders);

      // Mock de reindexFolder para simular procesamiento lento
      const mockReindexFolder = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ success: true, id: 'folder1' });
          }, 200);
        });
      });
      const originalReindexFolder = performFolderReindexing;
      (performFolderReindexing as any) = mockReindexFolder;

      // Crear mocks para callbacks
      const onGlobalProgress = jest.fn();

      // Iniciar operación en segundo plano
      const reindexPromise = folderService.reindexAll({
        onGlobalProgress
      });

      // Simular un poco de tiempo para que la operación comience
      await new Promise(resolve => setTimeout(resolve, 100));

      // Emitir evento de cancelación global
      folderService.emit('folder:cancel:all', {});

      // Esperar a que la promesa se resuelva
      const result = await reindexPromise;

      // Verificar resultado
      expect(result.cancelled).toBe(true);

      // Verificar que el callback de progreso global muestra la cancelación
      expect(onGlobalProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'cancelled'
        })
      );

      // Restaurar funciones originales
      (getFolders as any) = originalGetFolders;
      (performFolderReindexing as any) = originalReindexFolder;
    });

    test('Debe manejar correctamente el caso de 0 carpetas', async () => {
      // Mock de getFolders para devolver un array vacío
      const originalGetFolders = getFolders;
      (getFolders as any) = jest.fn().mockResolvedValue([]);

      // Crear mocks para callbacks
      const onGlobalProgress = jest.fn();

      // Ejecutar reindexAll
      const result = await folderService.reindexAll({
        onGlobalProgress
      });

      // Verificar resultado
      expect(result.totalFolders).toBe(0);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);

      // Verificar que el callback de progreso global muestra completado
      expect(onGlobalProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'No hay carpetas para reindexar',
          phase: 'complete',
          progress: 100
        })
      );

      // Restaurar función original
      (getFolders as any) = originalGetFolders;
    });
  });
});