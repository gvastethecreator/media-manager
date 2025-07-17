import { Router } from 'express';
import { z } from 'zod';
import {
	deleteUploadedImage,
	getUploadedImage,
	getUploadedImageStats,
	getUploadedImages,
	uploadImages,
} from '@/server/services/uploaded-images.api.service';

const router = Router();

const UploadedImageCreateSchema = z.object({
	name: z.string().min(1),
	path: z.string().min(1),
	size: z.number().min(0),
	hash: z.string().min(1),
	metadata: z.string().nullable().optional(),
	imageId: z.string().min(1),
});

const UploadedImageUpdateSchema = UploadedImageCreateSchema.partial();

// GET /uploaded-images/stats - Obtener estadísticas de imágenes subidas (DEBE IR ANTES QUE /:id)
router.get('/stats', async (_req, res) => {
	const result = await getUploadedImageStats();

	if (!result.success) {
		return res.status(500).json({ error: result.error });
	}

	res.json(result.stats);
});

// GET /uploaded-images - Obtener lista de imágenes subidas con filtros
router.get('/', async (req, res) => {
	const { limit, offset, category, searchTerm, orderBy, orderDir } = req.query;

	const filters = {
		limit: limit ? Number.parseInt(limit as string) : undefined,
		offset: offset ? Number.parseInt(offset as string) : undefined,
		category: category as string,
		search: searchTerm as string,
		sortBy: orderBy as any,
		sortOrder: orderDir as any,
	};

	const result = await getUploadedImages(filters);

	if (!result.success) {
		return res.status(500).json({ error: result.error });
	}

	res.json({
		data: result.items,
		pagination: {
			total: result.total,
			limit: result.pageSize,
			offset: result.page ? (result.page - 1) * result.pageSize : 0,
			hasNext: result.page ? result.page * result.pageSize < result.total : false,
			hasPrev: result.page ? result.page > 1 : false,
		},
		stats: result.stats,
	});
});

// GET /uploaded-images/:id - Obtener datos de una imagen subida por ID
router.get('/:id', async (req, res) => {
	const { id } = req.params;

	const result = await getUploadedImage(id);

	if (!result.success) {
		return res.status(404).json({ error: result.error });
	}

	res.json(result.item);
});

// DELETE /uploaded-images/:id - Eliminar imagen subida
router.delete('/:id', async (req, res) => {
	const { id } = req.params;

	const result = await deleteUploadedImage(id);

	if (!result.success) {
		return res.status(500).json({ error: result.error });
	}

	res.json(result);
});

// POST /uploaded-images - Subir imágenes
router.post('/', async (req, res) => {
	const formData = req.body; // FormData se maneja en el middleware

	const result = await uploadImages(formData);

	if (!result.success) {
		return res.status(500).json({ error: result.error });
	}

	res.status(201).json(result);
});

export type { router as uploadedImagesRouter };

// Exportación default para compatibilidad con server/index.ts
export default router;
