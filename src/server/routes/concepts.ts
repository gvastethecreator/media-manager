import { ConceptService } from '@/services/concept/concept.service';
import { toConceptWithStats } from '@/transformers/concept/concept.transformer';
import { toImageWithStats } from '@/transformers/image/image.transformer';
import express from 'express';

const router = express.Router();
const conceptService = new ConceptService();

// GET /concepts - Listar conceptos con filtros
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
      sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt' | 'imageCount',
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const { concepts, total } = await conceptService.getConcepts(filters);
    const transformedConcepts = concepts.map(toConceptWithStats);

    res.json({
      data: transformedConcepts,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasNext: filters.offset + filters.limit < total,
        hasPrev: filters.offset > 0
      }
    });
  } catch (error) {
    console.error('Error getting concepts:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /concepts/:id - Obtener concepto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const concept = await conceptService.getConceptById(id);

    if (!concept) {
      return res.status(404).json({ error: 'Concepto no encontrado' });
    }

    res.json(toConceptWithStats(concept));
  } catch (error) {
    console.error('Error getting concept:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /concepts/:id/images - Obtener imágenes de un concepto
router.get('/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const images = await conceptService.getConceptImages(id);
    const transformedImages = images.map(toImageWithStats);

    res.json(transformedImages);
  } catch (error) {
    console.error('Error getting concept images:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /concepts - Crear nuevo concepto
router.post('/', async (req, res) => {
  try {
    const { name, description, color, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const concept = await conceptService.createConcept({
      name,
      description,
      color,
      category
    });

    res.status(201).json(toConceptWithStats(concept));
  } catch (error) {
    console.error('Error creating concept:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /concepts/:id - Actualizar concepto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, category } = req.body;

    const concept = await conceptService.updateConcept(id, {
      name,
      description,
      color,
      category
    });

    if (!concept) {
      return res.status(404).json({ error: 'Concepto no encontrado' });
    }

    res.json(toConceptWithStats(concept));
  } catch (error) {
    console.error('Error updating concept:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /concepts/:id - Eliminar concepto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await conceptService.deleteConcept(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Concepto no encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting concept:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
