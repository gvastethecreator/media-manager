'use server';

import { revalidatePath } from 'next/cache';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import { mapCreateWildcardDataToPrisma, mapUpdateWildcardDataToPrisma } from '@/transformers/wildcard';
import type { CreateWildcardData, UpdateWildcardData } from '@/types/entities/wildcard';
import type { FileItem } from '@/types/file-item';

// Utilidades y logging
const wildcardLogger = serverLogger.withContext('WildcardActions');

const REVALIDATE_PATHS = ['/settings', '/wildcards', '/wildcards/[id]'] as const;

// Función para revalidar todas las rutas necesarias
const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	wildcardLogger.info('🔄 Rutas revalidadas');
};

// Notificar cambios en wildcards
const notifyWildcardChange = async (action: 'create' | 'update' | 'delete', wildcard: { id: string }) => {
	await emit({
		type: 'wildcards:modified',
		data: { action, wildcard },
	});
	statsEventEmitter.emit(STATS_EVENTS.WILDCARD_CHANGE);
};

// Código de errores para operaciones con wildcards
enum WildcardErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
	CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',
}

// Creador de errores para wildcards
const createWildcardError = (
	message: string,
	code: WildcardErrorCode = WildcardErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	return Object.assign(new Error(message), { code, cause });
};

// Interfaces
export interface WildcardFormInput {
	name: string;
	description?: string | null;
	emoji?: string;
	color?: string;
	category?: string | null;
	shortcut?: string | null;
	isFavorite?: boolean;
	children?: string[];
	parentId?: string | null;
}

export interface WildcardWithStats {
	id: string;
	name: string;
	description: string | null;
	emoji: string;
	color: string;
	category: string | null;
	shortcut: string | null;
	isFavorite: boolean;
	children: string;
	parentId: string | null;
	createdAt: Date;
	updatedAt: Date;
	_count: {
		images: number;
		videos: number;
		childWildcards: number;
	};
	totalEntities: number;
	lastUpdated: Date;
}

// Función auxiliar para verificar referencias circulares
async function checkCircularReference(wildcardId: string, newParentId: string): Promise<boolean> {
	// Verificar si estamos intentando asignar el wildcard como su propio padre
	if (wildcardId === newParentId) {
		return true;
	}

	// Obtener cadena de padres para verificar circularidad
	let currentParentId = newParentId;
	const visitedParents = new Set<string>();

	while (currentParentId) {
		// Evitar ciclos infinitos
		if (visitedParents.has(currentParentId)) {
			return true;
		}
		visitedParents.add(currentParentId);

		const parent = await prisma.wildcard.findUnique({
			where: { id: currentParentId },
			select: { parentId: true },
		});

		if (!parent || !parent.parentId) {
			break;
		}

		// Si encontramos el ID original en la cadena de padres, es una referencia circular
		if (parent.parentId === wildcardId) {
			return true;
		}

		currentParentId = parent.parentId;
	}

	return false;
}

// Acciones del servidor
export async function getWildcards(): Promise<WildcardWithStats[]> {
	try {
		wildcardLogger.info('🔍 Obteniendo wildcards con estadísticas');

		const wildcards = await prisma.wildcard.findMany({
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						childWildcards: true,
					},
				},
			},
			orderBy: {
				name: 'asc',
			},
		});

		const wildcardsWithStats = wildcards.map((wildcard) => {
			const totalEntities =
				(wildcard._count.images || 0) + (wildcard._count.videos || 0) + (wildcard._count.childWildcards || 0);

			return {
				...wildcard,
				totalEntities,
				lastUpdated: wildcard.updatedAt,
			};
		});

		wildcardLogger.info('✅ Wildcards obtenidos:', wildcards.length);
		return wildcardsWithStats;
	} catch (error) {
		wildcardLogger.error('❌ Error al obtener wildcards:', error);
		throw createWildcardError('No se pudieron obtener los wildcards', WildcardErrorCode.OPERATION_FAILED, error);
	}
}

