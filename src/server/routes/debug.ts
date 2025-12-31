import { asc } from 'drizzle-orm';
import express from 'express';
import os from 'os';
import { db } from '@/lib/drizzle';
import { folders } from '@/lib/drizzle/schema/index';
import { getSystemMonitorHelpers } from '@/lib/server/system-monitor';
import { formatBytes } from '@/lib/utils/format.utils';

const router = express.Router();

import { serverLogger } from '@/lib/logger/server-logger';
// Importar el servicio para el endpoint de test de tipos de entidad
import { FileEntityMapperService } from '@/services/file-entity-mapper/file-entity-mapper.service';

const fileEntityMapperService = FileEntityMapperService.getInstance();

router.get('/app-stats', async (_req, res) => {
	try {
		// MODO DEBUG TEMPORAL: Análisis de subcarpetas en lugar de app stats
		serverLogger.debug('🔍 [DEBUG] MODO DEBUG TEMPORAL: Analizando problema de subcarpetas');

		// 1. Test básico de query SQL childrenCount
		const { sql } = await import('drizzle-orm');
		const testQuery = await db.execute(sql`
			SELECT 
				id, name, parentId,
				(SELECT COUNT(*) FROM Folder WHERE Folder.parentId = Folder.id) as childrenCount
			FROM Folder 
			WHERE parentId IS NOT NULL
			ORDER BY name
			LIMIT 10
		`);

		const childrenResults = testQuery.rows.map((row: any) => ({
			id: row[0],
			name: row[1],
			parentId: row[2],
			childrenCount: row[3],
		}));

		// 2. Obtener todas las carpetas de BD
		const bdFolders = await db
			.select({
				id: folders.id,
				name: folders.name,
				path: folders.path,
				parentId: folders.parentId,
			})
			.from(folders)
			.orderBy(asc(folders.path));

		const subcarpetas = bdFolders.filter((f: any) => f.parentId !== null);
		const carpetasRaiz = bdFolders.filter((f: any) => f.parentId === null);

		const stats = {
			debug_mode: 'SUBCARPETAS_ANALYSIS',
			timestamp: new Date().toISOString(),
			resumen: {
				total_carpetas: bdFolders.length,
				carpetas_raiz: carpetasRaiz.length,
				subcarpetas: subcarpetas.length,
			},
			problema_childrenCount: {
				query:
					'SELECT id, name, parentId, (SELECT COUNT(*) FROM Folder WHERE Folder.parentId = Folder.id) as childrenCount FROM Folder WHERE parentId IS NOT NULL',
				total_rows: testQuery.rows.length,
				primeros_5_resultados: childrenResults.slice(0, 5),
				issue: 'Verificar si childrenCount siempre devuelve 0',
			},
			carpetas_con_parent: subcarpetas.slice(0, 10).map((f: any) => ({
				id: f.id,
				name: f.name,
				parentId: f.parentId,
				path: f.path,
			})),
			carpetas_raiz_muestra: carpetasRaiz.slice(0, 5).map((f: any) => ({
				id: f.id,
				name: f.name,
				path: f.path,
			})),
		};

		serverLogger.debug('✅ [DEBUG] Análisis temporal completado');
		res.json(stats);
	} catch (error) {
		serverLogger.error('❌ Error en análisis temporal de subcarpetas:', error);
		res.status(500).json({
			error: 'Error en análisis temporal',
			message: error instanceof Error ? error.message : String(error),
		});
	}
});

router.get('/system-stats', async (_req, res) => {
	try {
		const { getSystemStats } = await getSystemMonitorHelpers();
		const stats = await getSystemStats();
		const formattedStats = {
			cpu: {
				usage: stats.cpu.usage,
				cores: stats.cpu.cores,
				model: stats.cpu.model,
			},
			memory: {
				total: formatBytes(stats.memory.total),
				free: formatBytes(stats.memory.free),
				used: formatBytes(stats.memory.used),
				usedPercentage: stats.memory.usedPercent,
			},
			uptime: formatUptime(stats.uptime.system),
			platform: `${stats.platform.type} ${stats.platform.release}`,
			nodeVersion: stats.nodejs.version,
			network: formatNetworkInterfaces(),
		};
		res.json(formattedStats);
	} catch (error) {
		res.status(500).json({
			error: 'Error al obtener estadísticas del sistema',
			message: error instanceof Error ? error.message : String(error),
		});
	}
});

