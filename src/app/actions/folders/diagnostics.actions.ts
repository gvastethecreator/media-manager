'use server';

/**
 * @file Diagnostic actions for folders
 * @module app/actions/folders/folder-diagnostics
 */

import { scanFolder } from '@/lib/folder-scanner';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { FOLDER_ERROR_CODES } from './folder-types';

// Logger para diagnósticos
const diagnosticsLogger = serverLogger.withContext('FolderDiagnostics');

/**
 * Interfaz para errores de diagnóstico de carpetas
 */
export interface FolderDiagnosticErrorData {
	name: string;
	message: string;
	code: string;
	cause?: unknown;
}

/**
 * Función para crear errores de diagnóstico de carpetas (enfoque funcional)
 */
function createFolderDiagnosticError(
	message: string,
	code: string = FOLDER_ERROR_CODES.UNEXPECTED_ERROR,
	cause?: unknown
): FolderDiagnosticErrorData {
	return {
		name: 'FolderDiagnosticError',
		message,
		code,
		cause,
	};
}

/**
 * Tipos para diagnóstico de carpetas
 */
export interface FolderDiagnosticResult {
	status: 'healthy' | 'warning' | 'error';
	summary: string;
	folderId: string;
	folderName: string;
	issues: Array<{
		type: 'path' | 'indexing' | 'contents' | 'database' | 'performance';
		severity: 'low' | 'medium' | 'high' | 'critical';
		message: string;
		recommendation: string;
	}>;
	timestamp: number;
}

/**
 * Tipos para análisis de salud de carpetas
 */
export interface FolderHealthResult {
	folderId: string;
	folderName: string;
	path: string;
	healthScore: number; // 0-100
	issues: {
		accessIssues: boolean;
		missingFiles: number;
		orphanedImages: number;
		inconsistentStats: boolean;
		slowAccess: boolean;
		indexingIssues: boolean;
	};
	recommendations: string[];
	timestamp: number;
}

/**
 * Interfaz para archivos duplicados
 */
export interface DuplicateFilesResult {
	totalDuplicates: number;
	totalSize: number;
	groups: Array<{
		hash: string;
		count: number;
		totalSize: number;
		files: Array<{
			id: string;
			path: string;
			size: number;
			folderId: string;
			folderName: string;
		}>;
	}>;
}

/**
 * Interfaz para imágenes huérfanas
 */
export interface OrphanedImagesResult {
	totalOrphaned: number;
	totalSize: number;
	images: Array<{
		id: string;
		path: string;
		size: number;
		lastAccessed?: Date;
		originalFolderId?: string;
	}>;
}

/**
 * Verifica la conexión a la base de datos
 */
export async function checkDatabaseConnection(): Promise<{
	success: boolean;
	message: string;
	details?: any;
}> {
	try {
		diagnosticsLogger.info('🔍 Verificando conexión a la base de datos...');

		// Prueba la conexión con una consulta simple
		const result = await prisma.$queryRaw`SELECT 1 as test`;

		diagnosticsLogger.info('✅ Conexión a la base de datos verificada correctamente', { result });
		return {
			success: true,
			message: 'Conexión a la base de datos establecida correctamente',
		};
	} catch (error) {
		diagnosticsLogger.error('❌ Error al conectar a la base de datos', error);
		return {
			success: false,
			message: 'Error al conectar a la base de datos',
			details: error instanceof Error ? { message: error.message, name: error.name } : error,
		};
	}
}

/**
 * Verifica la estructura de la tabla Folder
 */
export async function checkFolderTableStructure(): Promise<{
	success: boolean;
	message: string;
	details?: any;
}> {
	try {
		diagnosticsLogger.info('🔍 Verificando estructura de la tabla Folder...');

		// Intenta obtener el primer registro para verificar la estructura
		const folder = await prisma.folder.findFirst({
			select: {
				id: true,
				name: true,
				path: true,
				description: true,
				emoji: true,
				color: true,
				totalFiles: true,
				totalSize: true,
				lastIndexed: true,
				autoReindex: true,
				isFavorite: true,
				createdAt: true,
				updatedAt: true,
				parentId: true,
				_count: {
					select: {
						images: true,
						videos: true,
						children: true,
					},
				},
			},
		});

		diagnosticsLogger.info(
			'✅ Estructura de la tabla Folder verificada correctamente',
			folder ? { id: folder.id, name: folder.name } : { noRecords: true }
		);

		return {
			success: true,
			message: folder
				? 'Estructura de la tabla Folder verificada correctamente'
				: 'La tabla Folder está vacía, pero la estructura parece correcta',
			details: folder ? { recordFound: true, id: folder.id } : { recordFound: false },
		};
	} catch (error) {
		diagnosticsLogger.error('❌ Error al verificar la estructura de la tabla Folder', error);
		return {
			success: false,
			message: 'Error al verificar la estructura de la tabla Folder',
			details: error instanceof Error ? { message: error.message, name: error.name } : error,
		};
	}
}

