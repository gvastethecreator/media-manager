/**
 * @file Hook de integración para conectar Details Panel con File Browser
 * @module components/panels/details-panel/integration-hook
 */

import { useCallback, useEffect } from 'react';
import { useDetailsPanel } from '@/store/details-panel.store';
import type { EntityWithStats } from '@/types/migration';

/**
 * Hook para manejar la integración del Details Panel con selecciones
 */
export function useDetailsPanelIntegration() {
	const { setSelectedItems, setVisible } = useDetailsPanel();

	/**
	 * Actualiza los elementos seleccionados en el Details Panel
	 */
	const updateSelection = useCallback(
		(items: EntityWithStats[]) => {
			setSelectedItems(items);

			// Mostrar el panel automáticamente si hay selección
			if (items.length > 0) {
				setVisible(true);
			}
		},
		[setSelectedItems, setVisible]
	);

	/**
	 * Limpia la selección del Details Panel
	 */
	const clearSelection = useCallback(() => {
		setSelectedItems([]);
	}, [setSelectedItems]);

	/**
	 * Selecciona un solo elemento
	 */
	const selectSingle = useCallback(
		(item: EntityWithStats) => {
			updateSelection([item]);
		},
		[updateSelection]
	);

	/**
	 * Añade un elemento a la selección múltiple
	 */
	const addToSelection = useCallback(
		(item: EntityWithStats) => {
			setSelectedItems((prev) => {
				const exists = prev.find((p) => p.id === item.id);
				if (exists) return prev;
				return [...prev, item];
			});
			setVisible(true);
		},
		[setSelectedItems, setVisible]
	);

	/**
	 * Quita un elemento de la selección
	 */
	const removeFromSelection = useCallback(
		(itemId: string) => {
			setSelectedItems((prev) => prev.filter((p) => p.id !== itemId));
		},
		[setSelectedItems]
	);

	/**
	 * Toggle de selección para un elemento
	 */
	const toggleSelection = useCallback(
		(item: EntityWithStats) => {
			setSelectedItems((prev) => {
				const exists = prev.find((p) => p.id === item.id);
				if (exists) {
					return prev.filter((p) => p.id !== item.id);
				}
				setVisible(true);
				return [...prev, item];
			});
		},
		[setSelectedItems, setVisible]
	);

	return {
		updateSelection,
		clearSelection,
		selectSingle,
		addToSelection,
		removeFromSelection,
		toggleSelection,
	};
}

/**
 * Hook para manejar acciones de entidades desde el Details Panel
 */
export function useEntityActions() {
	const handleAction = useCallback((action: string, data?: any) => {
		console.log('Handling entity action:', action, data);

		switch (action) {
			case 'view':
				// Implementar vista completa
				console.log('Opening full view for:', data?.entity?.name);
				break;

			case 'edit':
				// Implementar editor
				console.log('Opening editor for:', data?.entity?.name);
				break;

			case 'favorite':
				// Toggle favorito
				console.log('Toggling favorite for:', data?.entity?.name);
				break;

			case 'delete':
				// Confirmar y eliminar
				console.log('Deleting:', data?.entity?.name);
				break;

			case 'share':
				// Compartir
				console.log('Sharing:', data?.entity?.name);
				break;

			case 'download':
				// Descargar
				console.log('Downloading:', data?.entity?.name);
				break;

			case 'rotate-left':
			case 'rotate-right':
				// Rotar imagen
				console.log('Rotating image:', action, data?.entity?.name);
				break;

			case 'crop':
				// Recortar imagen
				console.log('Cropping image:', data?.entity?.name);
				break;

			case 'fullscreen':
				// Pantalla completa
				console.log('Opening fullscreen for:', data?.entity?.name);
				break;

			// Acciones en lote
			case 'bulk-tag':
				console.log('Bulk tagging:', data?.entities?.length, 'items');
				break;

			case 'bulk-move':
				console.log('Bulk moving:', data?.entities?.length, 'items');
				break;

			case 'bulk-favorite':
				console.log('Bulk favoriting:', data?.entities?.length, 'items');
				break;

			case 'bulk-delete':
				console.log('Bulk deleting:', data?.entities?.length, 'items');
				break;

			default:
				console.log('Unhandled action:', action, data);
		}
	}, []);

	return { handleAction };
}

/**
 * Props para componentes que necesitan integración con Details Panel
 */
export interface DetailsPanelIntegrationProps {
	onSelectionChange?: (items: EntityWithStats[]) => void;
	onEntityAction?: (action: string, data?: any) => void;
}

/**
 * Hook combinado que proporciona toda la funcionalidad de integración
 */
export function useDetailsPanelComplete() {
	const integration = useDetailsPanelIntegration();
	const actions = useEntityActions();

	return {
		...integration,
		...actions,
	};
}
