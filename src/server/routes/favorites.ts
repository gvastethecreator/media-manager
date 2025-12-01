import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { serverLogger } from '@/lib/logger/server-logger';
import { FavoriteEntityType } from '@/types/entities/favorite';

const router = Router() as any;

const toggleFavoriteSchema = z.object({
	entityType: z.nativeEnum(FavoriteEntityType),
	entityId: z.string().min(1),
});

router.post('/toggle', async (req: Request, res: Response) => {
	const validation = toggleFavoriteSchema.safeParse(req.body);
	if (!validation.success) {
		return res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
	}

	const { entityType, entityId } = validation.data;

	try {
		// TODO: Implementar lógica de favoritos usando campos isFavorite en cada entidad
		// Por ahora, devolver respuesta básica
		return res.json({ isFavorite: false, message: 'Funcionalidad de favoritos en desarrollo' });
	} catch (error) {
		serverLogger.error(`Error al alternar favorito para ${entityType}:${entityId}:`, error);
		return res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
