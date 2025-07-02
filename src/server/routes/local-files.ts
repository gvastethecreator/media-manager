import express from 'express';
import { existsSync } from 'fs';
import * as fs from 'fs/promises';
import path from 'path';

const router = express.Router();

router.get('/*', async (req, res) => {
  try {
    let filePath = req.params[0];
    if (filePath.startsWith('g/') || filePath.startsWith('G/')) {
      filePath = `G:${filePath.substring(1)}`;
    } else if (filePath.startsWith('d/') || filePath.startsWith('D/')) {
      filePath = `D:${filePath.substring(1)}`;
    } else if (filePath.startsWith('c/') || filePath.startsWith('C/')) {
      filePath = `C:${filePath.substring(1)}`;
    }
    const fullPath = filePath.split('/').join(path.sep);
    if (!existsSync(fullPath)) {
      console.error('Archivo no encontrado:', { filePath, fullPath });
      return res.status(404).send('Archivo no encontrado');
    }
    const buffer = await fs.readFile(fullPath);
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
