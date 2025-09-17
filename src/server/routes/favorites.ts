import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { FavoriteEntityType } from '@/types/entities/favorite';

const router = Router();

const toggleFavoriteSchema = z.object({
	entityType: z.nativeEnum(FavoriteEntityType),
	entityId: z.string().min(1),
});

router.post('/toggle', (req: Request, res: Response): void => {
	const validation = toggleFavoriteSchema.safeParse(req.body);
	if (!validation.success) {
		res.status(400).json({ error: 'Datos inválidos', details: validation.error.issues });
		return;
	}

	const { entityType, entityId } = validation.data;
	try {
		// TODO: Implementar lógica real
		res.json({ isFavorite: false, message: 'Funcionalidad de favoritos en desarrollo', entityType, entityId });
	} catch (error) {
		console.error(`Error al alternar favorito para ${entityType}:${entityId}:`, error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
