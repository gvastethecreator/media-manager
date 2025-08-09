/**
 * @file Barrel de tipos de Document (CANÓNICO)
 * @module types/entities/document
 * @description Reexporta los tipos canónicos desde ./document (migrado con Drizzle)
 * Mantiene compatibilidad con imports existentes: '@/types/entities/document'
 */

export type {
	DocumentBase,
	DocumentStatistics,
	DocumentWithStats,
	DocumentCreateInput,
	DocumentUpdateInput,
} from './document/index';

// Opcional: exporta también el tipo de búsqueda cuando se necesite
export type { DocumentSearchInput } from '@/transformers/document/validators';
