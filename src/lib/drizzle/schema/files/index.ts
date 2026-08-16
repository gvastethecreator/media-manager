/**
 * =================================================================================
 * FILES/MEDIA DOMAIN SCHEMA INDEX - DRIZZLE ORM
 * =================================================================================
 * Exportación centralizada de todas las entidades del dominio Media
 *
 * Tablas incluidas:
 * - folders: Gestión de carpetas (exportado desde organization)
 * - images: Archivos de imagen
 * - videos: Archivos de video
 * - uploadedImages: Imágenes subidas al sistema
 * - audios: Archivos de audio
 * - documents: Documentos
 * - jsonFiles: Archivos JSON
 * - file3Ds: Archivos 3D
 * =================================================================================
 */

export { folders } from '../organization/folders';
export { audios } from './audio';
export { documents } from './documents';
export { file3Ds } from './file3Ds';
export { files } from './files';
export { images } from './images';
export { jsonFiles } from './jsonFiles';
export { uploadedImages } from './uploadedImages';
export { videos } from './videos';
