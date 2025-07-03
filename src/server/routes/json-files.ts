import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// GET /json-files/:id - Obtener datos de un archivo JSON por ID
router.get('/:id', async (req, res) => {
	const { id } = req.params;

	if (!z.string().uuid().safeParse(id).success) {
		return res.status(400).json({ error: 'ID de archivo JSON inválido' });
	}

	try {
		const jsonFile = await prisma.jsonFile.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
					},
				},
			},
		});

		if (!jsonFile) {
			return res.status(404).json({ error: 'Archivo JSON no encontrado' });
		}

		res.json(jsonFile);
	} catch (error) {
		console.error('Error al obtener archivo JSON:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /json-files - Obtener lista de archivos JSON con filtros
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

		const [jsonFiles, total] = await Promise.all([
			prisma.jsonFile.findMany({
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
			prisma.jsonFile.count({ where }),
		]);

		res.json({
			data: jsonFiles,
			pagination: {
				total,
				limit: parsedLimit,
				offset: parsedOffset,
				hasNext: parsedOffset + parsedLimit < total,
				hasPrev: parsedOffset > 0,
			},
		});
	} catch (error) {
		console.error('Error al obtener archivos JSON:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export { router as jsonFilesRouter };
