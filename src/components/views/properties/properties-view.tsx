'use client';

import { getProperties } from '@/app/actions/properties/property.actions';
import { PropertyCard } from '@/components/cards/property-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { usePropertyStore } from '@/store/entities/property';
import type { PropertyWithStats as PropertyWithStatsBase } from '@/types/entities/property';
import { Variable } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

// Definir el tipo extendido para propiedades con estadísticas de asociaciones
export type PropertyWithStats = PropertyWithStatsBase & {
	totalAssociations: number;
};

const viewLogger = clientLogger.withContext('PropertiesView');

// Componente memoizado para cada tarjeta de propiedad
const MemoizedPropertyCard = React.memo(
	({ property, onPropertyClick }: { property: PropertyWithStats; onPropertyClick: () => void }) => {
		return <PropertyCard property={property} onClick={onPropertyClick} className="h-full" />;
	},
	(prevProps, nextProps) => {
		// Memoización personalizada para solo re-renderizar si cambian propiedades importantes
		return (
			prevProps.property.id === nextProps.property.id &&
			prevProps.property.name === nextProps.property.name &&
			prevProps.property.updatedAt === nextProps.property.updatedAt
		);
	}
);

// Para evitar advertencias de displayName
MemoizedPropertyCard.displayName = 'MemoizedPropertyCard';

export function PropertiesView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setProperties: setStoreProperties } = usePropertyStore();
	const router = useRouter();
	const [properties, setProperties] = useState<PropertyWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticProperties, _addEvent] = clientEvents.useEvents<PropertyWithStats[]>(properties);

	const fetchProperties = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando propiedades...');
			const data = await getProperties();

			// Convertir PropertyWithStats a PropertyWithStats local (con totalAssociations)
			const propertiesWithStats: PropertyWithStats[] = data.map((property) => ({
				...property,
				totalAssociations: property.stats.totalRelations, // Usar el valor de stats
			}));

			setProperties(propertiesWithStats);
			setStoreProperties(data); // Actualizar el store con las propiedades originales
			viewLogger.info(`✅ ${data.length} propiedades cargadas`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando propiedades:', err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [setStoreProperties]);

	useEffect(() => {
		// Cargar propiedades inicialmente
		fetchProperties();
	}, [fetchProperties]);

	const handlePropertyClick = useCallback(
		(property: PropertyWithStats) => {
			viewLogger.info('🖱️ Click en propiedad:', property.name);
			setCurrentView('property-content');
			// Navegar a la vista de detalle de la propiedad
			router.push(`/properties/${property.id}`);
		},
		[setCurrentView, router]
	);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!optimisticProperties || optimisticProperties.length === 0) {
		return (
			<EmptyState
				icon={Variable}
				title="No hay propiedades creadas"
				description="Crea propiedades para enriquecer tus entidades con metadatos personalizados."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{optimisticProperties.map((property, index) => {
						// Verificar que la propiedad tenga un id válido
						if (!property || !(property as any).id) {
							console.error('Propiedad sin id válido:', property);
							return null;
						}

						// Crear una función de clic específica para esta propiedad
						const onPropertyClick = () => handlePropertyClick(property);

						return (
							<motion.div
								key={(property as any).id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
								className="perspective-1000"
							>
								<div
									className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
									data-property-id={(property as any).id}
								>
									<MemoizedPropertyCard property={property} onPropertyClick={onPropertyClick} />
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</ScrollArea>
	);
}
