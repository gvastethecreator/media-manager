import { Router } from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { favorites, profiles } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
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
    const existing = await db.query.favorites.findFirst({
      where: and(eq(favorites.entityType, entityType), eq(favorites.entityId, entityId)),
    });

    if (existing) {
      await db.delete(favorites).where(eq(favorites.id, existing.id));
      return res.json({ isFavorite: false });
    }

    const defaultProfile = await db.query.profiles.findFirst({
      where: eq(profiles.isActive, true),
      columns: { id: true },
    });

    if (!defaultProfile) {
      return res.status(400).json({ error: 'No se encontró un perfil activo' });
    }

    await db.insert(favorites).values({
      entityType,
      entityId,
      profileId: defaultProfile.id,
    });

    return res.status(201).json({ isFavorite: true });
  } catch (error) {
    console.error(`Error al alternar favorito para ${entityType}:${entityId}:`, error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;