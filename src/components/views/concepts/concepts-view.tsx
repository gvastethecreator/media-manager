'use client';

import { ConceptCard } from '@/components/cards/concept-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConcepts } from '@/lib/api/concepts';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useConceptStore } from '@/store/entities/concept';
import { Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('ConceptsView');

export function ConceptsView({ isVisible }: ViewProps) {
	const { searchTerm, sortBy, sortOrder } = useNavigationStore();
	const { selectedConceptId, setSelectedConceptId } = useConceptStore();
	const [localSearch, setLocalSearch] = useState(searchTerm || '');

	// Usar React Query hook en lugar de server action
	const {
		data: concepts = [],
		isLoading,
		error,
		refetch,
	} = useConcepts({
		search: localSearch,
		sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
		sortOrder: sortOrder as 'asc' | 'desc',
	});

	// Sincronizar búsqueda local con store de navegación
	useEffect(() => {
		if (searchTerm !== localSearch) {
			setLocalSearch(searchTerm || '');
		}
	}, [searchTerm, localSearch]);

	const handleConceptSelect = useCallback(
		(conceptId: string) => {
			viewLogger.info('💡 Seleccionando concept', { conceptId });
			setSelectedConceptId(conceptId);
			clientEvents.emit('concept:selected', { conceptId });
		},
		[setSelectedConceptId]
	);

	const handleRetry = useCallback(() => {
		viewLogger.info('🔄 Reintentando cargar concepts');
		refetch();
	}, [refetch]);

	if (!isVisible) return null;

	if (isLoading) {
		return <LoadingScreen message="Cargando conceptos..." />;
	}

	if (error) {
		return (
			<EmptyState
				icon={Lightbulb}
				title="Error al cargar conceptos"
				description={error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
				action={{
					label: 'Reintentar',
					onClick: handleRetry,
				}}
			/>
		);
	}

	if (!concepts.length) {
		const emptyMessage = localSearch
			? `No se encontraron conceptos que coincidan con "${localSearch}"`
			: 'No hay conceptos disponibles';

		return <EmptyState icon={Lightbulb} title="Sin conceptos" description={emptyMessage} />;
	}

	return (
		<ScrollArea className="flex-1">
			<div className="p-6">
				<motion.div
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					{concepts.map((concept, index) => (
						<motion.div
							key={concept.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: index * 0.05 }}
						>
							<ConceptCard
								concept={concept}
								isSelected={concept.id === selectedConceptId}
								onSelect={() => handleConceptSelect(concept.id)}
							/>
						</motion.div>
					))}
				</motion.div>
			</div>
		</ScrollArea>
	);
}
