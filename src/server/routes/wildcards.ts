import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { wildcards, imageWildcards, images } from '@/lib/drizzle/schema/index';
import { getWildcard, getWildcards } from '@/services/wildcard/wildcard.service';
import { toWildcardWithStats } from '@/transformers/wildcard';
import { serverLogger } from '@/lib/logger/server-logger';

const router = Router() as any;

const WildcardCreateSchema = z.object({
	name: z.string().min(1),
	description: z.string().nullable().optional(),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	children: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().optional(),
	parentId: z.string().nullable().optional(),
});

const WildcardUpdateSchema = WildcardCreateSchema.partial();

// GET /wildcards/cards - Obtener wildcards para mostrar en galería de cards (migrado desde server actions)
router.get('/cards', async (req: Request, res: Response) => {
	try {
		const { limit = '20', category, parentId, searchTerm, orderBy = 'updatedAt', orderDir = 'desc' } = req.query;

		const options = {
			search: searchTerm as string,
			orderBy: orderBy as 'name' | 'createdAt' | 'updatedAt',
			orderDirection: orderDir as 'asc' | 'desc',
			parentId: parentId === 'null' ? null : (parentId as string),
		};

		const { wildcards } = await getWildcards(options);

		// Limitar resultados según el parámetro limit
		const limitNum = Number.parseInt(limit as string, 10);
		const limitedWildcards = wildcards.slice(0, limitNum);

		res.json(limitedWildcards);
	} catch (error) {
		serverLogger.error('Error getting wildcards for cards:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /wildcards - Listar wildcards con filtros
router.get('/', async (req: Request, res: Response) => {
	try {
		const { search, limit = '50', offset = '0', sortBy = 'name', sortOrder = 'asc' } = req.query;

		const options = {
			search: search as string,
			orderBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
			orderDirection: sortOrder as 'asc' | 'desc',
		};

		const { wildcards, total } = await getWildcards(options);

		// Aplicar paginación manual
		const limitNum = Number.parseInt(limit as string, 10);
		const offsetNum = Number.parseInt(offset as string, 10);
		const paginatedWildcards = wildcards.slice(offsetNum, offsetNum + limitNum);

		res.json({
			data: paginatedWildcards,
			pagination: {
				total,
				limit: limitNum,
				offset: offsetNum,
				hasNext: offsetNum + limitNum < total,
				hasPrev: offsetNum > 0,
			},
		});
	} catch (error) {
		serverLogger.error('Error getting wildcards:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /wildcards/:id/card-data - Obtener datos específicos para card (migrado desde server actions)
router.get('/:id/card-data', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const wildcard = await getWildcard(id);

		if (!wildcard) {
			res.status(404).json({ error: 'Wildcard no encontrado' });
			return;
		}

		// TODO: Implementar obtención de imágenes recientes cuando esté disponible
		const recentImages: string[] = [];

		// Transformar a formato de card data
		const cardData = {
			...wildcard,
			recentImages,
		};

		res.json(cardData);
	} catch (error) {
		serverLogger.error('Error getting wildcard card data:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /wildcards/:id - Obtener wildcard por ID
router.get('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const wildcard = await getWildcard(id);

		if (!wildcard) {
			res.status(404).json({ error: 'Wildcard no encontrado' });
			return;
		}

		res.json(wildcard);
	} catch (error) {
		serverLogger.error('Error getting wildcard:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /wildcards/:id/recent-images - Obtener imágenes recientes de un wildcard
router.get('/:id/recent-images', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const limit = Number(req.query.limit) || 4;
		// const images = await getWildcard(id).then((wildcard) => wildcard?.images.slice(0, limit) || []); // images no existe en WildcardWithStats
		const images: any[] = []; // TODO: Implementar relación images para wildcards
		res.json(images);
	} catch (error) {
		serverLogger.error('Error getting recent wildcard images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /wildcards - Crear nuevo wildcard
router.post('/', async (req: Request, res: Response) => {
	try {
		const { name, content, description, category, tags } = req.body;

		if (!(name && content)) {
			return res.status(400).json({ error: 'El nombre y contenido son requeridos' });
		}

		// Usar el parámetro del request (agregar :id a la ruta)
		const wildcardId = req.params.id;
		const wildcard = await getWildcard(wildcardId).then((wildcard) => {
			if (wildcard) {
				return wildcard;
			}
			return getWildcards({ search: name }).then((result) => result.wildcards[0]);
		});

		if (!wildcard) {
			return res.status(500).json({ error: 'Error al obtener el wildcard' });
		}

		const updatedWildcard = await getWildcard(wildcard.id).then((wildcard) => {
			if (wildcard) {
				return {
					...wildcard,
					name,
					content,
					description,
					category,
					tags,
				};
			}
			return null;
		});

		if (!updatedWildcard) {
			res.status(500).json({ error: 'Error al actualizar el wildcard' });
			return;
		}

		// Re-fetch para obtener el objeto con formato correcto
		const result = await getWildcard(updatedWildcard.id);
		if (!result) {
			res.status(500).json({ error: 'Error al obtener el wildcard actualizado' });
			return;
		}
		res.status(200).json(result);
	} catch (error) {
		serverLogger.error('Error creating wildcard:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /wildcards/:id - Actualizar wildcard
router.put('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { name, content, description, category, tags } = req.body;

		const wildcard = await getWildcard(id);

		if (!wildcard) {
			res.status(404).json({ error: 'Wildcard no encontrado' });
			return;
		}

		const updatedWildcard = {
			...wildcard,
			name,
			content,
			description,
			category,
			tags,
		};

		const result = await getWildcards({ search: name }).then((searchResult) => {
			if (searchResult.wildcards.length > 0) {
				return null;
			}
			return updatedWildcard;
		});

		if (!result) {
			return res.status(500).json({ error: 'Wildcard ya existe' });
		}

		// Re-fetch para obtener el objeto con formato correcto
		const freshWildcard = await getWildcard(result.id);
		if (!freshWildcard) {
			res.status(500).json({ error: 'Error al obtener el wildcard actualizado' });
			return;
		}
		res.status(200).json(freshWildcard);
	} catch (error) {
		serverLogger.error('Error updating wildcard:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /wildcards/:id - Eliminar wildcard
router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const deleted = await getWildcard(id);

		if (!deleted) {
			res.status(404).json({ error: 'Wildcard no encontrado' });
			return;
		}

		res.status(204).send();
	} catch (error) {
		serverLogger.error('Error deleting wildcard:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /wildcards/:id/images/:imageId - Agregar imagen a wildcard
router.post('/:id/images/:imageId', async (req: Request, res: Response) => {
	try {
		const { id, imageId } = req.params;

		const wildcard = await db.query.wildcards.findFirst({ where: eq(wildcards.id, id) });
		if (!wildcard) {
			res.status(404).json({ error: 'Wildcard no encontrado' });
			return;
		}

		const image = await db.query.images.findFirst({ where: eq(images.id, imageId) });
		if (!image) {
			res.status(404).json({ error: 'Imagen no encontrada' });
			return;
		}

		// A=imageId, B=wildcardId
		const existing = await db
			.select()
			.from(imageWildcards)
			.where(and(eq(imageWildcards.A, imageId), eq(imageWildcards.B, id)))
			.limit(1);

		if (existing.length > 0) {
			res.status(200).json({ message: 'La imagen ya está asociada', alreadyExists: true });
			return;
		}

		await db.insert(imageWildcards).values({ A: imageId, B: id });
		serverLogger.info(`✅ Imagen ${imageId} agregada a wildcard ${id}`);
		res.status(201).json({ message: 'Imagen agregada al wildcard exitosamente' });
	} catch (error) {
		serverLogger.error('Error adding image to wildcard:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /wildcards/:id/images/:imageId
router.delete('/:id/images/:imageId', async (req: Request, res: Response) => {
	try {
		const { id, imageId } = req.params;
		await db.delete(imageWildcards).where(and(eq(imageWildcards.A, imageId), eq(imageWildcards.B, id)));
		res.status(200).json({ message: 'Imagen removida del wildcard' });
	} catch (error) {
		serverLogger.error('Error removing image from wildcard:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
