/**
 * @file Exportaciones principales de tipos para la entidad Collection
 * @module types/entities/collection
 *
 * ⚠️ Limpieza: Solo se exportan tipos canónicos desde './types' y enums desde './enums'.
 * Legacy eliminado.
 */

export {
    CollectionCategory,
    CollectionPlatform,
    CollectionRarity,
    CollectionSortOption
} from './enums';

export type {
    // Tipos base
    CollectionBase,
    // Inputs para operaciones
    CollectionCreateInput,
    CollectionEdition,
    CollectionFilter,
    CollectionFilters,
    CollectionSearchOptions,
    // Estructuras auxiliares
    CollectionSortBy,
    CollectionUpdateInput,
    // Configuración y filtros
    CollectionViewConfig,
    // Tipo principal para uso en la aplicación
    CollectionWithStats,
    PrismaCollectionWithCounts
} from './types';

// 📝 Documentación: Solo tipos canónicos. CollectionWithStats es el tipo principal para UI y lógica de negocio.
