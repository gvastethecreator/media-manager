import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { serverLogger } from '@/lib/logger/server-logger';
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

// Esquema de validación para filtros de documentos
const DocumentFiltersSchema = z.object({
	folderId: z.string().uuid().optional(),
	search: z.string().optional(),
	isFavorite: z.boolean().optional(),
	isArchived: z.boolean().optional(),
	mimeType: z.string().optional(),
	extension: z.string().optional(),
	minSize: z.number().int().positive().optional(),
	maxSize: z.number().int().positive().optional(),
	limit: z.number().int().positive().max(100).default(20).optional(),
	offset: z.number().int().min(0).default(0).optional(),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'size']).default('name').optional(),
	sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
});

// GET /api/documents - Obtener documentos con filtros y paginación
router.get('/', async (req, res) => {
	try {
		const filtersResult = DocumentFiltersSchema.safeParse(req.query);
		if (!filtersResult.success) {
			res.status(400).json({ error: 'Parámetros de filtro inválidos', details: filtersResult.error.issues });
			return;
		}

		const filters = filtersResult.data;
		const result = await getDocuments(filters);
		res.json(result);
	} catch (error) {
		serverLogger.error('Error al obtener documentos:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/documents/:id - Obtener un documento por ID
const getDocumentByIdHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const document = await getDocumentById(id);
		if (!document) {
			res.status(404).json({ error: 'Documento no encontrado' });
			return;
		}
		res.json(document);
	} catch (error) {
		serverLogger.error('Error al obtener documento por ID:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

router.get('/:id', getDocumentByIdHandler);

// POST /api/documents - Crear un nuevo documento

const createDocumentHandler = async (req: Request, res: Response) => {
	try {
		// Validar campos obligatorios
		const requiredFields = ['name', 'path', 'size', 'hash', 'mimeType', 'extension', 'folderId'];
		for (const field of requiredFields) {
			if (req.body[field] === undefined) {
				res.status(400).json({ error: `El campo obligatorio '${field}' está ausente` });
				return;
			}
		}
		// Construir objeto solo con los campos esperados y valores normalizados
		const body: any = {
			name: req.body.name,
			path: req.body.path,
			size: req.body.size,
			hash: req.body.hash,
			mimeType: req.body.mimeType,
			extension: req.body.extension,
			folderId: req.body.folderId,
			isFavorite: req.body.isFavorite ?? false,
			isArchived: req.body.isArchived ?? false,
			pageCount: req.body.pageCount ?? null,
			wordCount: req.body.wordCount ?? null,
			language: req.body.language ?? null,
			title: req.body.title ?? null,
			author: req.body.author ?? null,
			subject: req.body.subject ?? null,
			keywords: req.body.keywords ?? null,
			creator: req.body.creator ?? null,
			producer: req.body.producer ?? null,
			creationDate: req.body.creationDate ?? null,
			modificationDate: req.body.modificationDate ?? null,
			encrypted: req.body.encrypted ?? null,
			version: req.body.version ?? null,
			content: req.body.content ?? null,
			summary: req.body.summary ?? null,
		};
		const validatedData = DocumentCreateSchema.parse(body) as import('@/types/entities/document').DocumentCreateInput;
		const newDocument = await createDocument(validatedData);
		res.status(201).json(newDocument);
	} catch (error) {
		serverLogger.error('Error al crear documento:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

router.post('/', createDocumentHandler);

// PUT /api/documents/:id - Actualizar un documento
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const validatedData = DocumentUpdateSchema.parse(req.body);
		const updatedDocument = await updateDocument(id, validatedData);
		res.json(updatedDocument);
	} catch (error) {
		serverLogger.error('Error al actualizar documento:', error);
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
		serverLogger.error('Error al eliminar documento:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
