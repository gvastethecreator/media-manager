import { useConceptStore } from '@/store/entities/concept';
import { processConcepts } from '@/transformers/concept/mappers';
import type { ConceptBase } from '@/types/entities/concept/base';
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
	}, [actions]);

	// Procesar conceptos con filtros, ordenamiento y paginación actuales
	// Convertir ConceptWithStats[] a ConceptBase[] para el procesamiento
	const conceptsBase: ConceptBase[] = concepts.map((concept) => {
		// Extraer solo las propiedades de ConceptBase
		const { _count, ...baseProperties } = concept;
		return baseProperties as ConceptBase;
	});
	const processedData = processConcepts(conceptsBase, filters, sortBy, page, pageSize);

	return {
		// Estado básico
		concepts,
		processedConcepts: processedData.items,
		isLoading,
		error,

		// Metadatos de paginación
		totalConcepts: processedData.total,
		totalPages: Math.ceil(processedData.total / pageSize),

		// Acciones de entidad
		...actions,

		// Gestión de filtros y ordenamiento
		...filtersManager,

		// Gestión de UI
		...uiManager,
	};
}
