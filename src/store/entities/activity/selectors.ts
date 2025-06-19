/**
 * @file Selectores para el store de Activity
 * @module store/entities/activity/selectors
 * @description Funciones selectoras para acceder al estado de manera optimizada
 */

import { Activity, ActivityCategory } from '@/types/entities/activity';
import { groupBy } from '@/utils/array';
import type { ActivityState } from './types';

/**
 * Selectores básicos
 */

// Obtener listado de actividades como array
export const selectActivities = (state: ActivityState) => Object.values(state.core.activities);

// Selectores de estado
export const selectIsLoading = (state: ActivityState) => state.core.isLoading;
export const selectError = (state: ActivityState) => state.core.error;
export const selectLastUpdated = (state: ActivityState) => state.core.lastUpdated;

/**
 * Selectores de UI
 */

// Obtener IDs seleccionados
export const selectSelectedIds = (state: ActivityState) => state.ui.selectedIds;

// Obtener actividades seleccionadas
export const selectSelectedActivities = (state: ActivityState) => {
	const activities = Object.values(state.core.activities);
	return activities.filter((activity) => state.ui.selectedIds.includes(activity.id));
};

// Verificar si una actividad específica está seleccionada
export const selectIsActivitySelected = (id: string) => (state: ActivityState) => state.ui.selectedIds.includes(id);

// Obtener IDs expandidos
export const selectExpandedIds = (state: ActivityState) => state.ui.expandedIds;

// Verificar si una actividad específica está expandida
export const selectIsActivityExpanded = (id: string) => (state: ActivityState) => state.ui.expandedIds.includes(id);

// Obtener actividad destacada
export const selectHighlightedActivity = (state: ActivityState) =>
	state.ui.highlightedId ? state.core.activities[state.ui.highlightedId] : null;

// Obtener actividad detallada
export const selectDetailActivity = (state: ActivityState) =>
	state.ui.detailActivityId ? state.core.activities[state.ui.detailActivityId] : null;

// Obtener estado del modal de detalles
export const selectIsDetailModalOpen = (state: ActivityState) => state.ui.isDetailModalOpen;

// Obtener configuración de agrupación por fecha
export const selectGroupByDate = (state: ActivityState) => state.ui.groupByDate;

/**
 * Selectores de filtros
 */

// Obtener criterio de ordenación
export const selectSortBy = (state: ActivityState) => state.filters.sortBy;

// Obtener consulta de búsqueda
export const selectSearchQuery = (state: ActivityState) => state.filters.searchQuery;

// Obtener categorías seleccionadas
export const selectSelectedCategories = (state: ActivityState) => state.filters.selectedCategories;

// Verificar si una categoría específica está seleccionada
export const selectIsCategorySelected = (category: ActivityCategory) => (state: ActivityState) =>
	state.filters.selectedCategories.includes(category);

// Obtener estado del filtro solo alertas
export const selectOnlyAlerts = (state: ActivityState) => state.filters.onlyAlerts;

// Obtener rango de fechas
export const selectDateRange = (state: ActivityState) => state.filters.dateRange;

// Obtener ID de imagen para filtrado
export const selectImageIdFilter = (state: ActivityState) => state.filters.filterByImageId;

/**
 * Selectores computados
 */

// Obtener actividades filtradas
export const selectFilteredActivities = (state: ActivityState) => {
	let activities = Object.values(state.core.activities);
	const filters = state.filters;

	// Filtrar por búsqueda
	if (filters.searchQuery) {
		const query = filters.searchQuery.toLowerCase();
		activities = activities.filter((activity) => activity.description.toLowerCase().includes(query));
	}

	// Filtrar por categorías
	if (filters.selectedCategories.length > 0) {
		activities = activities.filter((activity) =>
			filters.selectedCategories.includes(activity.category as ActivityCategory)
		);
	}

	// Filtrar por alertas
	if (filters.onlyAlerts) {
		activities = activities.filter(
			(activity) => activity.type.startsWith('system_error') || activity.type.startsWith('system_warning')
		);
	}

	// Filtrar por imagen
	if (filters.filterByImageId) {
		activities = activities.filter((activity) => activity.imageId === filters.filterByImageId);
	}

	// Filtrar por rango de fechas
	if (filters.dateRange.from || filters.dateRange.to) {
		activities = activities.filter((activity) => {
			const date = new Date(activity.createdAt);
			const fromDate = filters.dateRange.from ? new Date(filters.dateRange.from) : null;
			const toDate = filters.dateRange.to ? new Date(filters.dateRange.to) : null;

			if (fromDate && toDate) {
				return date >= fromDate && date <= toDate;
			}

			if (fromDate) {
				return date >= fromDate;
			}

			if (toDate) {
				return date <= toDate;
			}

			return true;
		});
	}

	return activities;
};

// Obtener actividades filtradas y ordenadas
export const selectSortedActivities = (state: ActivityState) => {
	const activities = selectFilteredActivities(state);
	const sortBy = state.filters.sortBy;

	return [...activities].sort((a, b) => {
		switch (sortBy) {
			case 'date_asc':
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			case 'date_desc':
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			case 'type_asc':
				return a.type.localeCompare(b.type);
			case 'type_desc':
				return b.type.localeCompare(a.type);
			default:
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		}
	});
};

// Obtener actividades agrupadas por día
export const selectActivitiesByDay = (state: ActivityState) => {
	const activities = selectSortedActivities(state);

	if (!state.ui.groupByDate) {
		return { '': activities };
	}

	// Agrupar por día en formato "YYYY-MM-DD"
	return groupBy(activities, (activity: Activity) => {
		const date = new Date(activity.createdAt);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	});
};

// Obtener actividades agrupadas por tipo
export const selectActivitiesByType = (state: ActivityState) => {
	const activities = selectSortedActivities(state);
	return groupBy(activities, 'type');
};

// Obtener actividades agrupadas por categoría
export const selectActivitiesByCategory = (state: ActivityState) => {
	const activities = selectSortedActivities(state);
	return groupBy(activities, 'category');
};
