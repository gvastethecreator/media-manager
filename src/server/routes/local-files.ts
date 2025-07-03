import express from 'express';
import { existsSync } from 'fs';
import * as fs from 'fs/promises';
import path from 'path';

const router = express.Router();

const BASE_DIRECTORY = path.resolve('/allowed/base/directory');

router.get('/*', async (req, res) => {
	try {
		const rawPath = req.params[0];
		const sanitizedPath = rawPath.replace(/^\.\.[/\\]/, ''); // Remove leading traversal sequences
		const fullPath = path.resolve(BASE_DIRECTORY, sanitizedPath);

		if (!fullPath.startsWith(BASE_DIRECTORY)) {
			console.error('Acceso denegado: ruta fuera del directorio permitido', { rawPath, fullPath });
			return res.status(403).send('Acceso denegado');
		}
		if (!existsSync(fullPath)) {
			console.error('Archivo no encontrado:', { filePath, fullPath });
			return res.status(404).send('Archivo no encontrado');
		}
		const ext = path.extname(fullPath).toLowerCase();
		const mimeTypes: Record<string, string> = {
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.gif': 'image/gif',
			'.webp': 'image/webp',
			'.svg': 'image/svg+xml',
			'.bmp': 'image/bmp',
		};
		const mimeType = mimeTypes[ext] || 'application/octet-stream';
		console.info('Archivo servido:', { path: filePath, fullPath, size: buffer.length, mimeType });
		res.set({
			'Content-Type': mimeType,
			'Cache-Control': 'public, max-age=31536000',
			'Content-Length': buffer.length.toString(),
		});
		res.send(buffer);
	} catch (error) {
		console.error('Error sirviendo archivo:', error);
		res.status(500).send('Error interno del servidor');
	}
});

export default router;
