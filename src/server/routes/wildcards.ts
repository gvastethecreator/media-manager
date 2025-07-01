import { WildcardService } from '@/services/wildcard/wildcard.service';
import { toWildcardWithStats } from '@/transformers/wildcard/wildcard.transformer';
import express from 'express';

const router = express.Router();
const wildcardService = new WildcardService();

// GET /wildcards - Listar wildcards con filtros
router.get('/', async (req, res) => {
  try {
    const {
      search,
      limit = '50',
      offset = '0',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const filters = {
      search: search as string,
      limit: Number.parseInt(limit as string),
      offset: Number.parseInt(offset as string),
      sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const { wildcards, total } = await wildcardService.getWildcards(filters);
    const transformedWildcards = wildcards.map(toWildcardWithStats);

    res.json({
      data: transformedWildcards,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasNext: filters.offset + filters.limit < total,
        hasPrev: filters.offset > 0
      }
    });
  } catch (error) {
    console.error('Error getting wildcards:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /wildcards/:id - Obtener wildcard por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const wildcard = await wildcardService.getWildcardById(id);

    if (!wildcard) {
      return res.status(404).json({ error: 'Wildcard no encontrado' });
    }

    res.json(toWildcardWithStats(wildcard));
  } catch (error) {
    console.error('Error getting wildcard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /wildcards - Crear nuevo wildcard
router.post('/', async (req, res) => {
  try {
    const { name, content, description, category, tags } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'El nombre y contenido son requeridos' });
    }

    const wildcard = await wildcardService.createWildcard({
      name,
      content,
      description,
      category,
      tags
    });

    res.status(201).json(toWildcardWithStats(wildcard));
  } catch (error) {
    console.error('Error creating wildcard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /wildcards/:id - Actualizar wildcard
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, description, category, tags } = req.body;

    const wildcard = await wildcardService.updateWildcard(id, {
      name,
      content,
      description,
      category,
      tags
    });

    if (!wildcard) {
      return res.status(404).json({ error: 'Wildcard no encontrado' });
    }

    res.json(toWildcardWithStats(wildcard));
  } catch (error) {
    console.error('Error updating wildcard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /wildcards/:id - Eliminar wildcard
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await wildcardService.deleteWildcard(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Wildcard no encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting wildcard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;