/**
 * @file Tipos para el store de actividades
 * @module store/entities/activity/types
 */

import { ActivityCategory, ActivityComplete, ActivitySortCriteria } from '@/types/entities/activity';

/**
 * Estado principal del store de actividades (estructura plana)
 */
export interface ActivityState {
	// Datos principales
	activities: Record<string, ActivityComplete>;
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
	detailActivityId: string | null;
	error: string | null;
	expandedIds: string[];
	filterByImageId: string | null;
	groupByDate: boolean;
	highlightedId: string | null;
	isDetailModalOpen: boolean;
	isLoading: boolean;
	lastUpdated: number | null;
	onlyAlerts: boolean;
	searchQuery: string;
	selectedCategories: ActivityCategory[];

	// Estado UI
	selectedIds: string[];

	// Estado de filtros
	sortBy: ActivitySortCriteria;
}
