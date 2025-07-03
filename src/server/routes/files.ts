import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { mapStatsToFileInfo, serializeDirectoryContents, serializeFileOperationResult } from '@/transformers/file';

/**
 * @file files.ts
 * @description Rutas REST para operaciones de archivos y directorios.
 *  - GET    /api/files/info    → Información de un archivo
 *  - GET    /api/files/list    → Listado de un directorio
 *  - DELETE /api/files         → Eliminar archivo
 *  - POST   /api/files/dir     → Crear directorio
 *  - PUT    /api/files/rename  → Renombrar/mover archivo
 *  - POST   /api/files/copy    → Copiar archivo
 */

export const filesRouter = Router();

// Base de seguridad: todas las rutas deben estar bajo este directorio
const BASE_DIR = process.env.FILES_BASE_DIR ?? path.resolve(process.cwd(), 'public/uploads');

/**
 * Normaliza y valida la ruta recibida para evitar directory traversal
 */
function resolveSafePath(relativePath: string): string {
	const normalized = path.normalize(relativePath).replace(/^([../\\])+/, '');
	const absolute = path.resolve(BASE_DIR, normalized);
	if (!absolute.startsWith(BASE_DIR)) {
		throw new Error('Ruta fuera de directorio permitido');
	}
	return absolute;
}

// -------------------------- Schemas --------------------------

const PathQuerySchema = z.object({ path: z.string().min(1) });

const RenameSchema = z.object({
	oldPath: z.string().min(1),
	newPath: z.string().min(1),
});

const CopyMoveSchema = z.object({
	sourcePath: z.string().min(1),
	destPath: z.string().min(1),
});

// -------------------------- Endpoints --------------------------

// GET /api/files/info?path=foo.jpg
filesRouter.get('/info', async (req, res) => {
	const parse = PathQuerySchema.safeParse(req.query);
	if (!parse.success) {
		return res.status(400).json({ error: 'Parámetros inválidos', details: parse.error.errors });
	}
	try {
		const filePath = resolveSafePath(parse.data.path);
		const stats = await fs.stat(filePath);
		if (!stats.isFile()) {
			return res.status(400).json({ error: 'La ruta indicada no es un archivo' });
		}
		const info = mapStatsToFileInfo(filePath, stats);
		return res.json(info);
	} catch (error: any) {
		return res.status(500).json({ error: 'Error obteniendo información', message: error.message });
	}
});

// GET /api/files/list?path=some/dir
filesRouter.get('/list', async (req, res) => {
	const parse = PathQuerySchema.safeParse(req.query);
	if (!parse.success) {
		return res.status(400).json({ error: 'Parámetros inválidos', details: parse.error.errors });
	}
	try {
		const dirPath = resolveSafePath(parse.data.path);
		const stats = await fs.stat(dirPath);
		if (!stats.isDirectory()) {
			return res.status(400).json({ error: 'La ruta indicada no es un directorio' });
		}
		const entries = await fs.readdir(dirPath, { withFileTypes: true });
		const items = await Promise.all(
			entries.map(async (dirent) => {
				const fullPath = path.join(dirPath, dirent.name);
				const entryStats = await fs.stat(fullPath);
				return mapStatsToFileInfo(fullPath, entryStats);
			})
		);
		const contents = serializeDirectoryContents(dirPath, items);
		return res.json(contents);
	} catch (error: any) {
		return res.status(500).json({ error: 'Error leyendo directorio', message: error.message });
	}
});

// DELETE /api/files?path=foo.jpg
filesRouter.delete('/', async (req, res) => {
	const parse = PathQuerySchema.safeParse(req.query);
	if (!parse.success) {
		return res.status(400).json({ error: 'Parámetros inválidos', details: parse.error.errors });
	}
	try {
		const filePath = resolveSafePath(parse.data.path);
		await fs.unlink(filePath);
		return res.json(serializeFileOperationResult(true, filePath));
	} catch (error: any) {
		return res.status(500).json({ error: 'Error eliminando archivo', message: error.message });
	}
});

// POST /api/files/dir
filesRouter.post('/dir', async (req, res) => {
	const bodySchema = z.object({ path: z.string().min(1) });
	const parse = bodySchema.safeParse(req.body);
	if (!parse.success) {
		return res.status(400).json({ error: 'Datos inválidos', details: parse.error.errors });
	}
	try {
		const dirPath = resolveSafePath(parse.data.path);
		await fs.mkdir(dirPath, { recursive: true });
		return res.status(201).json(serializeFileOperationResult(true, dirPath));
	} catch (error: any) {
		return res.status(500).json({ error: 'Error creando directorio', message: error.message });
	}
});

// PUT /api/files/rename
filesRouter.put('/rename', async (req, res) => {
	const parse = RenameSchema.safeParse(req.body);
	if (!parse.success) {
		return res.status(400).json({ error: 'Datos inválidos', details: parse.error.errors });
	}
	try {
		const oldPath = resolveSafePath(parse.data.oldPath);
		const newPath = resolveSafePath(parse.data.newPath);
		await fs.rename(oldPath, newPath);
		return res.json(serializeFileOperationResult(true, newPath));
	} catch (error: any) {
		return res.status(500).json({ error: 'Error renombrando archivo', message: error.message });
	}
});

// POST /api/files/copy
filesRouter.post('/copy', async (req, res) => {
	const parse = CopyMoveSchema.safeParse(req.body);
	if (!parse.success) {
		return res.status(400).json({ error: 'Datos inválidos', details: parse.error.errors });
	}
	try {
		const source = resolveSafePath(parse.data.sourcePath);
		const dest = resolveSafePath(parse.data.destPath);
		await fs.copyFile(source, dest);
		return res.status(201).json(serializeFileOperationResult(true, dest));
	} catch (error: any) {
		return res.status(500).json({ error: 'Error copiando archivo', message: error.message });
	}
});

// POST /api/files/move
filesRouter.post('/move', async (req, res) => {
	const parse = CopyMoveSchema.safeParse(req.body);
	if (!parse.success) {
		return res.status(400).json({ error: 'Datos inválidos', details: parse.error.errors });
	}
	try {
		const source = resolveSafePath(parse.data.sourcePath);
		const dest = resolveSafePath(parse.data.destPath);
		await fs.rename(source, dest);
		return res.json(serializeFileOperationResult(true, dest));
	} catch (error: any) {
		return res.status(500).json({ error: 'Error moviendo archivo', message: error.message });
	}
});
