'use server';

/**
 * @file CRUD actions for folders
 * @module app/actions/folders/crud.actions
 */

import { scanFolder } from '@/lib/folder-scanner';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { transformFolder } from '@/transformers/folder';
import { type FolderComplete } from '@/types/entities/folder';
import { revalidatePath } from 'next/cache';
import { CreateFolderOptions, FOLDER_ERROR_CODES, UpdateFolderOptions } from './folder-types';

// Logger para acciones CRUD
const crudLogger = serverLogger.withContext('FolderCrudActions');

// Rutas a revalidar después de operaciones CRUD
const REVALIDATE_PATHS = ['/folders', '/dashboard', '/images', '/api/folders'];

/**
 * Revalida las rutas relacionadas con carpetas
 */
async function revalidateFolderPaths() {
	crudLogger.info('🔄 Revalidando rutas de carpetas');
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
}

/**
 * Interfaz para errores de operaciones CRUD de carpetas
 */
export interface FolderCrudErrorData {
	name: string;
	message: string;
	code: string;
	cause?: unknown;
}

/**
 * Función para crear errores de operaciones CRUD de carpetas (enfoque funcional)
 */
function createFolderCrudError(
	message: string,
	code: string = FOLDER_ERROR_CODES.UNEXPECTED_ERROR,
	cause?: unknown
): FolderCrudErrorData {
	return {
		name: 'FolderCrudError',
		message,
		code,
		cause,
	};
}

/**
 * Crea una nueva carpeta en la base de datos
 * @param path Ruta de la carpeta en el sistema de archivos
 * @param options Opciones adicionales para la creación
 * @returns Datos de la carpeta creada
 */
export async function createFolder(path: string, options: CreateFolderOptions = {}): Promise<FolderComplete> {
	try {
		crudLogger.info('📁 Creando nueva carpeta:', { path, ...options });

		// Validar que la ruta no esté vacía
		if (!path || path.trim() === '') {
			throw createFolderCrudError('La ruta de la carpeta no puede estar vacía', FOLDER_ERROR_CODES.PATH_INVALID);
		}

		// Verificar que la carpeta exista y sea accesible
		try {
			const scanResult = await scanFolder(path, { recursive: false });
			crudLogger.info('🔍 Carpeta escaneada:', {
				path,
				exists: true,
				totalFiles: scanResult.totalFiles,
				totalSize: scanResult.totalSize,
			});
		} catch (error) {
			throw createFolderCrudError(
				`La carpeta no existe o no es accesible: ${path}`,
				FOLDER_ERROR_CODES.PATH_INVALID,
				error
			);
		}

		// Verificar si la carpeta ya existe en la base de datos
		const existingFolder = await prisma.folder.findFirst({
			where: { path: path },
		});

		if (existingFolder) {
			throw createFolderCrudError(`Ya existe una carpeta con la ruta ${path}`, FOLDER_ERROR_CODES.ALREADY_EXISTS);
		}

		// Extraer nombre de la carpeta de la ruta
		const folderName = options.name || path.split('/').pop() || path.split('\\').pop() || 'Nueva carpeta'; // Crear la carpeta en la base de datos
		const folder = await prisma.folder.create({
			data: {
				name: folderName,
				path: path,
				description: options.description || '',
				emoji: options.emoji || '📁',
				color: options.color || '',
				autoReindex: options.autoReindex || false,
				parentId: options.parentId || null,
				// Solo usar campos que existen en el esquema
			},
			include: {
				parent: true,
				_count: {
					select: {
						images: true,
						videos: true,
						children: true,
					},
				},
			},
		});

		// Revalidar rutas
		await revalidateFolderPaths();

		// Transformar y devolver resultado
		const transformedFolder = transformFolder(folder);
		crudLogger.info('✅ Carpeta creada correctamente:', { id: transformedFolder.id, name: transformedFolder.name });
		return transformedFolder;
	} catch (error) {
		// Manejar errores específicos
		if (error && typeof error === 'object' && 'name' in error && error.name === 'FolderCrudError') {
			crudLogger.error(`❌ Error creando carpeta: ${(error as FolderCrudErrorData).code}`, error);
			throw error;
		}

		// Manejar otros errores y convertirlos a FolderCrudError
		const errorMessage = error instanceof Error ? error.message : String(error);
		crudLogger.error('❌ Error inesperado creando carpeta:', error);

		// Determinar código de error según el mensaje
		let errorCode = FOLDER_ERROR_CODES.UNEXPECTED_ERROR;

		if (errorMessage.includes('permission') || errorMessage.includes('permiso')) {
			errorCode = FOLDER_ERROR_CODES.PERMISSION_DENIED;
		} else if (errorMessage.includes('already exists') || errorMessage.includes('ya existe')) {
			errorCode = FOLDER_ERROR_CODES.ALREADY_EXISTS;
		} else if (errorMessage.includes('not found') || errorMessage.includes('no encontrado')) {
			errorCode = FOLDER_ERROR_CODES.PATH_INVALID;
		}

		throw createFolderCrudError(`Error al crear carpeta: ${errorMessage}`, errorCode, error);
	}
}

