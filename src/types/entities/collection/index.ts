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
    // Alias para retrocompatibilidad
    CollectionComplete as Collection,
    // Tipos base
    CollectionBase, CollectionComplete,
    CollectionCreateInput,
    CollectionEdition,
    // Tipos extendidos
    CollectionExtended,
    CollectionFilter,
    CollectionFilters,
    CollectionSearchOptions,
    CollectionSortBy,
    CollectionUpdateInput,
    CollectionViewConfig
} from './types';

// 📝 Documentación: Solo tipos y enums canónicos. Legacy removido.
