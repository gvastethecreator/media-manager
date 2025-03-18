import type { ViewType } from '@/types/file-item';
import { useCallback, useState } from 'react';

/**
 * Hook que maneja el estado de colapso de las categorías en el panel de navegación
 * Permite expandir y colapsar categorías individualmente
 */
export function useCategoryCollapse() {
	// Estado para controlar el colapso de categorías
	const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

	// Función para verificar si una categoría está colapsada
	const isCategoryCollapsed = useCallback(
		(categoryId: ViewType) => !!collapsedCategories[categoryId],
		[collapsedCategories]
	);

	// Función para manejar el colapso/expansión
	const handleCollapseToggle = useCallback((id: ViewType, event: React.MouseEvent | React.KeyboardEvent) => {
		event.stopPropagation();
		setCollapsedCategories((prev) => ({
			...prev,
			[id]: !prev[id],
		}));
	}, []);

	return {
		isCategoryCollapsed,
		handleCollapseToggle,
	};
}
