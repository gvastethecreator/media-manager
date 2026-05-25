/**
 * @file Rutas para generación de thumbnails de archivos 3D
 * @module server/routes/3d-thumbnails
 */

import { eq } from 'drizzle-orm';
import express from 'express';
import { Effect } from 'effect';
import { db } from '@/lib/drizzle/index.js';
import { file3Ds } from '@/lib/drizzle/schema/index.js';
import { serverLogger } from '@/lib/logger/server-logger';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';

const router = express.Router();

/**
 * 🎲 Interfaz para opciones de generación de thumbnail 3D
 */
interface Model3DThumbnailOptions {
	angle?: number;
	autoRotate?: boolean;
	backgroundColor?: string;
	cameraDistance?: number;
	height?: number;
	lightIntensity?: number;
	width?: number;
	wireframe?: boolean;
}

/**
 * � Interfaz para información básica del modelo 3D
 */
interface Model3DInfo {
	boundingBox: {
		min: [number, number, number];
		max: [number, number, number];
	};
	faces: number;
	materials: number;
	vertices: number;
}

/**
 * 🔧 Formatos de modelo soportados
 */
const SUPPORTED_FORMATS = ['.gltf', '.glb', '.obj', '.ply', '.fbx', '.dae'];

/**
 * 🎨 Genera SVG placeholder para modelos 3D
 */
function generate3DPlaceholderSVG(options: Model3DThumbnailOptions): string {
	const { width = 300, height = 300, backgroundColor = 'var(--background)' } = options;

	const wireframeColor = backgroundColor === 'var(--background)' ? '#374151' : '#d1d5db';
	const textColor = backgroundColor === 'var(--background)' ? '#1f2937' : '#f9fafb';

	return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  <g transform="translate(${width / 2},${height / 2})">
    <!-- Cubo en wireframe -->
    <g stroke="${wireframeColor}" stroke-width="2" fill="none">
      <!-- Cara frontal -->
      <rect x="-40" y="-40" width="80" height="80"/>
      <!-- Cara trasera (perspectiva) -->
      <rect x="-25" y="-25" width="80" height="80"/>
      <!-- Líneas de conexión -->
      <line x1="-40" y1="-40" x2="-25" y2="-25"/>
      <line x1="40" y1="-40" x2="55" y2="-25"/>
      <line x1="40" y1="40" x2="55" y2="55"/>
      <line x1="-40" y1="40" x2="-25" y2="55"/>
    </g>
    <!-- Texto -->
    <text y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="${textColor}">
      3D Model
    </text>
  </g>
</svg>`;
}

/**
 * ️ Analiza el modelo 3D usando metadata disponible
 */
async function analyze3DModel(modelPath: string): Promise<Model3DInfo | null> {
	try {
		const extension = modelPath.substring(modelPath.lastIndexOf('.')).toLowerCase();

		if (!SUPPORTED_FORMATS.includes(extension)) {
			serverLogger.warn(`Formato no soportado: ${extension}`);
			return null;
		}

		serverLogger.info(
			'Análisis 3D solicitado sin metadata precalculada; devolviendo null para evitar datos inventados',
			{
				modelPath,
				extension,
			}
		);
		return null;
	} catch (error) {
		serverLogger.error('Error analizando modelo 3D:', error);
		return null;
	}
}

/**
 * 📊 Genera SVG informativo con estadísticas del modelo
 */
function generate3DInfoSVG(modelInfo: Model3DInfo | null, options: Model3DThumbnailOptions): string {
	const { width = 300, height = 300, backgroundColor = 'var(--background)' } = options;

	const textColor = backgroundColor === 'var(--background)' ? '#1f2937' : '#f9fafb';
	const accentColor = 'var(--dt-primary-500)';

	if (!modelInfo) {
		return generate3DPlaceholderSVG(options);
	}

	return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  
  <!-- Título -->
  <text x="${width / 2}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${textColor}">
    3D Model
  </text>
  
  <!-- Wireframe placeholder -->
  <g transform="translate(${width / 2},${height / 2 - 20})">
    <g stroke="${accentColor}" stroke-width="2" fill="none">
      <!-- Cubo isométrico -->
      <rect x="-30" y="-30" width="60" height="60"/>
      <rect x="-20" y="-20" width="60" height="60"/>
      <line x1="-30" y1="-30" x2="-20" y2="-20"/>
      <line x1="30" y1="-30" x2="40" y2="-20"/>
      <line x1="30" y1="30" x2="40" y2="40"/>
      <line x1="-30" y1="30" x2="-20" y2="40"/>
    </g>
  </g>
  
  <!-- Estadísticas -->
  <g transform="translate(${width / 2}, ${height - 80})">
    <text y="0" text-anchor="middle" font-family="monospace" font-size="10" fill="${textColor}">
      Vertices: ${modelInfo.vertices.toLocaleString()}
    </text>
    <text y="15" text-anchor="middle" font-family="monospace" font-size="10" fill="${textColor}">
      Faces: ${modelInfo.faces.toLocaleString()}
    </text>
    <text y="30" text-anchor="middle" font-family="monospace" font-size="10" fill="${textColor}">
      Materials: ${modelInfo.materials}
    </text>
  </g>
</svg>`;
}

