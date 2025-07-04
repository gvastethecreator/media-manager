import { Router } from 'express';
import { z } from 'zod';
import {
	createDocument,
	deleteDocument,
	getDocumentById,
	getDocuments,
	updateDocument,
} from '@/services/document/document.service';

const router = Router();

// GET /api/documents - Obtener todos los documentos
router.get('/', async (req, res) => {
	try {
		const documents = await getDocuments();
		res.json(documents);
	} catch (error) {
		console.error('Error al obtener documentos:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/documents/:id - Obtener un documento por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const document = await getDocumentById(id);
		if (!document) {
			return res.status(404).json({ error: 'Documento no encontrado' });
		}
		res.json(document);
	} catch (error) {
		console.error('Error al obtener documento por ID:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /api/documents - Crear un nuevo documento
router.post('/', async (req, res) => {
	try {
		// Aquí se podría añadir validación con Zod si fuera necesario
		const newDocument = await createDocument(req.body);
		res.status(201).json(newDocument);
	} catch (error) {
		console.error('Error al crear documento:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /api/documents/:id - Actualizar un documento
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		// Aquí se podría añadir validación con Zod si fuera necesario
		const updatedDocument = await updateDocument(id, req.body);
		res.json(updatedDocument);
	} catch (error) {
		console.error('Error al actualizar documento:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /api/documents/:id - Eliminar un documento
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		await deleteDocument(id);
		res.json({ message: 'Documento eliminado correctamente' });
	} catch (error) {
		console.error('Error al eliminar documento:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export { router as documentsRouter };
