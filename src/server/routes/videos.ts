import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const CreateVideoSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(255),
	path: z.string().min(1, 'La ruta es requerida'),
	size: z.number().int().positive(),
	mimeType: z.string().max(100),

	// Metadatos de video específicos
	duration: z.number().positive().optional().nullable(),
	width: z.number().int().positive().optional().nullable(),
	height: z.number().int().positive().optional().nullable(),
	framerate: z.number().positive().optional().nullable(),
	bitrate: z.number().int().positive().optional().nullable(),
	codec: z.string().max(50).optional().nullable(),
	format: z.string().max(50).optional().nullable(),

	// Propiedades base
	isHidden: z.boolean().default(false).optional(),
	isFavorite: z.boolean().default(false).optional(),
	tags: z.string().default('[]').optional(),
	notes: z.string().default('').optional(),

	// Relaciones opcionales
	folderId: z.string().uuid().optional().nullable(),
});

const UpdateVideoSchema = CreateVideoSchema.partial();

const VideoFiltersSchema = z.object({
	folderId: z.string().uuid().optional(),
	codec: z.string().optional(),
	format: z.string().optional(),
	isFavorite: z.boolean().optional(),
	isHidden: z.boolean().optional(),
	minDuration: z.number().positive().optional(),
	maxDuration: z.number().positive().optional(),
	minWidth: z.number().int().positive().optional(),
	maxWidth: z.number().int().positive().optional(),
	minHeight: z.number().int().positive().optional(),
	maxHeight: z.number().int().positive().optional(),
	minSize: z.number().int().positive().optional(),
	maxSize: z.number().int().positive().optional(),
	search: z.string().optional(),
	limit: z.number().int().positive().max(100).default(20).optional(),
	offset: z.number().int().min(0).default(0).optional(),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'size', 'duration', 'width', 'height']).default('name').optional(),
	sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
});

const videoInclude = {
	folder: { select: { id: true, name: true, path: true } },
	albums: { select: { id: true, name: true, emoji: true, color: true } },
	collections: { select: { id: true, name: true, emoji: true, color: true } },
	tags: { select: { id: true, name: true, emoji: true, color: true } },
	characters: { select: { id: true, name: true, emoji: true, color: true } },
	places: { select: { id: true, name: true, emoji: true, color: true } },
	_count: {
		select: {
			albums: true,
			collections: true,
			tags: true,
			characters: true,
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

// GET /api/videos
router.get('/', async (req, res) => {
	try {
		const filtersResult = VideoFiltersSchema.safeParse(req.query);
		if (!filtersResult.success) {
			return res.status(400).json({ error: 'Parámetros de filtro inválidos', details: filtersResult.error.errors });
		}

		const filters = filtersResult.data;
		const where: any = {};

		if (filters.folderId) where.folderId = filters.folderId;
		if (filters.codec) where.codec = filters.codec;
		if (filters.format) where.format = filters.format;
		if (filters.isFavorite !== undefined) where.isFavorite = filters.isFavorite;
		if (filters.isHidden !== undefined) where.isHidden = filters.isHidden;

		if (filters.minDuration || filters.maxDuration) {
			where.duration = {};
			if (filters.minDuration) where.duration.gte = filters.minDuration;
			if (filters.maxDuration) where.duration.lte = filters.maxDuration;
		}

		if (filters.minWidth || filters.maxWidth) {
			where.width = {};
			if (filters.minWidth) where.width.gte = filters.minWidth;
			if (filters.maxWidth) where.width.lte = filters.maxWidth;
		}

		if (filters.minHeight || filters.maxHeight) {
			where.height = {};
			if (filters.minHeight) where.height.gte = filters.minHeight;
			if (filters.maxHeight) where.height.lte = filters.maxHeight;
		}

		if (filters.minSize || filters.maxSize) {
			where.size = {};
			if (filters.minSize) where.size.gte = filters.minSize;
			if (filters.maxSize) where.size.lte = filters.maxSize;
		}

		if (filters.search) {
			where.OR = [
				{ name: { contains: filters.search, mode: 'insensitive' } },
				{ notes: { contains: filters.search, mode: 'insensitive' } },
			];
		}

		const orderBy: any = {};
		orderBy[filters.sortBy || 'name'] = filters.sortOrder || 'asc';

		const [videos, total] = await Promise.all([
			prisma.video.findMany({ where, include: videoInclude, orderBy, take: filters.limit, skip: filters.offset }),
			prisma.video.count({ where }),
		]);

		res.json({
			data: videos,
			pagination: {
				total,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: (filters.offset || 0) + (filters.limit || 20) < total,
				hasPrev: (filters.offset || 0) > 0,
			},
		});
	} catch (error) {
		console.error('Error al obtener videos:', error);
		res
			.status(500)
			.json({
				error: 'Error interno del servidor',
				message: error instanceof Error ? error.message : 'Error desconocido',
			});
	}
});

// GET /api/videos/:id
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de video inválido' });
		}

		const video = await prisma.video.findUnique({
			where: { id },
			include: videoInclude,
		});

		if (!video) {
			return res.status(404).json({ error: 'Video no encontrado' });
		}

		res.json(video);
	} catch (error) {
		console.error('Error al obtener video:', error);
		res
			.status(500)
			.json({
				error: 'Error interno del servidor',
				message: error instanceof Error ? error.message : 'Error desconocido',
			});
	}
});

