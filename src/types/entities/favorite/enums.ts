/**
 * @file Enumeraciones y constantes para la entidad Favorite
 * @module types/entities/favorite/enums
 */

/**
 * Códigos de error específicos para favoritos
 */
export enum FavoriteErrorCode {
    NOT_FOUND = 'NOT_FOUND',
    ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
    ALREADY_EXISTS = 'ALREADY_EXISTS',
    INVALID_ENTITY_TYPE = 'INVALID_ENTITY_TYPE',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    OPERATION_FAILED = 'OPERATION_FAILED',
}

/**
 * Tipos de eventos relacionados con favoritos
 */
export enum FavoriteEventType {
    ADDED = 'favorite:added',
    REMOVED = 'favorite:removed',
    TOGGLED = 'favorite:toggled',
    UPDATED = 'favorite:updated',
}

/**
 * Acciones de favoritos para eventos
 */
export enum FavoriteAction {
    ADD = 'add',
    REMOVE = 'remove',
    TOGGLE = 'toggle',
}

/**
 * Emojis para tipos de entidades favoritas
 */
export const FAVORITE_ENTITY_EMOJIS: Record<string, string> = {
    image: '🖼️',
    album: '📔',
    collection: '🗃️',
    folder: '📁',
    character: '👤',
    place: '🗺️',
    worldItem: '🧩',
    concept: '💡',
    prompt: '💬',
    note: '📝',
    default: '⭐'
};

/**
 * Colores para tipos de entidades favoritas
 */
export const FAVORITE_ENTITY_COLORS: Record<string, string> = {
    image: '#3b82f6',
    album: '#10b981',
    collection: '#f97316',
    folder: '#8b5cf6',
    character: '#ec4899',
    place: '#22c55e',
    worldItem: '#14b8a6',
    concept: '#6366f1',
    prompt: '#0ea5e9',
    note: '#a855f7',
    default: '#f59e0b'
};

/**
 * Nombres para mostrar de tipos de entidades favoritas
 */
export const FAVORITE_ENTITY_DISPLAY_NAMES: Record<string, string> = {
    image: 'Imágenes',
    album: 'Álbumes',
    collection: 'Colecciones',
    folder: 'Carpetas',
    character: 'Personajes',
    place: 'Lugares',
    worldItem: 'Objetos',
    concept: 'Conceptos',
    prompt: 'Prompts',
    note: 'Notas',
    default: 'Favoritos'
};