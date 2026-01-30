/**
 * @file Barrel de tipos de Document (CANÓNICO)
 * @module types/entities/document
 * @description Reexporta los tipos canónicos desde ./document (migrado con Drizzle)
 * Mantiene compatibilidad con imports existentes: '@/types/entities/document'
 */

// Opcional: exporta también el tipo de búsqueda cuando se necesite
export type { DocumentSearchInput } from '@/transformers/document/validators';
export type {
	DocumentBase,
	DocumentCreateInput,
	DocumentStatistics,
	DocumentUpdateInput,
	DocumentWithStats,
} from './document/index';
