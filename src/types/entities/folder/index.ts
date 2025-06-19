/**
 * @file Archivo de índice para exportar tipos de la entidad Folder
 * @module types/entities/folder
 *
 * ⚠️ Limpieza: Solo se exportan tipos canónicos desde './types' y enums desde './enums'.
 * Legacy eliminado.
 */

export {
    FolderSortBy,
    FolderType,
    FolderViewMode
} from './enums';
export type {
    CreateFolderData,
    // Alias para retrocompatibilidad
    FolderComplete as Folder, FolderBase, FolderComplete, FolderCounts,
    FolderCreateInput,
    FolderExtended,
    FolderExtendedComplete,
    FolderFilters,
    FolderRelations,
    FolderSearchOptions,
    FolderStats,
    FolderUIProps,
    FolderUpdateInput,
    FolderWithRelations,
    UpdateFolderData
} from './types';

// 📝 Documentación: Solo tipos y enums canónicos. Legacy removido.
