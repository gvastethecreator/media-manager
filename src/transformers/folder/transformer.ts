/**
 * @file Transformador principal para la entidad Folder
 * @module transformers/folder/transformer
 * @description Contiene la lógica para convertir un objeto Folder de Prisma a nuestro tipo canónico.
 */

import type { Prisma } from '@prisma/client';
import { serverLogger } from '@/lib/logger/server-logger';
import type { FolderComplete, FolderExtended, FolderExtendedComplete } from '@/types/entities/folder';
import { TransformerError } from '@/utils/transformers/errors';

// Define el tipo de payload de Prisma que esperamos, con todas las relaciones y conteos.
type FolderFromPrisma = Prisma.FolderGetPayload<{
	include: {
		parent: true;
		children: true;
		images: true;
		_count: {
			select: {
				children: true;
				images: true;
			};
		};
	};
}>;

/**
 * 🔄 Transforma un objeto Folder de Prisma a nuestro tipo canónico FolderComplete.
 *
 * @param prismaFolder - El objeto Folder obtenido de Prisma, que debe incluir relaciones y conteos.
 * @returns Un objeto FolderComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaFolder(prismaFolder: FolderFromPrisma | null): FolderComplete {
	if (!prismaFolder) {
		throw new TransformerError('El objeto de carpeta de Prisma no puede ser nulo.');
	}

	try {
		// El objeto de Prisma ya debería tener la forma correcta.
		// Esta función principalmente asegura la consistencia del tipo
		// y maneja cualquier transformación menor o valor por defecto necesario.
		const { _count, ...baseData } = prismaFolder;

		return {
			...baseData,
			// Asegurarse de que las relaciones opcionales no sean undefined
			parent: baseData.parent ?? null,
			children: baseData.children ?? [],
			images: baseData.images ?? [],
			// Asignar el conteo de forma segura
			_count: {
				children: _count?.children ?? 0,
				images: _count?.images ?? 0,
			},
		};
	} catch (error) {
		serverLogger.error('Error transformando carpeta desde Prisma', {
			error,
			folderId: prismaFolder.id,
		});
		throw new TransformerError(`Error al transformar la carpeta: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de carpetas de Prisma a una lista de FolderComplete.
 *
 * @param prismaFolders - Un array de objetos Folder de Prisma.
 * @returns Un array de objetos FolderComplete.
 */
export function fromPrismaFolders(prismaFolders: FolderFromPrisma[]): FolderComplete[] {
	return prismaFolders.map(fromPrismaFolder);
}

export function transformFolderToExtended(folder: FolderComplete, level = 0): FolderExtended {
	const extendedFolder: FolderExtended = {
		...folder,
		isSelected: false,
		isOpen: false,
		isLoading: false,
		hasError: false,
		isDragging: false,
		isDropTarget: false,
		level,
	};

	if (folder.children && folder.children.length > 0) {
		// Aquí asumimos que los hijos ya son `FolderComplete`.
		// Si necesitamos que los hijos también sean `FolderExtended`, se requiere un mapeo recursivo.
		(extendedFolder as FolderExtendedComplete).children = folder.children.map(
			(child) => transformFolderToExtended(child as FolderComplete, level + 1) as FolderExtendedComplete
		);
	}

	return extendedFolder;
}
