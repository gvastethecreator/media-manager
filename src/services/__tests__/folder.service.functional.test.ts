/**
 * @jest-environment node
 */

import {
	createFolderError,
	FOLDER_ERROR_CODES,
	folderErrorToResponse,
	fromError as folderFromError,
} from '@/app/actions/folders/folder-types';

import { getFolders } from '@/app/actions/folders/get.actions';
import { folderService } from '@/services/folder/folder.service';

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

		describe('Sistema de eventos', () => {
			test('on/off registra y elimina callbacks correctamente', async () => {
				const callback = jest.fn();

				folderService.on('test-event', callback);

				// Emitir evento para verificar suscripción
				await (folderService as any).emitEvent('test-event');
				expect(callback).toHaveBeenCalledTimes(1);

				folderService.off('test-event', callback);
				await (folderService as any).emitEvent('test-event');
				expect(callback).toHaveBeenCalledTimes(1);
			});

			test('offAll limpia todos los callbacks', async () => {
				const callback1 = jest.fn();
				const callback2 = jest.fn();

				folderService.on('event1', callback1);
				folderService.on('event2', callback2);

				folderService.offAll();

				await (folderService as any).emitEvent('event1');
				await (folderService as any).emitEvent('event2');
				expect(callback1).not.toHaveBeenCalled();
				expect(callback2).not.toHaveBeenCalled();
			});

			test('onProgress/offProgress manejan callbacks de progreso', async () => {
				const progressCallback = jest.fn();

				folderService.onProgress(progressCallback);

				await (folderService as any).emitEvent('folder:progress', { progress: 10 });
				expect(progressCallback).toHaveBeenCalledTimes(1);

				folderService.offProgress(progressCallback);
				await (folderService as any).emitEvent('folder:progress', { progress: 20 });
				expect(progressCallback).toHaveBeenCalledTimes(1);
			});
		});

		describe('Control de concurrencia', () => {
			test('withConcurrencyControl reutiliza la promesa en operaciones duplicadas', async () => {
				// Mock de función async
				const mockOperation = jest.fn().mockResolvedValue('result');

				// Crear referencias para acceder a métodos internos
				const withConcurrencyControl = (folderService as any).withConcurrencyControl.bind(folderService);

				// Primera operación
				const promise1 = withConcurrencyControl('test-op', mockOperation);

				// Segunda operación con misma clave (reutiliza la promesa existente)
				const promise2 = withConcurrencyControl('test-op', mockOperation);

				const [result1, result2] = await Promise.all([promise1, promise2]);

				expect(result1).toBe('result');
				expect(result2).toBe('result');
				expect(mockOperation).toHaveBeenCalledTimes(1);
			});

			test('withConcurrencyControl permite operaciones con claves diferentes', async () => {
				// Mock de funciones async
				const mockOp1 = jest.fn().mockResolvedValue('result1');
				const mockOp2 = jest.fn().mockResolvedValue('result2');

				// Crear referencias para acceder a métodos internos
				const withConcurrencyControl = (folderService as any).withConcurrencyControl.bind(folderService);

				// Operaciones con claves diferentes
				const promise1 = withConcurrencyControl('op1', mockOp1);
				const promise2 = withConcurrencyControl('op2', mockOp2);

				const results = await Promise.all([promise1, promise2]);

				expect(results).toEqual(['result1', 'result2']);
				expect(mockOp1).toHaveBeenCalledTimes(1);
				expect(mockOp2).toHaveBeenCalledTimes(1);
			});
		});

		describe.skip('Cancelación de operaciones', () => {
			beforeEach(() => {
				// Limpiar cualquier estado o evento previo
				folderService.offAll();
			});

			test('Debe permitir cancelar una operación de reindexación', async () => {
				// Mock de la función de indexación
				const mockResult = { id: 'folder1', success: true };
				const mockReindexFolder = jest.fn().mockResolvedValue(mockResult);
				const originalReindex = (await import('@/app/actions/folders')).reindexFolder as any;
				(jest.requireMock('@/app/actions/folders').reindexFolder as any) = mockReindexFolder;

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
				(folderService as any).emitEvent('folder:cancel', {});

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
				(jest.requireMock('@/app/actions/folders').reindexFolder as any) = originalReindex;
			});
		});

		test.skip('Debe permitir cancelar reindexAll', async () => {
			// Mock de getFolders para devolver carpetas de prueba
			const mockFolders = [
				{ id: 'folder1', name: 'Folder 1', path: '/test/folder1' },
				{ id: 'folder2', name: 'Folder 2', path: '/test/folder2' },
			];
			const getFoldersMock = getFolders as jest.Mock;
			getFoldersMock.mockResolvedValue(mockFolders);

			// Mock de reindexFolder para simular procesamiento lento
			const mockReindexFolder = jest.fn().mockImplementation(() => {
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve({ success: true, id: 'folder1' });
					}, 200);
				});
			});
			const reindexFolderMock = jest.requireMock('@/app/actions/folders').reindexFolder as jest.Mock;
			reindexFolderMock.mockImplementation(mockReindexFolder);

			// Iniciar operación en segundo plano
			const reindexPromise = folderService.reindexAll();

			// Simular un poco de tiempo para que la operación comience
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Emitir evento de cancelación global
			(folderService as any).emitEvent('folder:cancel:all', {});

			// Esperar a que la promesa se resuelva
			const result = await reindexPromise;

			// Verificar resultado simplificado
			expect(result.success).toBe(true);
			expect(result.errors.length).toBe(0);

			// Restaurar funciones originales
			getFoldersMock.mockReset();
			reindexFolderMock.mockReset();
		});

		test('Debe manejar correctamente el caso de 0 carpetas', async () => {
			// Mock de getFolders para devolver un array vacío
			const getFoldersMock = getFolders as jest.Mock;
			getFoldersMock.mockResolvedValue([]);

			// Ejecutar reindexAll
			const result = await folderService.reindexAll();

			// Verificar resultado
			expect(result.totalFolders).toBe(0);
			expect(result.processedFolders).toBe(0);
			expect(result.errors.length).toBe(0);

			// Restaurar función original
			getFoldersMock.mockReset();
		});
	});
});
