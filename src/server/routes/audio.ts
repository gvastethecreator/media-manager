import { Router } from 'express';
import { z } from 'zod';
import {
	createAudio,
	deleteAudio,
	getAudioById,
	getAudioFormatStats,
	getAudioGenreStats,
	getAudios,
	updateAudio,
} from '@/services/audio/audio.service';

const router = Router();

const AudioCreateSchema = z.object({
	name: z.string().min(1),
	path: z.string().min(1),
	size: z.number().min(0),
	hash: z.string().min(1),
	mimeType: z.string().min(1),
	extension: z.string().min(1),
	folderId: z.string().min(1),
	isFavorite: z.boolean().optional(),
	isArchived: z.boolean().optional(),
	duration: z.number().nullable().optional(),
	bitrate: z.number().nullable().optional(),
	sampleRate: z.number().nullable().optional(),
	channels: z.number().nullable().optional(),
	format: z.string().nullable().optional(),
	codec: z.string().nullable().optional(),
	title: z.string().nullable().optional(),
	artist: z.string().nullable().optional(),
	album: z.string().nullable().optional(),
	year: z.number().nullable().optional(),
	genre: z.string().nullable().optional(),
	track: z.number().nullable().optional(),
	disc: z.number().nullable().optional(),
	albumArtist: z.string().nullable().optional(),
	composer: z.string().nullable().optional(),
	comment: z.string().nullable().optional(),
	lyrics: z.string().nullable().optional(),
	bpm: z.number().nullable().optional(),
	key: z.string().nullable().optional(),
	mood: z.string().nullable().optional(),
});

const AudioUpdateSchema = AudioCreateSchema.partial();

// GET /api/audio
router.get('/', async (_req, res) => {
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
		const validatedData = AudioCreateSchema.parse(req.body);
		const newAudio = await createAudio(validatedData);
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
		const validatedData = AudioUpdateSchema.parse(req.body);
		const updatedAudio = await updateAudio(id, validatedData);
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
		const result = await deleteAudio(id);
		if (!result.success) {
			return res.status(404).json({ error: 'Archivo de audio no encontrado' });
		}
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
router.get('/stats/formats', async (_req, res) => {
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
router.get('/stats/genres', async (_req, res) => {
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
