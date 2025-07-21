import express from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { profiles } from '@/lib/drizzle/schema/index';
import { desc, eq, ilike, or, count } from 'drizzle-orm';

const router = express.Router();

// Schema para validación
const ProfileFiltersSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  isActive: z.coerce.boolean().optional(),
});

// GET /api/profiles/active - Obtener perfil activo
router.get('/active', async (_req, res) => {
  try {
    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.isActive, true))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({
        error: 'No se encontró un perfil activo',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      data: result[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error obteniendo perfil activo:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/profiles - Obtener todos los perfiles
router.get('/', async (req, res) => {
  try {
    const parse = ProfileFiltersSchema.safeParse(req.query);
    if (!parse.success) {
      return res.status(400).json({
        error: 'Parámetros inválidos',
        details: parse.error.errors,
      });
    }

    const { search, limit, offset, sortBy, sortOrder, isActive } = parse.data;

    let query = db.select().from(profiles);

    // Aplicar filtros
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(profiles.name, `%${search}%`),
          ilike(profiles.description, `%${search}%`)
        )
      );
    }

    if (isActive !== undefined) {
      conditions.push(eq(profiles.isActive, isActive));
    }

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : or(...conditions));
    }

    // Aplicar ordenamiento
    const orderByColumn = sortBy === 'name' ? profiles.name :
      sortBy === 'createdAt' ? profiles.createdAt :
        profiles.updatedAt;

    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    query = orderDirection === 'asc'
      ? query.orderBy(orderByColumn)
      : query.orderBy(desc(orderByColumn));

    const result = await query.limit(limit).offset(offset);

    // Obtener total de registros
    const totalQuery = db.select({ count: count() }).from(profiles);
    if (conditions.length > 0) {
      totalQuery.where(conditions.length === 1 ? conditions[0] : or(...conditions));
    }
    const [{ count: total }] = await totalQuery;

    res.json({
      data: result,
      pagination: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrev: offset > 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error obteniendo perfiles:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/profiles/:id - Obtener perfil por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    res.json({
      data: result[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

export default router;