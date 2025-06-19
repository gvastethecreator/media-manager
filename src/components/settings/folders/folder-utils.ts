import { serverLogger } from '@/lib/logger/server-logger';
import { IndexStatus } from './folder-index-status-badge';
import type { ExtendedFolder } from './folder-types';

const folderLogger = serverLogger.withContext('FolderUtils');

export function getFolderIndexStatus(folder: ExtendedFolder): IndexStatus {
	// Verificar si hay un error en la carpeta
	if (folder.error) {
		// Verificar si el error está relacionado con no encontrar la carpeta
		if (
			folder.error.includes('no está disponible en el sistema') ||
			folder.error.includes('PATH_NOT_FOUND') ||
			folder.error.includes('no encontrada') ||
			folder.error.toLowerCase().includes('not found')
		) {
			folderLogger.debug('Carpeta no encontrada:', {
				folderId: folder.id,
				error: folder.error,
			});
			return 'not_found';
		}

		// Para otros tipos de errores
		folderLogger.debug('Carpeta con error:', {
			folderId: folder.id,
			error: folder.error,
		});
		return 'error';
	}

	// Si no tiene lastIndexed, nunca se ha indexado
	if (!folder.lastIndexed) {
		folderLogger.debug('Carpeta nunca indexada:', {
			folderId: folder.id,
		});
		return 'pending';
	}

	const now = new Date();
	const lastIndexed = new Date(folder.lastIndexed);
	const diffHours = Math.abs(now.getTime() - lastIndexed.getTime()) / 36e5;

	// Si se indexó hace más de 24 horas
	if (diffHours > 24) {
		folderLogger.debug('Carpeta con indexación desactualizada:', {
			folderId: folder.id,
			diffHours,
		});
		return 'outdated';
	}

	// Si fue indexada recientemente (menos de 24 horas)
	folderLogger.debug('Carpeta con indexación actualizada:', {
		folderId: folder.id,
		diffHours,
	});
	return 'indexed';
}