function formatUptime(seconds: number): string {
	const days = Math.floor(seconds / (3600 * 24));
	const hours = Math.floor((seconds % (3600 * 24)) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);
	const parts = [] as string[];
	if (days > 0) {
		parts.push(`${days}d`);
	}
	if (hours > 0) {
		parts.push(`${hours}h`);
	}
	if (minutes > 0) {
		parts.push(`${minutes}m`);
	}
	if (secs > 0 || parts.length === 0) {
		parts.push(`${secs}s`);
	}
	return parts.join(' ');
}

function formatNetworkInterfaces() {
	const interfaces = os.networkInterfaces();
	const result: Array<{ interface: string; address: string; netmask: string; mac: string }> = [];

	// Validación null-safe para evitar errores de Object.entries
	if (!interfaces || typeof interfaces !== 'object') {
		serverLogger.warn('⚠️ [DEBUG] os.networkInterfaces() retornó null/undefined, retornando array vacío');
		return result;
	}

	for (const [name, netInterface] of Object.entries(interfaces)) {
		if (netInterface) {
			for (const iface of netInterface) {
				if (iface.family === 'IPv4') {
					result.push({ interface: name, address: iface.address, netmask: iface.netmask, mac: iface.mac });
				}
			}
		}
	}
	return result;
}

