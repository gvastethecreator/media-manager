import type { ProcessStatus } from '@/app/actions/folders';
import { FOLDER_EVENTS, FolderService } from '@/services/folder/folder.service';
import { describe, expect, it, jest } from '@jest/globals';

describe('🧪 Folder Service', () => {
  let folderService: typeof FolderService;

  beforeEach(() => {
    // Obtener una nueva instancia del servicio para cada prueba
    folderService = FolderService.getInstance();
    // Limpiar todos los callbacks registrados
    folderService.offAll();
  });

  describe('Gestión de Eventos', () => {
    it('debería registrar y ejecutar callbacks de eventos', async () => {
      const mockCallback = jest.fn();
      folderService.on(FOLDER_EVENTS.PROGRESS, mockCallback);

      const mockStatus: ProcessStatus = {
        id: 'test-id',
        operation: 'test',
        status: 'processing',
        progress: 50,
        total: 100,
        current: 50,
        startTime: Date.now(),
        estimatedEndTime: Date.now() + 1000
      };

      await folderService.emitEvent(FOLDER_EVENTS.PROGRESS, mockStatus);
      expect(mockCallback).toHaveBeenCalledWith(mockStatus);
    });

    it('debería eliminar callbacks correctamente', () => {
      const mockCallback = jest.fn();
      folderService.on(FOLDER_EVENTS.ERROR, mockCallback);
      folderService.off(FOLDER_EVENTS.ERROR, mockCallback);

      const callbacks = folderService.getEventCallbacks().get(FOLDER_EVENTS.ERROR);
      expect(callbacks?.size).toBe(0);
    });

    it('debería limpiar todos los callbacks con offAll', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();

      folderService.on(FOLDER_EVENTS.PROGRESS, mockCallback1);
      folderService.on(FOLDER_EVENTS.ERROR, mockCallback2);

      folderService.offAll();

      expect(folderService.getEventCallbacks().size).toBe(0);
    });
  });

  describe('Control de Concurrencia', () => {
    it('debería prevenir operaciones concurrentes del mismo tipo', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const operation1 = folderService.withConcurrencyControl('test', mockOperation);
      const operation2 = folderService.withConcurrencyControl('test', mockOperation);

      await Promise.all([operation1, operation2]);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('debería permitir operaciones diferentes simultáneamente', async () => {
      const mockOperation1 = jest.fn().mockResolvedValue('success1');
      const mockOperation2 = jest.fn().mockResolvedValue('success2');

      await Promise.all([
        folderService.withConcurrencyControl('test1', mockOperation1),
        folderService.withConcurrencyControl('test2', mockOperation2)
      ]);

      expect(mockOperation1).toHaveBeenCalledTimes(1);
      expect(mockOperation2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Gestión de Progreso', () => {
    it('debería actualizar y emitir el progreso correctamente', async () => {
      const mockProgressCallback = jest.fn();
      folderService.onProgress(mockProgressCallback);

      const mockStatus: ProcessStatus = {
        id: 'test-id',
        operation: 'test',
        status: 'processing',
        progress: 0,
        total: 100,
        current: 0,
        startTime: Date.now(),
        estimatedEndTime: Date.now() + 1000
      };

      await folderService.updateProgress('test-id', mockStatus);

      expect(mockProgressCallback).toHaveBeenCalledWith(expect.objectContaining({
        id: 'test-id',
        progress: expect.any(Number)
      }));
    });

    it('debería limpiar el progreso correctamente', () => {
      const mockStatus: ProcessStatus = {
        id: 'test-id',
        operation: 'test',
        status: 'processing',
        progress: 50,
        total: 100,
        current: 50,
        startTime: Date.now(),
        estimatedEndTime: Date.now() + 1000
      };

      folderService.updateProgress('test-id', mockStatus);
      folderService.clearProgress('test-id');

      expect(folderService.getGlobalProgress().has('test-id')).toBeFalsy();
    });
  });

  describe('Operaciones de Carpetas', () => {
    it('debería manejar errores en getFolders', async () => {
      const mockErrorCallback = jest.fn();
      folderService.onError(mockErrorCallback);

      // Simular un error en getFolders
      jest.spyOn(folderService, 'getFolders').mockRejectedValue(new Error('Test error'));

      await expect(folderService.getFolders()).rejects.toThrow('Test error');
      expect(mockErrorCallback).toHaveBeenCalled();
    });

    it('debería emitir eventos apropiados al añadir una carpeta', async () => {
      const mockProgressCallback = jest.fn();
      const mockCompleteCallback = jest.fn();

      folderService.onProgress(mockProgressCallback);
      folderService.onComplete(mockCompleteCallback);

      await folderService.addFolder('/test/path');

      expect(mockProgressCallback).toHaveBeenCalled();
      expect(mockCompleteCallback).toHaveBeenCalled();
    });
  });
});