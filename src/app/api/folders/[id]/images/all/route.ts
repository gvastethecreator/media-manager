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
import { type NextRequest, NextResponse } from 'next/server';

const imagesLogger = serverLogger.withContext('ImagesAPI');

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

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
	try {
		const { id } = context.params;
		imagesLogger.info('🔍 Buscando carpeta:', { id });

		const folder = await prisma.folder.findUnique({
			where: { id },
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
			imagesLogger.error('❌ Carpeta no encontrada:', { id });
			return new NextResponse('Carpeta no encontrada', { status: 404 });
		}

		imagesLogger.info('✅ Carpeta encontrada:', {
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
		imagesLogger.error('Error obteniendo imágenes:', error);
		return new NextResponse('Error interno del servidor', { status: 500 });
	}
}
