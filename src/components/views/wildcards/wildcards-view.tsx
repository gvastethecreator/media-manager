import { WildcardCard } from '@/components/cards/wildcard-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWildcards } from '@/lib/api/wildcards';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
// El store se expone desde el barrel de la entidad
import { useWildcardStore } from '@/store/entities/wildcard';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('WildcardsView');

export function WildcardsView({ isVisible }: ViewProps) {
	const { searchTerm, sortBy, sortOrder } = useNavigationStore();
	const { selectedWildcardId, setSelectedWildcardId } = useWildcardStore();
	const [localSearch, setLocalSearch] = useState(searchTerm || '');

	// Usar React Query hook en lugar de server action
	const {
		data: wildcards = [],
		isLoading,
		error,
		refetch,
	} = useWildcards({
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

	const handleWildcardSelect = useCallback(
		(wildcardId: string) => {
			viewLogger.info('✨ Seleccionando wildcard', { wildcardId });
			setSelectedWildcardId(wildcardId);
			clientEvents.emit('wildcard:selected', { wildcardId });
		},
		[setSelectedWildcardId]
	);

	const handleRetry = useCallback(() => {
		viewLogger.info('🔄 Reintentando cargar wildcards');
		refetch();
	}, [refetch]);

	if (!isVisible) return null;

	if (isLoading) {
		return <LoadingScreen message="Cargando wildcards..." />;
	}

	if (error) {
		return (
			<EmptyState
				icon={Sparkles}
				title="Error al cargar wildcards"
				description={error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
				action={{
					label: 'Reintentar',
					onClick: handleRetry,
				}}
			/>
		);
	}

	if (!wildcards.length) {
		const emptyMessage = localSearch
			? `No se encontraron wildcards que coincidan con "${localSearch}"`
			: 'No hay wildcards disponibles';

		return <EmptyState icon={Sparkles} title="Sin wildcards" description={emptyMessage} />;
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
					{wildcards.map((wildcard, index) => (
						<motion.div
							key={wildcard.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: index * 0.05 }}
						>
							<WildcardCard
								wildcard={wildcard}
								isSelected={wildcard.id === selectedWildcardId}
								onSelect={() => handleWildcardSelect(wildcard.id)}
							/>
						</motion.div>
					))}
				</motion.div>
			</div>
		</ScrollArea>
	);
}
