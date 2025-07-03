import { Router } from 'express';
import { createAudio, getAudios, getAudioById, updateAudio, deleteAudio, getAudioCount } from '@/services/audio/audio.service';

// GET /api/audio
const router = Router();

// GET /api/audio
router.get('/', async (req, res) => {
	try {
		const audios = await getAudios();
		res.json(audios);
	} catch (error) {
		console.error('Error al obtener archivos de audio:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/audio/:id
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const audio = await getAudioById(id);

		if (!audio) {
			return res.status(404).json({ error: 'Archivo de audio no encontrado' });
		}

		res.json(audio);
	} catch (error) {
		console.error('Error al obtener archivo de audio:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/audio
router.post('/', async (req, res) => {
	try {
		const newAudio = await createAudio(req.body);
		res.status(201).json(newAudio);
	} catch (error) {
		console.error('Error al crear archivo de audio:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PUT /api/audio/:id
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const updatedAudio = await updateAudio(id, req.body);
		res.json(updatedAudio);
	} catch (error) {
		console.error('Error al actualizar archivo de audio:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DELETE /api/audio/:id
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		await deleteAudio(id);
		res.json({
			success: true,
			message: 'Archivo de audio eliminado correctamente',
			deletedId: id,
		});
	} catch (error) {
		console.error('Error al eliminar archivo de audio:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/audio/stats/formats
router.get('/stats/formats', async (req, res) => {
	try {
		const formatStats = await getAudioFormatStats();
		res.json({
			data: formatStats,
		});
	} catch (error) {
		console.error('Error al obtener estadísticas de formatos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/audio/stats/genres
router.get('/stats/genres', async (req, res) => {
	try {
		const genreStats = await getAudioGenreStats();
		res.json({
			data: genreStats,
		});
	} catch (error) {
		console.error('Error al obtener estadísticas de géneros:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

export { router as audioRouter };
