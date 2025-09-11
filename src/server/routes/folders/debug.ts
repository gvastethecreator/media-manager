/**
 * @file Endpoints de Debug para Folders
 * @module server/routes/folders/debug
 * @description
 * Endpoints especializados para debugging y análisis:
 * - /_debug_ - Test simple de debug
 * - /test-simple - Test básico de conectividad
 * - /subcarpetas - Análisis BD vs FS
 * - /tree - Vista de árbol con conteos
 * - /scanner-test - Test del escáner de archivos
 *
 * ✅ REFACTORIZADO - Septiembre 2025
 */

// @ts-nocheck - Temporary suppression for Express handler parameter types

import { asc, sql } from 'drizzle-orm';
import { Router } from 'express';

import { db } from '@/lib/drizzle';
import { folders } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';

const router = Router();
const logger = serverLogger.withContext('FoldersDebug');

// TEST ENDPOINT SIMPLE
router.get('/test-simple', (req, res) => {
	logger.debug('📁 TEST SIMPLE ENDPOINT HIT');
	res.json({
		status: 'ok',
		message: 'Simple test working',
		timestamp: new Date().toISOString(),
	});
});

// DEBUG-ROUTES - Endpoint de debug básico
router.get('/', async (_req, res) => {
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
router.get('/subcarpetas', async (_req, res) => {
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
				logger.warn(`⚠️ [DEBUG] Carpeta ${carpeta.name} tiene parentId ${carpeta.parentId} que no existe`);
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

		logger.info('Análisis de subcarpetas completado');
		res.json(respuesta);
	} catch (error) {
		logger.error('Error en debug de subcarpetas', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /tree - Obtener todas las carpetas con conteos y estadísticas
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
				audiosCount: sql<number>`(SELECT COUNT(1) FROM Audio WHERE Audio.folderId = ${folders.id})`,
				documentsCount: sql<number>`(SELECT COUNT(1) FROM Document WHERE Document.folderId = ${folders.id})`,
				jsonFilesCount: sql<number>`(SELECT COUNT(1) FROM JsonFile WHERE JsonFile.folderId = ${folders.id})`,
				file3DsCount: sql<number>`(SELECT COUNT(1) FROM File3D WHERE File3D.folderId = ${folders.id})`,
				childrenCount: sql<number>`(SELECT COUNT(*) FROM Folder WHERE Folder.parentId = ${folders.id})`,
			})
			.from(folders)
			.orderBy(asc(folders.path));

		logger.debug('Tree endpoint completado', { totalFolders: rows.length });
		res.json(rows);
	} catch (error) {
		logger.error('Error al obtener tree de carpetas', { error });
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// TEST DEL ESCÁNER
router.get('/scanner-test', async (_req, res) => {
	try {
		logger.info('Testing file scanner');

		const { scanFileSystemFromRoot } = await import('@/lib/filesystem/folder-sync');
		const scanResult = await scanFileSystemFromRoot();

		res.json({
			message: 'File scanner test completed',
			stats: {
				foldersFound: scanResult.folders.length,
				imagesFound: scanResult.images.length,
				videosFound: scanResult.videos.length,
				audiosFound: scanResult.audios.length,
				documentsFound: scanResult.documents.length,
				jsonFilesFound: scanResult.jsonFiles.length,
				file3DsFound: scanResult.file3Ds.length,
				othersFound: scanResult.others.length,
			},
			samples: {
				folderNames: scanResult.folders.slice(0, 10).map((f) => f.name),
				imageFiles: scanResult.images.slice(0, 10).map((f) => f.name),
				videoFiles: scanResult.videos.slice(0, 10).map((f) => f.name),
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

export { router as debugRoutes };
