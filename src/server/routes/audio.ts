import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const CreateAudioSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(255),
	path: z.string().min(1, 'La ruta es requerida'),
	size: z.number().int().positive(),
	mimeType: z.string().max(100),

	// Metadatos de audio específicos
	duration: z.number().positive().optional().nullable(),
	bitrate: z.number().int().positive().optional().nullable(),
	sampleRate: z.number().int().positive().optional().nullable(),
	channels: z.number().int().positive().default(2).optional(),
	codec: z.string().max(50).optional().nullable(),
	format: z.string().max(50).optional().nullable(),

	// Metadatos adicionales
	title: z.string().max(255).optional().nullable(),
	artist: z.string().max(255).optional().nullable(),
	album: z.string().max(255).optional().nullable(),
	genre: z.string().max(100).optional().nullable(),
	year: z.number().int().min(1900).max(new Date().getFullYear()).optional().nullable(),
	track: z.number().int().positive().optional().nullable(),

	// Propiedades base
	isHidden: z.boolean().default(false).optional(),
	isFavorite: z.boolean().default(false).optional(),
	tags: z.string().default('[]').optional(),
	notes: z.string().default('').optional(),

	// Relaciones opcionales
	folderId: z.string().uuid().optional().nullable(),
});

const UpdateAudioSchema = CreateAudioSchema.partial();

const AudioFiltersSchema = z.object({
	folderId: z.string().uuid().optional(),
	codec: z.string().optional(),
	format: z.string().optional(),
	genre: z.string().optional(),
	artist: z.string().optional(),
	album: z.string().optional(),
	isFavorite: z.boolean().optional(),
	isHidden: z.boolean().optional(),
	minDuration: z.number().positive().optional(),
	maxDuration: z.number().positive().optional(),
	minBitrate: z.number().int().positive().optional(),
	maxBitrate: z.number().int().positive().optional(),
	minSize: z.number().int().positive().optional(),
	maxSize: z.number().int().positive().optional(),
	search: z.string().optional(),
	limit: z.number().int().positive().max(100).default(20).optional(),
	offset: z.number().int().min(0).default(0).optional(),
	sortBy: z
		.enum(['name', 'createdAt', 'updatedAt', 'size', 'duration', 'bitrate', 'artist', 'album'])
		.default('name')
		.optional(),
	sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
});

const audioInclude = {
	folder: { select: { id: true, name: true, path: true } },
	albums: { select: { id: true, name: true, emoji: true, color: true } },
	tags: { select: { id: true, name: true, emoji: true, color: true } },
	characters: { select: { id: true, name: true, emoji: true, color: true } },
	collections: { select: { id: true, name: true, emoji: true, color: true } },
	places: { select: { id: true, name: true, emoji: true, color: true } },
	_count: {
		select: {
			albums: true,
			tags: true,
			characters: true,
			collections: true,
			places: true,
			worldItems: true,
			concepts: true,
			prompts: true,
			notes: true,
			wildcards: true,
			properties: true,
			groups: true,
		},
	},
};

