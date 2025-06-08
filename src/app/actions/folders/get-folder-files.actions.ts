'use server';

import path from 'path';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

const filesActionsLogger = serverLogger.withContext('FolderFilesActions');

export async function getFolderFiles(folderId: string) {
	try {
		filesActionsLogger.info('⚡ Server Action: getFolderFiles', { folderId });

		const folder = await prisma.folder.findUnique({
			where: { id: folderId },
			include: {
				images: {
					orderBy: {
						name: 'asc',
					},
				},
			},
		});

		if (!folder) {
			filesActionsLogger.error('❌ Carpeta no encontrada:', { folderId });
			// Devolver un objeto con un mensaje de error y un estado adecuado
			return { error: 'Carpeta no encontrada', status: 404, items: [], folder: null };
		}

		filesActionsLogger.info('✅ Carpeta encontrada:', {
			id: folder.id,
			name: folder.name,
			imageCount: folder.images.length,
		});

		const files = folder.images.map((image) => {
			const metadata = image.metadata ? JSON.parse(image.metadata) : null;
			const mimeType = metadata?.mimeType || `image/${path.extname(image.path).slice(1)}`;

			return {
				id: image.id,
				name: image.name,
				path: image.path,
				size: image.size,
				type: 'image',
				mimeType,
				lastModified: image.updatedAt,
				isDirectory: false,
				metadata,
				thumbnailUrl: `/api/thumbnails/${image.id}?quality=medium`,
				previewUrl: image.path ? `/local-files/${image.path.split(path.sep).join('/')}` : null,
				downloadUrl: `/api/images/${image.id}/download`,
			};
		});

		return {
			items: files,
			folder: {
				id: folder.id,
				name: folder.name,
				path: folder.path,
				totalFiles: folder.totalFiles,
				totalSize: folder.totalSize,
			},
			status: 200, // Indicar éxito
		};
	} catch (error) {
		filesActionsLogger.error('❌ Error obteniendo archivos de carpeta:', error);
		return {
			error: `Error interno del servidor: ${error instanceof Error ? error.message : String(error)}`,
			status: 500,
			items: [],
			folder: null,
		};
	}
}
