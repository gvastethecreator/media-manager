import { prisma } from '@/lib/database/prisma';
import { serializeAlbum } from '@/transformers/album';
import { Router } from 'express';
import { z } from 'zod';

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
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
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
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const [albums, total] = await Promise.all([
      prisma.album.findMany({
        where,
        include: {
          _count: {
            select: { images: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      prisma.album.count({ where })
    ]);

    const serializedAlbums = albums.map(serializeAlbum);

    res.json({
      data: serializedAlbums,
      pagination: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrev: offset > 0,
      }
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
    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        _count: {
          select: { images: true }
        }
      }
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
    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        images: {
          include: {
            _count: {
              select: {
                tags: true,
                albums: true,
                collections: true,
                characters: true,
                places: true,
                worldItems: true,
                notes: true,
              }
            },
            folder: true,
          }
        }
      }
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
    const album = await prisma.album.create({
      data: parse.data,
      include: {
        _count: {
          select: { images: true }
        }
      }
    });

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
    const album = await prisma.album.update({
      where: { id },
      data: parse.data,
      include: {
        _count: {
          select: { images: true }
        }
      }
    });

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
    await prisma.album.delete({
      where: { id }
    });

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
    await prisma.album.update({
      where: { id },
      data: {
        images: {
          connect: { id: imageId }
        }
      }
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
    await prisma.album.update({
      where: { id },
      data: {
        images: {
          disconnect: { id: imageId }
        }
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error quitando imagen del album:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
