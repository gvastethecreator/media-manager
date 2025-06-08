'use server';

import path from 'path';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type {
	RelatedAlbum,
	RelatedCharacter,
	RelatedCollection,
	RelatedPlace,
	RelatedTag,
	RelatedWorldItem,
} from '@/types/file-item';

const imagesActionsLogger = serverLogger.withContext('FolderImagesActions');

// Definir una interfaz que se adapte a lo que realmente estamos devolviendo
interface ApiResponseFileItem {
	id: string;
	name: string;
	path: string;
	type: 'image';
	size: number;
	width: number;
	height: number;
	metadata: string;
	thumbnail: string | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	isPublic: boolean;
	isFavorite: boolean;
	folderId: string;
	createdAt: Date;
	updatedAt: Date;
	modifiedAt: Date;
	accessedAt: Date;
	collections: RelatedCollection[];
	tags: RelatedTag[];
	albums: RelatedAlbum[];
	characters: RelatedCharacter[];
	places: RelatedPlace[];
	objects: RelatedWorldItem[];
}

export async function getFolderImages(folderId: string) {
	try {
		imagesActionsLogger.info('⚡ Server Action: getFolderImages', { folderId });

		const folder = await prisma.folder.findUnique({
			where: { id: folderId },
			include: {
				images: {
					orderBy: {
						name: 'asc',
					},
					include: {
						stats: true,
						tags: {
							select: {
								id: true,
								name: true,
								color: true,
							},
						},
						collections: {
							select: {
								id: true,
								name: true,
								color: true,
							},
						},
					},
				},
			},
		});

		if (!folder) {
			imagesActionsLogger.error('❌ Carpeta no encontrada:', { folderId });
			return { error: 'Carpeta no encontrada', status: 404, items: [], folder: null };
		}

		imagesActionsLogger.info('✅ Carpeta encontrada:', {
			id: folder.id,
			name: folder.name,
			imageCount: folder.images.length,
		});

		const files: ApiResponseFileItem[] = folder.images.map((image) => {
			// Construir metadata
			const metadata = {
				mimeType: image.metadata ? JSON.parse(image.metadata).mimeType : undefined,
				size: image.size,
				dimensions: image.width && image.height ? { width: image.width, height: image.height } : undefined,
				fileSystem: {
					size: image.size,
					created: image.createdAt.toISOString(),
					modified: image.updatedAt.toISOString(),
					accessed: image.updatedAt.toISOString(),
				},
				extension: image.path ? path.extname(image.path).slice(1) : undefined,
				exif: image.metadata ? JSON.parse(image.metadata).exif : undefined,
				generation: image.metadata ? JSON.parse(image.metadata).generation : undefined,
			};

			// Mapear colecciones y tags al formato requerido
			const collections: RelatedCollection[] = image.collections.map((c) => ({
				id: c.id,
				name: c.name,
			}));

			const tags: RelatedTag[] = image.tags.map((t) => ({
				id: t.id,
				name: t.name,
				color: t.color,
			}));

			return {
				id: image.id,
				name: image.name,
				path: image.path,
				type: 'image',
				size: image.size,
				width: image.width,
				height: image.height,
				metadata: JSON.stringify(metadata),
				thumbnail: image.thumbnail
					? `data:${metadata.mimeType || 'image/webp'};base64,${Buffer.from(image.thumbnail).toString('base64')}`
					: null,
				thumbnailSize: image.thumbnailSize,
				thumbnailWidth: image.thumbnailWidth,
				thumbnailHeight: image.thumbnailHeight,
				isPublic: image.isPublic || false,
				isFavorite: image.isFavorite || false,
				folderId: folder.id,
				createdAt: image.createdAt,
				updatedAt: image.updatedAt,
				modifiedAt: image.updatedAt,
				accessedAt: image.updatedAt,
				collections,
				tags,
				albums: [],
				characters: [],
				places: [],
				objects: [],
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
		imagesActionsLogger.error('❌ Error obteniendo imágenes de carpeta:', error);
		return {
			error: `Error interno del servidor: ${error instanceof Error ? error.message : String(error)}`,
			status: 500,
			items: [],
			folder: null,
		};
	}
}
