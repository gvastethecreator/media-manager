import { PropertyCard } from '@/components/cards/property-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProperties } from '@/lib/api/properties';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { usePropertyStore } from '@/store/entities/property';
import { Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('PropertiesView');

export function PropertiesView({ isVisible }: ViewProps) {
	const { searchTerm, sortBy, sortOrder } = useNavigationStore();
	const { selectedPropertyId, setSelectedPropertyId } = usePropertyStore();
	const [localSearch, setLocalSearch] = useState(searchTerm || '');

	// Usar React Query hook en lugar de server action
	const {
		data: properties = [],
		isLoading,
		error,
		refetch,
	} = useProperties({
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

	const handlePropertySelect = useCallback(
		(propertyId: string) => {
			viewLogger.info('⚙️ Seleccionando property', { propertyId });
			setSelectedPropertyId(propertyId);
			clientEvents.emit('property:selected', { propertyId });
		},
		[setSelectedPropertyId]
	);

	const handleRetry = useCallback(() => {
		viewLogger.info('🔄 Reintentando cargar properties');
		refetch();
	}, [refetch]);

	if (!isVisible) return null;

	if (isLoading) {
		return <LoadingScreen message="Cargando propiedades..." />;
	}

	if (error) {
		return (
			<EmptyState
				icon={Settings}
				title="Error al cargar propiedades"
				description={error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
				action={{
					label: 'Reintentar',
					onClick: handleRetry,
				}}
			/>
		);
	}

	if (!properties.length) {
		const emptyMessage = localSearch
			? `No se encontraron propiedades que coincidan con "${localSearch}"`
			: 'No hay propiedades disponibles';

		return <EmptyState icon={Settings} title="Sin propiedades" description={emptyMessage} />;
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
					{properties.map((property, index) => (
						<motion.div
							key={property.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: index * 0.05 }}
						>
							<PropertyCard
								property={property}
								isSelected={property.id === selectedPropertyId}
								onSelect={() => handlePropertySelect(property.id)}
							/>
						</motion.div>
					))}
				</motion.div>
			</div>
		</ScrollArea>
	);
}
