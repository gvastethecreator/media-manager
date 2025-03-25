/**
 * @file Enumeraciones y constantes para la entidad Place
 * @module types/entities/place/enums
 */

/**
 * Tipos de lugares
 */
export enum PlaceType {
  CITY = 'city',
  TOWN = 'town',
  VILLAGE = 'village',
  RUIN = 'ruin',
  CASTLE = 'castle',
  FORTRESS = 'fortress',
  DUNGEON = 'dungeon',
  CAVE = 'cave',
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  VALLEY = 'valley',
  ISLAND = 'island',
  LAKE = 'lake',
  RIVER = 'river',
  OCEAN = 'ocean',
  DESERT = 'desert',
  TUNDRA = 'tundra',
  JUNGLE = 'jungle',
  SWAMP = 'swamp',
  OTHER = 'other'
}

/**
 * Categorías de lugares
 */
export enum PlaceCategory {
  SETTLEMENT = 'settlement',
  LANDSCAPE = 'landscape',
  STRUCTURE = 'structure',
  BIOME = 'biome',
  UNDERGROUND = 'underground',
  MYTHICAL = 'mythical',
  HISTORICAL = 'historical',
  OTHER = 'other'
}

/**
 * Tipos de clima
 */
export enum ClimateType {
  TROPICAL = 'tropical',
  ARID = 'arid',
  TEMPERATE = 'temperate',
  CONTINENTAL = 'continental',
  POLAR = 'polar',
  ALPINE = 'alpine',
  MEDITERRANEAN = 'mediterranean',
  DESERT = 'desert',
  OCEANIC = 'oceanic',
  MONSOON = 'monsoon',
  SAVANNA = 'savanna',
  TUNDRA = 'tundra',
  MAGICAL = 'magical',
  OTHER = 'other'
}

/**
 * Tipos de gobierno
 */
export enum GovernmentType {
  MONARCHY = 'monarchy',
  REPUBLIC = 'republic',
  DEMOCRACY = 'democracy',
  DICTATORSHIP = 'dictatorship',
  OLIGARCHY = 'oligarchy',
  ANARCHY = 'anarchy',
  THEOCRACY = 'theocracy',
  FEUDAL = 'feudal',
  COUNCIL = 'council',
  TRIBAL = 'tribal',
  COLONY = 'colony',
  CITY_STATE = 'city_state',
  AUTONOMOUS = 'autonomous',
  MAGICAL = 'magical',
  OTHER = 'other'
}

/**
 * Niveles de peligro
 */
export enum DangerLevel {
  SAFE = 'safe',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  EXTREME = 'extreme',
  DEADLY = 'deadly',
  UNKNOWN = 'unknown'
}

/**
 * Criterios de ordenación para lugares
 */
export enum PlaceSortCriteria {
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  CREATED_ASC = 'created_asc',
  CREATED_DESC = 'created_desc',
  UPDATED_ASC = 'updated_asc',
  UPDATED_DESC = 'updated_desc',
  POPULATION_ASC = 'population_asc',
  POPULATION_DESC = 'population_desc',
  TYPE_ASC = 'type_asc',
  TYPE_DESC = 'type_desc',
  DANGER_ASC = 'danger_asc',
  DANGER_DESC = 'danger_desc'
}

/**
 * Modos de visualización para lugares
 */
export enum PlaceViewMode {
  LIST = 'list',
  GRID = 'grid',
  MAP = 'map',
  TABLE = 'table'
}

/**
 * Estructura de un recurso de lugar
 */
export interface PlaceResource {
  name: string;
  description?: string;
  rarity?: string;
  amount?: string;
}

/**
 * Estructura de un peligro de lugar
 */
export interface PlaceDanger {
  name: string;
  description?: string;
  level?: DangerLevel;
  location?: string;
}

/**
 * Estructura para las estadísticas de un lugar
 */
export interface PlaceStats {
  population?: number;
  size?: string;
  wealth?: string;
  militaryPower?: string;
  magicalInfluence?: string;
  stability?: string;
  reputation?: string;
  technologicalLevel?: string;
  customStats?: Record<string, string | number>;
}

/**
 * Nombres de propiedades para ordenación
 */
export const PLACE_SORT_PROPERTY_MAP: Record<PlaceSortCriteria, string> = {
  [PlaceSortCriteria.NAME_ASC]: 'name',
  [PlaceSortCriteria.NAME_DESC]: 'name',
  [PlaceSortCriteria.CREATED_ASC]: 'createdAt',
  [PlaceSortCriteria.CREATED_DESC]: 'createdAt',
  [PlaceSortCriteria.UPDATED_ASC]: 'updatedAt',
  [PlaceSortCriteria.UPDATED_DESC]: 'updatedAt',
  [PlaceSortCriteria.POPULATION_ASC]: 'population',
  [PlaceSortCriteria.POPULATION_DESC]: 'population',
  [PlaceSortCriteria.TYPE_ASC]: 'type',
  [PlaceSortCriteria.TYPE_DESC]: 'type',
  [PlaceSortCriteria.DANGER_ASC]: 'dangers',
  [PlaceSortCriteria.DANGER_DESC]: 'dangers'
};