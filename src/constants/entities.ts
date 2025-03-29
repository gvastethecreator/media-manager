/**
 * Constantes de entidades del sistema
 *
 * Este archivo centraliza la lista de entidades disponibles en el sistema
 * para asegurar coherencia entre todos los componentes que necesitan cargar/mostrar
 * estas entidades.
 */

// Lista de todas las entidades del sistema
export const ALL_ENTITIES = [
  'collections',
  'tags',
  'albums',
  'characters',
  'places',
  'worldItems',
  'prompts',
  'notes',
  'concepts'
] as const;

// Tipo para las entidades (útil para tipado estricto)
export type EntityType = typeof ALL_ENTITIES[number];

// Entidades prioritarias (las que se cargan primero)
export const PRIORITY_ENTITIES: EntityType[] = [
  'collections',
  'tags',
  'albums',
  'places'
];

// Mapeo de IDs de entidades a nombres legibles
export const ENTITY_DISPLAY_NAMES: Record<EntityType, string> = {
  collections: 'Colecciones',
  tags: 'Etiquetas',
  albums: 'Álbumes',
  characters: 'Personajes',
  places: 'Lugares',
  worldItems: 'Objetos del mundo',
  prompts: 'Prompts',
  notes: 'Notas',
  concepts: 'Conceptos'
};

// Mapeo de entidades a sus tabs correspondientes en SettingsView
export const ENTITY_TO_SETTINGS_TAB: Record<EntityType, string> = {
  collections: 'collections',
  tags: 'tags',
  albums: 'albums',
  characters: 'characters',
  places: 'places',
  worldItems: 'world-items',
  prompts: 'prompts',
  notes: 'notes',
  concepts: 'concepts'
};