// GET /api/audio
router.get('/', async (req, res) => {
	try {
		const filtersResult = AudioFiltersSchema.safeParse(req.query);
		if (!filtersResult.success) {
			return res.status(400).json({ error: 'Parámetros de filtro inválidos', details: filtersResult.error.errors });
		}

		const filters = filtersResult.data;
		const where: any = {};

		if (filters.folderId) where.folderId = filters.folderId;
		if (filters.codec) where.codec = filters.codec;
		if (filters.format) where.format = filters.format;
		if (filters.genre) where.genre = filters.genre;
		if (filters.artist) where.artist = { contains: filters.artist, mode: 'insensitive' };
		if (filters.album) where.album = { contains: filters.album, mode: 'insensitive' };
		if (filters.isFavorite !== undefined) where.isFavorite = filters.isFavorite;
		if (filters.isHidden !== undefined) where.isHidden = filters.isHidden;

		if (filters.minDuration || filters.maxDuration) {
			where.duration = {};
			if (filters.minDuration) where.duration.gte = filters.minDuration;
			if (filters.maxDuration) where.duration.lte = filters.maxDuration;
		}

		if (filters.minBitrate || filters.maxBitrate) {
			where.bitrate = {};
			if (filters.minBitrate) where.bitrate.gte = filters.minBitrate;
			if (filters.maxBitrate) where.bitrate.lte = filters.maxBitrate;
		}

		if (filters.minSize || filters.maxSize) {
			where.size = {};
			if (filters.minSize) where.size.gte = filters.minSize;
			if (filters.maxSize) where.size.lte = filters.maxSize;
		}

		if (filters.search) {
			where.OR = [
				{ name: { contains: filters.search, mode: 'insensitive' } },
				{ title: { contains: filters.search, mode: 'insensitive' } },
				{ artist: { contains: filters.search, mode: 'insensitive' } },
				{ album: { contains: filters.search, mode: 'insensitive' } },
				{ genre: { contains: filters.search, mode: 'insensitive' } },
				{ notes: { contains: filters.search, mode: 'insensitive' } },
			];
		}

		const orderBy: any = {};
		orderBy[filters.sortBy || 'name'] = filters.sortOrder || 'asc';

		const [audioFiles, total] = await Promise.all([
			prisma.audio.findMany({ where, include: audioInclude, orderBy, take: filters.limit, skip: filters.offset }),
			prisma.audio.count({ where }),
		]);

		res.json({
			data: audioFiles,
			pagination: {
				total,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: (filters.offset || 0) + (filters.limit || 20) < total,
				hasPrev: (filters.offset || 0) > 0,
			},
		});
	} catch (error) {
		console.error('Error al obtener archivos de audio:', error);
		res
			.status(500)
			.json({
				error: 'Error interno del servidor',
				message: error instanceof Error ? error.message : 'Error desconocido',
			});
	}
});

// GET /api/audio/:id
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de audio inválido' });
		}

		const audio = await prisma.audio.findUnique({
			where: { id },
			include: audioInclude,
		});

		if (!audio) {
			return res.status(404).json({ error: 'Archivo de audio no encontrado' });
		}

		res.json(audio);
	} catch (error) {
		console.error('Error al obtener archivo de audio:', error);
		res
			.status(500)
			.json({
				error: 'Error interno del servidor',
				message: error instanceof Error ? error.message : 'Error desconocido',
			});
	}
});

// POST /api/audio
router.post('/', async (req, res) => {
	try {
		const validationResult = CreateAudioSchema.safeParse(req.body);
		if (!validationResult.success) {
			return res.status(400).json({ error: 'Datos de entrada inválidos', details: validationResult.error.errors });
		}

		const data = validationResult.data;
		const existingAudio = await prisma.audio.findFirst({ where: { path: data.path } });
		if (existingAudio) {
			return res.status(409).json({ error: 'Ya existe un archivo de audio con esa ruta' });
		}

		const newAudio = await prisma.audio.create({
			data: {
				name: data.name,
				path: data.path,
				size: data.size,
				mimeType: data.mimeType,
				duration: data.duration,
				bitrate: data.bitrate,
				sampleRate: data.sampleRate,
				channels: data.channels || 2,
				codec: data.codec,
				format: data.format,
				title: data.title,
				artist: data.artist,
				album: data.album,
				genre: data.genre,
				year: data.year,
				track: data.track,
				isHidden: data.isHidden || false,
				isFavorite: data.isFavorite || false,
				tags: data.tags || '[]',
				notes: data.notes || '',
				folderId: data.folderId,
			},
			include: audioInclude,
		});

		res.status(201).json(newAudio);
	} catch (error) {
		console.error('Error al crear archivo de audio:', error);
		res
			.status(500)
			.json({
				error: 'Error interno del servidor',
				message: error instanceof Error ? error.message : 'Error desconocido',
			});
	}
});

