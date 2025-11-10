/**
 * @file albums.handlers.ts
 * @module server/routes/albums/handlers
 * @description Handlers individuales para rutas de albums
 */

import { and, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db } from '@/lib/drizzle';
import { albums, imageAlbums } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { serializeAlbum, toAlbumWithStats } from '@/transformers/album/index';
import { AlbumCreateSchema, AlbumUpdateSchema } from './albums.validators';

const albumLogger = serverLogger.withContext('AlbumsAPI');

/**
 * GET /api/albums/:id - Obtener album específico
 */
export async function getAlbumByIdHandler(req: Request, res: Response) {
	const { id } = req.params;

	try {
		const album = await db.query.albums.findFirst({
			where: eq(albums.id, id),
			with: {
				images: { columns: { id: true } },
			},
		});

		if (!album) {
			res.status(404).json({ error: 'Album no encontrado' });
			return;
		}

		const albumWithStats = toAlbumWithStats(album);
		res.json(serializeAlbum(albumWithStats));
	} catch (error) {
		albumLogger.error('Error obteniendo album', { error });
		res.status(500).json({ error: 'Error interno del servidor' });
	}
}

/**
 * GET /api/albums/:id/images - Obtener imágenes del album
 */
export async function getAlbumImagesHandler(req: Request, res: Response) {
	const { id } = req.params;

	try {
		const album = await db.query.albums.findFirst({
			where: eq(albums.id, id),
			with: {
				images: {
					with: {
						folder: true,
						tags: { columns: { id: true } },
						albums: { columns: { id: true } },
						collections: { columns: { id: true } },
						characters: { columns: { id: true } },
						places: { columns: { id: true } },
						worldItems: { columns: { id: true } },
						notes: { columns: { id: true } },
					},
				},
			},
		});

		if (!album) {
			res.status(404).json({ error: 'Album no encontrado' });
			return;
		}

		res.json(album.images);
	} catch (error) {
		albumLogger.error('Error obteniendo imágenes del album', { error });
		res.status(500).json({ error: 'Error interno del servidor' });
	}
}

/**
 * POST /api/albums - Crear album
 */
export async function createAlbumHandler(req: Request, res: Response) {
	const parse = AlbumCreateSchema.safeParse(req.body);
	if (!parse.success) {
		res.status(400).json({ error: 'Datos inválidos', details: parse.error.issues });
		return;
	}

	try {
		const [newAlbum] = await db.insert(albums).values(parse.data).returning({
			id: albums.id,
			name: albums.name,
			description: albums.description,
			color: albums.color,
			createdAt: albums.createdAt,
			updatedAt: albums.updatedAt,
			featuredImage: albums.featuredImage,
			category: albums.category,
			filters: albums.filters,
		});

		if (!newAlbum) {
			res.status(500).json({ error: 'Error creando álbum' });
			return;
		}

		const album = await db.query.albums.findFirst({
			where: eq(albums.id, newAlbum.id),
			with: {
				images: { columns: { id: true } },
			},
		});

		if (!album) {
			res.status(500).json({ error: 'Error obteniendo álbum creado' });
			return;
		}

		res.status(201).json(serializeAlbum(album));
	} catch (error) {
		albumLogger.error('Error creando album', { error });
		res.status(500).json({ error: 'Error interno del servidor' });
	}
}

/**
 * PUT /api/albums/:id - Actualizar album
 */
export async function updateAlbumHandler(req: Request, res: Response) {
	const { id } = req.params;
	const parse = AlbumUpdateSchema.safeParse(req.body);

	if (!parse.success) {
		res.status(400).json({ error: 'Datos inválidos', details: parse.error.issues });
		return;
	}

	try {
		const [updatedAlbum] = await db.update(albums).set(parse.data).where(eq(albums.id, id)).returning({
			id: albums.id,
			name: albums.name,
			description: albums.description,
			color: albums.color,
			createdAt: albums.createdAt,
			updatedAt: albums.updatedAt,
			featuredImage: albums.featuredImage,
			category: albums.category,
			filters: albums.filters,
		});

		if (!updatedAlbum) {
			res.status(404).json({ error: 'Album no encontrado' });
			return;
		}

		const album = await db.query.albums.findFirst({
			where: eq(albums.id, updatedAlbum.id),
			with: {
				images: { columns: { id: true } },
			},
		});

		if (!album) {
			res.status(500).json({ error: 'Error obteniendo álbum actualizado' });
			return;
		}

		res.json(serializeAlbum(album));
	} catch (error) {
		albumLogger.error('Error actualizando album', { error });
		res.status(500).json({ error: 'Error interno del servidor' });
	}
}

/**
 * DELETE /api/albums/:id - Eliminar album
 */
export async function deleteAlbumHandler(req: Request, res: Response) {
	const { id } = req.params;

	try {
		await db.delete(albums).where(eq(albums.id, id));
		res.status(204).send();
	} catch (error) {
		albumLogger.error('Error eliminando album', { error });
		res.status(500).json({ error: 'Error interno del servidor' });
	}
}

/**
 * POST /api/albums/:id/images/:imageId - Añadir imagen al album
 */
export async function addImageToAlbumHandler(req: Request, res: Response) {
	const { id, imageId } = req.params;

	try {
		await db.insert(imageAlbums).values({
			A: imageId, // imageId
			B: id, // albumId
		});
		res.status(204).send();
	} catch (error) {
		albumLogger.error('Error añadiendo imagen al album', { error });
		res.status(500).json({ error: 'Error interno del servidor' });
	}
}

/**
 * DELETE /api/albums/:id/images/:imageId - Quitar imagen del album
 */
export async function removeImageFromAlbumHandler(req: Request, res: Response) {
	const { id, imageId } = req.params;

	try {
		await db.delete(imageAlbums).where(and(eq(imageAlbums.A, imageId), eq(imageAlbums.B, id)));
		res.status(204).send();
	} catch (error) {
		albumLogger.error('Error quitando imagen del album', { error });
		res.status(500).json({ error: 'Error interno del servidor' });
	}
}
