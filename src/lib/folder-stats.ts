import { scanFolder } from './folder-scanner';
import { prisma } from './prisma';

/**
 * 🔧 FIXED: Actualiza estadísticas usando el mismo criterio que el reindexado
 * Ahora usa scanFolder() para obtener totalFiles y totalSize reales del sistema de archivos
 * en lugar de contar solo las imágenes en la BD
 */
export async function updateFolderStats(folderId: string) {
	// Obtener la carpeta para acceder a su path
	const folder = await prisma.folder.findUnique({
		where: { id: folderId },
		select: { path: true },
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
	await prisma.folder.update({
		where: { id: folderId },
		data: {
			totalFiles: scanResult.totalFiles, // 🎯 Ahora usa el mismo criterio
			totalSize: scanResult.totalSize, // 🎯 Ahora usa el mismo criterio
			lastIndexed: new Date(),
		},
	});
}

export async function getFolderStats(folderId: string) {
	const folder = await prisma.folder.findUnique({
		where: { id: folderId },
		select: {
			totalFiles: true,
			totalSize: true,
			lastIndexed: true,
			_count: {
				select: { images: true },
			},
		},
	});

	return {
		totalFiles: folder?.totalFiles || 0,
		totalSize: folder?.totalSize || 0,
		lastIndexed: folder?.lastIndexed,
		imageCount: folder?._count.images || 0,
	};
}

export async function updateAllFolderStats() {
	const folders = await prisma.folder.findMany({
		select: { id: true },
	});

	for (const folder of folders) {
		await updateFolderStats(folder.id);
	}
}