// PUT /api/audio/:id
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de audio inválido' });
		}

		const validationResult = UpdateAudioSchema.safeParse(req.body);
		if (!validationResult.success) {
			return res.status(400).json({ error: 'Datos de entrada inválidos', details: validationResult.error.errors });
		}

		const data = validationResult.data;
		const existingAudio = await prisma.audio.findUnique({ where: { id } });
		if (!existingAudio) {
			return res.status(404).json({ error: 'Archivo de audio no encontrado' });
		}

		if (data.path && data.path !== existingAudio.path) {
			const duplicateAudio = await prisma.audio.findFirst({ where: { path: data.path, id: { not: id } } });
			if (duplicateAudio) {
				return res.status(409).json({ error: 'Ya existe un archivo de audio con esa ruta' });
			}
		}

		const updatedAudio = await prisma.audio.update({
			where: { id },
			data: {
				...(data.name && { name: data.name }),
				...(data.path && { path: data.path }),
				...(data.size && { size: data.size }),
				...(data.mimeType && { mimeType: data.mimeType }),
				...(data.duration !== undefined && { duration: data.duration }),
				...(data.bitrate !== undefined && { bitrate: data.bitrate }),
				...(data.sampleRate !== undefined && { sampleRate: data.sampleRate }),
				...(data.channels !== undefined && { channels: data.channels }),
				...(data.codec !== undefined && { codec: data.codec }),
				...(data.format !== undefined && { format: data.format }),
				...(data.title !== undefined && { title: data.title }),
				...(data.artist !== undefined && { artist: data.artist }),
				...(data.album !== undefined && { album: data.album }),
				...(data.genre !== undefined && { genre: data.genre }),
				...(data.year !== undefined && { year: data.year }),
				...(data.track !== undefined && { track: data.track }),
				...(data.isHidden !== undefined && { isHidden: data.isHidden }),
				...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
				...(data.tags !== undefined && { tags: data.tags }),
				...(data.notes !== undefined && { notes: data.notes }),
				...(data.folderId !== undefined && { folderId: data.folderId }),
			},
			include: audioInclude,
		});

		res.json(updatedAudio);
	} catch (error) {
		console.error('Error al actualizar archivo de audio:', error);
		res
			.status(500)
			.json({
				error: 'Error interno del servidor',
				message: error instanceof Error ? error.message : 'Error desconocido',
			});
	}
});

// DELETE /api/audio/:id
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de audio inválido' });
		}

		const existingAudio = await prisma.audio.findUnique({
			where: { id },
			include: { _count: { select: { albums: true, tags: true, characters: true } } },
		});

		if (!existingAudio) {
			return res.status(404).json({ error: 'Archivo de audio no encontrado' });
		}

		await prisma.audio.delete({ where: { id } });

		res.json({
			success: true,
			message: 'Archivo de audio eliminado correctamente',
			deletedId: id,
			stats: {
				albumsCount: existingAudio._count.albums,
				tagsCount: existingAudio._count.tags,
				charactersCount: existingAudio._count.characters,
			},
		});
	} catch (error) {
		console.error('Error al eliminar archivo de audio:', error);
		res
			.status(500)
			.json({
				error: 'Error interno del servidor',
				message: error instanceof Error ? error.message : 'Error desconocido',
			});
	}
});

// GET /api/audio/stats/formats
router.get('/stats/formats', async (req, res) => {
	try {
		const formatStats = await prisma.audio.groupBy({
			by: ['format'],
			_count: { format: true },
			_sum: { size: true },
			_avg: { duration: true, bitrate: true },
			orderBy: { _count: { format: 'desc' } },
		});

		res.json({
			data: formatStats.map((stat) => ({
				format: stat.format,
				count: stat._count.format,
				totalSize: stat._sum.size || 0,
				avgDuration: stat._avg.duration,
				avgBitrate: stat._avg.bitrate,
			})),
		});
	} catch (error) {
		console.error('Error al obtener estadísticas de formatos:', error);
		res
			.status(500)
			.json({
				error: 'Error interno del servidor',
				message: error instanceof Error ? error.message : 'Error desconocido',
			});
	}
});

// GET /api/audio/stats/genres
router.get('/stats/genres', async (req, res) => {
	try {
		const genreStats = await prisma.audio.groupBy({
			by: ['genre'],
			_count: { genre: true },
			orderBy: { _count: { genre: 'desc' } },
		});

		res.json({
			data: genreStats.map((stat) => ({
				genre: stat.genre,
				count: stat._count.genre,
			})),
		});
	} catch (error) {
		console.error('Error al obtener estadísticas de géneros:', error);
		res
			.status(500)
			.json({
				error: 'Error interno del servidor',
				message: error instanceof Error ? error.message : 'Error desconocido',
			});
	}
});

export { router as audioRouter };
