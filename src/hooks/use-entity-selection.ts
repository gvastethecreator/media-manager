/**
 * @file Hook para manejar selección de entidades y actualizar panel de detalles
 * @module hooks/use-entity-selection
 */

import { useCallback } from 'react';
import { useDetailsPanel } from '@/store/details-panel.store';
import type { AnyEntityWithStats } from '@/types/entities';

/**
 * Hook compartido para manejar la selección de items y actualizar el panel de detalles
 *
 * @example
 * ```tsx
 * function MyView() {
 *   const handleClick = useEntitySelection();
 *
 *   return (
 *     <FileBrowser
 *       items={items}
 *       onItemClick={handleClick}
 *     />
 *   );
 * }
 * ```
 */
export function useEntitySelection() {
	const { setSelectedItems } = useDetailsPanel();

	const handleItemClick = useCallback(
		(item: AnyEntityWithStats) => {
			// Actualizar panel de detalles con el item seleccionado
			setSelectedItems([item]);
		},
		[setSelectedItems]
	);

	const handleMultipleSelection = useCallback(
		(items: AnyEntityWithStats[]) => {
			// Actualizar panel de detalles con múltiples items
			setSelectedItems(items);
		},
		[setSelectedItems]
	);

	const clearSelection = useCallback(() => {
		// Limpiar selección
		setSelectedItems([]);
	}, [setSelectedItems]);

	return {
		handleItemClick,
		handleMultipleSelection,
		clearSelection,
	};
}
