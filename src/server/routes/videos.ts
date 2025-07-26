import { Router } from 'express';
import { z } from 'zod';
import {
	createVideo,
	deleteVideo,
	getVideoById,
	getVideoFormatStats,
	getVideos,
	updateVideo,
} from '../services/video.server.service';

const router = Router();

const VideoCreateSchema = z.object({
	name: z.string().min(1),
	description: z.string().nullable().optional(),
	path: z.string().min(1),
	hash: z.string().min(1),
	size: z.number().min(0),
	duration: z.number().min(0),
	width: z.number().int().min(0).nullable().optional(),
	height: z.number().int().min(0).nullable().optional(),
	metadata: z.string().nullable().optional(),
	thumbnail: z.string().nullable().optional(),
	thumbnailSize: z.number().int().min(0).nullable().optional(),
	thumbnailWidth: z.number().int().min(0).nullable().optional(),
	thumbnailHeight: z.number().int().min(0).nullable().optional(),
	isPublic: z.boolean().optional(),
	isFavorite: z.boolean().optional(),
	isHidden: z.boolean().optional(),
	folderId: z.string().min(1),
});

const VideoUpdateSchema = VideoCreateSchema.partial();

// GET /api/videos - Obtener videos con filtros
router.get('/', async (req, res) => {
	try {
		const filters = req.query; // Los filtros se validan en el servicio
		const result = await getVideos(filters);
		res.json(result);
	} catch (error) {
		console.error('Error al obtener videos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/videos/:id - Obtener un video por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const video = await getVideoById(id);
		res.json(video);
	} catch (error) {
		console.error('Error al obtener video:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/videos - Crear nuevo video
router.post('/', async (req, res) => {
	try {
		const validatedData = VideoCreateSchema.parse(req.body);
		const newVideo = await createVideo(validatedData);
		res.status(201).json(newVideo);
	} catch (error) {
		console.error('Error al crear video:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PUT /api/videos/:id - Actualizar video
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const validatedData = VideoUpdateSchema.parse(req.body);
		const updatedVideo = await updateVideo(id, validatedData);
		res.json(updatedVideo);
	} catch (error) {
		console.error('Error al actualizar video:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DELETE /api/videos/:id - Eliminar video
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const result = await deleteVideo(id);
		if (!result.success) {
			res.status(404).json({ error: 'Video no encontrado' });; return;
		}
		res.json({
			success: true,
			message: 'Video eliminado correctamente',
			deletedId: id,
		});
	} catch (error) {
		console.error('Error al eliminar video:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/videos/stats/formats - Obtener estadísticas de formatos de video
router.get('/stats/formats', async (_req, res) => {
	try {
		const formatStats = await getVideoFormatStats();
		res.json({
			data: formatStats.map((stat: any) => ({
				format: stat.format,
				count: stat.count,
				totalSize: stat.sumSize || 0,
				avgDuration: stat.avgDuration,
				avgWidth: stat.avgWidth,
				avgHeight: stat.avgHeight,
			})),
		});
	} catch (error) {
		console.error('Error al obtener estadísticas de formatos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

export { router as videosRouter };
