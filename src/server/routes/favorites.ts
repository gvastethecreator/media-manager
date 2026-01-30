import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { serverLogger } from '@/lib/logger/server-logger';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';

const router = Router() as any;

const toggleFavoriteSchema = z.object({
	entityType: z.nativeEnum(FavoriteEntityType),
	entityId: z.string().min(1),
});

// GET /favorites - Listar favoritos con filtros
router.get('/', async (req: Request, res: Response) => {
	try {
		const { entityType, limit = '50', offset = '0', sortOrder = 'desc' } = req.query;

		const filters = {
			entityType: entityType as string | undefined,
			limit: Number.parseInt(limit as string, 10),
			offset: Number.parseInt(offset as string, 10),
			sortOrder: sortOrder as 'asc' | 'desc',
		};

		const result = await favoriteService.list(filters);

		res.json({
			data: result.items,
			pagination: {
				total: result.total,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: result.hasMore,
				hasPrev: filters.offset > 0,
			},
		});
	} catch (error) {
		serverLogger.error('Error al listar favoritos:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /favorites/counts - Obtener conteos por tipo
router.get('/counts', async (_req: Request, res: Response) => {
	try {
		const counts = await favoriteService.getCountsByType();
		res.json(counts);
	} catch (error) {
		serverLogger.error('Error al obtener conteos de favoritos:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /favorites/check - Verificar si una entidad es favorita
router.get('/check', async (req: Request, res: Response) => {
	try {
		const { entityType, entityId } = req.query;

		if (!entityType) {
			res.status(400).json({ error: 'entityType es requerido' });
			return;
		}
		if (!entityId) {
			res.status(400).json({ error: 'entityId es requerido' });
			return;
		}

		const isFavorite = await favoriteService.isFavorite(entityType as FavoriteEntityType, entityId as string);
		res.json({ isFavorite });
	} catch (error) {
		serverLogger.error('Error al verificar favorito:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /favorites/:id - Obtener favorito por ID
router.get('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const favorite = await favoriteService.getById(id);

		if (!favorite) {
			res.status(404).json({ error: 'Favorito no encontrado' });
			return;
		}

		res.json(favorite);
	} catch (error) {
		serverLogger.error('Error al obtener favorito:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /favorites/toggle - Alternar estado de favorito
router.post('/toggle', async (req: Request, res: Response) => {
	const validation = toggleFavoriteSchema.safeParse(req.body);
	if (!validation.success) {
		return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
	}

	const { entityType, entityId } = validation.data;

	try {
		const result = await favoriteService.toggle(entityType, entityId);
		return res.json(result);
	} catch (error) {
		serverLogger.error(`Error al alternar favorito para ${entityType}:${entityId}:`, error);
		return res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /favorites/:id - Eliminar favorito
router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const deleted = await favoriteService.delete(id);

		if (!deleted) {
			res.status(404).json({ error: 'Favorito no encontrado' });
			return;
		}

		res.status(204).send();
	} catch (error) {
		serverLogger.error('Error al eliminar favorito:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
