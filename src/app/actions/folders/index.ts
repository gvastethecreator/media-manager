/**
 * @file Acciones de carpetas - Índice centralizado
 * @module app/actions/folders
 */

// ✅ Re-exportar tipos canónicos desde @/types/entities/folder
export * from '@/types/entities/folder';
// ✅ Re-exportar función de imágenes de carpeta con alias
export { getLatestFolderImages as getFolderImages } from '../images/folder-images.action';
// ✅ Re-exportar acciones CRUD
export * from './crud.actions';
// ✅ Re-exportar acciones de búsqueda y consulta
export * from './query.actions';

