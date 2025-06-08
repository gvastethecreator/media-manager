/**
 * @file Acciones de carpetas - Índice centralizado
 * @module app/actions/folders
 */

// ✅ Re-exportar acciones CRUD específicas
export {
	createFolder,
	deleteFolder,
	updateFolder,
	updateFolderAutoReindex,
} from './crud.actions';

// ✅ Re-exportar acciones de búsqueda y consulta
export {
	getFoldersStats,
	getFolderTree,
	revalidateFolderRoutes,
	searchFolders,
} from './query.actions';

// ✅ Re-exportar acciones específicas de obtención de carpetas
export {
	getFolderById,
	getFolders,
	getFoldersWithFilter,
} from './get.actions';

// ✅ Re-exportar acciones específicas de indexación y procesamiento de carpetas
export {
	indexFolder,
	indexFolderThrottled,
	indexMultipleFolders,
	reindexAllFoldersInSystem as reindexAllFolders,
	reindexAutoFolders,
	reindexFolder,
	reindexFolderThrottled,
	repairFolder,
	validateFolderPath,
} from './process.actions';

// ✅ Re-exportar acciones de diagnóstico
export {
	analyzeFolderHealth,
	checkFolderConsistency,
	getDuplicateFiles,
	getOrphanedImages,
} from './diagnostics.actions';

// ✅ Re-exportar acciones de imágenes en carpetas
export { getRecentFolderImages } from './images.actions';

// ✅ Re-exportar acción para obtener todas las imágenes de una carpeta
export { getFolderImages } from './get-folder-images.actions';

// ✅ Re-exportar estadísticas
export {
	getFolderIndexingStats,
	getFolderStats,
	getFolderStatsById,
	getFolderStorageStats,
	revalidateFolderStats,
} from './stats.actions';

// ✅ Re-exportar tipos existentes de folder-types
export type {
	CreateFolderOptions,
	ErrorResponse,
	FolderCreate,
	FolderError,
	FolderResponse,
	FolderUpdate,
	ImageEntity,
	ImageWithRelations,
	IndexCallbacks,
	IndexOptions,
	IndexState,
	ProcessStatus,
	ReindexOptions,
	UpdateFolderOptions,
} from './folder-types';

export {
	createFolderError,
	FOLDER_ERROR_CODES,
	folderErrorToResponse,
	fromError,
	SUPPORTED_FORMATS,
} from './folder-types';

// ✅ Re-exportar tipos base desde @/types/entities/folder
export type {
	CreateFolderData,
	FolderBase,
	FolderExtended,
	FolderSummary,
	UpdateFolderData,
} from '@/types/entities/folder';

// ✅ Exportar la acción del servidor para escanear carpetas
export { scanFolderAction } from './scan-folder.actions';

// Exportaciones adicionales usando export * from para simplificar
export * from './get-folder-files.actions'; // 📂 Nueva acción para obtener archivos de carpeta
export * from './get-folder-images.actions'; // 🖼️ Nueva acción para obtener imágenes de carpeta
export * from './scan-folder.actions';
export * from './status.actions'; // 📊 Nueva acción de estado de carpeta
