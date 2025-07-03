import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// GET /uploaded-images/:id - Obtener datos de una imagen subida por ID
router.get('/:id', async (req, res) => {
	const { id } = req.params;

	if (!z.string().uuid().safeParse(id).success) {
		return res.status(400).json({ error: 'ID de imagen subida inválido' });
	}

	try {
		const uploadedImage = await prisma.uploadedImage.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
					},
				},
			},
		});

		if (!uploadedImage) {
			return res.status(404).json({ error: 'Imagen subida no encontrada' });
		}

		res.json(uploadedImage);
	} catch (error) {
		console.error('Error al obtener imagen subida:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /uploaded-images - Obtener lista de imágenes subidas con filtros
router.get('/', async (req, res) => {
	const { limit = '20', offset = '0', category, searchTerm, orderBy = 'createdAt', orderDir = 'desc' } = req.query;

	const parsedLimit = Number.parseInt(limit as string);
	const parsedOffset = Number.parseInt(offset as string);

	try {
		const where: any = {};
		if (category) {
			where.category = category as string;
		}
		if (searchTerm) {
			where.OR = [
				{ name: { contains: searchTerm as string, mode: 'insensitive' } },
				{ description: { contains: searchTerm as string, mode: 'insensitive' } },
			];
		}

		const [uploadedImages, total] = await Promise.all([
			prisma.uploadedImage.findMany({
				where,
				include: {
					_count: {
						select: {
							images: true,
						},
					},
				},
				orderBy: { [orderBy as string]: orderDir as string },
				take: parsedLimit,
				skip: parsedOffset,
			}),
			prisma.uploadedImage.count({ where }),
		]);

		res.json({
			data: uploadedImages,
			pagination: {
				total,
				limit: parsedLimit,
				offset: parsedOffset,
				hasNext: parsedOffset + parsedLimit < total,
				hasPrev: parsedOffset > 0,
			},
		});
	} catch (error) {
		console.error('Error al obtener imágenes subidas:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export { router as uploadedImagesRouter };
