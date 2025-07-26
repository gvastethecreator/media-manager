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

const DocumentCreateSchema = z.object({
	name: z.string().min(1),
	path: z.string().min(1),
	size: z.number().min(0),
	hash: z.string().min(1),
	mimeType: z.string().min(1),
	extension: z.string().min(1),
	folderId: z.string().min(1),
	isFavorite: z.boolean().optional(),
	isArchived: z.boolean().optional(),
	pageCount: z.number().int().min(0).nullable().optional(),
	wordCount: z.number().int().min(0).nullable().optional(),
	language: z.string().nullable().optional(),
	title: z.string().nullable().optional(),
	author: z.string().nullable().optional(),
	subject: z.string().nullable().optional(),
	keywords: z.string().nullable().optional(),
	creator: z.string().nullable().optional(),
	producer: z.string().nullable().optional(),
	creationDate: z.date().nullable().optional(),
	modificationDate: z.date().nullable().optional(),
	encrypted: z.boolean().optional(),
	version: z.string().nullable().optional(),
	content: z.string().nullable().optional(),
	summary: z.string().nullable().optional(),
});

const DocumentUpdateSchema = DocumentCreateSchema.partial();

// GET /api/documents - Obtener todos los documentos
router.get('/', async (_req, res) => {
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
			res.status(404).json({ error: 'Documento no encontrado' });; return;
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
		const validatedData = DocumentCreateSchema.parse(req.body);
		const newDocument = await createDocument(validatedData);
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
		const validatedData = DocumentUpdateSchema.parse(req.body);
		const updatedDocument = await updateDocument(id, validatedData);
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

export default router;
