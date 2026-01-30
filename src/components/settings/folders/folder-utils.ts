import { clientLogger } from '@/lib/logger/client-logger';
import type { IndexStatus } from './folder-card-index-status-badge';
import type { ExtendedFolder } from './folder-types';

const folderLogger = clientLogger.withContext('FolderUtils');

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
			// Solo log en casos de error real, no en cada render
			return 'not_found';
		}

		// Para otros tipos de errores
		return 'error';
	}

	// Si no tiene lastIndexed, nunca se ha indexado
	if (!folder.lastIndexed) {
		// Reducir logs - solo hacer log una vez o en casos específicos
		return 'pending';
	}

	const now = new Date();
	const lastIndexed = new Date(folder.lastIndexed);
	const diffHours = Math.abs(now.getTime() - lastIndexed.getTime()) / 36e5;

	// Si se indexó hace más de 24 horas
	if (diffHours > 24) {
		return 'outdated';
	}

	// Si fue indexada recientemente (menos de 24 horas)
	return 'indexed';
}
