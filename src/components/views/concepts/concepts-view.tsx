import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientLogger } from '@/lib/logger/client-logger';
import { useConceptStore } from '@/store/entities/concept';
import type { ViewProps } from '../types';
import ConceptsContentView from './concepts-content-view';

const viewLogger = clientLogger.withContext('ConceptsView');

export function ConceptsView() {
	const navigate = useNavigate();
	const {
		concepts,
		isLoading,
		error,
		selectedConcept,
		selectConcept,
		loadConcepts,
		createConcept,
		filters,
		setFilters,
	} = useConceptStore();

	const [showForm, setShowForm] = useState(false);
	const [newConceptName, setNewConceptName] = useState('');
	const [newConceptDescription, setNewConceptDescription] = useState('');
	const [searchTerm, setSearchTerm] = useState(filters.search || '');

	// Cargar conceptos al montar el componente
	useEffect(() => {
		loadConcepts();
	}, [loadConcepts]);

	// Sincronizar filtros de búsqueda
	useEffect(() => {
		setFilters({ search: searchTerm });
	}, [searchTerm, setFilters]);

	const handleConceptSelect = useCallback(
		(conceptId: string) => {
			const concept = concepts.find((c) => c.id === conceptId);
			if (concept) {
				viewLogger.info('💡 Seleccionando concept', { conceptId });
				selectConcept(concept);

				// Navegar a la vista de detalle del concepto
				navigate('/concept-content');
			}
		},
		[concepts, selectConcept, navigate]
	);

	const handleCreateConcept = useCallback(async () => {
		if (newConceptName.trim() === '') {
			console.error('❌ Error: El nombre del concepto no puede estar vacío');
			return;
		}

		try {
			const now = new Date();
			await createConcept({
				name: newConceptName,
				description: newConceptDescription || null,
				content: newConceptDescription || '',
				emoji: '💡',
				color: '#3b82f6',
				category: 'general',
				featuredImage: null,
				isFavorite: false,
				createdAt: now,
				updatedAt: now,
			});
			setNewConceptName('');
			setNewConceptDescription('');
			setShowForm(false);
		} catch (error) {
			console.error('❌ Error creando concepto:', error);
		}
	}, [newConceptName, newConceptDescription, createConcept]);

	return (
		<ConceptsContentView
			concepts={concepts}
			isLoading={isLoading}
			error={error}
			showForm={showForm}
			newConceptName={newConceptName}
			newConceptDescription={newConceptDescription}
			searchTerm={searchTerm}
			setShowForm={setShowForm}
			setNewConceptName={setNewConceptName}
			setNewConceptDescription={setNewConceptDescription}
			setSearchTerm={setSearchTerm}
			handleConceptSelect={handleConceptSelect}
			handleCreateConcept={handleCreateConcept}
		/>
	);
}