/**
 * Actualiza una carpeta existente
 * @param id ID de la carpeta a actualizar
 * @param data Datos a actualizar
 * @returns Datos de la carpeta actualizada
 */
export async function updateFolder(id: string, data: UpdateFolderOptions): Promise<FolderComplete> {
	try {
		crudLogger.info('📝 Actualizando carpeta:', { id, data });

		// Validar que el ID no esté vacío
		if (!id || id.trim() === '') {
			throw createFolderCrudError('El ID de la carpeta no puede estar vacío', FOLDER_ERROR_CODES.NOT_FOUND);
		}

		// Buscar la carpeta
		const folder = await prisma.folder.findUnique({
			where: { id },
		});

		if (!folder) {
			throw createFolderCrudError(`No se encontró ninguna carpeta con ID ${id}`, FOLDER_ERROR_CODES.NOT_FOUND);
		}

		// Si se actualiza la ruta, verificar que la nueva ruta sea válida
		if (data.path && data.path !== folder.path) {
			try {
				const scanResult = await scanFolder(data.path, { recursive: false });
				crudLogger.info('🔍 Nueva ruta escaneada:', {
					path: data.path,
					exists: true,
					totalFiles: scanResult.totalFiles,
				});
			} catch (error) {
				throw createFolderCrudError(
					`La nueva ruta no existe o no es accesible: ${data.path}`,
					FOLDER_ERROR_CODES.PATH_INVALID,
					error
				);
			}

			// Verificar si ya existe otra carpeta con esa ruta
			const existingFolder = await prisma.folder.findFirst({
				where: {
					path: data.path,
					id: { not: id },
				},
			});

			if (existingFolder) {
				throw createFolderCrudError(
					`Ya existe otra carpeta con la ruta ${data.path}`,
					FOLDER_ERROR_CODES.ALREADY_EXISTS
				);
			}
		}

		// Filtrar propiedades nulas o indefinidas para no sobrescribir datos existentes
		const updateData = Object.fromEntries(
			Object.entries(data).filter(([_, value]) => value !== undefined && value !== null)
		);

		// Actualizar la carpeta
		const updatedFolder = await prisma.folder.update({
			where: { id },
			data: updateData,
			include: {
				parent: true,
				_count: {
					select: {
						images: true,
						videos: true,
						children: true,
					},
				},
			},
		});

		// Revalidar rutas
		await revalidateFolderPaths();

		// Transformar y devolver resultado
		const transformedFolder = transformFolder(updatedFolder);
		crudLogger.info('✅ Carpeta actualizada correctamente:', { id: transformedFolder.id });
		return transformedFolder;
	} catch (error) {
		// Manejar errores específicos
		if (error && typeof error === 'object' && 'name' in error && error.name === 'FolderCrudError') {
			crudLogger.error(`❌ Error actualizando carpeta: ${(error as FolderCrudErrorData).code}`, error);
			throw error;
		}

		// Manejar otros errores
		const errorMessage = error instanceof Error ? error.message : String(error);
		crudLogger.error('❌ Error inesperado actualizando carpeta:', error);

		// Determinar código de error según el mensaje
		let errorCode = FOLDER_ERROR_CODES.UNEXPECTED_ERROR;

		if (errorMessage.includes('permission') || errorMessage.includes('permiso')) {
			errorCode = FOLDER_ERROR_CODES.PERMISSION_DENIED;
		} else if (errorMessage.includes('already exists') || errorMessage.includes('ya existe')) {
			errorCode = FOLDER_ERROR_CODES.ALREADY_EXISTS;
		} else if (errorMessage.includes('not found') || errorMessage.includes('no encontrado')) {
			errorCode = FOLDER_ERROR_CODES.NOT_FOUND;
		}

		throw createFolderCrudError(`Error al actualizar carpeta: ${errorMessage}`, errorCode, error);
	}
}

