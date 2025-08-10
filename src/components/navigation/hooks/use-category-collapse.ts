import React, { useCallback, useState } from 'react';
import { ViewType } from '@/components/views/types';

/**
 * Hook que maneja el estado de colapso de las categorías en el panel de navegación
 * Permite expandir y colapsar categorías individualmente
 * Mantiene solo una categoría expandida a la vez, a menos que se expanda manualmente
 */
export function useCategoryCollapse() {
	// Estado para controlar el colapso de categorías
	// Todas las categorías inician colapsadas por defecto (true = colapsado)
	const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
	// Rastrear la última categoría expandida manualmente
	const [lastExpandedCategory, setLastExpandedCategory] = useState<string | null>(null);

	// Función para verificar si una categoría está colapsada
	const isCategoryCollapsed = useCallback(
		(categoryId: ViewType) => {
			// Si no existe en el estado, por defecto está colapsada
			return collapsedCategories[categoryId] === undefined ? true : !!collapsedCategories[categoryId];
		},
		[collapsedCategories]
	);

	// Función para manejar el colapso/expansión
	const handleCollapseToggle = useCallback((id: ViewType, event: React.MouseEvent | React.KeyboardEvent) => {
		event.stopPropagation();

		setCollapsedCategories((prev) => {
			const isCurrentlyCollapsed = prev[id] === undefined ? true : prev[id];
			const newState = { ...prev };

			if (isCurrentlyCollapsed) {
				// Si vamos a expandir esta categoría, colapsamos todas las demás
				for (const categoryId of Object.keys(newState)) {
					newState[categoryId] = true;
				}
				// Expandimos solo la seleccionada
				newState[id] = false;
				setLastExpandedCategory(id);
			} else {
				// Solo colapsamos la categoría actual
				newState[id] = true;
			}

			return newState;
		});
	}, []);

	// Función para expandir explícitamente una categoría (sin evento)
	const expandCategory = useCallback((id: ViewType) => {
		setCollapsedCategories((prev) => {
			// Si ya está expandida, no hacemos nada
			if (prev[id] === false) {
				return prev;
			}

			const newState = { ...prev };
			// Colapsamos todas las categorías
			for (const categoryId of Object.keys(newState)) {
				newState[categoryId] = true;
			}
			// Expandimos solo la seleccionada
			newState[id] = false;
			setLastExpandedCategory(id);
			return newState;
		});
	}, []);

	return {
		isCategoryCollapsed,
		handleCollapseToggle,
		expandCategory,
		lastExpandedCategory,
	};
}
