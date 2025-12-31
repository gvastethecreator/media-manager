import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { useConceptStore } from '@/store/entities/concept';
import type { ConceptCreateInput } from '@/types/entities/concept';
import ConceptsContentView from './concepts-content-view';

const viewLogger = clientLogger.withContext('ConceptsView');

export function ConceptsView({ className }: { className?: string }) {
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
			clientLogger.error('❌ Error: El nombre del concepto no puede estar vacío');
			return;
		}

		try {
			const conceptData: ConceptCreateInput = {
				name: newConceptName,
				description: newConceptDescription || null,
				emoji: '💡',
				color: '#3b82f6',
				category: 'general',
				content: newConceptDescription || '',
				isFavorite: false,

				totalImages: 0,
				totalVideos: 0,
			};
			await createConcept(conceptData);
			setNewConceptName('');
			setNewConceptDescription('');
			setShowForm(false);
		} catch (error) {
			clientLogger.error('❌ Error creando concepto:', error);
		}
	}, [newConceptName, newConceptDescription, createConcept]);

	return (
		<div className={cn('h-full', className)}>
			<ConceptsContentView
				concepts={concepts}
				error={error}
				handleConceptSelect={handleConceptSelect}
				handleCreateConcept={handleCreateConcept}
				isLoading={isLoading}
				newConceptDescription={newConceptDescription}
				newConceptName={newConceptName}
				searchTerm={searchTerm}
				setNewConceptDescription={setNewConceptDescription}
				setNewConceptName={setNewConceptName}
				setSearchTerm={setSearchTerm}
				setShowForm={setShowForm}
				showForm={showForm}
			/>
		</div>
	);
}
