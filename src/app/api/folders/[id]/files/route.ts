import path from 'node:path';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { type NextRequest, NextResponse } from 'next/server';

const filesLogger = logger.withContext('FilesAPI');

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
	try {
		const { id } = context.params;
		filesLogger.info('🔍 Buscando carpeta:', { id });

		const folder = await prisma.folder.findUnique({
			where: { id },
			include: {
				images: {
					orderBy: {
						name: 'asc',
					},
				},
			},
		});

		if (!folder) {
			filesLogger.error('❌ Carpeta no encontrada:', { id });
			return new NextResponse('Carpeta no encontrada', { status: 404 });
		}

		filesLogger.info('✅ Carpeta encontrada:', {
			id: folder.id,
			name: folder.name,
			imageCount: folder.images.length,
		});

		// Convertir las imágenes al formato esperado por VirtualizedView
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

		return NextResponse.json({
			items: files,
			folder: {
				id: folder.id,
				name: folder.name,
				path: folder.path,
				totalFiles: folder.totalFiles,
				totalSize: folder.totalSize,
			},
		});
	} catch (error) {
		filesLogger.error('Error obteniendo archivos:', error);
		return new NextResponse('Error interno del servidor', { status: 500 });
	}
}
