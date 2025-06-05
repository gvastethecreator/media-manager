/**
 * @file Punto de entrada para todos los transformadores de UploadedImage
 * @module transformers/uploaded-image
 */

// Importar explícitamente lo necesario para los alias
import { fromDBToBase, toDBRecord, toExtended } from './transformer';

// Exportar transformadores (se puede excluir lo ya importado si se prefiere, pero no es necesario)
export {
	fromDBToBase,
	toDBRecord,
	toExtended,
	transformUploadedImage,
	transformUploadedImages,
	type UploadedImageDBRecord,
	type UploadedImageResult,
} from './transformer';

// Exportar alias para mayor compatibilidad con el código existente
// Ahora 'toExtended', 'fromDBToBase' y 'toDBRecord' están definidos en este scope
export const transformUploadedImageToExtended = toExtended;
export const fromDB = fromDBToBase;
export const toDB = toDBRecord;
