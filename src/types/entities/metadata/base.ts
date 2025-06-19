/**
 * @file Tipos base para la entidad Metadata
 * @module types/entities/metadata/base
 * @deprecated Usar tipos desde './types' en su lugar
 */

/**
 * Tipo base para Metadata
 * @deprecated Usar MetadataBase desde './types'
 */
export interface MetadataBase {
	id: string;
	name: string;
	type: string;
	value: string;
	createdAt: Date;
	updatedAt: Date;
}

// Re-export desde types para mantener compatibilidad
export type { MetadataBase as MetadataLegacy } from './types';