// POST /api/videos
router.post('/', async (req, res) => {
	try {
		const validationResult = CreateVideoSchema.safeParse(req.body);
		if (!validationResult.success) {
			return res.status(400).json({ error: 'Datos de entrada inválidos', details: validationResult.error.errors });
		}

		const data = validationResult.data;
		const existingVideo = await prisma.video.findFirst({ where: { path: data.path } });
		if (existingVideo) {
			return res.status(409).json({ error: 'Ya existe un video con esa ruta' });
		}

		const newVideo = await prisma.video.create({
			data: {
				name: data.name,
				path: data.path,
				size: data.size,
				mimeType: data.mimeType,
				duration: data.duration,
				width: data.width,
				height: data.height,
				framerate: data.framerate,
				bitrate: data.bitrate,
				codec: data.codec,
				format: data.format,
				isHidden: data.isHidden || false,
				isFavorite: data.isFavorite || false,
				tags: data.tags || '[]',
				notes: data.notes || '',
				folderId: data.folderId,
			},
			include: videoInclude,
		});

		res.status(201).json(newVideo);
	} catch (error) {
		console.error('Error al crear video:', error);
		res
			.status(500)
			.json({
				error: 'Error interno del servidor',
				message: error instanceof Error ? error.message : 'Error desconocido',
			});
	}
});

// PUT /api/videos/:id
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de video inválido' });
		}

		const validationResult = UpdateVideoSchema.safeParse(req.body);
		if (!validationResult.success) {
			return res.status(400).json({ error: 'Datos de entrada inválidos', details: validationResult.error.errors });
		}

		const data = validationResult.data;
		const existingVideo = await prisma.video.findUnique({ where: { id } });
		if (!existingVideo) {
			return res.status(404).json({ error: 'Video no encontrado' });
		}

		if (data.path && data.path !== existingVideo.path) {
			const duplicateVideo = await prisma.video.findFirst({ where: { path: data.path, id: { not: id } } });
			if (duplicateVideo) {
				return res.status(409).json({ error: 'Ya existe un video con esa ruta' });
			}
		}

		const updatedVideo = await prisma.video.update({
			where: { id },
			data: {
				...(data.name && { name: data.name }),
				...(data.path && { path: data.path }),
				...(data.size && { size: data.size }),
				...(data.mimeType && { mimeType: data.mimeType }),
				...(data.duration !== undefined && { duration: data.duration }),
				...(data.width !== undefined && { width: data.width }),
				...(data.height !== undefined && { height: data.height }),
				...(data.framerate !== undefined && { framerate: data.framerate }),
				...(data.bitrate !== undefined && { bitrate: data.bitrate }),
				...(data.codec !== undefined && { codec: data.codec }),
				...(data.format !== undefined && { format: data.format }),
				...(data.isHidden !== undefined && { isHidden: data.isHidden }),
				...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
				...(data.tags !== undefined && { tags: data.tags }),
				...(data.notes !== undefined && { notes: data.notes }),
				...(data.folderId !== undefined && { folderId: data.folderId }),
			},
			include: videoInclude,
		});

		res.json(updatedVideo);
	} catch (error) {
		console.error('Error al actualizar video:', error);
		res
			.status(500)
			.json({
				error: 'Error interno del servidor',
				message: error instanceof Error ? error.message : 'Error desconocido',
			});
	}
});

// DELETE /api/videos/:id
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de video inválido' });
		}

		const existingVideo = await prisma.video.findUnique({
			where: { id },
			include: { _count: { select: { albums: true, collections: true, tags: true } } },
		});

		if (!existingVideo) {
			return res.status(404).json({ error: 'Video no encontrado' });
		}

		await prisma.video.delete({ where: { id } });

		res.json({
			success: true,
			message: 'Video eliminado correctamente',
			deletedId: id,
			stats: {
				albumsCount: existingVideo._count.albums,
				collectionsCount: existingVideo._count.collections,
				tagsCount: existingVideo._count.tags,
			},
		});
	} catch (error) {
		console.error('Error al eliminar video:', error);
		res
			.status(500)
			.json({
				error: 'Error interno del servidor',
				message: error instanceof Error ? error.message : 'Error desconocido',
			});
	}
});

// GET /api/videos/stats/formats
router.get('/stats/formats', async (req, res) => {
	try {
		const formatStats = await prisma.video.groupBy({
			by: ['format'],
			_count: { format: true },
			_sum: { size: true },
			_avg: { duration: true, width: true, height: true },
			orderBy: { _count: { format: 'desc' } },
		});

		res.json({
			data: formatStats.map((stat) => ({
				format: stat.format,
				count: stat._count.format,
				totalSize: stat._sum.size || 0,
				avgDuration: stat._avg.duration,
				avgWidth: stat._avg.width,
				avgHeight: stat._avg.height,
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

export { router as videosRouter };
