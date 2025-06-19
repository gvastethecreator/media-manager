/**
 * @file Exportaciones principales de tipos para la entidad File3D
 * @module types/entities/file3d
 */

// Exportar el esquema de validación
export { file3DSchema } from './file3d.schema';
// Exportar los tipos principales
export type {
	File3DBase,
	File3DComplete,
	File3DCreateInput,
	File3DUpdateInput,
} from './types';
