import { GroupService } from '@/services/group/group.service';
import { toGroupWithStats } from '@/transformers/group/group.transformer';
import express from 'express';

const router = express.Router();
const groupService = new GroupService();

// GET /groups - Listar groups con filtros
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

    const { groups, total } = await groupService.getGroups(filters);
    const transformedGroups = groups.map(toGroupWithStats);

    res.json({
      data: transformedGroups,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasNext: filters.offset + filters.limit < total,
        hasPrev: filters.offset > 0
      }
    });
  } catch (error) {
    console.error('Error getting groups:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /groups/:id - Obtener group por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const group = await groupService.getGroupById(id);

    if (!group) {
      return res.status(404).json({ error: 'Group no encontrado' });
    }

    res.json(toGroupWithStats(group));
  } catch (error) {
    console.error('Error getting group:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /groups/:id/images - Obtener imágenes del group
router.get('/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      limit = '50',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      limit: Number.parseInt(limit as string),
      offset: Number.parseInt(offset as string),
      sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const { images, total } = await groupService.getGroupImages(id, filters);

    res.json({
      data: images,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasNext: filters.offset + filters.limit < total,
        hasPrev: filters.offset > 0
      }
    });
  } catch (error) {
    console.error('Error getting group images:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /groups - Crear nuevo group
router.post('/', async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const group = await groupService.createGroup({
      name,
      description,
      isPublic
    });

    res.status(201).json(toGroupWithStats(group));
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /groups/:id - Actualizar group
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isPublic } = req.body;

    const group = await groupService.updateGroup(id, {
      name,
      description,
      isPublic
    });

    if (!group) {
      return res.status(404).json({ error: 'Group no encontrado' });
    }

    res.json(toGroupWithStats(group));
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /groups/:id - Eliminar group
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await groupService.deleteGroup(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Group no encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /groups/:id/images/:imageId - Agregar imagen al group
router.post('/:id/images/:imageId', async (req, res) => {
  try {
    const { id, imageId } = req.params;

    await groupService.addImageToGroup(id, imageId);

    res.status(201).json({ message: 'Imagen agregada al group correctamente' });
  } catch (error) {
    console.error('Error adding image to group:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /groups/:id/images/:imageId - Remover imagen del group
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const { id, imageId } = req.params;

    await groupService.removeImageFromGroup(id, imageId);

    res.status(204).send();
  } catch (error) {
    console.error('Error removing image from group:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;