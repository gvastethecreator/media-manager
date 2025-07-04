import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
// import { favorites, profiles } from '@/lib/drizzle/schema'; // favorites no existe
import { profiles } from '@/lib/drizzle/schema';
import { FavoriteEntityType } from '@/types/entities/favorite';

const router = Router();

const toggleFavoriteSchema = z.object({
	entityType: z.nativeEnum(FavoriteEntityType),
	entityId: z.string().min(1),
});

router.post('/toggle', async (req, res) => {
	const validation = toggleFavoriteSchema.safeParse(req.body);
	if (!validation.success) {
		return res.status(400).json({ error: 'Datos inválidos', details: validation.error.errors });
	}

	const { entityType, entityId } = validation.data;

	try {
		// TODO: Implementar lógica de favoritos usando campos isFavorite en cada entidad
		// Por ahora, devolver respuesta básica
		return res.json({ isFavorite: false, message: 'Funcionalidad de favoritos en desarrollo' });
	} catch (error) {
		console.error(`Error al alternar favorito para ${entityType}:${entityId}:`, error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
