import { Router } from 'express';
import { z } from 'zod';
import {
	createJsonFile,
	deleteJsonFile,
	getJsonFileById,
	getJsonFiles,
	updateJsonFile,
} from '@/services/json-file/json-file.service';

const router = Router();

const JsonFileCreateSchema = z.object({
	name: z.string().min(1),
	path: z.string().min(1),
	size: z.number().min(0),
	hash: z.string().min(1),
	mimeType: z.string().min(1),
	extension: z.string().min(1),
	folderId: z.string().min(1),
	isFavorite: z.boolean().optional(),
	isArchived: z.boolean().optional(),
	content: z.string().nullable().optional(),
	schema: z.string().nullable().optional(),
	isValid: z.boolean().optional(),
	validationErrors: z.string().nullable().optional(),
	keyCount: z.number().int().min(0).nullable().optional(),
	depth: z.number().int().min(0).nullable().optional(),
});

const JsonFileUpdateSchema = JsonFileCreateSchema.partial();

// GET /json-files/:id - Obtener datos de un archivo JSON por ID
router.get('/:id', async (req, res) => {
	const { id } = req.params;

	try {
		const jsonFile = await getJsonFileById(id);

		if (!jsonFile) {
			res.status(404).json({ error: 'Archivo JSON no encontrado' });
			return;
		}

		res.json(jsonFile);
	} catch (error) {
		console.error('Error al obtener archivo JSON:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /json-files - Obtener lista de archivos JSON con filtros
router.get('/', async (_req, res) => {
	try {
		const jsonFiles = await getJsonFiles();
		res.json(jsonFiles);
	} catch (error) {
		console.error('Error al obtener archivos JSON:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /json-files/:id - Eliminar un archivo JSON
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		await deleteJsonFile(id);
		res.json({ message: 'Archivo JSON eliminado correctamente' });
	} catch (error) {
		console.error('Error al eliminar archivo JSON:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /json-files/:id - Actualizar un archivo JSON
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const validatedData = JsonFileUpdateSchema.parse(req.body);
		const updatedJsonFile = await updateJsonFile(id, validatedData);
		res.json(updatedJsonFile);
	} catch (error) {
		console.error('Error al actualizar archivo JSON:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /json-files - Crear un nuevo archivo JSON
router.post('/', async (req, res) => {
	try {
		const validatedData = JsonFileCreateSchema.parse(req.body);
		// Normalizar campos undefined a valores apropiados
		const jsonFileData: any = { ...validatedData };

		// Convertir undefined a valores apropiados según el tipo esperado
		Object.keys(jsonFileData).forEach((key) => {
			if (jsonFileData[key] === undefined) {
				// Para campos booleanos usar false por defecto
				if (['isFavorite', 'isArchived'].includes(key)) {
					jsonFileData[key] = false;
				} else {
					// Para otros campos usar null
					jsonFileData[key] = null;
				}
			}
		});

		const newJsonFile = await createJsonFile(jsonFileData);
		res.status(201).json(newJsonFile);
	} catch (error) {
		console.error('Error al crear archivo JSON:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
