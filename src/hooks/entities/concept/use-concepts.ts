import { useConceptStore } from '@/store/entities/concept';
import { processConcepts } from '@/transformers/concept/mappers';
import { useEffect } from 'react';
import { useConceptActions } from './use-concept-actions';
import { useConceptFilters } from './use-concept-filters';
import { useConceptUI } from './use-concept-ui';

/**
 * Hook principal que combina todas las funcionalidades relacionadas con conceptos
 */
export function useConcepts() {
	// Obtener estado del store
	const { concepts, selectedConcept, isLoading, error, filters, sortBy, page, pageSize } = useConceptStore();

	// Combinar todos los hooks específicos
	const actions = useConceptActions();
	const filtersManager = useConceptFilters();
	const uiManager = useConceptUI();

	// Efecto para cargar conceptos al montar el componente
	useEffect(() => {
		actions.loadConcepts();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Procesar conceptos con filtros, ordenamiento y paginación actuales
	const processedData = processConcepts(concepts, filters, sortBy, page, pageSize);

	return {
		// Estado básico
		concepts,
		processedConcepts: processedData.items,
		selectedConcept,
		isLoading,
		error,

		// Metadatos de paginación
		totalConcepts: processedData.total,
		totalPages: processedData.totalPages,

		// Acciones de entidad
		...actions,

		// Gestión de filtros y ordenamiento
		...filtersManager,

		// Gestión de UI
		...uiManager,
	};
}