/**
 * 🎬 Renderiza un modelo 3D usando Three.js headless (placeholder)
 */
async function render3DModelHeadless(modelPath: string, options: Model3DThumbnailOptions): Promise<Buffer | null> {
	serverLogger.debug('Renderizado headless de modelos 3D no disponible; usando fallback visual');
	serverLogger.debug('Modelo:', { modelPath, options });
	return null;
}

/**
 * GET /3d/:id/thumbnail - Generar thumbnail de modelo 3D
 */
router.get('/:id/thumbnail', effectHandler(
	(req) =>
		Effect.tryPromise({
			try: async () => {
				const { id } = req.params;
				const options: Model3DThumbnailOptions = {
					angle: Math.min(Number.parseInt(req.query.angle as string, 10) || 45, 360),
					lightIntensity: Math.min(Number.parseFloat(req.query.lightIntensity as string) || 1.5, 10),
					backgroundColor: `#${(req.query.backgroundColor as string) || 'ffffff'}`,
					width: Math.min(Number.parseInt(req.query.width as string, 10) || 300, 2000),
					height: Math.min(Number.parseInt(req.query.height as string, 10) || 300, 2000),
					wireframe: req.query.wireframe === 'true',
					cameraDistance: Math.min(Number.parseFloat(req.query.cameraDistance as string) || 5, 100),
					autoRotate: req.query.autoRotate === 'true',
				};

				const model3DRecords = await db.select({ metadata: file3Ds.metadata }).from(file3Ds).where(eq(file3Ds.id, id));

				if (model3DRecords.length === 0) {
					throw Object.assign(new Error('3D model not found'), { _tag: 'FileNotFound' });
				}

				const model3D = model3DRecords[0];
				let metadata: any = null;

				if (model3D.metadata) {
					try {
						metadata = JSON.parse(model3D.metadata);
					} catch (e) {
						serverLogger.warn(`Error parsing metadata for 3D model ${id}:`, e);
					}
				}

				if (metadata?.thumbnail) {
					return { svg: metadata.thumbnail, status: 200 };
				}

				const errorSVG = generate3DPlaceholderSVG({
					width: options.width,
					height: options.height,
					backgroundColor: options.backgroundColor,
				});
				return { svg: errorSVG, status: 404 };
			},
			catch: (error) => new Error(String(error)),
		}),
	{
		onSuccess: (data, res) => {
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', data.status === 200 ? 'public, max-age=3600' : 'public, max-age=60');
			res.status(data.status).send(data.svg);
		},
		onError: (_error, res) => {
			serverLogger.error('Error generando thumbnail 3D:', _error);
			const errorSVG = generate3DPlaceholderSVG({
				width: 300,
				height: 300,
				backgroundColor: '#fee2e2',
			});
			res.setHeader('Content-Type', 'image/svg+xml');
			res.status(500).send(errorSVG);
		},
	}
));

/**
 * GET /3d/:id/info - Obtener información del modelo 3D sin renderizar
 */
router.get('/:id/info', effectHandler((req) =>
	Effect.tryPromise({
		try: async () => {
			const { id } = req.params;

			const model3DRecords = await db
				.select({ path: file3Ds.path, metadata: file3Ds.metadata })
				.from(file3Ds)
				.where(eq(file3Ds.id, id));

			if (model3DRecords.length === 0) {
				throw Object.assign(new Error('3D model not found'), { _tag: 'FileNotFound' });
			}

			const model3D = model3DRecords[0];

			if (model3D.metadata) {
				try {
					const metadata = JSON.parse(model3D.metadata);
					if (metadata.modelInfo) {
						return { id, ...metadata.modelInfo };
					}
				} catch {
					// Metadata inválida, continuar con análisis
				}
			}

			const modelInfo = await analyze3DModel(model3D.path);

			if (!modelInfo) {
				throw Object.assign(new Error('Model not found or unsupported format'), { _tag: 'FileNotFound' });
			}

			return {
				id,
				vertices: modelInfo.vertices,
				faces: modelInfo.faces,
				materials: modelInfo.materials,
				boundingBox: {
					min: modelInfo.boundingBox.min,
					max: modelInfo.boundingBox.max,
				},
			};
		},
		catch: (error) => new Error(String(error)),
	})
));

export default router;
