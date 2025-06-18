/**
 * @file Exportaciones principales de tipos para la entidad Collection
 * @module types/entities/collection
 *
 * ⚠️ Limpieza: Solo se exportan tipos canónicos desde './types', extendidos desde './extended' y enums desde './enums'.
 * Legacy eliminado.
 */

export {
    CollectionCategory, CollectionPlatform, CollectionRarity
} from './enums';
export type {
    CollectionCard, CollectionExtended, CollectionListItem, CollectionStats, CollectionViewConfig
} from './extended';
export type {
    CollectionBase,
    CollectionCreateInput,
    CollectionUpdateInput
} from './types';

// 📝 Documentación: Solo tipos y enums canónicos. Legacy removido.
