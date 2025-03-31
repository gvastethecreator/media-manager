/**
 * Reexportaciones para mantener compatibilidad con importaciones
 * que usan @/app/actions/folder (singular) en lugar de @/app/actions/folders (plural)
 */

// Reexportar todo desde folders
export * from '../folders';

// Reexportar tipos específicos
export type {
    ErrorResponse, FolderResponse, IndexCallbacks, ProcessStatus
} from '../folders/folder-types.actions';

// Reexportar acciones específicas
export {
    createFolder, deleteFolder, getAllFolders, getFolderById, updateFolder
} from '../folders/folder-crud.actions';

// Reexportar acciones de indexación
export {
    indexFolder, reindexAllFolders, reindexFolder
} from '../folders/folder-indexing.actions';
