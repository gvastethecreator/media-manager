'use server';

/**
 * @file Acciones de estadísticas para carpetas
 * @module app/actions/folders/stats.actions
 * @description Server actions para actualizar y obtener estadísticas de carpetas
 */

import { getFolderStats, updateAllFolderStats, updateFolderStats } from '@/lib/filesystem/folder-stats';
import { serverLogger } from '@/lib/logger/server-logger';
import { revalidatePath } from '@/lib/server/revalidate';

const logger = serverLogger.withContext('FolderStatsActions');

/**
 * 📊 Actualiza las estadísticas de una carpeta específica
 * Calcula totalFiles y totalSize usando scanFolder() del sistema de archivos
 */
export async function updateFolderStatsAction(folderId: string): Promise<void> {
	logger.info(`📊 Actualizando estadísticas de carpeta: ${folderId}`);

	try {
		await updateFolderStats(folderId);

		// Revalidar rutas relacionadas
		revalidatePath('/folders');
		revalidatePath('/settings/folders');
		revalidatePath(`/folders/${folderId}`);

		logger.info(`✅ Estadísticas actualizadas para carpeta: ${folderId}`);
	} catch (error) {
		logger.error(`❌ Error actualizando estadísticas de carpeta ${folderId}:`, error);
		throw new Error(
			`No se pudieron actualizar las estadísticas de la carpeta: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * 📊 Actualiza las estadísticas de TODAS las carpetas del sistema
 * Esta operación puede ser costosa y debe usarse con cuidado
 */
export async function updateAllFolderStatsAction(): Promise<{
	success: boolean;
	message: string;
	updatedCount?: number;
}> {
	logger.info('📊 Actualizando estadísticas de todas las carpetas del sistema');

	try {
		// Contar carpetas antes de actualizar
		const { prisma } = await import('@/lib/database/prisma');
		const totalFolders = await prisma.folder.count();

		logger.info(`📊 Iniciando actualización de ${totalFolders} carpetas`);

		await updateAllFolderStats();

		// Revalidar todas las rutas relacionadas
		revalidatePath('/folders');
		revalidatePath('/settings/folders');
		revalidatePath('/');

		logger.info(`✅ Estadísticas actualizadas para ${totalFolders} carpetas`);

		return {
			success: true,
			message: `Estadísticas actualizadas exitosamente para ${totalFolders} carpetas`,
			updatedCount: totalFolders,
		};
	} catch (error) {
		logger.error('❌ Error actualizando estadísticas de todas las carpetas:', error);
		return {
			success: false,
			message: `Error actualizando estadísticas: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * 📊 Obtiene las estadísticas de una carpeta específica
 */
export async function getFolderStatsAction(folderId: string) {
	logger.info(`📊 Obteniendo estadísticas de carpeta: ${folderId}`);

	try {
		const stats = await getFolderStats(folderId);
		logger.info(`✅ Estadísticas obtenidas para carpeta: ${folderId}`);
		return stats;
	} catch (error) {
		logger.error(`❌ Error obteniendo estadísticas de carpeta ${folderId}:`, error);
		throw new Error(
			`No se pudieron obtener las estadísticas de la carpeta: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
