import { Router } from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { albums, images, videos, albumsToImages } from '@/lib/drizzle/schema';
import { eq, like, or, desc, asc, count } from 'drizzle-orm';
import { serializeAlbum } from '@/transformers/album';

/**
 * @file albums.ts
 * @description Rutas REST para gestión de albums.
 *  - GET    /api/albums         → Listar albums con filtros
 *  - GET    /api/albums/:id     → Obtener album específico
 *  - GET    /api/albums/:id/images → Obtener imágenes del album
 *  - POST   /api/albums         → Crear nuevo album
 *  - PUT    /api/albums/:id     → Actualizar album
 *  - DELETE /api/albums/:id     → Eliminar album
 *  - POST   /api/albums/:id/images/:imageId → Añadir imagen al album
 *  - DELETE /api/albums/:id/images/:imageId → Quitar imagen del album
 */

export const albumsRouter = Router();

// Schemas de validación
const AlbumFiltersSchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'imageCount']).default('updatedAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const AlbumCreateSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	isPrivate: z.boolean().default(false),
});

const AlbumUpdateSchema = AlbumCreateSchema.partial();

// GET /api/albums - Listar albums
albumsRouter.get('/', async (req, res) => {
	const parse = AlbumFiltersSchema.safeParse(req.query);
	if (!parse.success) {
		return res.status(400).json({ error: 'Parámetros inválidos', details: parse.error.errors });
	}

	const { search, limit, offset, sortBy, sortOrder } = parse.data;

	try {
		const whereConditions = [];
		if (search) {
			whereConditions.push(
				or(
					like(albums.name, `%${search}%`),
					like(albums.description, `%${search}%`),
				),
			);
		}

		const orderByColumn = albums[sortBy];
		const orderByClause = sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

		const [albumsData, totalResult] = await Promise.all([
			db.query.albums.findMany({
				where: and(...whereConditions),
				with: {
					images: { columns: { id: true } },
				},
				orderBy: orderByClause,
				limit: limit,
				offset: offset,
			}),
			db.select({ count: count() }).from(albums).where(and(...whereConditions)),
		]);

		const total = totalResult[0].count;
		const serializedAlbums = albumsData.map(serializeAlbum);

		res.json({
			data: serializedAlbums,
			pagination: {
				total,
				limit,
				offset,
				hasNext: offset + limit < total,
				hasPrev: offset > 0,
			},
		});
	} catch (error) {
		console.error('Error obteniendo albums:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/albums/:id - Obtener album específico
albumsRouter.get('/:id', async (req, res) => {
	const { id } = req.params;

	try {
		const album = await db.query.albums.findFirst({
			where: eq(albums.id, id),
			with: {
				images: { columns: { id: true } },
			},
		});

		if (!album) {
			return res.status(404).json({ error: 'Album no encontrado' });
		}

		res.json(serializeAlbum(album));
	} catch (error) {
		console.error('Error obteniendo album:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/albums/:id/images - Obtener imágenes del album
albumsRouter.get('/:id/images', async (req, res) => {
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
			return res.status(404).json({ error: 'Album no encontrado' });
		}

		// Serializar imágenes (usar serializeImage si existe)
		res.json(album.images);
	} catch (error) {
		console.error('Error obteniendo imágenes del album:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /api/albums - Crear album
albumsRouter.post('/', async (req, res) => {
	const parse = AlbumCreateSchema.safeParse(req.body);
	if (!parse.success) {
		return res.status(400).json({ error: 'Datos inválidos', details: parse.error.errors });
	}

	try {
		const [newAlbum] = await db.insert(albums).values(parse.data).returning({
			id: albums.id,
			name: albums.name,
			description: albums.description,
			color: albums.color,
			isPrivate: albums.isPrivate,
			createdAt: albums.createdAt,
			updatedAt: albums.updatedAt,
			featuredImage: albums.featuredImage,
			shortcut: albums.shortcut,
			category: albums.category,
			filters: albums.filters,
		});

		if (!newAlbum) {
			return res.status(500).json({ error: 'Error creando álbum' });
		}

		// Para serializar el álbum, necesitamos las relaciones. Realizamos una nueva consulta.
		const album = await db.query.albums.findFirst({
			where: eq(albums.id, newAlbum.id),
			with: {
				images: { columns: { id: true } },
			},
		});

		if (!album) {
			return res.status(500).json({ error: 'Error obteniendo álbum creado' });
		}

		res.status(201).json(serializeAlbum(album));
	} catch (error) {
		console.error('Error creando album:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /api/albums/:id - Actualizar album
albumsRouter.put('/:id', async (req, res) => {
	const { id } = req.params;
	const parse = AlbumUpdateSchema.safeParse(req.body);

	if (!parse.success) {
		return res.status(400).json({ error: 'Datos inválidos', details: parse.error.errors });
	}

	try {
		const [updatedAlbum] = await db.update(albums).set(parse.data).where(eq(albums.id, id)).returning({
			id: albums.id,
			name: albums.name,
			description: albums.description,
			color: albums.color,
			isPrivate: albums.isPrivate,
			createdAt: albums.createdAt,
			updatedAt: albums.updatedAt,
			featuredImage: albums.featuredImage,
			shortcut: albums.shortcut,
			category: albums.category,
			filters: albums.filters,
		});

		if (!updatedAlbum) {
			return res.status(404).json({ error: 'Album no encontrado' });
		}

		// Para serializar el álbum, necesitamos las relaciones. Realizamos una nueva consulta.
		const album = await db.query.albums.findFirst({
			where: eq(albums.id, updatedAlbum.id),
			with: {
				images: { columns: { id: true } },
			},
		});

		if (!album) {
			return res.status(500).json({ error: 'Error obteniendo álbum actualizado' });
		}

		res.json(serializeAlbum(album));
	} catch (error) {
		console.error('Error actualizando album:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /api/albums/:id - Eliminar album
albumsRouter.delete('/:id', async (req, res) => {
	const { id } = req.params;

	try {
		await db.delete(albums).where(eq(albums.id, id));

		res.status(204).send();
	} catch (error) {
		console.error('Error eliminando album:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /api/albums/:id/images/:imageId - Añadir imagen al album
albumsRouter.post('/:id/images/:imageId', async (req, res) => {
	const { id, imageId } = req.params;

	try {
		await db.insert(albumsToImages).values({
			albumId: id,
			imageId: imageId,
		});

		res.status(204).send();
	} catch (error) {
		console.error('Error añadiendo imagen al album:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /api/albums/:id/images/:imageId - Quitar imagen del album
albumsRouter.delete('/:id/images/:imageId', async (req, res) => {
	const { id, imageId } = req.params;

	try {
		await db.delete(albumsToImages).where(and(eq(albumsToImages.albumId, id), eq(albumsToImages.imageId, imageId)));

		res.status(204).send();
	} catch (error) {
		console.error('Error quitando imagen del album:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});