/**
 * Cuenta registros en tablas principales para diagnóstico
 */
export async function countRecordsInTables(): Promise<{
	success: boolean;
	message: string;
	counts?: Record<string, number>;
	details?: any;
}> {
	try {
		diagnosticsLogger.info('🔍 Contando registros en tablas principales...');

		const [folderCount, imageCount, videoCount] = await Promise.all([
			prisma.folder.count(),
			prisma.image.count(),
			prisma.video.count(),
		]);

		const counts = {
			folder: folderCount,
			image: imageCount,
			video: videoCount,
		};

		diagnosticsLogger.info('✅ Conteo de registros completado', counts);

		return {
			success: true,
			message: 'Conteo de registros completado',
			counts,
		};
	} catch (error) {
		diagnosticsLogger.error('❌ Error al contar registros en tablas', error);
		return {
			success: false,
			message: 'Error al contar registros en tablas',
			details: error instanceof Error ? { message: error.message, name: error.name } : error,
		};
	}
}

/**
 * Ejecuta todas las verificaciones de diagnóstico
 */
export async function runAllDiagnostics(): Promise<{
	connection: Awaited<ReturnType<typeof checkDatabaseConnection>>;
	structure: Awaited<ReturnType<typeof checkFolderTableStructure>>;
	counts: Awaited<ReturnType<typeof countRecordsInTables>>;
	overallSuccess: boolean;
}> {
	diagnosticsLogger.info('🔍 Iniciando diagnóstico completo...');

	const connection = await checkDatabaseConnection();

	// Si no hay conexión, no seguimos con las demás pruebas
	if (!connection.success) {
		return {
			connection,
			structure: {
				success: false,
				message: 'No se pudo verificar la estructura porque no hay conexión a la base de datos',
			},
			counts: {
				success: false,
				message: 'No se pudieron contar registros porque no hay conexión a la base de datos',
			},
			overallSuccess: false,
		};
	}

	const structure = await checkFolderTableStructure();
	const counts = await countRecordsInTables();

	const overallSuccess = connection.success && structure.success && counts.success;

	diagnosticsLogger.info('✅ Diagnóstico completo finalizado', {
		overallSuccess,
		connectionOk: connection.success,
		structureOk: structure.success,
		countsOk: counts.success,
	});

	return {
		connection,
		structure,
		counts,
		overallSuccess,
	};
}

/**
 * Realiza un análisis de consistencia de una carpeta
 * @param id ID de la carpeta a analizar
 * @returns Resultado del diagnóstico
 */
