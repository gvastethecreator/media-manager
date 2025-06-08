/**
 * @jest-environment node
 */

import {
    FOLDER_ERROR_CODES,
    createFolderError,
    folderErrorToResponse,
    fromError as folderFromError,
} from '@/app/actions/folders/folder-types';

import { folderService } from '../folder/folder.service';

// Mock de las acciones del servidor
jest.mock('@/app/actions/folders', () => ({
	createFolder: jest.fn(),
	deleteFolder: jest.fn(),
	indexFolder: jest.fn(),
	reindexFolder: jest.fn(),
}));

// Mock del módulo de eventos
jest.mock('@/lib/server/events.server', () => ({
	emit: jest.fn().mockResolvedValue(undefined),
}));

// Mocks explícitos para acciones internas usadas en los tests funcionales
jest.mock('@/app/actions/folders/reindex.actions', () => ({
  reindexFolderAction: jest.fn(),
}));
jest.mock('@/app/actions/folders/get.actions', () => ({
  getFolders: jest.fn(),
}));
jest.mock('../folder/folder.service', () => {
  const actual = jest.requireActual('../folder/folder.service');
  return {
    ...actual,
    performFolderReindexing: jest.fn(),
  };
});

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
				folderId: 'folder-123',
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
				folderId: 'folder-123',
			});
			expect(folderError.stack).toBeDefined();
		});

		test('folderFromError devuelve el mismo objeto si ya es un FolderError', () => {
			const originalError = createFolderError('Error original', FOLDER_ERROR_CODES.PATH_INVALID);
			const folderError = folderFromError(originalError);

			expect(folderError).toBe(originalError);
		});

		test('folderErrorToResponse convierte FolderError a ErrorResponse', () => {
			const error = createFolderError('Error de prueba', FOLDER_ERROR_CODES.NOT_FOUND, 'Detalles', 'folder-123');
			const response = folderErrorToResponse(error);

			expect(response).toMatchObject({
				message: 'Error de prueba',
				details: 'Detalles',
				folderId: 'folder-123',
				code: FOLDER_ERROR_CODES.NOT_FOUND,
				timestamp: error.timestamp,
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
				onCancel,
			});

			// Simular un poco de tiempo para que la operación comience
			await new Promise((resolve) => setTimeout(resolve, 50));

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
	});

	describe('Debe manejar correctamente el caso de 0 carpetas', () => {
		test('reindexAll retorna success y processedFolders en 0 si no hay carpetas', async () => {
			// Ejecutar reindexAll
			const result = await folderService.reindexAll();
			// Verificar resultado
			expect(result.success).toBe(true);
			expect(result.processedFolders).toBe(0);
			expect(result.totalFolders).toBe(0);
			expect(Array.isArray(result.errors)).toBe(true);
		});
	});
});
