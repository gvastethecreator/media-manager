/**
 * @file Tipos para el store de actividades
 * @module store/entities/activity/types
 */

import { ActivityCategory, ActivityComplete, ActivitySortCriteria } from '../../../types/entities/activity';

/**
 * Estado principal del store de actividades (estructura plana)
 */
export interface ActivityState {
	// Datos principales
	activities: Record<string, ActivityComplete>;
	isLoading: boolean;
	error: string | null;
	lastUpdated: number | null;

	// Estado UI
	selectedIds: string[];
	expandedIds: string[];
	highlightedId: string | null;
	detailActivityId: string | null;
	isDetailModalOpen: boolean;
	groupByDate: boolean;

	// Estado de filtros
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
