import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { folders } from '@/lib/drizzle/schema/index';
import { scanFolder } from './folder-scanner';

/**
 * 🔧 FIXED: Actualiza estadísticas usando el mismo criterio que el reindexado
 * Ahora usa scanFolder() para obtener totalFiles y totalSize reales del sistema de archivos
 * en lugar de contar solo las imágenes en la BD
 */
export async function updateFolderStats(folderId: string) {
	// Obtener la carpeta para acceder a su path
	const folder = await db.query.folders.findFirst({
		where: eq(folders.id, folderId),
		columns: { path: true },
	});

	if (!folder) {
		throw new Error(`Carpeta con ID ${folderId} no encontrada`);
	}

	// 📊 USAR EL MISMO CRITERIO QUE EL REINDEXADO: scanFolder()
	// Esto asegura consistencia entre reindexado y actualización de estadísticas
	const scanResult = await scanFolder(folder.path, {
		recursive: true,
		includeHidden: false,
	});

	// Actualizar con los mismos valores que usa el reindexado
	await db
		.update(folders)
		.set({
			totalFiles: scanResult.totalFiles, // 🎯 Ahora usa el mismo criterio
			totalSize: scanResult.totalSize, // 🎯 Ahora usa el mismo criterio
			lastIndexed: new Date(),
		})
		.where(eq(folders.id, folderId));
}

export async function getFolderStats(folderId: string) {
	const folder = await db.query.folders.findFirst({
		where: eq(folders.id, folderId),
		with: {
			images: { columns: { id: true } },
		},
		columns: {
			totalFiles: true,
			totalSize: true,
			lastIndexed: true,
		},
	});

	return {
		totalFiles: folder?.totalFiles || 0,
		totalSize: folder?.totalSize || 0,
		lastIndexed: folder?.lastIndexed,
		imageCount: folder?.images.length || 0,
	};
}

export async function updateAllFolderStats() {
	const foldersData = await db.query.folders.findMany({
		columns: { id: true },
	});

	for (const folder of foldersData) {
		await updateFolderStats(folder.id);
	}
}