export async function checkFolderConsistency(id: string): Promise<FolderDiagnosticResult> {
	try {
		diagnosticsLogger.info('🔍 Iniciando análisis de consistencia para carpeta:', id);

		// Buscar carpeta en la base de datos
		const folder = await prisma.folder.findUnique({
			where: { id },
			include: {
				images: true,
				_count: {
					select: {
						images: true,
						videos: true,
					},
				},
			},
		});

		if (!folder) {
			throw createFolderDiagnosticError(`No se encontró ninguna carpeta con ID ${id}`, FOLDER_ERROR_CODES.NOT_FOUND);
		}

		const issues: FolderDiagnosticResult['issues'] = [];
		let status: FolderDiagnosticResult['status'] = 'healthy';

		// Verificar si la carpeta existe en el sistema de archivos
		try {
			const scanResult = await scanFolder(folder.path, { recursive: false });

			// Verificar inconsistencias en número de archivos
			if (scanResult.totalFiles !== folder.totalFiles) {
				issues.push({
					type: 'contents',
					severity: 'medium',
					message: `Inconsistencia en número de archivos. DB: ${folder.totalFiles}, Actual: ${scanResult.totalFiles}`,
					recommendation: 'Ejecutar reindexación para actualizar estadísticas',
				});
				status = 'warning';
			}

			// Verificar inconsistencias en tamaño total
			if (Math.abs((scanResult.totalSize - folder.totalSize) / folder.totalSize) > 0.1) {
				issues.push({
					type: 'contents',
					severity: 'medium',
					message: `Inconsistencia en tamaño total. DB: ${folder.totalSize} bytes, Actual: ${scanResult.totalSize} bytes`,
					recommendation: 'Ejecutar reindexación para actualizar estadísticas',
				});
				status = 'warning';
			}

			// Verificar archivos de imagen faltantes
			const existingPaths = new Set(scanResult.images);
			const missingImages = folder.images.filter((img) => !existingPaths.has(img.path));

			if (missingImages.length > 0) {
				issues.push({
					type: 'contents',
					severity: 'high',
					message: `${missingImages.length} imágenes en la base de datos no existen en el sistema de archivos`,
					recommendation: 'Ejecutar reparación de carpeta para limpiar referencias huérfanas',
				});
				status = 'error';
			}

			// Verificar rendimiento de acceso a archivos
			if (scanResult.scanTime && scanResult.scanTime > 5000 && scanResult.totalFiles > 100) {
				issues.push({
					type: 'performance',
					severity: 'low',
					message: `Tiempo de escaneo elevado (${scanResult.scanTime}ms para ${scanResult.totalFiles} archivos)`,
					recommendation: 'Considerar dividir la carpeta en subcarpetas o mover a almacenamiento más rápido',
				});
			}
		} catch (error) {
			issues.push({
				type: 'path',
				severity: 'critical',
				message: `No se puede acceder a la carpeta en la ruta: ${folder.path}`,
				recommendation: 'Verificar permisos de acceso o actualizar la ruta si la carpeta se ha movido',
			});
			status = 'error';
		}

		// Verificar estado de indexación
		if (!folder.lastIndexed) {
			issues.push({
				type: 'indexing',
				severity: 'medium',
				message: 'La carpeta nunca ha sido indexada',
				recommendation: 'Ejecutar indexación para catalogar el contenido',
			});
			status = status === 'healthy' ? 'warning' : status;
		} else {
			const daysSinceLastIndex = (Date.now() - new Date(folder.lastIndexed).getTime()) / (1000 * 60 * 60 * 24);
			if (daysSinceLastIndex > 30 && folder.autoReindex) {
				issues.push({
					type: 'indexing',
					severity: 'low',
					message: `La carpeta no ha sido reindexada en ${Math.floor(daysSinceLastIndex)} días a pesar de tener autoReindex activado`,
					recommendation: 'Verificar el funcionamiento del sistema de reindexación automática',
				});
				status = status === 'healthy' ? 'warning' : status;
			}
		}

		// Verificar relaciones en la base de datos
		const databaseIssues = await prisma.$queryRaw`
      SELECT COUNT(*) as orphanedCount
      FROM "Image"
      WHERE "folderId" = ${id}
      AND id NOT IN (SELECT id FROM "Image" WHERE "folderId" = ${id})
    `;

		if (databaseIssues[0].orphanedCount > 0) {
			issues.push({
				type: 'database',
				severity: 'medium',
				message: `Encontradas ${databaseIssues[0].orphanedCount} referencias inconsistentes en la base de datos`,
				recommendation: 'Ejecutar reparación de base de datos para corregir referencias',
			});
			status = status === 'healthy' ? 'warning' : status;
		}

		// Si no hay problemas, añadir mensaje de salud
		if (issues.length === 0) {
			issues.push({
				type: 'path',
				severity: 'low',
				message: 'No se encontraron problemas. La carpeta está en buen estado.',
				recommendation: 'Continuar con mantenimiento regular',
			});
		}

		diagnosticsLogger.info(`✅ Análisis completado para carpeta ${id}:`, {
			status,
			issueCount: issues.length,
		});

		return {
			status,
			summary: `Análisis completado: ${issues.length} problemas encontrados. Estado: ${status}`,
			folderId: id,
			folderName: folder.name,
			issues,
			timestamp: Date.now(),
		};
	} catch (error) {
		diagnosticsLogger.error('❌ Error durante análisis de carpeta:', error);

		if (error && typeof error === 'object' && 'name' in error && error.name === 'FolderDiagnosticError') {
			throw error;
		}

		throw createFolderDiagnosticError(
			`Error durante análisis de consistencia: ${error instanceof Error ? error.message : String(error)}`,
			FOLDER_ERROR_CODES.UNEXPECTED_ERROR,
			error
		);
	}
}

/**
 * Analiza la salud general de una carpeta
 * @param id ID de la carpeta a analizar
 * @returns Resultado del análisis de salud
 */
