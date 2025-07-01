import { NoteService } from '@/services/note/note.service';
import { toImageWithStats } from '@/transformers/image/image.transformer';
import { toNoteWithStats } from '@/transformers/note/note.transformer';
import express from 'express';

const router = express.Router();
const noteService = new NoteService();

// GET /notes - Listar notas con filtros
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

    const { notes, total } = await noteService.getNotes(filters);
    const transformedNotes = notes.map(toNoteWithStats);

    res.json({
      data: transformedNotes,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasNext: filters.offset + filters.limit < total,
        hasPrev: filters.offset > 0
      }
    });
  } catch (error) {
    console.error('Error getting notes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /notes/:id - Obtener nota por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const note = await noteService.getNoteById(id);

    if (!note) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }

    res.json(toNoteWithStats(note));
  } catch (error) {
    console.error('Error getting note:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /notes/:id/images - Obtener imágenes de una nota
router.get('/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const images = await noteService.getNoteImages(id);
    const transformedImages = images.map(toImageWithStats);

    res.json(transformedImages);
  } catch (error) {
    console.error('Error getting note images:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /notes - Crear nueva nota
router.post('/', async (req, res) => {
  try {
    const { name, content, color, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const note = await noteService.createNote({
      name,
      content,
      color,
      category
    });

    res.status(201).json(toNoteWithStats(note));
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /notes/:id - Actualizar nota
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, color, category } = req.body;

    const note = await noteService.updateNote(id, {
      name,
      content,
      color,
      category
    });

    if (!note) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }

    res.json(toNoteWithStats(note));
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /notes/:id - Eliminar nota
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await noteService.deleteNote(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
