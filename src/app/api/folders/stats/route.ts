import { prisma } from '@/lib/prisma';
import { formatBytes } from '@/lib/utils';
import { NextResponse } from 'next/server';

// Definir interfaces para los tipos utilizados
interface FolderWithImages {
	id: string;
	name: string;
	path: string;
	lastIndexed?: Date | null;
	_count: {
		images: number;
	};
	images: Array<{
		size: number;
	}>;
}

export async function GET() {
	try {
		// Obtener todos los folders con conteo de imágenes
		const folders = (await prisma.folder.findMany({
			include: {
				images: {
					select: {
						size: true,
					},
				},
				_count: {
					select: {
						images: true,
					},
				},
			},
		})) as FolderWithImages[];

		// Calcular estadísticas totales
		const stats = {
			totalFolders: folders.length,
			totalFiles: folders.reduce((sum: number, folder: FolderWithImages) => sum + folder._count.images, 0),
			totalSize: folders.reduce((sum: number, folder: FolderWithImages) => {
				const folderSize = folder.images.reduce((total: number, img: { size: number }) => total + (img.size || 0), 0);
				return sum + folderSize;
			}, 0),
			lastIndexed: folders
				.filter((f: FolderWithImages) => f.lastIndexed)
				.reduce(
					(latest: Date | null, folder: FolderWithImages) => {
						if (!latest || (folder.lastIndexed && folder.lastIndexed > latest)) {
							return folder.lastIndexed;
						}
						return latest;
					},
					null as Date | null
				),
		};

		return NextResponse.json(stats);
	} catch (error) {
		console.error('Error en GET /api/folders/stats:', error);
		return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
	}
}
