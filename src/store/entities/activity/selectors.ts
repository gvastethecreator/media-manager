/**
 * @file Selectores para el store de Activity
 * @module store/entities/activity/selectors
 * @description Funciones selectoras para acceder al estado de manera optimizada
 */

import { groupBy } from '@/lib/utils/array.utils';
import { ActivityCategory, ActivityComplete } from '@/types/entities/activity';
import type { ActivityStore } from './index';

/**
 * Selectores básicos
 */

// Obtener listado de actividades como array
export const selectActivities = (state: ActivityStore) => Object.values(state.activities);

// Selectores de estado
export const selectIsLoading = (state: ActivityStore) => state.isLoading;
export const selectError = (state: ActivityStore) => state.error;
export const selectLastUpdated = (state: ActivityStore) => state.lastUpdated;

/**
 * Selectores de UI
 */

// Obtener IDs seleccionados
export const selectSelectedIds = (state: ActivityStore) => state.selectedIds;

// Obtener actividades seleccionadas
export const selectSelectedActivities = (state: ActivityStore) => {
	const activities = Object.values(state.activities);
	return activities.filter((activity) => state.selectedIds.includes(activity.id));
};

// Verificar si una actividad específica está seleccionada
export const selectIsActivitySelected = (id: string) => (state: ActivityStore) => state.selectedIds.includes(id);

// Obtener IDs expandidos
export const selectExpandedIds = (state: ActivityStore) => state.expandedIds;

// Verificar si una actividad específica está expandida
export const selectIsActivityExpanded = (id: string) => (state: ActivityStore) => state.expandedIds.includes(id);

// Obtener actividad destacada
export const selectHighlightedActivity = (state: ActivityStore) =>
	state.highlightedId ? state.activities[state.highlightedId] : null;

// Obtener actividad detallada
export const selectDetailActivity = (state: ActivityStore) =>
	state.detailActivityId ? state.activities[state.detailActivityId] : null;

// Obtener estado del modal de detalles
export const selectIsDetailModalOpen = (state: ActivityStore) => state.isDetailModalOpen;

// Obtener configuración de agrupación por fecha
export const selectGroupByDate = (state: ActivityStore) => state.groupByDate;

/**
 * Selectores de filtros
 */

// Obtener criterio de ordenación
export const selectSortBy = (state: ActivityStore) => state.sortBy;

// Obtener consulta de búsqueda
export const selectSearchQuery = (state: ActivityStore) => state.searchQuery;

// Obtener categorías seleccionadas
export const selectSelectedCategories = (state: ActivityStore) => state.selectedCategories;

// Verificar si una categoría específica está seleccionada
export const selectIsCategorySelected = (category: ActivityCategory) => (state: ActivityStore) =>
	state.selectedCategories.includes(category);

// Obtener estado del filtro solo alertas
export const selectOnlyAlerts = (state: ActivityStore) => state.onlyAlerts;

// Obtener rango de fechas
export const selectDateRange = (state: ActivityStore) => state.dateRange;

// Obtener ID de imagen para filtrado
export const selectImageIdFilter = (state: ActivityStore) => state.filterByImageId;

/**
 * Selectores computados
 */

// Obtener actividades filtradas
export const selectFilteredActivities = (state: ActivityStore) => {
	let activities = Object.values(state.activities);

	// Filtrar por búsqueda
	if (state.searchQuery) {
		const query = state.searchQuery.toLowerCase();
		activities = activities.filter((activity) => activity.description?.toLowerCase().includes(query));
	}

	// Filtrar por categorías
	if (state.selectedCategories.length > 0) {
		activities = activities.filter((activity) =>
			state.selectedCategories.includes(activity.category as ActivityCategory)
		);
	}

	// Filtrar por alertas
	if (state.onlyAlerts) {
		activities = activities.filter(
			(activity) => activity.type.startsWith('system_error') || activity.type.startsWith('system_warning')
		);
	}

	// Filtrar por imagen
	if (state.filterByImageId) {
		activities = activities.filter(
			(activity) =>
				(activity.entityType === 'image' && activity.entityId === state.filterByImageId) ||
				activity.image?.id === state.filterByImageId
		);
	}

	// Filtrar por rango de fechas
	if (state.dateRange.from || state.dateRange.to) {
		activities = activities.filter((activity) => {
			const date = new Date(activity.createdAt);
			const fromDate = state.dateRange.from ? new Date(state.dateRange.from) : null;
			const toDate = state.dateRange.to ? new Date(state.dateRange.to) : null;

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
export const selectSortedActivities = (state: ActivityStore) => {
	const activities = selectFilteredActivities(state);
	const sortBy = state.sortBy;

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
export const selectActivitiesByDay = (state: ActivityStore) => {
	const activities = selectSortedActivities(state);

	if (!state.groupByDate) {
		return { '': activities };
	}

	// Agrupar por día en formato "YYYY-MM-DD"
	return groupBy(activities, (activity: ActivityComplete) => {
		const date = new Date(activity.createdAt);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	});
};

// Obtener actividades agrupadas por tipo
export const selectActivitiesByType = (state: ActivityStore) => {
	const activities = selectSortedActivities(state);
	return groupBy(activities, 'type');
};

// Obtener actividades agrupadas por categoría
export const selectActivitiesByCategory = (state: ActivityStore) => {
	const activities = selectSortedActivities(state);
	return groupBy(activities, 'category');
};
