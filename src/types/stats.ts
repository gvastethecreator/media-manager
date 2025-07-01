/**
 * @file Tipos para estadísticas del sistema
 * @module types/stats
 */

export interface BaseStats {
  total: number;
  processed: number;
  errors: number;
}

export interface ThumbnailStats extends BaseStats {
  totalSize: number;
}

export interface TagStats {
  totalRelations: number;
  usageDiversity: number;
  popularity: number;
  completenessScore: number;
}

export interface EntityStats {
  count: number;
  recentlyAdded: number;
  recentlyUpdated: number;
  withImages: number;
  withoutImages: number;
}

export interface SystemStats {
  images: EntityStats;
  tags: EntityStats;
  collections: EntityStats;
  albums: EntityStats;
  characters: EntityStats;
  places: EntityStats;
  worldItems: EntityStats;
  concepts: EntityStats;
  prompts: EntityStats;
  notes: EntityStats;
  groups: EntityStats;
  properties: EntityStats;
  wildcards: EntityStats;
  thumbnails: ThumbnailStats;
}

export interface PerformanceStats {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  databaseSize: number;
  lastUpdated: Date;
}