export async function analyzeFolderHealth(id: string): Promise<FolderHealthResult> {
	try {
		diagnosticsLogger.info('💊 Iniciando análisis de salud para carpeta:', id);

		// Obtener el diagnóstico como base
		const diagnostic = await checkFolderConsistency(id);

		// Buscar carpeta con detalles adicionales
		const folder = await prisma.folder.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				path: true,
				totalFiles: true,
				totalSize: true,
				lastIndexed: true,
				status: true,
				_count: {
					select: {
						images: true,
						videos: true,
					},
				},
			},
		});

		if (!folder) {
			throw createFolderDiagnosticError(`No se encontró ninguna carpeta con ID ${id}`, FOLDER_ERROR_CODES.NOT_FOUND);
		}

		// Calcular puntuación de salud (0-100)
		let healthScore = 100;
		const recommendations: string[] = [];

		// Problemas de acceso reducen drásticamente la puntuación
		const accessIssues = diagnostic.issues.some((i) => i.type === 'path' && i.severity === 'critical');
		if (accessIssues) {
			healthScore -= 50;
			recommendations.push('Verificar permisos de acceso y existencia de la carpeta');
		}

		// Contar archivos faltantes
		const missingFilesIssue = diagnostic.issues.find((i) =>
			i.message.includes('imágenes en la base de datos no existen')
		);
		const missingFiles = missingFilesIssue ? Number.parseInt(missingFilesIssue.message.split(' ')[0]) : 0;

		if (missingFiles > 0) {
			const missingPercentage = folder._count.images > 0 ? (missingFiles / folder._count.images) * 100 : 0;
			healthScore -= Math.min(30, missingPercentage * 3); // Reducir hasta 30 puntos según el porcentaje
			recommendations.push('Ejecutar reparación de carpeta para limpiar referencias huérfanas');
		}

		// Verificar imágenes huérfanas
		const orphanedImagesIssue = diagnostic.issues.find((i) => i.type === 'database');
		const orphanedImages = orphanedImagesIssue
			? Number.parseInt(orphanedImagesIssue.message.match(/\d+/)?.[0] || '0')
			: 0;

		if (orphanedImages > 0) {
			healthScore -= Math.min(15, orphanedImages); // Reducir hasta 15 puntos
			recommendations.push('Ejecutar reparación de base de datos para corregir referencias');
		}

		// Verificar inconsistencias en estadísticas
		const inconsistentStats = diagnostic.issues.some(
			(i) => i.type === 'contents' && i.message.includes('Inconsistencia')
		);
		if (inconsistentStats) {
			healthScore -= 10;
			recommendations.push('Reindexar la carpeta para actualizar estadísticas');
		}

		// Verificar problemas de rendimiento
		const slowAccess = diagnostic.issues.some((i) => i.type === 'performance');
		if (slowAccess) {
			healthScore -= 5;
			recommendations.push('Optimizar estructura de carpetas o mover a almacenamiento más rápido');
		}

		// Verificar problemas de indexación
		const indexingIssues = diagnostic.issues.some((i) => i.type === 'indexing');
		if (indexingIssues) {
			healthScore -= 8;
			recommendations.push('Programar indexación regular de la carpeta');
		}

		// Asegurar que la puntuación está en el rango 0-100
		healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

		// Si no hay recomendaciones, añadir una genérica
		if (recommendations.length === 0) {
			recommendations.push('Mantener indexación regular para asegurar consistencia');
		}

		diagnosticsLogger.info(`✅ Análisis de salud completado para carpeta ${id}:`, {
			healthScore,
			recommendations: recommendations.length,
		});

		return {
			folderId: id,
			folderName: folder.name,
			path: folder.path,
			healthScore,
			issues: {
				accessIssues,
				missingFiles,
				orphanedImages,
				inconsistentStats,
				slowAccess,
				indexingIssues,
			},
			recommendations,
			timestamp: Date.now(),
		};
	} catch (error) {
		diagnosticsLogger.error('❌ Error durante análisis de salud:', error);

		if (error && typeof error === 'object' && 'name' in error && error.name === 'FolderDiagnosticError') {
			throw error;
		}

		throw createFolderDiagnosticError(
			`Error durante análisis de salud: ${error instanceof Error ? error.message : String(error)}`,
			FOLDER_ERROR_CODES.UNEXPECTED_ERROR,
			error
		);
	}
}

/**
 * Encuentra archivos de imagen duplicados entre carpetas
 * @param options Opciones para la búsqueda
 * @returns Resultado con grupos de archivos duplicados
 */
