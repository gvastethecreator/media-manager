import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';
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
    const existing = await prisma.favorite.findFirst({
      where: { entityType, entityId },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ isFavorite: false });
    }

    const defaultProfile = await prisma.profile.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (!defaultProfile) {
      return res.status(400).json({ error: 'No se encontró un perfil activo' });
    }

    await prisma.favorite.create({
      data: {
        entityType,
        entityId,
        profile: { connect: { id: defaultProfile.id } },
      },
    });

    return res.status(201).json({ isFavorite: true });
  } catch (error) {
    console.error(`Error al alternar favorito para ${entityType}:${entityId}:`, error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;