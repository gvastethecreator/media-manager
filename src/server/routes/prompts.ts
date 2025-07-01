import { PromptService } from '@/services/prompt/prompt.service';
import { toImageWithStats } from '@/transformers/image/image.transformer';
import { toPromptWithStats } from '@/transformers/prompt/prompt.transformer';
import express from 'express';

const router = express.Router();
const promptService = new PromptService();

// GET /prompts - Listar prompts con filtros
router.get('/', async (req, res) => {
	try {
		const { search, limit = '50', offset = '0', sortBy = 'name', sortOrder = 'asc' } = req.query;

		const filters = {
			search: search as string,
			limit: Number.parseInt(limit as string),
			offset: Number.parseInt(offset as string),
			sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt' | 'imageCount',
			sortOrder: sortOrder as 'asc' | 'desc',
		};

		const { prompts, total } = await promptService.getPrompts(filters);
		const transformedPrompts = prompts.map(toPromptWithStats);

		res.json({
			data: transformedPrompts,
			pagination: {
				total,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: filters.offset + filters.limit < total,
				hasPrev: filters.offset > 0,
			},
		});
	} catch (error) {
		console.error('Error getting prompts:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /prompts/:id - Obtener prompt por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const prompt = await promptService.getPromptById(id);

		if (!prompt) {
			return res.status(404).json({ error: 'Prompt no encontrado' });
		}

		res.json(toPromptWithStats(prompt));
	} catch (error) {
		console.error('Error getting prompt:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /prompts/:id/images - Obtener imágenes de un prompt
router.get('/:id/images', async (req, res) => {
	try {
		const { id } = req.params;
		const images = await promptService.getPromptImages(id);
		const transformedImages = images.map(toImageWithStats);

		res.json(transformedImages);
	} catch (error) {
		console.error('Error getting prompt images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /prompts - Crear nuevo prompt
router.post('/', async (req, res) => {
	try {
		const { name, content, description, category, tags } = req.body;

		if (!name || !content) {
			return res.status(400).json({ error: 'El nombre y contenido son requeridos' });
		}

		const prompt = await promptService.createPrompt({
			name,
			content,
			description,
			category,
			tags,
		});

		res.status(201).json(toPromptWithStats(prompt));
	} catch (error) {
		console.error('Error creating prompt:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /prompts/:id - Actualizar prompt
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name, content, description, category, tags } = req.body;

		const prompt = await promptService.updatePrompt(id, {
			name,
			content,
			description,
			category,
			tags,
		});

		if (!prompt) {
			return res.status(404).json({ error: 'Prompt no encontrado' });
		}

		res.json(toPromptWithStats(prompt));
	} catch (error) {
		console.error('Error updating prompt:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /prompts/:id - Eliminar prompt
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const deleted = await promptService.deletePrompt(id);

		if (!deleted) {
			return res.status(404).json({ error: 'Prompt no encontrado' });
		}

		res.status(204).send();
	} catch (error) {
		console.error('Error deleting prompt:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