export async function getWildcard(id: string): Promise<WildcardWithStats | null> {
	try {
		wildcardLogger.info('🔍 Obteniendo wildcard:', id);

		const wildcard = await prisma.wildcard.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						childWildcards: true,
					},
				},
			},
		});

		if (!wildcard) {
			throw createWildcardError(`Wildcard con id ${id} no encontrado`, WildcardErrorCode.NOT_FOUND);
		}

		wildcardLogger.info('✅ Wildcard obtenido:', wildcard.name);
		return {
			...wildcard,
			totalEntities:
				(wildcard._count.images || 0) + (wildcard._count.videos || 0) + (wildcard._count.childWildcards || 0),
			lastUpdated: wildcard.updatedAt,
		};
	} catch (error) {
		wildcardLogger.error('❌ Error al obtener wildcard:', error);
		if ((error as any).code === WildcardErrorCode.NOT_FOUND) {
			throw error;
		}
		throw createWildcardError(`No se pudo obtener el wildcard con id ${id}`, WildcardErrorCode.OPERATION_FAILED, error);
	}
}

export async function createWildcard(data: CreateWildcardData): Promise<WildcardWithStats> {
	try {
		wildcardLogger.info('📝 Creando nuevo wildcard:', data.name);

		// Validar nombre único
		if (!data.name) {
			throw createWildcardError('El nombre del wildcard es obligatorio', WildcardErrorCode.VALIDATION_ERROR);
		}

		const existingWildcard = await prisma.wildcard.findUnique({
			where: { name: data.name },
		});

		if (existingWildcard) {
			throw createWildcardError(
				`Ya existe un wildcard con el nombre "${data.name}"`,
				WildcardErrorCode.VALIDATION_ERROR
			);
		}

		// Validar que no se cree un ciclo en la jerarquía si se proporciona un padre
		if (data.parentId) {
			// Verificar que el padre existe
			const parent = await prisma.wildcard.findUnique({
				where: { id: data.parentId },
			});

			if (!parent) {
				throw createWildcardError(`No se encontró el padre con id ${data.parentId}`, WildcardErrorCode.NOT_FOUND);
			}
		}

		// Crear objeto compatible con Prisma
		const prismaData = mapCreateWildcardDataToPrisma(data);

		// Crear el wildcard
		const createdWildcard = await prisma.wildcard.create({
			data: prismaData,
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						childWildcards: true,
					},
				},
			},
		});

		// Notificar cambio
		await notifyWildcardChange('create', { id: createdWildcard.id });

		// Revalidar rutas
		await revalidateAllPaths();

		wildcardLogger.info('✅ Wildcard creado:', createdWildcard.name);
		return {
			...createdWildcard,
			totalEntities: 0, // Nuevo, no tiene entidades
			lastUpdated: createdWildcard.createdAt,
		};
	} catch (error) {
		wildcardLogger.error('❌ Error al crear wildcard:', error);
		throw error;
	}
}