export async function getDuplicateFiles(options?: {
	folderId?: string;
	minSize?: number;
	limit?: number;
}): Promise<DuplicateFilesResult> {
	try {
		const { folderId, minSize = 1024, limit = 100 } = options || {};

		diagnosticsLogger.info('🔍 Buscando archivos duplicados', {
			folderId: folderId || 'all',
			minSize,
			limit,
		});

		// Esta es una consulta simulada. En una implementación real,
		// sería necesario tener un campo de hash o usar alguna estrategia
		// de detección de duplicados más sofisticada.
		const duplicateGroups = await prisma.$queryRaw`
      SELECT
        md5(i.path) as hash,
        COUNT(*) as file_count,
        SUM(i.size) as total_size,
        ARRAY_AGG(i.id) as file_ids
      FROM "Image" i
      ${folderId ? prisma.$raw`WHERE i."folderId" = ${folderId}` : prisma.$raw`WHERE i.size > ${minSize}`}
      GROUP BY md5(i.path), i.size
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, SUM(i.size) DESC
      LIMIT ${limit}
    `;

		// Convertir el resultado raw a la estructura esperada
		const fileIds = duplicateGroups.flatMap((g) => g.file_ids);

		// Obtener detalles de los archivos
		const fileDetails =
			fileIds.length > 0
				? await prisma.image.findMany({
						where: { id: { in: fileIds } },
						select: {
							id: true,
							path: true,
							size: true,
							folderId: true,
							folder: {
								select: { name: true },
							},
						},
					})
				: [];

		// Organizar por grupos
		const groups = duplicateGroups.map((group) => {
			const files = fileDetails
				.filter((f) => group.file_ids.includes(f.id))
				.map((f) => ({
					id: f.id,
					path: f.path,
					size: f.size,
					folderId: f.folderId,
					folderName: f.folder.name,
				}));

			return {
				hash: group.hash,
				count: Number.parseInt(group.file_count),
				totalSize: Number.parseInt(group.total_size),
				files,
			};
		});

		const totalDuplicates = groups.reduce((sum, g) => sum + g.count, 0) - groups.length;
		const totalSize = groups.reduce((sum, g) => sum + g.totalSize, 0);

		diagnosticsLogger.info(`✅ Búsqueda completada: encontrados ${totalDuplicates} archivos duplicados`);

		return {
			totalDuplicates,
			totalSize,
			groups,
		};
	} catch (error) {
		diagnosticsLogger.error('❌ Error buscando archivos duplicados:', error);
		throw createFolderDiagnosticError(
			`Error buscando archivos duplicados: ${error instanceof Error ? error.message : String(error)}`,
			FOLDER_ERROR_CODES.UNEXPECTED_ERROR,
			error
		);
	}
}

/**
 * Encuentra imágenes huérfanas en la base de datos
 * @returns Resultado con imágenes huérfanas
 */
export async function getOrphanedImages(): Promise<OrphanedImagesResult> {
	try {
		diagnosticsLogger.info('🔍 Buscando imágenes huérfanas');

		// Imágenes sin carpeta asociada
		const noFolderImages = await prisma.image.findMany({
			where: {
				folderId: null,
			},
			select: {
				id: true,
				path: true,
				size: true,
				createdAt: true,
			},
		});

		// Imágenes con referencia a carpetas que ya no existen
		const invalidFolderImages = await prisma.image.findMany({
			where: {
				folder: null,
				NOT: {
					folderId: null,
				},
			},
			select: {
				id: true,
				path: true,
				size: true,
				folderId: true,
				createdAt: true,
			},
		});

		const orphanedImages = [
			...noFolderImages.map((img) => ({
				id: img.id,
				path: img.path,
				size: img.size,
				lastAccessed: img.createdAt,
			})),
			...invalidFolderImages.map((img) => ({
				id: img.id,
				path: img.path,
				size: img.size,
				originalFolderId: img.folderId,
				lastAccessed: img.createdAt,
			})),
		];

		const totalSize = orphanedImages.reduce((sum, img) => sum + img.size, 0);

		diagnosticsLogger.info(`✅ Búsqueda completada: encontradas ${orphanedImages.length} imágenes huérfanas`);

		return {
			totalOrphaned: orphanedImages.length,
			totalSize,
			images: orphanedImages,
		};
	} catch (error) {
		diagnosticsLogger.error('❌ Error buscando imágenes huérfanas:', error);
		throw createFolderDiagnosticError(
			`Error buscando imágenes huérfanas: ${error instanceof Error ? error.message : String(error)}`,
			FOLDER_ERROR_CODES.UNEXPECTED_ERROR,
			error
		);
	}
}
