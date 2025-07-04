import { Router } from 'express';
import {
	createVideo,
	deleteVideo,
	getVideoById,
	getVideoFormatStats,
	getVideos,
	updateVideo,
} from '../services/video.server.service';

const router = Router();

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
		const newVideo = await createVideo(req.body);
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
		const updatedVideo = await updateVideo(id, req.body);
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
		await deleteVideo(id);
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
router.get('/stats/formats', async (req, res) => {
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
