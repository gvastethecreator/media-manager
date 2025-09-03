// Drizzle imports - CAMBIO PARA FORZAR RELOAD
// @ts-nocheck - Temporary suppression for Express handler parameter types

import { asc, count, desc, eq, isNull, sql } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '@/lib/drizzle';
import { folders, images, videos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { generateFolderIdFromName, isValidFolderId } from '@/lib/utils/folder-id-generator';
import { CreateFolderSchema } from '@/types/entities/folder/schema';

const router = Router();
const logger = serverLogger.withContext('FoldersRoutes');

// DEBUG-ROUTES - Rutas especiales de debug que deben ir ANTES que /:id
router.get('/_debug_', async (_req, res) => {
	try {
		logger.debug('Endpoint debug simple alcanzado - FUNCIONA AHORA');

		// Test directo de la query problemática
		const testResults = await db.execute(sql`
			SELECT 
				id, name, parentId,
				(SELECT COUNT(*) FROM Folder WHERE Folder.parentId = Folder.id) as childrenCount
			FROM Folder 
			ORDER BY name
		`);

		res.json({
			message: 'Test de conteo de hijos directo desde SQL',
			totalFolders: testResults.length,
			query:
				'SELECT id, name, parentId, (SELECT COUNT(*) FROM Folder WHERE Folder.parentId = Folder.id) as childrenCount FROM Folder',
			results: testResults,
		});
	} catch (error) {
		logger.error('Error en debug simple', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DEBUG AVANZADO - Endpoint de debug para subcarpetas completo
router.get('/debug-subcarpetas-analysis', async (_req, res) => {
	try {
		logger.info('Iniciando depuración de subcarpetas BD vs FS');

		// Importar servicios necesarios
		const { syncFoldersWithFileSystem } = await import('@/lib/filesystem/folder-sync');

		// 1. Obtener todas las carpetas de la BD
		const bdFolders = await db
			.select({
				id: folders.id,
				name: folders.name,
				path: folders.path,
				parentId: folders.parentId,
			})
			.from(folders)
			.orderBy(asc(folders.path));

		logger.info(`BD: ${bdFolders.length} carpetas encontradas`);

		// 2. Usar sincronización para obtener diferencias
		const syncResult = await syncFoldersWithFileSystem({ dryRun: true });

		// 3. Análisis de subcarpetas
		const subcarpetasBD = bdFolders.filter((f) => f.parentId !== null);

		// 4. Buscar relaciones problemáticas
		const bdById = new Map(bdFolders.map((c) => [c.id, c]));
		const relacionesProblematicas = bdFolders.filter((carpeta: any) => {
			if (!carpeta.parentId) return false;

			const padre = bdById.get(carpeta.parentId);
			if (!padre) {
				logger.warn(`Carpeta ${carpeta.name} tiene parentId ${carpeta.parentId} que no existe`);
				return true;
			}

			return false;
		});

		// 5. Respuesta detallada
		const respuesta = {
			resumen: {
				carpetasBD: bdFolders.length,
				carpetasFaltantesEnBD: syncResult.added.length,
				carpetasOrfanasEnBD: syncResult.removed.length,
				relacionesProblematicas: relacionesProblematicas.length,
			},
			diferencias: {
				solo_en_fs: syncResult.added.slice(0, 20),
				solo_en_bd: syncResult.removed.slice(0, 20),
			},
			subcarpetas: {
				bd: subcarpetasBD.slice(0, 10).map((f) => ({
					id: f.id,
					name: f.name,
					path: f.path,
					parent: f.parentId ? bdById.get(f.parentId)?.name || 'PARENT_NOT_FOUND' : 'NO_PARENT',
				})),
				fs: syncResult.added.slice(0, 10).map((d) => ({
					name: d.name,
					path: d.path,
					parent_path: d.path.substring(0, d.path.lastIndexOf('/')) || '/',
				})),
			},
			sync_analysis: syncResult,
		};

		logger.success('Análisis de subcarpetas completado');
		res.json(respuesta);
	} catch (error) {
		logger.error('Error en debug de subcarpetas', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DEBUG SCANNER - Test específico del scanner de archivos
router.get('/debug-scanner/:folderId', async (req, res) => {
	try {
		const { folderId } = req.params;
		logger.info('🔍 [DEBUG] Testing scanner for folder:', folderId);

		// Obtener carpeta de la BD
		const [folder] = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);

		if (!folder) {
			return res.status(404).json({ error: 'Folder not found' });
		}

		logger.info('🔍 [DEBUG] Found folder:', folder.path);

		// Usar el scanner directamente
		const { scanFolder } = await import('@/lib/filesystem/folder-scanner');
		const scanResult = await scanFolder(folder.path, {
			recursive: false,
			includeHidden: false,
		});

		logger.info('🔍 [DEBUG] Scanner result:', {
			totalFiles: scanResult.totalFiles,
			filesFound: scanResult.files.length,
		});

		res.json({
			folder: {
				id: folder.id,
				path: folder.path,
				name: folder.name,
			},
			scanResult: {
				totalFiles: scanResult.totalFiles,
				totalSize: scanResult.totalSize,
				files: scanResult.files.map((f) => ({
					name: f.name,
					extension: f.extension,
					size: f.size,
				})),
				classification: {
					images: scanResult.images.length,
					videos: scanResult.videos.length,
					audios: scanResult.audios.length,
					documents: scanResult.documents.length,
					jsonFiles: scanResult.jsonFiles.length,
					file3Ds: scanResult.file3Ds.length,
					others: scanResult.others.length,
				},
				imageFiles: scanResult.images.map((f) => f.name),
				videoFiles: scanResult.videos.map((f) => f.name),
				audioFiles: scanResult.audios.map((f) => f.name),
				documentFiles: scanResult.documents.map((f) => f.name),
				jsonFilesList: scanResult.jsonFiles.map((f) => f.name),
				file3DsList: scanResult.file3Ds.map((f) => f.name),
				otherFiles: scanResult.others.map((f) => f.name),
			},
		});
	} catch (error) {
		logger.error('Error testing scanner', { error });
		res.status(500).json({
			error: 'Error testing scanner',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// ===== REWRITE [BEGIN]: folders core endpoints =====
// GET /api/folders - Listado de carpetas (alias top-level cuando parentId == rootId)
router.get('/', async (req, res) => {
	try {
		const { parentId } = req.query as { parentId?: string };

		const baseSelect = db
			.select({
				id: folders.id,
				name: folders.name,
				description: folders.description,
				path: folders.path,
				emoji: folders.emoji,
				color: folders.color,
				featuredImage: folders.featuredImage,
				isFavorite: folders.isFavorite,
				totalFiles: folders.totalFiles,
				totalSize: folders.totalSize,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			})
			.from(folders)
			.orderBy(asc(folders.name));

		if (parentId) {
			const rootRow = await db.select({ id: folders.id }).from(folders).where(eq(folders.path, '/')).limit(1);
			if (rootRow.length && rootRow[0].id === parentId) {
				const rows = await baseSelect.where(isNull(folders.parentId));
				return res.json(rows);
			}
			const rows = await baseSelect.where(eq(folders.parentId, parentId));
			return res.json(rows);
		}

		const rows = await baseSelect;
		return res.json(rows);
	} catch (error) {
		logger.error('Error al obtener carpetas', { error });
		return res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/root-id - ID de la raíz (auto-crear si falta)
router.get('/root-id', async (_req, res) => {
	try {
		let root = await db.select({ id: folders.id }).from(folders).where(eq(folders.path, '/')).limit(1);
		if (!root.length) {
			const folderId = await generateFolderIdFromName('Root');
			const inserted = await db
				.insert(folders)
				.values({
					id: folderId,
					name: 'Root',
					description: null,
					path: '/',
					emoji: null,
					color: null,
					featuredImage: null,
					isFavorite: false,
					totalFiles: 0,
					totalSize: 0,
					parentId: null,
					presetId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning({ id: folders.id });
			root = inserted;
		}
		return res.json({ id: root[0].id });
	} catch (error) {
		return res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/root - Carpeta raíz (auto-crear si falta)
router.get('/root', async (_req, res) => {
	try {
		let rootFolder = await db
			.select({
				id: folders.id,
				name: folders.name,
				description: folders.description,
				path: folders.path,
				emoji: folders.emoji,
				color: folders.color,
				featuredImage: folders.featuredImage,
				isFavorite: folders.isFavorite,
				totalFiles: folders.totalFiles,
				totalSize: folders.totalSize,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			})
			.from(folders)
			.where(eq(folders.path, '/'))
			.limit(1);

		if (rootFolder.length === 0) {
			const folderId = await generateFolderIdFromName('Root');
			const inserted = await db
				.insert(folders)
				.values({
					id: folderId,
					name: 'Root',
					description: null,
					path: '/',
					emoji: null,
					color: null,
					featuredImage: null,
					isFavorite: false,
					totalFiles: 0,
					totalSize: 0,
					parentId: null,
					presetId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning({
					id: folders.id,
					name: folders.name,
					description: folders.description,
					path: folders.path,
					emoji: folders.emoji,
					color: folders.color,
					featuredImage: folders.featuredImage,
					isFavorite: folders.isFavorite,
					totalFiles: folders.totalFiles,
					totalSize: folders.totalSize,
					lastIndexed: folders.lastIndexed,
					createdAt: folders.createdAt,
					updatedAt: folders.updatedAt,
					parentId: folders.parentId,
					presetId: folders.presetId,
				});
			rootFolder = inserted;
		}
		return res.json(rootFolder[0]);
	} catch (error) {
		logger.error('Error al obtener/crear la carpeta raíz', { error });
		return res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/folders - Crear carpeta
router.post('/', async (req, res) => {
	try {
		const validationResult = CreateFolderSchema.safeParse(req.body);
		if (!validationResult.success) {
			return res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: validationResult.error.issues,
			});
		}

		const data = validationResult.data;
		const existingFolder = await db.select({ id: folders.id }).from(folders).where(eq(folders.path, data.path));
		if (existingFolder.length > 0) {
			return res.status(409).json({ error: 'Ya existe una carpeta con esa ruta' });
		}

		const folderId = await generateFolderIdFromName(data.name);
		const newFolder = await db
			.insert(folders)
			.values({
				id: folderId,
				name: data.name,
				description: data.description ?? null,
				path: data.path,
				emoji: data.emoji ?? null,
				color: data.color ?? null,
				featuredImage: data.featuredImage ?? null,
				isFavorite: data.isFavorite ?? false,
				totalFiles: 0,
				totalSize: 0,
				parentId: data.parentId ?? null,
				presetId: data.presetId ?? null,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning({
				id: folders.id,
				name: folders.name,
				description: folders.description,
				path: folders.path,
				emoji: folders.emoji,
				color: folders.color,
				featuredImage: folders.featuredImage,
				isFavorite: folders.isFavorite,
				totalFiles: folders.totalFiles,
				totalSize: folders.totalSize,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			});

		return res.status(201).json(newFolder[0]);
	} catch (error) {
		logger.error('Error al crear carpeta', { error });
		return res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});
// DEBUG AVANZADO - Endpoint de debug para subcarpetas completo
router.get('/_debug_subcarpetas', async (_req, res) => {
	try {
		logger.info('Iniciando depuración de subcarpetas BD vs FS');

		// Importar servicios necesarios
		const { scanFileSystemFromRoot } = await import('@/lib/filesystem/folder-sync');

		// 1. Obtener carpetas desde BD
		const carpetasBD = await db
			.select({
				id: folders.id,
				name: folders.name,
				path: folders.path,
				parentId: folders.parentId,
			})
			.from(folders)
			.orderBy(asc(folders.path));

		logger.info(`Carpetas en BD: ${carpetasBD.length}`);

		// 2. Escanear sistema de archivos
		const { syncFoldersWithFileSystem } = await import('@/lib/filesystem/folder-sync');
		const syncResult = await syncFoldersWithFileSystem({ dryRun: true });

		// 3. Crear mapas para comparación rápida
		const bdPaths = new Set(carpetasBD.map((c) => c.path));
		const fsPaths = new Set(); // Vacío ya que usamos syncResult.added

		// 4. Análisis de diferencias - usar resultado de sincronización
		const soloEnBD = syncResult.removed; // Carpetas que están en BD pero no en FS
		const soloEnFS = syncResult.added; // Carpetas que están en FS pero no en BD

		// 5. Análisis de subcarpetas
		const subcarpetasBD = carpetasBD.filter((c) => c.parentId);
		const subcarpetasFS = syncResult.discovered
			.filter((path) => path.includes('/') || path.includes('\\'))
			.map((path) => ({
				name: path.split(/[/\\]/).pop() || 'unknown',
				path,
			}));

		// 6. Buscar relaciones problemáticas
		const bdById = new Map(carpetasBD.map((c) => [c.id, c]));
		const relacionesProblematicas = carpetasBD.filter((carpeta: any) => {
			if (!carpeta.parentId) return false;

			const padre = bdById.get(carpeta.parentId);
			if (!padre) {
				console.warn(`⚠️ [DEBUG] Carpeta ${carpeta.name} tiene parentId ${carpeta.parentId} que no existe`);
				return true;
			}

			return false;
		});

		const respuesta = {
			resumen: {
				carpetasBD: carpetasBD.length,
				carpetasFaltantesEnBD: soloEnFS.length,
				carpetasOrfanasEnBD: soloEnBD.length,
				relacionesProblematicas: relacionesProblematicas.length,
			},
			diferencias: {
				solo_en_fs: soloEnFS.slice(0, 20),
				solo_en_bd: soloEnBD.slice(0, 20),
			},
			subcarpetas: {
				bd: subcarpetasBD.slice(0, 10).map((f) => ({
					id: f.id,
					name: f.name,
					path: f.path,
					parent: f.parentId ? bdById.get(f.parentId)?.name || 'PARENT_NOT_FOUND' : 'NO_PARENT',
				})),
				fs: subcarpetasFS.slice(0, 10).map((d) => ({
					name: d.name,
					path: d.path,
					parent_path: d.path.substring(0, d.path.lastIndexOf('/')) || '/',
				})),
			},
			sync_analysis: syncResult,
		};

		logger.success('Análisis de subcarpetas completado');
		res.json(respuesta);
	} catch (error) {
		logger.error('Error en debug de subcarpetas', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/tree - Obtener todas las carpetas con conteos y estadísticas
router.get('/tree', async (_req, res) => {
	try {
		logger.debug('[TREE] ENDPOINT');
		const rows = await db
			.select({
				id: folders.id,
				name: folders.name,
				description: folders.description,
				path: folders.path,
				emoji: folders.emoji,
				color: folders.color,
				featuredImage: folders.featuredImage,
				isFavorite: folders.isFavorite,
				totalFiles: folders.totalFiles,
				totalSize: folders.totalSize,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
				imagesCount: sql<number>`(SELECT COUNT(1) FROM Image WHERE Image.folderId = ${folders.id})`,
				videosCount: sql<number>`(SELECT COUNT(1) FROM Video WHERE Video.folderId = ${folders.id})`,
				childrenCount: sql<number>`(SELECT COUNT(*) FROM Folder WHERE Folder.parentId = ${folders.id})`,
			})
			.from(folders)
			.orderBy(asc(folders.name));

		const withCounts = rows.map((f: any) => ({
			...f,
			_count: {
				images: Number(f.imagesCount) || 0,
				videos: Number(f.videosCount) || 0,
				children: Number(f.childrenCount) || 0,
			},
		}));

		// Debug ligero
		for (const f of withCounts.slice(0, 1)) {
			logger.debug(`childrenCount sample -> ${f.name}: ${f.childrenCount}`);
		}

		const { fromDrizzleFoldersWithCounts } = await import('@/transformers/folder');
		const transformed = fromDrizzleFoldersWithCounts(withCounts);
		res.json(transformed);
	} catch (error) {
		logger.error('Error al obtener árbol de carpetas', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DEBUG-ROUTES - Rutas especiales de debug que deben ir antes de /:id
router.get('/_debug_', async (_req, res) => {
	try {
		console.log('🔍 [DEBUG] Endpoint debug simple alcanzado - FUNCIONA AHORA');

		// TEST DE QUERY SQL DIRECTA PARA CHILDRENCOUNT
		const testQuery = await db.execute(sql`
			SELECT 
				id, name, parentId,
				(SELECT COUNT(*) FROM Folder WHERE Folder.parentId = Folder.id) as childrenCount
			FROM Folder 
			WHERE name IN ('Photography', 'Cartoons', 'Aesthethic', 'SilentHill', 'Nature')
			ORDER BY name
		`);

		const testResults = testQuery.rows.map((row: any) => ({
			id: row[0],
			name: row[1],
			parentId: row[2],
			childrenCount: row[3],
		}));

		res.json({
			success: true,
			message: 'Debug endpoint funcionando correctamente',
			timestamp: new Date().toISOString(),
			server_time: Date.now(),
			hot_reload_working: true,
			sqlTest: {
				query:
					'SELECT id, name, parentId, (SELECT COUNT(*) FROM Folder WHERE Folder.parentId = Folder.id) as childrenCount FROM Folder',
				results: testResults,
			},
		});
	} catch (error) {
		console.error('❌ Error en debug simple:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DEBUG AVANZADO - Endpoint de debug para subcarpetas completo
// (El endpoint '/debug-subcarpetas-analysis' ya está definido arriba)

// TEMPORARY: Endpoint para diagnosticar mapeo de tipos de archivo
router.post('/test-entity-types', async (req, res) => {
	try {
		const { extensions } = req.body;
		if (!Array.isArray(extensions)) {
			return res.status(400).json({ error: 'extensions debe ser un array' });
		}

		const { FileEntityMapperService } = await import('@/services/file-entity-mapper/file-entity-mapper.service');
		const mapper = FileEntityMapperService.getInstance();

		const results = {};
		for (const ext of extensions) {
			results[ext] = mapper.getEntityTypeFromExtension(ext);
		}

		res.json({ results });
	} catch (error) {
		console.error('Error testing entity types:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id/preview - Generar thumbnail compuesto de una carpeta
router.get('/:id/preview', async (req, res) => {
	try {
		const { id } = req.params;
		console.log('📁 PREVIEW ENDPOINT HIT:', id);

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		// Obtener imágenes de la carpeta (máximo 4 para el preview)
		const recentImages = await db
			.select({
				id: images.id,
				filename: images.filename,
				path: images.path,
			})
			.from(images)
			.where(eq(images.folderId, id))
			.orderBy(desc(images.createdAt))
			.limit(4);

		console.log('📁 PREVIEW DB RESULT:', { 
			id, 
			imageCount: recentImages?.length || 0,
			images: recentImages?.map(img => img?.filename || 'UNDEFINED') || 'NULL_RESULT'
		});

		// Si no hay imágenes, devolver un SVG con mensaje
		if (!recentImages || recentImages.length === 0) {
			const emptySvg = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
				<rect width="100%" height="100%" fill="#f8f9fa"/>
				<rect x="50" y="50" width="100" height="100" fill="#e9ecef" stroke="#dee2e6" stroke-width="2" stroke-dasharray="5,5"/>
				<text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12" fill="#6c757d">Sin imágenes</text>
				<text x="100" y="115" text-anchor="middle" font-family="Arial" font-size="10" fill="#adb5bd">${id}</text>
			</svg>`;
			
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=300');
			return res.send(emptySvg);
		}

		// Generar SVG composite
		const svgWidth = 200;
		const svgHeight = 200;
		const gridSize = recentImages.length >= 4 ? 2 : recentImages.length === 3 ? 2 : 1;
		const imageSize = svgWidth / gridSize;

		let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
		
		// Fondo
		svgContent += `<rect width="100%" height="100%" fill="#f8f9fa"/>`;

		recentImages.forEach((image, index) => {
			if (!image?.filename) {
				console.log('📁 SKIPPING NULL IMAGE:', { index, image });
				return;
			}

			const row = Math.floor(index / gridSize);
			const col = index % gridSize;
			const x = col * imageSize;
			const y = row * imageSize;

			// Crear rectángulo con imagen como fondo
			svgContent += `<rect x="${x}" y="${y}" width="${imageSize}" height="${imageSize}" fill="#e9ecef" stroke="#dee2e6" stroke-width="1"/>`;
			
			// Texto del filename como fallback
			const shortName = image.filename.length > 10 ? `${image.filename.substring(0, 10)}...` : image.filename;
			svgContent += `<text x="${x + imageSize/2}" y="${y + imageSize/2}" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">${shortName}</text>`;
		});

		svgContent += '</svg>';

		res.setHeader('Content-Type', 'image/svg+xml');
		res.setHeader('Cache-Control', 'public, max-age=3600');
		return res.send(svgContent);
	} catch (error) {
		console.error('📁 PREVIEW ERROR:', error);
		
		// SVG de error
		const errorSvg = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
			<rect width="100%" height="100%" fill="#ffe6e6"/>
			<rect x="50" y="50" width="100" height="100" fill="#ffcccc" stroke="#ff6b6b" stroke-width="2"/>
			<text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12" fill="#cc0000">Error</text>
			<text x="100" y="115" text-anchor="middle" font-family="Arial" font-size="10" fill="#ff6b6b">${req.params.id}</text>
		</svg>`;
		
		res.setHeader('Content-Type', 'image/svg+xml');
		res.setHeader('Cache-Control', 'public, max-age=60');
		return res.send(errorSvg);
	}
});

// TEST - Endpoint simple para probar rutas parametrizadas
router.get('/:id/test', async (req, res) => {
	console.log('🧪 TEST ENDPOINT HIT:', req.params.id);
	res.json({ test: 'success', id: req.params.id });
});



// POST /api/folders/:id/toggle-favorite - Alternar favorito
router.post('/:id/toggle-favorite', async (req, res) => {
	try {
		const { id } = req.params;
		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const current = await db
			.select({ isFavorite: folders.isFavorite })
			.from(folders)
			.where(eq(folders.id, id))
			.limit(1);
		if (!current.length) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}
		const updated = await db
			.update(folders)
			.set({ isFavorite: !current[0].isFavorite })
			.where(eq(folders.id, id))
			.returning({
				id: folders.id,
				name: folders.name,
				description: folders.description,
				path: folders.path,
				emoji: folders.emoji,
				color: folders.color,
				featuredImage: folders.featuredImage,
				isFavorite: folders.isFavorite,
				totalFiles: folders.totalFiles,
				totalSize: folders.totalSize,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			});
		res.json(updated[0]);
	} catch (error) {
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/folders/:id/move - Mover carpeta (cambiar parentId)
router.post('/:id/move', async (req, res) => {
	try {
		const { id } = req.params;
		const { newParentId } = req.body as { newParentId: string | null };
		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}
		const updated = await db
			.update(folders)
			.set({ parentId: newParentId ?? null })
			.where(eq(folders.id, id))
			.returning({
				id: folders.id,
				name: folders.name,
				description: folders.description,
				path: folders.path,
				emoji: folders.emoji,
				color: folders.color,
				featuredImage: folders.featuredImage,
				isFavorite: folders.isFavorite,
				totalFiles: folders.totalFiles,
				totalSize: folders.totalSize,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			});
		res.json(updated[0]);
	} catch (error) {
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/by-path - Obtener el ID de una carpeta por su ruta
// (Endpoint '/by-path' definido más abajo, se elimina duplicado)

// GET /api/folders/:id/recent-images - Obtener imágenes recientes de una carpeta
router.get('/:id/recent-images', async (req, res) => {
	try {
		const { id } = req.params;
		const limit = Number(req.query.limit) || 4;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folderImages = await db
			.select({ thumbnailUrl: images.thumbnail })
			.from(images)
			.where(eq(images.folderId, id))
			.orderBy(desc(images.createdAt))
			.limit(limit);

		const imageUrls = folderImages
			.map((img: any) => img.thumbnailUrl)
			.filter((url: any): url is string => url !== null);
		res.json(imageUrls);
	} catch (error) {
		logger.error('Error al obtener imágenes recientes de la carpeta', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id/stats - Obtener estadísticas de una carpeta
router.get('/:id/stats', async (req, res) => {
	try {
		const { id } = req.params;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}
		// Obtener estadísticas básicas de la carpeta
		const folderData = await db
			.select({
				totalSize: folders.totalSize,
				lastIndexed: folders.lastIndexed,
			})
			.from(folders)
			.where(eq(folders.id, id))
			.limit(1);

		if (folderData.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}
		// Contar imágenes por tipo
		const imageStats = await db
			.select({
				count: count(),
			})
			.from(images)
			.where(eq(images.folderId, id));

		// Contar videos
		const videoStats = await db
			.select({
				count: count(),
			})
			.from(videos)
			.where(eq(videos.folderId, id));

		// Obtener las últimas 4 imágenes
		const recentImages = await db
			.select({
				id: images.id,
				name: images.name,
				thumbnail: images.thumbnail,
				createdAt: images.createdAt,
			})
			.from(images)
			.where(eq(images.folderId, id))
			.orderBy(desc(images.createdAt))
			.limit(4);

		const stats = {
			totalImages: imageStats[0]?.count || 0,
			totalVideos: videoStats[0]?.count || 0,
			totalAudio: 0, // TODO: Implementar cuando se agregue tabla de audio
			totalDocuments: 0, // TODO: Implementar cuando se agregue tabla de documentos
			totalOthers: 0, // TODO: Implementar cuando se agregue tabla de otros archivos
			totalSize: folderData[0].totalSize,
			lastActivity: folderData[0].lastIndexed,
			recentImages: recentImages.map((image) => ({
				id: image.id,
				name: image.name,
				thumbnailUrl: image.thumbnail, // Mapear thumbnail a thumbnailUrl
			})),
		};
		res.json(stats);
	} catch (error) {
		logger.error('Error al obtener estadísticas de la carpeta', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id/path - Obtener la ruta de una carpeta por su ID
router.get('/:id/path', async (req, res) => {
	try {
		const { id } = req.params;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folder = await db.select({ path: folders.path }).from(folders).where(eq(folders.id, id));

		if (folder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}
		res.json({ path: folder[0].path });
	} catch (error) {
		logger.error('Error al obtener la ruta de la carpeta', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id/name - Obtener el nombre de una carpeta por su ID
router.get('/:id/name', async (req, res) => {
	try {
		const { id } = req.params;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folder = await db.select({ name: folders.name }).from(folders).where(eq(folders.id, id));

		if (folder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}
		res.json({ name: folder[0].name });
	} catch (error) {
		logger.error('Error al obtener el nombre de la carpeta', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/by-path - Obtener el ID de una carpeta por su ruta
router.get('/by-path', async (req, res) => {
	try {
		const folderPath = req.query.path as string;
		logger.debug('[BY-PATH] Parámetros recibidos', { query: req.query, path: folderPath });

		if (!folderPath) {
			logger.warn('[BY-PATH] Error: La ruta es requerida');
			return res.status(400).json({ error: 'La ruta es requerida' });
		}

		const folder = await db.select({ id: folders.id }).from(folders).where(eq(folders.path, folderPath));

		if (!folder || folder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada para la ruta proporcionada' });
		}
		res.json({ id: folder[0].id });
	} catch (error) {
		logger.error('Error al obtener el ID de la carpeta por ruta', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id/parent-id - Obtener el ID de la carpeta padre
router.get('/:id/parent-id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folder = await db.select({ parentId: folders.parentId }).from(folders).where(eq(folders.id, id));

		if (folder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}
		res.json({ parentFolderId: folder[0].parentId });
	} catch (error) {
		logger.error('Error al obtener el ID de la carpeta padre', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PATCH /api/folders/:id/featured-image - Actualizar imagen destacada de una carpeta
router.patch('/:id/featured-image', async (req, res) => {
	try {
		const { id } = req.params;
		const { imageUrl } = req.body;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db
			.update(folders)
			.set({ featuredImage: imageUrl })
			.where(eq(folders.id, id))
			.returning({
				id: folders.id,
				name: folders.name,
				description: folders.description,
				path: folders.path,
				emoji: folders.emoji,
				color: folders.color,
				featuredImage: folders.featuredImage,
				isFavorite: folders.isFavorite,
				totalFiles: folders.totalFiles,
				totalSize: folders.totalSize,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			});
		res.json(updatedFolder);
	} catch (error) {
		logger.error('Error al actualizar la imagen destacada de la carpeta', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PATCH /api/folders/:id/color - Actualizar color de una carpeta
router.patch('/:id/color', async (req, res) => {
	try {
		const { id } = req.params;
		const { color } = req.body;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db.update(folders).set({ color }).where(eq(folders.id, id)).returning({
			id: folders.id,
			name: folders.name,
			description: folders.description,
			path: folders.path,
			emoji: folders.emoji,
			color: folders.color,
			featuredImage: folders.featuredImage,
			isFavorite: folders.isFavorite,
			totalFiles: folders.totalFiles,
			totalSize: folders.totalSize,
			lastIndexed: folders.lastIndexed,
			createdAt: folders.createdAt,
			updatedAt: folders.updatedAt,
			parentId: folders.parentId,
			presetId: folders.presetId,
		});
		res.json(updatedFolder);
	} catch (error) {
		logger.error('Error al actualizar el color de la carpeta', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PATCH /api/folders/:id/emoji - Actualizar emoji de una carpeta
router.patch('/:id/emoji', async (req, res) => {
	try {
		const { id } = req.params;
		const { emoji } = req.body;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db.update(folders).set({ emoji }).where(eq(folders.id, id)).returning({
			id: folders.id,
			name: folders.name,
			description: folders.description,
			path: folders.path,
			emoji: folders.emoji,
			color: folders.color,
			featuredImage: folders.featuredImage,
			isFavorite: folders.isFavorite,
			totalFiles: folders.totalFiles,
			totalSize: folders.totalSize,
			lastIndexed: folders.lastIndexed,
			createdAt: folders.createdAt,
			updatedAt: folders.updatedAt,
			parentId: folders.parentId,
			presetId: folders.presetId,
		});
		res.json(updatedFolder);
	} catch (error) {
		logger.error('Error al actualizar el emoji de la carpeta', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PATCH /api/folders/:id/favorite - Actualizar estado de favorito de una carpeta
router.patch('/:id/favorite', async (req, res) => {
	try {
		const { id } = req.params;
		const { isFavorite } = req.body;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db.update(folders).set({ isFavorite }).where(eq(folders.id, id)).returning({
			id: folders.id,
			name: folders.name,
			description: folders.description,
			path: folders.path,
			emoji: folders.emoji,
			color: folders.color,
			featuredImage: folders.featuredImage,
			isFavorite: folders.isFavorite,
			totalFiles: folders.totalFiles,
			totalSize: folders.totalSize,
			lastIndexed: folders.lastIndexed,
			createdAt: folders.createdAt,
			updatedAt: folders.updatedAt,
			parentId: folders.parentId,
			presetId: folders.presetId,
		});
		res.json(updatedFolder);
	} catch (error) {
		logger.error('Error al actualizar el estado de favorito de la carpeta', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PATCH /api/folders/:id/description - Actualizar descripción de una carpeta
router.patch('/:id/description', async (req, res) => {
	try {
		const { id } = req.params;
		const { description } = req.body;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db.update(folders).set({ description }).where(eq(folders.id, id)).returning({
			id: folders.id,
			name: folders.name,
			description: folders.description,
			path: folders.path,
			emoji: folders.emoji,
			color: folders.color,
			featuredImage: folders.featuredImage,
			isFavorite: folders.isFavorite,
			totalFiles: folders.totalFiles,
			totalSize: folders.totalSize,
			lastIndexed: folders.lastIndexed,
			createdAt: folders.createdAt,
			updatedAt: folders.updatedAt,
			parentId: folders.parentId,
			presetId: folders.presetId,
		});
		res.json(updatedFolder);
	} catch (error) {
		logger.error('Error al actualizar la descripción de la carpeta', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PATCH /api/folders/:id/name - Actualizar nombre de una carpeta
router.patch('/:id/name', async (req, res) => {
	try {
		const { id } = req.params;
		const { name } = req.body;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const updatedFolder = await db.update(folders).set({ name }).where(eq(folders.id, id)).returning({
			id: folders.id,
			name: folders.name,
			description: folders.description,
			path: folders.path,
			emoji: folders.emoji,
			color: folders.color,
			featuredImage: folders.featuredImage,
			isFavorite: folders.isFavorite,
			totalFiles: folders.totalFiles,
			totalSize: folders.totalSize,
			lastIndexed: folders.lastIndexed,
			createdAt: folders.createdAt,
			updatedAt: folders.updatedAt,
			parentId: folders.parentId,
			presetId: folders.presetId,
		});
		res.json(updatedFolder);
	} catch (error) {
		logger.error('Error al actualizar el nombre de la carpeta', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/folders/:id/reindex - Reindexar una carpeta específica
router.post('/:id/reindex', async (req, res) => {
	try {
		const { id } = req.params;
		const { useStructuredFlow = false, enableSync = true, skipThumbnails = false, skipMetadata = false } = req.body;

		if (!id || typeof id !== 'string' || id.trim().length === 0) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		logger.info(`Iniciando reindexación de carpeta: ${id}`, {
			useStructuredFlow,
			enableSync,
			skipThumbnails,
			skipMetadata,
		});

		// Obtener la carpeta para verificar que existe
		const folder = await db
			.select({
				id: folders.id,
				path: folders.path,
				name: folders.name,
			})
			.from(folders)
			.where(eq(folders.id, id))
			.limit(1);

		if (folder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		const targetFolder = folder[0];

		// ===== USAR FLUJO ESTRUCTURADO O LEGACY =====
		if (useStructuredFlow) {
			logger.info('🚀 Usando nuevo servicio de reindexado estructurado');

			const { FolderReindexService } = await import('@/services/folders/folder-reindex.service');
			const reindexService = FolderReindexService.getInstance();

			const result = await reindexService.executeStructuredReindex({
				folderId: id,
				includeSubfolders: true,
				includeHidden: false,
				concurrency: 3,
				emitEvents: true,
				skipThumbnails,
				skipMetadata,
			});

			logger.success(`Reindexación estructurada completada para carpeta: ${targetFolder.name}`, {
				success: result.success,
				foldersProcessed: result.summary.foldersProcessed,
				filesIndexed: result.summary.filesIndexed,
				thumbnailsGenerated: result.summary.thumbnailsGenerated,
				metadataExtracted: result.summary.metadataExtracted,
				totalDuration: result.totalDuration,
			});

			// Obtener la carpeta actualizada
			const updatedFolder = await db
				.select({
					id: folders.id,
					name: folders.name,
					description: folders.description,
					path: folders.path,
					emoji: folders.emoji,
					color: folders.color,
					featuredImage: folders.featuredImage,
					isFavorite: folders.isFavorite,
					totalFiles: folders.totalFiles,
					totalSize: folders.totalSize,
					lastIndexed: folders.lastIndexed,
					createdAt: folders.createdAt,
					updatedAt: folders.updatedAt,
					parentId: folders.parentId,
					presetId: folders.presetId,
				})
				.from(folders)
				.where(eq(folders.id, id))
				.limit(1);

			return res.json({
				folder: updatedFolder[0],
				reindexResult: result,
				mode: 'structured',
			});
		}
		// ===== FLUJO LEGACY =====
		logger.info('📁 Usando flujo legacy de reindexado');

		const { updateFolderStats } = await import('@/lib/filesystem/folder-stats');

		// Ejecutar la reindexación con sincronización automática y eventos de progreso
		const indexResult = await updateFolderStats(id, new Set(), 10, 0, enableSync, true);

		logger.success(`Reindexación legacy completada para carpeta: ${targetFolder.name}`, {
			entitiesCreated: indexResult.successful,
			entitiesUpdated: indexResult.processed - indexResult.successful,
			syncResult: indexResult.syncResult,
		});

		// Obtener la carpeta actualizada para devolverla
		const updatedFolder = await db
			.select({
				id: folders.id,
				name: folders.name,
				description: folders.description,
				path: folders.path,
				emoji: folders.emoji,
				color: folders.color,
				featuredImage: folders.featuredImage,
				isFavorite: folders.isFavorite,
				totalFiles: folders.totalFiles,
				totalSize: folders.totalSize,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			})
			.from(folders)
			.where(eq(folders.id, id))
			.limit(1);

		// Incluir información de sincronización en la respuesta
		return res.json({
			folder: updatedFolder[0],
			indexResult: {
				created: indexResult.successful,
				updated: indexResult.processed - indexResult.successful,
				errors: indexResult.errors,
			},
			...(indexResult.syncResult && { syncResult: indexResult.syncResult }),
			mode: 'legacy',
		});
	} catch (error) {
		logger.error('Error al reindexar la carpeta', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/folders/reindex-all - Reindexar todas las carpetas
router.post('/reindex-all', async (req, res) => {
	try {
		const { useStructuredFlow = false, enableSync = true, skipThumbnails = false, skipMetadata = false } = req.body;

		logger.info('Iniciando reindexación global de todas las carpetas', {
			useStructuredFlow,
			enableSync,
			skipThumbnails,
			skipMetadata,
		});

		// Obtener todas las carpetas
		const allFolders = await db
			.select({
				id: folders.id,
				name: folders.name,
				path: folders.path,
			})
			.from(folders)
			.orderBy(asc(folders.name));

		if (allFolders.length === 0) {
			logger.info('No hay carpetas para reindexar');
			return res.json({ processed: 0, errors: [], mode: useStructuredFlow ? 'structured' : 'legacy' });
		}

		// ===== USAR FLUJO ESTRUCTURADO O LEGACY =====
		if (useStructuredFlow) {
			logger.info('🚀 Usando nuevo servicio de reindexado estructurado para todas las carpetas');

			const { FolderReindexService } = await import('@/services/folders/folder-reindex.service');
			const reindexService = FolderReindexService.getInstance();

			const result = await reindexService.executeStructuredReindex({
				includeSubfolders: true,
				includeHidden: false,
				concurrency: 3,
				emitEvents: true,
				skipThumbnails,
				skipMetadata,
			});

			logger.success('Reindexación estructurada global completada', {
				success: result.success,
				foldersProcessed: result.summary.foldersProcessed,
				filesIndexed: result.summary.filesIndexed,
				thumbnailsGenerated: result.summary.thumbnailsGenerated,
				metadataExtracted: result.summary.metadataExtracted,
				totalDuration: result.totalDuration,
			});

			return res.json({
				processed: result.summary.foldersProcessed,
				errors: Object.values(result.phases).flatMap((phase) => phase.errors),
				result,
				mode: 'structured',
			});
		}
		// ===== FLUJO LEGACY =====
		logger.info('📁 Usando flujo legacy de reindexado para todas las carpetas');

		// Importar funciones necesarias una sola vez
		const { updateFolderStats } = await import('@/lib/filesystem/folder-stats');
		const { emit } = await import('@/lib/server/events.server');

		const result = await reindexAllFoldersProcess(allFolders, enableSync, updateFolderStats, emit);

		return res.json({
			...result,
			mode: 'legacy',
		});
	} catch (error) {
		console.error('Error en reindexación global:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// REWRITE: helper limpio para reindexado global
async function reindexAllFoldersProcess(
	allFolders: Array<{ id: string; name: string; path: string }>,
	enableSync: boolean,
	updateFolderStats: (
		folderId: string,
		visited: Set<string>,
		batchSize: number,
		depth: number,
		enableSync: boolean,
		emitProgress: boolean
	) => Promise<{ processed: number; successful: number; errors: string[]; syncResult?: unknown }>,
	emit: (evt: { type: string; data: Record<string, unknown> }) => Promise<void>
) {
	let processed = 0;
	const errors: string[] = [];
	let globalSyncResult: unknown = null;

	const processAt = async (i: number): Promise<void> => {
		if (i >= allFolders.length) return;
		const folder = allFolders[i];
		const phase = getFolderProcessPhase(i, allFolders.length);
		const progress = Math.round(((i + 1) / allFolders.length) * 100);
		const shouldSync = enableSync && i === 0;
		try {
			await emit({
				type: 'folder:reindexAll:progress',
				data: {
					folderId: folder.id,
					isProcessing: true,
					progress,
					totalFiles: allFolders.length,
					filesProcessed: i + 1,
					phase,
					message: `Reindexando carpetas... ${i + 1}/${allFolders.length} (${folder.name})`,
					timestamp: Date.now(),
					currentFolder: folder.name,
				},
			});

			const indexResult = await updateFolderStats(folder.id, new Set(), 10, 0, shouldSync, true);
			if (shouldSync && indexResult?.syncResult) {
				globalSyncResult = indexResult.syncResult;
			}
			processed += 1;
			logger.success(`Carpeta reindexada: ${folder.name}`);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Error desconocido';
			const errorMessage = `Error en carpeta ${folder.name}: ${message}`;
			console.error(`❌ ${errorMessage}`);
			errors.push(errorMessage);
		}
		await processAt(i + 1);
	};

	await processAt(0);

	await emit({
		type: 'folder:reindexAll:progress',
		data: {
			folderId: null,
			isProcessing: false,
			progress: 100,
			totalFiles: allFolders.length,
			filesProcessed: allFolders.length,
			phase: 'complete',
			message: `Reindexación completada: ${processed} carpetas procesadas`,
			timestamp: Date.now(),
			currentFolder: null,
			...(globalSyncResult ? { syncResult: globalSyncResult } : {}),
		},
	});

	logger.success(`Reindexación global completada: ${processed} carpetas procesadas, ${errors.length} errores`);

	return {
		processed,
		errors,
		...(globalSyncResult ? { syncResult: globalSyncResult } : {}),
	};
}

// Función auxiliar para determinar la fase del proceso
function getFolderProcessPhase(currentIndex: number, totalFolders: number): string {
	if (currentIndex < totalFolders / 3) {
		return 'scanning';
	}
	if (currentIndex < (totalFolders * 2) / 3) {
		return 'metadata';
	}
	return 'processing';
}

// POST /api/folders/sync - Sincronizar carpetas con el sistema de archivos
router.post('/sync', async (req, res) => {
	try {
		const { dryRun = false, maxDepth = 10, includeHidden = false } = req.body;
		logger.info('Iniciando sincronización de carpetas', { dryRun, maxDepth, includeHidden });

		// Importar la función de sincronización
		const { syncFoldersWithFileSystem } = await import('@/lib/filesystem/folder-sync');

		// Ejecutar sincronización
		const syncResult = await syncFoldersWithFileSystem({
			dryRun,
			maxDepth,
			includeHidden,
			forceSync: true,
		});

		logger.success('Sincronización completada', {
			added: syncResult.added.length,
			removed: syncResult.removed.length,
			updated: syncResult.updated.length,
			errors: syncResult.errors.length,
			duration: `${syncResult.stats.duration}ms`,
			dryRun,
		});

		res.json(syncResult);
	} catch (error) {
		logger.error('Error en sincronización de carpetas', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/sync/status - Verificar estado de sincronización (dry run)
router.get('/sync/status', async (req, res) => {
	try {
		const { maxDepth = 10, includeHidden = false } = req.query;
		logger.info('Verificando estado de sincronización');

		// Importar la función de verificación
		const { checkSyncStatus } = await import('@/lib/filesystem/folder-sync');

		// Verificar estado sin hacer cambios
		const syncStatus = await checkSyncStatus({
			maxDepth: Number(maxDepth),
			includeHidden: includeHidden === 'true',
		});

		logger.success('Verificación completada', {
			toAdd: syncStatus.added.length,
			toRemove: syncStatus.removed.length,
			toUpdate: syncStatus.updated.length,
			errors: syncStatus.errors.length,
		});

		res.json(syncStatus);
	} catch (error) {
		logger.error('Error verificando estado de sincronización', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// ==============================================
// RUTAS DE SINCRONIZACIÓN DE ARCHIVOS
// ==============================================

// POST /api/folders/:id/sync-files - Sincronizar archivos de una carpeta específica
router.post('/:id/sync-files', async (req, res) => {
	try {
		const { id } = req.params;
		const { force = false } = req.body;

		logger.info(`Iniciando sincronización de archivos para carpeta: ${id}`);
		logger.debug('Parámetros recibidos', { id, force });

		// Importar el servicio de sincronización de archivos
		logger.debug('Importando fileSyncService...');
		const { fileSyncService } = await import('@/lib/filesystem/file-sync.service');
		logger.success('fileSyncService importado exitosamente');

		// Ejecutar sincronización de archivos
		logger.debug('Ejecutando syncFolderFiles...');
		const syncResult = await fileSyncService.syncFolderFiles(id, { force });

		logger.success(`Sincronización de archivos completada para carpeta: ${id}`, syncResult);

		res.json(syncResult);
	} catch (error) {
		logger.error(`Error sincronizando archivos de carpeta ${req.params.id}`, {
			error,
			stack: error instanceof Error ? error.stack : 'No stack',
			details: {
				name: error instanceof Error ? error.name : 'Unknown',
				message: error instanceof Error ? error.message : String(error),
				cause: error instanceof Error ? (error as any).cause : undefined,
			},
		});
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/folders/sync-all-files - Sincronizar archivos de todas las carpetas
router.post('/sync-all-files', async (req, res) => {
	try {
		const { force = false, parallelism = 3 } = req.body;

		logger.info('Iniciando sincronización global de archivos');

		// Importar servicios necesarios
		const { fileSyncService } = await import('@/lib/filesystem/file-sync.service');
		const { getAllFolders } = await import('@/services/folder/folder.service');

		// Obtener todas las carpetas
		const allFolders = await getAllFolders();
		const folderIds = allFolders.map((f: { id: string }) => f.id);

		// Ejecutar sincronización global
		const syncResult = await fileSyncService.syncMultipleFolders(folderIds, { force, parallelism });

		logger.success('Sincronización global de archivos completada', syncResult);

		res.json(syncResult);
	} catch (error) {
		logger.error('Error en sincronización global de archivos', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id/sync-status - Verificar estado de sincronización de archivos
router.get('/:id/sync-status', async (req, res) => {
	try {
		const { id } = req.params;

		logger.info(`Verificando estado de sincronización para carpeta: ${id}`);

		// Importar el servicio de sincronización de archivos
		const { fileSyncService } = await import('@/lib/filesystem/file-sync.service');

		// Verificar estado de sincronización
		const syncStatus = await fileSyncService.checkSyncStatus(id);

		res.json(syncStatus);
	} catch (error) {
		logger.error(`Error verificando estado de sincroncronización de carpeta ${req.params.id}`, { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/folders/:id - Obtener una carpeta por ID (DEBE IR AL FINAL)
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!isValidFolderId(id)) {
			return res.status(400).json({ error: 'ID de carpeta inválido' });
		}

		const folder = await db
			.select({
				id: folders.id,
				name: folders.name,
				description: folders.description,
				path: folders.path,
				emoji: folders.emoji,
				color: folders.color,
				featuredImage: folders.featuredImage,
				isFavorite: folders.isFavorite,
				totalFiles: folders.totalFiles,
				totalSize: folders.totalSize,
				lastIndexed: folders.lastIndexed,
				createdAt: folders.createdAt,
				updatedAt: folders.updatedAt,
				parentId: folders.parentId,
				presetId: folders.presetId,
			})
			.from(folders)
			.where(eq(folders.id, id));

		if (folder.length === 0) {
			return res.status(404).json({ error: 'Carpeta no encontrada' });
		}

		return res.json(folder);
	} catch (error) {
		logger.error('Error al obtener carpeta', { error });
		return res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

export { router as foldersRouter };
