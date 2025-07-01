import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Schema de validación para crear carpeta
const CreateFolderSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(255),
	description: z.string().max(1000).optional().nullable(),
	path: z.string().min(1, 'La ruta es requerida').max(500),
	emoji: z.string().max(10).optional().nullable(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional()
		.nullable(),
	featuredImage: z.string().url().optional().nullable(),
	isFavorite: z.boolean().default(false).optional(),
	autoReindex: z.boolean().default(true),
	parentId: z.string().uuid().optional().nullable(),
	presetId: z.string().uuid().optional().nullable(),
});

// Schema de validación para actualizar carpeta
const UpdateFolderSchema = CreateFolderSchema.partial().omit({ path: true });

// GET /api/folders - Obtener todas las carpetas
router.get('/', async (req, res) => {
	try {
		const folders = await prisma.folder.findMany({
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						documents: true,
						file3Ds: true,
						jsonFiles: true,
						audios: true,
					},
				},
				preset: true,
				parent: true,
				children: true,
			},
			orderBy: {
				name: 'asc',
			},
		});

		res.json(folders);
	} catch (error) {
		console.error('Error al obtener carpetas:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id - Obtener una carpeta por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folder = await prisma.folder.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						documents: true,
						file3Ds: true,
						jsonFiles: true,
						audios: true,
					},
				},
				preset: true,
				parent: true,
				children: true,
			},
		});

		if (!folder) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		res.json(folder);
	} catch (error) {
		console.error('Error al obtener carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/folders - Crear nueva carpeta
router.post('/', async (req, res) => {
	try {
		const validationResult = CreateFolderSchema.safeParse(req.body);

		if (!validationResult.success) {
			return res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: validationResult.error.errors,
			});
		}

		const data = validationResult.data;

		// Verificar que no exista una carpeta con la misma ruta
		const existingFolder = await prisma.folder.findFirst({
			where: { path: data.path },
		});

		if (existingFolder) {
			return res.status(409).json({
				error: 'Ya existe una carpeta con esa ruta',
			});
		}

		const newFolder = await prisma.folder.create({
			data: {
				name: data.name,
				description: data.description,
				path: data.path,
				emoji: data.emoji,
				color: data.color,
				featuredImage: data.featuredImage,
				isFavorite: data.isFavorite || false,
				parentId: data.parentId,
				presetId: data.presetId,
			},
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						documents: true,
						file3Ds: true,
						jsonFiles: true,
						audios: true,
					},
				},
				preset: true,
				parent: true,
				children: true,
			},
		});

		res.status(201).json(newFolder);
	} catch (error) {
		console.error('Error al crear carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PUT /api/folders/:id - Actualizar carpeta
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const validationResult = UpdateFolderSchema.safeParse(req.body);

		if (!validationResult.success) {
			return res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: validationResult.error.errors,
			});
		}

		const data = validationResult.data;

		// Verificar que la carpeta existe
		const existingFolder = await prisma.folder.findUnique({
			where: { id },
		});

		if (!existingFolder) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		const updatedFolder = await prisma.folder.update({
			where: { id },
			data: {
				...(data.name && { name: data.name }),
				...(data.description !== undefined && { description: data.description }),
				...(data.emoji !== undefined && { emoji: data.emoji }),
				...(data.color !== undefined && { color: data.color }),
				...(data.featuredImage !== undefined && { featuredImage: data.featuredImage }),
				...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
				...(data.parentId !== undefined && { parentId: data.parentId }),
				...(data.presetId !== undefined && { presetId: data.presetId }),
			},
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						documents: true,
						file3Ds: true,
						jsonFiles: true,
						audios: true,
					},
				},
				preset: true,
				parent: true,
				children: true,
			},
		});

		res.json(updatedFolder);
	} catch (error) {
		console.error('Error al actualizar carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DELETE /api/folders/:id - Eliminar carpeta
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		// Verificar que la carpeta existe
		const existingFolder = await prisma.folder.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						documents: true,
						file3Ds: true,
						jsonFiles: true,
						audios: true,
					},
				},
			},
		});

		if (!existingFolder) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		// Verificar que la carpeta no tiene archivos asociados
		const totalFiles = Object.values(existingFolder._count).reduce((sum, count) => sum + count, 0);

		if (totalFiles > 0) {
			return res.status(409).json({
				error: 'No se puede eliminar la carpeta porque contiene archivos',
				details: `La carpeta contiene ${totalFiles} archivos`,
			});
		}

		await prisma.folder.delete({
			where: { id },
		});

		res.json({
			success: true,
			message: 'Carpeta eliminada correctamente',
			deletedId: id,
		});
	} catch (error) {
		console.error('Error al eliminar carpeta:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

export { router as foldersRouter };
