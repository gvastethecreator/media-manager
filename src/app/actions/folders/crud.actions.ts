'use server';

/**
 * @file Acciones CRUD para carpetas
 * @module app/actions/folders/crud.actions
 */

import { invalidateAllFolderCache } from '@/lib/folder-cache';
import { scanFolder } from '@/lib/folder-scanner';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { transformFolder } from '@/transformers/folder';
import { type FolderComplete } from '@/types/entities/folder';
import { revalidatePath } from 'next/cache';
import { CreateFolderOptions, FOLDER_ERROR_CODES, UpdateFolderOptions, createFolderError } from './folder-types';

// Logger para acciones CRUD
const crudLogger = serverLogger.withContext('FolderCrudActions');

// Rutas a revalidar después de operaciones CRUD
const REVALIDATE_PATHS = ['/folders', '/dashboard', '/images', '/api/folders'];

/**
 * Revalida todas las rutas relevantes
 */
async function revalidateFolderPaths() {
	crudLogger.info('🔄 Revalidando rutas de carpetas');
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	// Invalidar cache también
	invalidateAllFolderCache();
	crudLogger.info('✅ Rutas revalidadas y cache invalidado');
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
			throw createFolderError('La ruta de la carpeta no puede estar vacía', FOLDER_ERROR_CODES.PATH_INVALID);
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
			throw createFolderError(
				`La carpeta no existe o no es accesible: ${path}`,
				FOLDER_ERROR_CODES.PATH_INVALID,
				error instanceof Error ? error.stack : undefined,
				undefined,
				error
			);
		}

		// Verificar si la carpeta ya existe en la base de datos
		const existingFolder = await prisma.folder.findFirst({
			where: { path },
		});

		if (existingFolder) {
			throw createFolderError(`Ya existe una carpeta con la ruta ${path}`, FOLDER_ERROR_CODES.ALREADY_EXISTS);
		}

		// Extraer nombre de la carpeta de la ruta
		const folderName = options.name || path.split('/').pop() || path.split('\\').pop() || 'Nueva carpeta';

		// Crear la carpeta en la base de datos
		const folder = await prisma.folder.create({
			data: {
				name: folderName,
				path,
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
		crudLogger.info('✅ Carpeta creada correctamente:', {
			id: transformedFolder.id,
			name: transformedFolder.name,
		});
		return transformedFolder;
	} catch (error) {
		crudLogger.error('❌ Error creando carpeta:', error);

		// Si ya es un error de carpeta, simplemente relanzarlo
		if (error && typeof error === 'object' && 'code' in error &&
		    typeof error.code === 'string' && error.code.startsWith('FOLDER_')) {
			throw error;
		}

		// Determinar código de error según el mensaje
		let errorCode = FOLDER_ERROR_CODES.UNEXPECTED_ERROR;
		const errorMessage = error instanceof Error ? error.message : String(error);

		if (errorMessage.includes('permission') || errorMessage.includes('permiso')) {
			errorCode = FOLDER_ERROR_CODES.PERMISSION_DENIED;
		} else if (errorMessage.includes('already exists') || errorMessage.includes('ya existe')) {
			errorCode = FOLDER_ERROR_CODES.ALREADY_EXISTS;
		} else if (errorMessage.includes('not found') || errorMessage.includes('no encontrado')) {
			errorCode = FOLDER_ERROR_CODES.PATH_INVALID;
		}

		throw createFolderError(
			`Error al crear carpeta: ${errorMessage}`,
			errorCode,
			error instanceof Error ? error.stack : undefined,
			undefined,
			error
		);
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
			throw createFolderError('El ID de la carpeta no puede estar vacío', FOLDER_ERROR_CODES.NOT_FOUND);
		}

		// Buscar la carpeta
		const folder = await prisma.folder.findUnique({
			where: { id },
		});

		if (!folder) {
			throw createFolderError(`No se encontró ninguna carpeta con ID ${id}`, FOLDER_ERROR_CODES.NOT_FOUND);
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
				throw createFolderError(
					`La nueva ruta no existe o no es accesible: ${data.path}`,
					FOLDER_ERROR_CODES.PATH_INVALID,
					error instanceof Error ? error.stack : undefined,
					undefined,
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
				throw createFolderError(
					`Ya existe otra carpeta con la ruta ${data.path}`,
					FOLDER_ERROR_CODES.ALREADY_EXISTS
				);
			}
		}

		// Actualizar la carpeta
		const updatedFolder = await prisma.folder.update({
			where: { id },
			data: {
				name: data.name,
				path: data.path,
				description: data.description,
				emoji: data.emoji,
				color: data.color,
				autoReindex: data.autoReindex,
				parentId: data.parentId,
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
		const transformedFolder = transformFolder(updatedFolder);
		crudLogger.info('✅ Carpeta actualizada correctamente:', {
			id: transformedFolder.id,
			name: transformedFolder.name,
		});
		return transformedFolder;
	} catch (error) {
		crudLogger.error('❌ Error actualizando carpeta:', error);

		// Si ya es un error de carpeta, simplemente relanzarlo
		if (error && typeof error === 'object' && 'code' in error &&
		    typeof error.code === 'string' && error.code.startsWith('FOLDER_')) {
			throw error;
		}

		throw createFolderError(
			'Error al actualizar carpeta',
			FOLDER_ERROR_CODES.UNEXPECTED_ERROR,
			error instanceof Error ? error.stack : undefined,
			undefined,
			error
		);
	}
}

/**
 * Elimina una carpeta y todo su contenido
 * @param id ID de la carpeta a eliminar
 * @returns Confirmación de eliminación
 */
export async function deleteFolder(id: string): Promise<{ success: boolean; id: string }> {
	try {
		crudLogger.info('🗑️ Eliminando carpeta:', id);

		// Validar que el ID no esté vacío
		if (!id || id.trim() === '') {
			throw createFolderError('El ID de la carpeta no puede estar vacío', FOLDER_ERROR_CODES.NOT_FOUND);
		}

		// Buscar la carpeta
		const folder = await prisma.folder.findUnique({
			where: { id },
		});

		if (!folder) {
			throw createFolderError(`No se encontró ninguna carpeta con ID ${id}`, FOLDER_ERROR_CODES.NOT_FOUND);
		}

		// Eliminar la carpeta (Prisma se encargará de las relaciones con cascada)
		await prisma.folder.delete({
			where: { id },
		});

		// Revalidar rutas
		await revalidateFolderPaths();

		crudLogger.info('✅ Carpeta eliminada correctamente:', {
			id,
			name: folder.name,
		});
		return { success: true, id };
	} catch (error) {
		crudLogger.error('❌ Error eliminando carpeta:', error);

		// Si ya es un error de carpeta, simplemente relanzarlo
		if (error && typeof error === 'object' && 'code' in error &&
		    typeof error.code === 'string' && error.code.startsWith('FOLDER_')) {
			throw error;
		}

		throw createFolderError(
			'Error al eliminar carpeta',
			FOLDER_ERROR_CODES.UNEXPECTED_ERROR,
			error instanceof Error ? error.stack : undefined,
			undefined,
			error
		);
	}
}

/**
 * Actualiza la configuración de reindexación automática de una carpeta
 * @param id ID de la carpeta
 * @param autoReindex Nuevo valor para autoReindex
 * @returns Datos de la carpeta actualizada
 */
export async function updateFolderAutoReindex(id: string, autoReindex: boolean): Promise<FolderComplete> {
	try {
		crudLogger.info('🔄 Actualizando autoReindex de carpeta:', { id, autoReindex });

		// Validar que el ID no esté vacío
		if (!id || id.trim() === '') {
			throw createFolderError('El ID de la carpeta no puede estar vacío', FOLDER_ERROR_CODES.NOT_FOUND);
		}

		// Buscar la carpeta
		const folder = await prisma.folder.findUnique({
			where: { id },
		});

		if (!folder) {
			throw createFolderError(`No se encontró ninguna carpeta con ID ${id}`, FOLDER_ERROR_CODES.NOT_FOUND);
		}

		// Actualizar la carpeta
		const updatedFolder = await prisma.folder.update({
			where: { id },
			data: {
				autoReindex,
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
		const transformedFolder = transformFolder(updatedFolder);
		crudLogger.info('✅ AutoReindex actualizado correctamente:', {
			id: transformedFolder.id,
			name: transformedFolder.name,
			autoReindex,
		});
		return transformedFolder;
	} catch (error) {
		crudLogger.error('❌ Error actualizando autoReindex:', error);

		// Si ya es un error de carpeta, simplemente relanzarlo
		if (error && typeof error === 'object' && 'code' in error &&
		    typeof error.code === 'string' && error.code.startsWith('FOLDER_')) {
			throw error;
		}

		throw createFolderError(
			'Error al actualizar autoReindex',
			FOLDER_ERROR_CODES.UNEXPECTED_ERROR,
			error instanceof Error ? error.stack : undefined,
			undefined,
			error
		);
	}
}
