/**
 * @file Exporta todas las acciones relacionadas con carpetas
 * @module app/actions/folders
 */

// Re-exportar todas las funciones por categoría
export * from './crud.actions';
export * from './process.actions';
export * from './query.actions';
export * from './stats.actions';

// Re-exportar funciones específicas
export * from './folder-diagnostics';
export * from './folder-images.actions';
export * from './folder-types';

// Exportar transformadores para carpetas desde /transformers
export {
	fromFolderComplete,
	mapFolderExtendedFromComplete,
	toFolderComplete,
	toFolderExtended,
	toFolderSummary,
	toFolderTreeItem,
	toFolderWithStats,
	toPrismaFolder
} from '@/transformers/folder';

