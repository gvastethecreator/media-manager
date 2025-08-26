import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { createFile3D, deleteFile3D, getFile3DById, getFile3Ds, updateFile3D } from '@/services/file3d/file3d.service';

const router = Router();

const File3DCreateSchema = z.object({
	name: z.string().min(1),
	path: z.string().min(1),
	size: z.number().min(0),
	hash: z.string().min(1),
	mimeType: z.string().min(1),
	extension: z.string().min(1),
	folderId: z.string().min(1),
	isFavorite: z.boolean().optional(),
	isArchived: z.boolean().optional(),
	format: z.string().nullable().optional(),
	version: z.string().nullable().optional(),
	vertices: z.number().int().min(0).nullable().optional(),
	faces: z.number().int().min(0).nullable().optional(),
	triangles: z.number().int().min(0).nullable().optional(),
	materials: z.number().int().min(0).nullable().optional(),
	textures: z.number().int().min(0).nullable().optional(),
	animations: z.number().int().min(0).nullable().optional(),
	bones: z.number().int().min(0).nullable().optional(),
	scenes: z.number().int().min(0).nullable().optional(),
	cameras: z.number().int().min(0).nullable().optional(),
	lights: z.number().int().min(0).nullable().optional(),
	hasUV: z.boolean().optional(),
	hasNormals: z.boolean().optional(),
	hasColors: z.boolean().optional(),
	boundingBox: z.string().nullable().optional(),
});

const File3DUpdateSchema = File3DCreateSchema.partial();

// GET /api/file3ds - Obtener todos los archivos 3D
router.get('/', async (_req, res) => {
	try {
		const file3ds = await getFile3Ds();
		res.json(file3ds);
	} catch (error) {
		console.error('Error al obtener archivos 3D:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/file3ds/:id - Obtener un archivo 3D por ID
const getFile3DByIdHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const file3d = await getFile3DById(id);
		if (!file3d) {
			res.status(404).json({ error: 'Archivo 3D no encontrado' });
			return;
		}
		res.json(file3d);
	} catch (error) {
		console.error('Error al obtener archivo 3D por ID:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

router.get('/:id', getFile3DByIdHandler);

// POST /api/file3ds - Crear un nuevo archivo 3D
const createFile3DHandler = async (req: Request, res: Response) => {
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
			format: req.body.format ?? null,
			version: req.body.version ?? null,
			vertices: req.body.vertices ?? null,
			faces: req.body.faces ?? null,
			triangles: req.body.triangles ?? null,
			materials: req.body.materials ?? null,
			textures: req.body.textures ?? null,
			animations: req.body.animations ?? null,
			bones: req.body.bones ?? null,
			scenes: req.body.scenes ?? null,
			cameras: req.body.cameras ?? null,
			lights: req.body.lights ?? null,
			hasUV: req.body.hasUV ?? false,
			hasNormals: req.body.hasNormals ?? false,
			hasColors: req.body.hasColors ?? false,
			boundingBox: req.body.boundingBox ?? null,
		};

		const validatedData = File3DCreateSchema.parse(body) as import('@/types/entities/file3d').File3DCreateInput;
		const newFile3D = await createFile3D(validatedData);
		res.status(201).json(newFile3D);
	} catch (error) {
		console.error('Error al crear archivo 3D:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

router.post('/', createFile3DHandler);

// PUT /api/file3ds/:id - Actualizar un archivo 3D
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const validatedData = File3DUpdateSchema.parse(req.body);
		const updatedFile3D = await updateFile3D(id, validatedData);
		res.json(updatedFile3D);
	} catch (error) {
		console.error('Error al actualizar archivo 3D:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /api/file3ds/:id - Eliminar un archivo 3D
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		await deleteFile3D(id);
		res.json({ message: 'Archivo 3D eliminado correctamente' });
	} catch (error) {
		console.error('Error al eliminar archivo 3D:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