// DEBUG Endpoint para investigar subcarpetas
router.get('/folder-children-test', async (_req, res) => {
	try {
		const { db } = await import('@/lib/drizzle');
		const { sql } = await import('drizzle-orm');

		// Test directo de la query problemática
		const testQuery = await db.execute(sql`
			SELECT 
				id, name, parentId,
				(SELECT COUNT(*) FROM Folder WHERE Folder.parentId = Folder.id) as childrenCount
			FROM Folder 
			ORDER BY name
		`);

		res.json({
			message: 'Test de conteo de hijos directo desde SQL',
			totalFolders: testQuery.rows.length,
			folders: testQuery.rows.map((row: any) => ({
				id: row[0],
				name: row[1],
				parentId: row[2],
				childrenCount: row[3],
			})),
		});
	} catch (error) {
		serverLogger.error('❌ Error en test de folder children:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

router.get('/subcarpetas', async (_req, res) => {
	try {
		serverLogger.debug('🔍 [DEBUG] Iniciando depuración de subcarpetas BD vs FS');

		// Importar servicios necesarios
		const { syncFoldersWithFileSystem } = await import('@/lib/filesystem/folder-sync');

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

		serverLogger.debug(`📊 [DEBUG] Carpetas en BD: ${carpetasBD.length}`);

		// 2. Realizar sincronización con dry-run para obtener estadísticas
		serverLogger.debug('🔍 [DEBUG] Ejecutando análisis de sincronización...');
		const syncResult = await syncFoldersWithFileSystem({ dryRun: true });

		serverLogger.debug(
			`📊 [DEBUG] Resultado sincronización - Agregar: ${syncResult.added.length}, Eliminar: ${syncResult.removed.length}`
		);

		// 3. Análisis de diferencias
		const pathsBD = new Set(carpetasBD.map((c: any) => c.path));
		const pathsFS = new Set(syncResult.added.map((c: any) => c.path)); // Rutas que faltan en BD

		// Carpetas solo en FS (faltantes en BD)
		const soloEnFS = syncResult.added;

		// Carpetas solo en BD (órfanas/eliminadas)
		const soloEnBD = syncResult.removed;

		// 4. Análisis de relaciones padre-hijo
		const relacionesProblematicas = carpetasBD.filter((carpeta: any) => {
			if (!carpeta.parentId) return false;

			const padre = carpetasBD.find((p: any) => p.id === carpeta.parentId);
			if (!padre) {
				serverLogger.warn(`⚠️ [DEBUG] Carpeta ${carpeta.name} tiene parentId ${carpeta.parentId} que no existe`);
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
				faltantesEnBD: soloEnFS.slice(0, 20), // Limitar para evitar respuestas muy grandes
				orfanasEnBD: soloEnBD.slice(0, 20),
				relacionesProblematicas: relacionesProblematicas.slice(0, 10),
			},
			estadisticas: {
				carpetasRaiz: carpetasBD.filter((c: any) => !c.parentId).length,
				subcarpetas: carpetasBD.filter((c: any) => c.parentId).length,
			},
			syncResult: {
				duration: syncResult.stats.duration,
				errors: syncResult.errors.slice(0, 5), // Primeros 5 errores
				totalProcessed: syncResult.stats.totalProcessed,
			},
			muestrasBD: carpetasBD.slice(0, 10), // Muestra de carpetas en BD
		};

		serverLogger.debug('✅ [DEBUG] Análisis de subcarpetas completado');
		res.json(respuesta);
	} catch (error) {
		serverLogger.error('❌ Error en debug de subcarpetas:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DEBUG ESPECIAL: Investigación completa de subcarpetas BD vs FS
router.get('/subcarpetas-full-analysis', async (_req, res) => {
	try {
		serverLogger.debug('🔍 [DEBUG] Iniciando análisis completo de subcarpetas BD vs FS');

		// Test simple primero - sin imports dinámicos
		res.json({
			message: 'DEBUG ENDPOINT FUNCIONANDO',
			timestamp: new Date().toISOString(),
			status: 'ACTIVE',
			next_step: 'Implementar lógica completa',
		});
	} catch (error) {
		serverLogger.error('❌ Error en análisis completo de subcarpetas:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// NEW TEST ENDPOINT
router.get('/test-hot-reload', async (_req, res) => {
	try {
		serverLogger.debug('🔥 [DEBUG] HOT RELOAD TEST ENDPOINT WORKING!');

		res.json({
			message: 'HOT RELOAD IS WORKING!',
			timestamp: new Date().toISOString(),
			server_time: Date.now(),
			status: 'ACTIVE_NEW_ENDPOINT',
		});
	} catch (error) {
		serverLogger.error('❌ Error en test hot reload:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// CLEANUP ENDPOINT - Eliminar imágenes fantasma cursed-img-*
router.get('/cleanup-phantom-images', async (_req, res): Promise<void> => {
	try {
		serverLogger.debug('🔥 [CLEANUP] Iniciando limpieza de imágenes fantasma...');

		// Importar base de datos
		const { sql } = await import('drizzle-orm');
		const { images } = await import('@/lib/drizzle/schema/index');

		// 1. Contar imágenes cursed-img-*
		const cursedQuery = await db.execute(sql`
			SELECT id, name, path 
			FROM ${images} 
			WHERE id LIKE 'cursed-img-%' 
			ORDER BY id
		`);

		const cursedCount = cursedQuery.rows.length;
		serverLogger.debug(`📊 Imágenes cursed-img-* encontradas: ${cursedCount}`);

		if (cursedCount === 0) {
			res.json({
				success: true,
				message: 'No se encontraron imágenes fantasma cursed-img-*',
				deleted: 0,
				timestamp: new Date().toISOString(),
			});
			return;
		}

		// 2. Eliminar imágenes cursed-img-*
		serverLogger.debug(`🗑️ Eliminando ${cursedCount} imágenes fantasma...`);
		const deleteResult = await db.execute(sql`
			DELETE FROM ${images} WHERE id LIKE 'cursed-img-%'
		`);

		// 3. Verificar estado final
		const finalCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM ${images}`);
		const finalCount = finalCountResult.rows[0]?.[0] || 0;

		serverLogger.debug(`✅ Eliminadas: ${cursedCount} imágenes fantasma`);
		serverLogger.debug(`📊 Imágenes restantes en BD: ${finalCount}`);

		res.json({
			success: true,
			message: '¡Limpieza completada con éxito!',
			deleted: cursedCount,
			remaining: finalCount,
			timestamp: new Date().toISOString(),
			note: 'Los errores ServiceError file_not_found deberían desaparecer ahora.',
		});
	} catch (error) {
		serverLogger.error('❌ Error en cleanup de imágenes fantasma:', error);
		res.status(500).json({
			success: false,
			error: 'Error durante la limpieza',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

/**
 * Endpoint de diagnóstico para validar mapeo de tipos de entidad
 * POST /api/debug/test-entity-types
 */
router.post('/test-entity-types', async (req, res): Promise<void> => {
	try {
		const { extensions } = req.body;

		if (!(extensions && Array.isArray(extensions))) {
			res.status(400).json({
				error: 'Se requiere un array de extensiones en el body',
			});
			return;
		}

		const results = extensions.map((ext: string) => {
			const entityType = fileEntityMapperService.getEntityTypeFromExtension(ext);
			return {
				extension: ext,
				entityType,
				isSupported: entityType !== 'unknown',
			};
		});

		res.json({
			success: true,
			results,
			summary: {
				total: results.length,
				supported: results.filter((r) => r.isSupported).length,
				unsupported: results.filter((r) => !r.isSupported).length,
			},
		});
	} catch (error) {
		serverLogger.error('Error en test de mapeo de tipos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

export default router;
