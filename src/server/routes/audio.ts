import { Router } from 'express';
import { z } from 'zod';
import type { ExpressHandler } from '@/lib/express-types';
import { serverLogger } from '@/lib/logger/server-logger';
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
	key: z.string().nullable(),
	mood: z.string().nullable().optional(),
});

const AudioUpdateSchema = AudioCreateSchema.partial();

// GET /api/audio
const getAudiosHandler: ExpressHandler = async (_req, res) => {
	try {
		const audios = await getAudios();
		res.json(audios);
	} catch (error) {
		serverLogger.error('Error al obtener archivos de audio:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
};

router.get('/', getAudiosHandler);

// GET /api/audio/:id
const getAudioByIdHandler: ExpressHandler = async (req, res) => {
	try {
		const { id } = req.params;
		const audio = await getAudioById(id);

		if (!audio) {
			res.status(404).json({ error: 'Archivo de audio no encontrado' });
			return;
		}

		res.json(audio);
	} catch (error) {
		serverLogger.error('Error al obtener archivo de audio:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
};

router.get('/:id', getAudioByIdHandler);

// POST /api/audio
const createAudioHandler: ExpressHandler = async (req, res) => {
	try {
		const validatedData = AudioCreateSchema.parse(req.body);
		// Normalizar campos undefined a null para compatibilidad con AudioCreateInput
		const audioData: any = { ...validatedData };

		// Convertir undefined a valores apropiados según el tipo esperado
		for (const key of Object.keys(audioData)) {
			if (audioData[key] === undefined) {
				// Para campos booleanos usar false por defecto
				if (['isFavorite', 'isArchived'].includes(key)) {
					audioData[key] = false;
				} else {
					// Para otros campos usar null
					audioData[key] = null;
				}
			}
		}

		const newAudio = await createAudio(audioData);
		res.status(201).json(newAudio);
	} catch (error) {
		serverLogger.error('Error al crear archivo de audio:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
};

router.post('/', createAudioHandler);

// PUT /api/audio/:id
const updateAudioHandler: ExpressHandler = async (req, res) => {
	try {
		const { id } = req.params;
		const validatedData = AudioUpdateSchema.parse(req.body);
		const updatedAudio = await updateAudio(id, validatedData);
		res.json(updatedAudio);
	} catch (error) {
		serverLogger.error('Error al actualizar archivo de audio:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
};

router.put('/:id', updateAudioHandler);

// DELETE /api/audio/:id
const deleteAudioHandler: ExpressHandler = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await deleteAudio(id);
		if (!result.success) {
			res.status(404).json({ error: 'Archivo de audio no encontrado' });
			return;
		}
		res.json({
			success: true,
			message: 'Archivo de audio eliminado correctamente',
			deletedId: id,
		});
	} catch (error) {
		serverLogger.error('Error al eliminar archivo de audio:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
};

router.delete('/:id', deleteAudioHandler);

// GET /api/audio/stats/formats
const getAudioFormatStatsHandler: ExpressHandler = async (_req, res) => {
	try {
		const formatStats = await getAudioFormatStats();
		res.json({
			data: formatStats,
		});
	} catch (error) {
		serverLogger.error('Error al obtener estadísticas de formatos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
};

router.get('/stats/formats', getAudioFormatStatsHandler);

// GET /api/audio/stats/genres
const getAudioGenreStatsHandler: ExpressHandler = async (_req, res) => {
	try {
		const genreStats = await getAudioGenreStats();
		res.json({
			data: genreStats,
		});
	} catch (error) {
		serverLogger.error('Error al obtener estadísticas de géneros:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
};

router.get('/stats/genres', getAudioGenreStatsHandler);

export { router as audioRouter };