/**
 * Elimina una carpeta y sus relaciones
 * @param id ID de la carpeta a eliminar
 * @returns Indicador de éxito
 */
export async function deleteFolder(id: string): Promise<{ success: boolean; id: string }> {
	try {
		crudLogger.info('🗑️ Eliminando carpeta:', { id });

		// Validar que el ID no esté vacío
		if (!id || id.trim() === '') {
			throw new FolderCrudError('El ID de la carpeta no puede estar vacío', FOLDER_ERROR_CODES.NOT_FOUND);
		}

		// Verificar si la carpeta existe
		const folder = await prisma.folder.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						children: true,
					},
				},
			},
		});

		if (!folder) {
			throw new FolderCrudError(`No se encontró ninguna carpeta con ID ${id}`, FOLDER_ERROR_CODES.NOT_FOUND);
		}

		// Iniciar transacción para asegurar consistencia
		await prisma.$transaction(async (tx) => {
			// Eliminar imágenes relacionadas
			if (folder._count.images > 0) {
				crudLogger.info(`Eliminando ${folder._count.images} imágenes de la carpeta:`, { folderId: id });
				await tx.image.deleteMany({
					where: { folderId: id },
				});
			}

			// Eliminar videos relacionados
			if (folder._count.videos > 0) {
				crudLogger.info(`Eliminando ${folder._count.videos} videos de la carpeta:`, { folderId: id });
				await tx.video.deleteMany({
					where: { folderId: id },
				});
			}

			// Reasignar carpetas hijas (opcional: actualizar a null o moverlas a otra carpeta)
			if (folder._count.children > 0) {
				crudLogger.info(`Actualizando ${folder._count.children} carpetas hijas:`, { parentId: id });
				await tx.folder.updateMany({
					where: { parentId: id },
					data: { parentId: null },
				});
			}

			// Eliminar la carpeta
			await tx.folder.delete({
				where: { id },
			});
		});

		// Revalidar rutas
		await revalidateFolderPaths();

		crudLogger.info('✅ Carpeta eliminada correctamente:', { id });
		return { success: true, id };
	} catch (error) {
		// Manejar errores específicos
		if (error instanceof FolderCrudError) {
			crudLogger.error(`❌ Error eliminando carpeta: ${error.code}`, error);
			throw error;
		}

		// Manejar otros errores
		const errorMessage = error instanceof Error ? error.message : String(error);
		crudLogger.error('❌ Error inesperado eliminando carpeta:', error);

		// Determinar código de error según el mensaje
		let errorCode = FOLDER_ERROR_CODES.UNEXPECTED_ERROR;

		if (errorMessage.includes('permission') || errorMessage.includes('permiso')) {
			errorCode = FOLDER_ERROR_CODES.PERMISSION_DENIED;
		} else if (errorMessage.includes('not found') || errorMessage.includes('no encontrado')) {
			errorCode = FOLDER_ERROR_CODES.NOT_FOUND;
		} else if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
			errorCode = FOLDER_ERROR_CODES.OPERATION_IN_PROGRESS;
		}

		throw new FolderCrudError(`Error al eliminar carpeta: ${errorMessage}`, errorCode, error);
	}
}
