'use server';

import { getPrismaClient } from '@/lib/database/db';
import { serverLogger } from '@/lib/logger/server-logger';
import { NoteStatus } from '@/types/entities/note/enums';

// Logger específico para acciones de NoteCard
const noteCardLogger = serverLogger.withContext('NoteCardActions');

// Interfaz para las imágenes thumbnail
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

// Interface para los contadores de relaciones
export interface NoteRelationCounts {
	characters: number;
	places: number;
	worldItems: number;
	concepts: number;
	prompts: number;
	images: number;
	videos: number;
	albums: number;
	collections: number;
	tags: number;
	wildcards: number;
	properties: number;
	groups: number;
}

/**
 * Obtiene las imágenes recientes de una nota para mostrar en la tarjeta
 * @param noteId ID de la nota
 * @param limit Número máximo de imágenes a obtener (por defecto 6)
 * @returns Array de imágenes con sus thumbnails
 */
export async function getRecentNoteImages(noteId: string, limit = 6): Promise<ThumbnailImage[]> {
	try {
		noteCardLogger.info('🖼️ Obteniendo imágenes recientes para NoteCard:', noteId);
		const prisma = await getPrismaClient();

		// Verificar que el ID es válido
		if (!noteId) {
			throw new Error('ID de nota no proporcionado');
		}

		// Obtener imágenes recientes de la nota
		const images = await prisma.image.findMany({
			where: {
				notes: {
					some: {
						id: noteId,
					},
				},
				thumbnail: { not: null }, // Solo imágenes con thumbnail
			},
			select: {
				id: true,
				name: true,
				thumbnail: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
				thumbnailSize: true,
			},
			orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
			take: limit,
		});

		// Convertir los thumbnails a URLs de datos
		const thumbnails: ThumbnailImage[] = images.map((image) => {
			let thumbnailUrl = '';

			// Verificar si tenemos un thumbnail válido
			if (image.thumbnail && image.thumbnailSize && image.thumbnailSize < 100000) {
				thumbnailUrl = `data:image/jpeg;base64,${Buffer.from(image.thumbnail).toString('base64')}`;
			}

			return {
				id: image.id,
				name: image.name,
				thumbnailUrl,
				url: `/images/${image.id}`,
			};
		});

		noteCardLogger.info('✅ Imágenes obtenidas para NoteCard:', thumbnails.length);
		return thumbnails;
	} catch (error) {
		noteCardLogger.error('❌ Error obteniendo imágenes para NoteCard:', error);
		throw new Error(
			`No se pudieron obtener las imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`
		);
	}
}

/**
 * Obtiene el recuento de elementos relacionados con una nota
 * @param noteId ID de la nota
 * @returns Objeto con contadores de relaciones
 */
export async function getNoteCounts(noteId: string): Promise<NoteRelationCounts> {
	try {
		noteCardLogger.info('🔢 Obteniendo recuentos para NoteCard:', noteId);
		const prisma = await getPrismaClient();

		// Verificar que el ID es válido
		if (!noteId) {
			throw new Error('ID de nota no proporcionado');
		}

		// Obtener recuentos de la nota
		const counts = await prisma.note.findUnique({
			where: { id: noteId },
			select: {
				_count: {
					select: {
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						images: true,
						videos: true,
						albums: true,
						collections: true,
						tags: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		});

		if (!counts) {
			throw new Error('Nota no encontrada');
		}

		const result: NoteRelationCounts = {
			characters: counts._count.characters,
			places: counts._count.places,
			worldItems: counts._count.worldItems,
			concepts: counts._count.concepts,
			prompts: counts._count.prompts,
			images: counts._count.images,
			videos: counts._count.videos,
			albums: counts._count.albums,
			collections: counts._count.collections,
			tags: counts._count.tags,
			wildcards: counts._count.wildcards,
			properties: counts._count.properties,
			groups: counts._count.groups,
		};

		noteCardLogger.info('✅ Recuentos obtenidos para NoteCard');
		return result;
	} catch (error) {
		noteCardLogger.error('❌ Error obteniendo recuentos para NoteCard:', error);
		return {
			characters: 0,
			places: 0,
			worldItems: 0,
			concepts: 0,
			prompts: 0,
			images: 0,
			videos: 0,
			albums: 0,
			collections: 0,
			tags: 0,
			wildcards: 0,
			properties: 0,
			groups: 0,
		};
	}
}

/**
 * Obtiene los estados disponibles para notas desde el enum NoteStatus
 * @returns Lista de estados disponibles
 */
export async function getNoteStatuses(): Promise<string[]> {
	try {
		return Object.values(NoteStatus);
	} catch (_error) {
		return ['active', 'archived', 'completed', 'draft', 'pending'];
	}
}
