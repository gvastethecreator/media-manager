/**
 * @file Tipos para el store de actividades
 * @module store/entities/activity/types
 */

import {
    type Activity,
    type ActivityCategory,
    type ActivitySortCriteria
} from '../../../types/entities/activity';

/**
 * Estado principal del store de actividades
 */
export interface ActivityState {
  // Slices de estado
  core: ActivityCoreState;
  ui: ActivityUIState;
  filters: ActivityFiltersState;
}

/**
 * Estado del slice core
 */
export interface ActivityCoreState {
  activities: Record<string, Activity>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

/**
 * Estado del slice UI
 */
export interface ActivityUIState {
  selectedIds: string[];
  expandedIds: string[];
  highlightedId: string | null;
  detailActivityId: string | null;
  isDetailModalOpen: boolean;
  groupByDate: boolean;
}

/**
 * Estado del slice de filtros
 */
export interface ActivityFiltersState {
  sortBy: ActivitySortCriteria;
  searchQuery: string;
  selectedCategories: ActivityCategory[];
  onlyAlerts: boolean;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  filterByImageId: string | null;
}