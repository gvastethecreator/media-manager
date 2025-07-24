import express from 'express';
import { z } from 'zod';
import { ActivityService } from '../../services/activity/activity.service';
import type { ActivityFilters } from '@/types/entities/activity/types';

const router = express.Router();
const activityService = new ActivityService();

// Schema para validación
const createActivitySchema = z.object({
  type: z.string().min(1, 'El tipo de actividad es requerido'),
  message: z.string().min(1, 'El mensaje es requerido'),
  imageId: z.string().optional(),
  albumId: z.string().optional(),
  folderId: z.string().optional(),
  characterId: z.string().optional(),
  collectionId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// POST /api/activity - Registrar nueva actividad
router.post('/', async (req, res) => {
  const validatedResult = createActivitySchema.safeParse(req.body);
  if (!validatedResult.success) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: validatedResult.error.errors,
    });
  }

  const validatedData = validatedResult.data;

  try {
    const activity = await activityService.create({
      type: validatedData.type,
      entityType: 'general',
      entityId: validatedData.imageId || validatedData.albumId || validatedData.folderId || validatedData.characterId || validatedData.collectionId || '',
      action: 'create',
      userId: 'system',
      description: validatedData.message,
      metadata: validatedData.metadata,
    });

    res.status(201).json({
      data: activity,
      message: 'Actividad registrada exitosamente',
    });
  } catch (error) {
    console.error('Error registrando actividad:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

// GET /api/activity - Obtener actividades
router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const filters: ActivityFilters = {
      limit,
      offset: (page - 1) * limit,
    };

    if (req.query.type) {
      filters.types = [req.query.type as string];
    }
    if (req.query.imageId) {
      filters.imageId = req.query.imageId as string;
    }

    const result = await activityService.list(filters);

    res.json({
      data: result.activities,
      pagination: {
        page,
        limit,
        total: result.totalCount,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error('Error obteniendo actividades:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

// GET /api/activity/stats - Obtener estadísticas de actividad
router.get('/stats', async (req, res) => {
  try {
    const type = req.query.type as string;
    const filters: ActivityFilters = {};
    if (type) filters.types = [type];

    const recentActivities = await activityService.list(filters);

    const typeCount: Record<string, number> = {};
    for (const activity of recentActivities.activities) {
      typeCount[activity.type] = (typeCount[activity.type] || 0) + 1;
    }

    const stats = {
      totalActivities: recentActivities.totalCount,
      activitiesByType: typeCount,
    };

    res.json({ data: stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas de actividad:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

// GET /api/activity/:id - Obtener actividad específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await activityService.findById(id);

    if (!activity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.json({ data: activity });
  } catch (error) {
    console.error('Error obteniendo actividad:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

// DELETE /api/activity/:id - Eliminar actividad
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await activityService.delete(id);

    if (!success) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.json({ message: 'Actividad eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando actividad:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

export default router;