export async function updateWildcard(id: string, data: UpdateWildcardData): Promise<WildcardWithStats> {
	try {
		wildcardLogger.info('🔄 Actualizando wildcard:', id);

		// Verificar que el wildcard existe
		const existingWildcard = await prisma.wildcard.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						childWildcards: true,
					},
				},
			},
		});

		if (!existingWildcard) {
			throw createWildcardError(`Wildcard con id ${id} no encontrado`, WildcardErrorCode.NOT_FOUND);
		}

		// Validar nombre único si se está cambiando
		if (data.name && data.name !== existingWildcard.name) {
			const wildcardWithSameName = await prisma.wildcard.findUnique({
				where: { name: data.name },
			});

			if (wildcardWithSameName && wildcardWithSameName.id !== id) {
				throw createWildcardError(
					`Ya existe un wildcard con el nombre "${data.name}"`,
					WildcardErrorCode.VALIDATION_ERROR
				);
			}
		}

		// Validar que no se cree un ciclo en la jerarquía
		if (data.parentId && data.parentId !== existingWildcard.parentId) {
			const hasCircularReference = await checkCircularReference(id, data.parentId);
			if (hasCircularReference) {
				throw createWildcardError(
					'No se puede asignar este padre porque crearía una referencia circular',
					WildcardErrorCode.CIRCULAR_REFERENCE
				);
			}
		}

		// Crear objeto compatible con Prisma
		const prismaData = mapUpdateWildcardDataToPrisma(data);

		// Actualizar el wildcard
		const updatedWildcard = await prisma.wildcard.update({
			where: { id },
			data: prismaData,
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						childWildcards: true,
					},
				},
			},
		});

		// Notificar cambio
		await notifyWildcardChange('update', { id });

		// Revalidar rutas
		await revalidateAllPaths();

		wildcardLogger.info('✅ Wildcard actualizado:', updatedWildcard.name);

		return {
			...updatedWildcard,
			totalEntities:
				(updatedWildcard._count.images || 0) +
				(updatedWildcard._count.videos || 0) +
				(updatedWildcard._count.childWildcards || 0),
			lastUpdated: updatedWildcard.updatedAt,
		};
	} catch (error) {
		wildcardLogger.error('❌ Error al actualizar wildcard:', error);
		if (
			(error as any).code === WildcardErrorCode.NOT_FOUND ||
			(error as any).code === WildcardErrorCode.CIRCULAR_REFERENCE
		) {
			throw error;
		}
		throw createWildcardError(
			`No se pudo actualizar el wildcard con id ${id}`,
			WildcardErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function deleteWildcard(id: string): Promise<void> {
	try {
		wildcardLogger.info('🗑️ Eliminando wildcard:', id);

		// Verificar que el wildcard exista
		const existingWildcard = await prisma.wildcard.findUnique({
			where: { id },
			include: {
				childWildcards: true,
			},
		});

		if (!existingWildcard) {
			throw createWildcardError(`Wildcard con id ${id} no encontrado`, WildcardErrorCode.NOT_FOUND);
		}

		// Si tiene hijos, actualizar sus parentId a null
		if (existingWildcard.childWildcards.length > 0) {
			await prisma.wildcard.updateMany({
				where: {
					parentId: id,
				},
				data: {
					parentId: null,
				},
			});
		}

		// Eliminar el wildcard
		await prisma.wildcard.delete({
			where: { id },
		});

		// Notificar cambio
		await notifyWildcardChange('delete', { id });

		// Revalidar rutas
		await revalidateAllPaths();

		wildcardLogger.info('✅ Wildcard eliminado:', id);
	} catch (error) {
		wildcardLogger.error('❌ Error al eliminar wildcard:', error);
		if ((error as any).code === WildcardErrorCode.NOT_FOUND) {
			throw error;
		}
		throw createWildcardError(
			`No se pudo eliminar el wildcard con id ${id}`,
			WildcardErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function getWildcardImages(id: string): Promise<FileItem[]> {
	try {
		wildcardLogger.info('🔍 Obteniendo imágenes del wildcard:', id);

		// Verificar que el wildcard existe
		const wildcard = await prisma.wildcard.findUnique({
			where: { id },
			include: {
				images: {
					orderBy: {
						createdAt: 'desc',
					},
				},
			},
		});

		if (!wildcard) {
			throw createWildcardError(`Wildcard con id ${id} no encontrado`, WildcardErrorCode.NOT_FOUND);
		}

		// Convertir imágenes al formato necesario
		const fileItems = await Promise.all(wildcard.images.map((image) => convertServerImageToFileItem(image)));

		wildcardLogger.info('✅ Imágenes obtenidas:', fileItems.length);
		return fileItems;
	} catch (error) {
		wildcardLogger.error('❌ Error al obtener imágenes del wildcard:', error);
		if ((error as any).code === WildcardErrorCode.NOT_FOUND) {
			throw error;
		}
		throw createWildcardError(
			`No se pudieron obtener las imágenes del wildcard con id ${id}`,
			WildcardErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function addImageToWildcard(wildcardId: string, imageId: string): Promise<void> {
	try {
		wildcardLogger.info('➕ Añadiendo imagen al wildcard:', { wildcardId, imageId });

		// Verificar que el wildcard y la imagen existen
		const [wildcard, image] = await Promise.all([
			prisma.wildcard.findUnique({ where: { id: wildcardId } }),
			prisma.image.findUnique({ where: { id: imageId } }),
		]);

		if (!wildcard) {
			throw createWildcardError(`Wildcard con id ${wildcardId} no encontrado`, WildcardErrorCode.NOT_FOUND);
		}

		if (!image) {
			throw createWildcardError(`Imagen con id ${imageId} no encontrada`, WildcardErrorCode.NOT_FOUND);
		}

		// Verificar si la imagen ya está asociada al wildcard
		const existingRelation = await prisma.image.findFirst({
			where: {
				id: imageId,
				wildcards: {
					some: {
						id: wildcardId,
					},
				},
			},
		});

		if (existingRelation) {
			wildcardLogger.info('⚠️ La imagen ya está asociada al wildcard');
			return;
		}

		// Añadir la imagen al wildcard
		await prisma.wildcard.update({
			where: { id: wildcardId },
			data: {
				images: {
					connect: {
						id: imageId,
					},
				},
			},
		});

		// Notificar cambio
		await notifyWildcardChange('update', { id: wildcardId });

		// Revalidar rutas
		await revalidateAllPaths();

		wildcardLogger.info('✅ Imagen añadida al wildcard');
	} catch (error) {
		wildcardLogger.error('❌ Error al añadir imagen al wildcard:', error);
		if ((error as any).code === WildcardErrorCode.NOT_FOUND) {
			throw error;
		}
		throw createWildcardError(
			`No se pudo añadir la imagen ${imageId} al wildcard ${wildcardId}`,
			WildcardErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function removeImageFromWildcard(wildcardId: string, imageId: string): Promise<void> {
	try {
		wildcardLogger.info('➖ Quitando imagen del wildcard:', { wildcardId, imageId });

		// Verificar que el wildcard y la imagen existen
		const [wildcard, image] = await Promise.all([
			prisma.wildcard.findUnique({ where: { id: wildcardId } }),
			prisma.image.findUnique({ where: { id: imageId } }),
		]);

		if (!wildcard) {
			throw createWildcardError(`Wildcard con id ${wildcardId} no encontrado`, WildcardErrorCode.NOT_FOUND);
		}

		if (!image) {
			throw createWildcardError(`Imagen con id ${imageId} no encontrada`, WildcardErrorCode.NOT_FOUND);
		}

		// Desconectar la imagen del wildcard
		await prisma.wildcard.update({
			where: { id: wildcardId },
			data: {
				images: {
					disconnect: {
						id: imageId,
					},
				},
			},
		});

		// Notificar cambio
		await notifyWildcardChange('update', { id: wildcardId });

		// Revalidar rutas
		await revalidateAllPaths();

		wildcardLogger.info('✅ Imagen quitada del wildcard');
	} catch (error) {
		wildcardLogger.error('❌ Error al quitar imagen del wildcard:', error);
		if ((error as any).code === WildcardErrorCode.NOT_FOUND) {
			throw error;
		}
		throw createWildcardError(
			`No se pudo quitar la imagen ${imageId} del wildcard ${wildcardId}`,
			WildcardErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Obtiene comodines raíz (sin padre) para la selección en formularios
 */
export async function getRootWildcards() {
	try {
		return await prisma.wildcard.findMany({
			where: {
				parentId: null,
			},
			orderBy: {
				name: 'asc',
			},
		});
	} catch (error) {
		wildcardLogger.error('❌ Error al obtener comodines raíz:', error);
		throw new Error('No se pudieron obtener los comodines raíz');
	}
}

/**
 * Función auxiliar para validar que no se cree un ciclo en la jerarquía
 */
async function _validateParentHierarchy(wildcardId: string | null, parentId: string) {
	// No se puede asignar un comodín como su propio padre
	if (wildcardId === parentId) {
		throw new Error('Un comodín no puede ser su propio padre');
	}

	// Verificar que no se cree un ciclo en la jerarquía
	let currentParent = parentId;
	while (currentParent) {
		const parent = await prisma.wildcard.findUnique({
			where: { id: currentParent },
			select: { id: true, parentId: true },
		});

		if (!parent) break;

		// Si encontramos el ID del comodín actual, hay un ciclo
		if (parent.parentId === wildcardId) {
			throw new Error('No se puede crear un ciclo en la jerarquía de comodines');
		}

		currentParent = parent.parentId || '';
	}
}
