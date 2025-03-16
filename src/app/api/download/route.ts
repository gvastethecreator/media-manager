import fs from 'node:fs/promises';
import path from 'node:path';
import { getFileInfo } from '@/app/actions/files/file.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const downloadLogger = serverLogger.withContext('DownloadAPI');

/**
 * Handler para procesar solicitudes POST de descarga
 * Permite descargar archivos cuando se envía un formulario desde el cliente
 */
export async function POST(request: NextRequest) {
	try {
		// Obtener la ruta del archivo del cuerpo de la solicitud
		const formData = await request.formData();
		const filePath = formData.get('path')?.toString();

		if (!filePath) {
			downloadLogger.error('❌ Descarga fallida: No se proporcionó ruta de archivo');
			return NextResponse.json({ error: 'Se requiere una ruta de archivo' }, { status: 400 });
		}

		// Obtener información del archivo mediante la Server Action
		let fileInfo: Awaited<ReturnType<typeof getFileInfo>>;
		try {
			fileInfo = await getFileInfo(filePath);
		} catch (error) {
			downloadLogger.error(`❌ Error al obtener información del archivo: ${filePath}`, error);
			return NextResponse.json({ error: 'Archivo no encontrado o inaccesible' }, { status: 404 });
		}

		// Leer el archivo
		try {
			const fileBuffer = await fs.readFile(fileInfo.path);

			// Devolver el archivo con las cabeceras adecuadas
			downloadLogger.info(`✅ Enviando archivo para descarga: ${fileInfo.name} (${fileInfo.mimeType})`);

			return new NextResponse(fileBuffer, {
				headers: {
					'Content-Type': fileInfo.mimeType,
					'Content-Disposition': `attachment; filename="${fileInfo.name}"`,
					'Content-Length': fileInfo.size.toString(),
				},
			});
		} catch (error) {
			downloadLogger.error(`❌ Error al leer el archivo: ${fileInfo.path}`, error);
			return NextResponse.json({ error: 'Error al leer el archivo' }, { status: 500 });
		}
	} catch (error) {
		downloadLogger.error('❌ Error inesperado en la descarga de archivo:', error);
		return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
	}
}

// También manejamos solicitudes GET por si se necesita acceder directamente vía URL
export async function GET(request: NextRequest) {
	try {
		// Obtener la ruta del archivo de los parámetros de consulta
		const searchParams = request.nextUrl.searchParams;
		const filePath = searchParams.get('path');

		if (!filePath) {
			downloadLogger.error('❌ Descarga fallida: No se proporcionó ruta de archivo');
			return NextResponse.json({ error: 'Se requiere una ruta de archivo' }, { status: 400 });
		}

		// Redireccionar a un formulario POST para evitar problemas con rutas largas
		// Esto es una página HTML que enviará automáticamente un formulario POST
		downloadLogger.info(`⏩ Redirigiendo a formulario POST para descarga: ${filePath}`);

		return new NextResponse(
			`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Descargando archivo...</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
              color: #333;
            }
            .loader {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin-bottom: 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="loader"></div>
          <p>Iniciando descarga...</p>
          <form id="downloadForm" method="POST" action="/api/download">
            <input type="hidden" name="path" value="${filePath}">
          </form>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              document.getElementById('downloadForm').submit();
            });
          </script>
        </body>
      </html>
    `,
			{
				headers: {
					'Content-Type': 'text/html',
				},
			}
		);
	} catch (error) {
		downloadLogger.error('❌ Error inesperado en la redirección de descarga:', error);
		return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
	}
}
