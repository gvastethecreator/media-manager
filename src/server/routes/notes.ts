import { Router } from 'express';
import { z } from 'zod';
import * as noteService from '@/services/note/note.service';
import { toImageWithStats } from '@/transformers/image';
import { toNoteWithStats } from '@/transformers/note';

const router = Router();

const NoteCreateSchema = z.object({
	title: z.string().min(1),
	content: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	priority: z.number().int().min(0).max(4).optional(),
	status: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().optional(),
	presetId: z.string().nullable().optional(),
});

const NoteUpdateSchema = NoteCreateSchema.partial();

// GET /notes - Listar notas con filtros
router.get('/', async (req, res) => {
	try {
		const { search, limit = '50', offset = '0', sortBy = 'name', sortOrder = 'asc' } = req.query;

		const filters = {
			search: search as string,
			limit: Number.parseInt(limit as string),
			offset: Number.parseInt(offset as string),
			sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
			sortOrder: sortOrder as 'asc' | 'desc',
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
				hasPrev: filters.offset > 0,
			},
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
			res.status(404).json({ error: 'Nota no encontrada' });; return;
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

// GET /notes/:id/recent-images - Obtener imágenes recientes de una nota
router.get('/:id/recent-images', async (req, res) => {
	try {
		const { id } = req.params;
		const limit = Number(req.query.limit) || 6;
		const images = await noteService.getRecentNoteImages(id, limit);
		res.json(images);
	} catch (error) {
		console.error('Error getting recent note images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /notes/:id/counts - Obtener recuentos de una nota
router.get('/:id/counts', async (req, res) => {
	try {
		const { id } = req.params;
		const counts = await noteService.getNoteCounts(id);
		res.json(counts);
	} catch (error) {
		console.error('Error getting note counts:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /notes/statuses - Obtener estados disponibles para notas
router.get('/statuses', async (_req, res) => {
	try {
		const statuses = await noteService.getNoteStatuses();
		res.json(statuses);
	} catch (error) {
		console.error('Error getting note statuses:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /notes - Crear nueva nota
router.post('/', async (req, res) => {
	try {
		const validatedData = NoteCreateSchema.parse(req.body);
		const newNote = await noteService.createNote(validatedData);
		res.status(201).json(toNoteWithStats(newNote));
	} catch (error) {
		console.error('Error creating note:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /notes/:id - Actualizar nota
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const validatedData = NoteUpdateSchema.parse(req.body);
		const note = await noteService.updateNote(id, validatedData);

		if (!note) {
			res.status(404).json({ error: 'Nota no encontrada' });; return;
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
			res.status(404).json({ error: 'Nota no encontrada' });; return;
		}

		res.status(204).send();
	} catch (error) {
		console.error('Error deleting note:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
