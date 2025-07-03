import { serverLogger } from '@/lib/logger/server-logger';
import { getFileInfo } from '@/services/file/file.service';
import express from 'express';
import fs from 'fs/promises';

const router = express.Router();
const downloadLogger = serverLogger.withContext('DownloadAPI');

router.post('/', async (req, res) => {
	try {
		const filePath = req.body.path as string | undefined;
		if (!filePath) {
			downloadLogger.error('❌ Descarga fallida: No se proporcionó ruta de archivo');
			return res.status(400).json({ error: 'Se requiere una ruta de archivo' });
		}
		let fileInfo: Awaited<ReturnType<typeof getFileInfo>>;
		try {
			fileInfo = await getFileInfo(filePath);
		} catch (error) {
			downloadLogger.error(`❌ Error al obtener información del archivo: ${filePath}`, error);
			return res.status(404).json({ error: 'Archivo no encontrado o inaccesible' });
		}
		try {
			const fileBuffer = await fs.readFile(fileInfo.path);
			res.set({
				'Content-Type': fileInfo.mimeType,
				'Content-Disposition': `attachment; filename="${fileInfo.name}"`,
				'Content-Length': fileInfo.size.toString(),
			});
			downloadLogger.info(`✅ Enviando archivo para descarga: ${fileInfo.name} (${fileInfo.mimeType})`);
			res.send(fileBuffer);
		} catch (error) {
			downloadLogger.error(`❌ Error al leer el archivo: ${fileInfo.path}`, error);
			res.status(500).json({ error: 'Error al leer el archivo' });
		}
	} catch (error) {
		downloadLogger.error('❌ Error inesperado en la descarga de archivo:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

router.get('/', (req, res) => {
	const filePath = req.query.path as string | undefined;
	if (!filePath) {
		downloadLogger.error('❌ Descarga fallida: No se proporcionó ruta de archivo');
		return res.status(400).json({ error: 'Se requiere una ruta de archivo' });
	}
	res.send(`<!DOCTYPE html>
<html>
  <head>
    <title>Descargando archivo...</title>
    <style>
      body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; color: #333; }
      .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div class="loader"></div>
    <p>Iniciando descarga...</p>
    <form id="downloadForm" method="POST" action="/api/download">
      <input type="hidden" name="path" value="${filePath}">
    </form>
    <script>document.addEventListener('DOMContentLoaded',function(){document.getElementById('downloadForm').submit();});</script>
  </body>
</html>`);
});

export default router;
