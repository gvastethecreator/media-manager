import { Router } from 'express';
import { getJsonFiles, getJsonFileById, createJsonFile, updateJsonFile, deleteJsonFile } from '@/services/json-file/json-file.service';

const router = Router();

// GET /json-files/:id - Obtener datos de un archivo JSON por ID
router.get('/:id', async (req, res) => {
	const { id } = req.params;

	try {
		const jsonFile = await getJsonFileById(id);

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
		const updatedJsonFile = await updateJsonFile(id, req.body);
		res.json(updatedJsonFile);
	} catch (error) {
		console.error('Error al actualizar archivo JSON:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /json-files - Crear un nuevo archivo JSON
router.post('/', async (req, res) => {
	try {
		const newJsonFile = await createJsonFile(req.body);
		res.status(201).json(newJsonFile);
	} catch (error) {
		console.error('Error al crear archivo JSON:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export { router as jsonFilesRouter };
