'use client';

/**
 * 🧩 Plantilla base para vistas de entidades
 *
 * Esta plantilla proporciona una estructura común para todas las vistas de entidades,
 * integrando correctamente el sistema de tarjetas EntityCard.
 */

import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { EntityCardAdapter } from '@/components/features/entity-cards/adapters/entity-card-adapter';
import { LayerPluginProvider } from '@/components/features/entity-cards/layers/layer-plugin-system';
import { RegisterEntityTypeLayers } from '@/components/features/entity-cards/modules/layers/register-layers';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { logger } from '@/lib/logger/logger';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

// Tipos genéricos para la plantilla
export interface EntityViewProps<T> extends ViewProps {
	// Propiedades específicas para la vista
	title?: string;
	description?: string;
	emptyStateIcon?: React.ComponentType<any>;
	emptyStateTitle?: string;
	emptyStateDescription?: string;
	// Función para cargar entidades
	fetchEntities: () => Promise<T[]>;
	// Función para manejar el clic en una entidad
	onEntityClick: (entity: T) => void;
	// Tipo de entidad para el sistema de tarjetas
	entityType: string;
	// Opciones visuales predeterminadas
	defaultOptions: CardOptions;
	// Endpoint para cargar configuración visual
	visualConfigEndpoint?: string;
	// Función para transformar datos (opcional)
	transformData?: (data: any[]) => T[];
	// Clase CSS adicional
	className?: string;
}

/**
 * Componente base para vistas de entidades
 */
export function EntityView<T extends { id: string }>({
	title,
	description,
	emptyStateIcon,
	emptyStateTitle = 'No hay elementos',
	emptyStateDescription = 'No se encontraron elementos para mostrar.',
	fetchEntities,
	onEntityClick,
	entityType,
	defaultOptions,
	visualConfigEndpoint,
	transformData,
	className,
	...props
}: EntityViewProps<T>) {
	// Estado para las entidades
	const [entities, setEntities] = useState<T[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [visualConfig, setVisualConfig] = useState<CardOptions>(defaultOptions);

	// Logger contextual
	const viewLogger = logger.withContext(`${entityType}View`);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticEntities, _addEvent] = clientEvents.useEvents<T[]>(entities);

	// Cargar entidades
	const loadEntities = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info(`🔄 Cargando ${entityType}...`);

			const data = await fetchEntities();

			// Transformar datos si es necesario
			const transformedData = transformData ? transformData(data) : data;

			setEntities(transformedData);
			viewLogger.info(`✅ ${transformedData.length} ${entityType} cargados`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			viewLogger.error(`❌ Error cargando ${entityType}:`, error);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [fetchEntities, transformData, entityType, viewLogger]);

	// Cargar entidades al montar el componente
	useEffect(() => {
		loadEntities();
	}, [loadEntities]);

	// Cargar configuración visual
	useEffect(() => {
		const loadVisualConfig = async () => {
			if (!visualConfigEndpoint) return;

			try {
				const response = await fetch(visualConfigEndpoint);
				if (!response.ok) {
					throw new Error(`Error al cargar la configuración visual para ${entityType}`);
				}

				const config = await response.json();

				// Combinar la configuración del servidor con las opciones predeterminadas
				setVisualConfig({
					...defaultOptions,
					...config,
					// Asegurar que las propiedades anidadas se combinen correctamente
					designSystem: {
						...(defaultOptions.designSystem || {}),
						...(config.designSystem || {}),
					},
					layerSystem: {
						...(defaultOptions.layerSystem || {}),
						...(config.layerSystem || {}),
					},
				});
			} catch (error) {
				console.error(`Error al cargar la configuración visual para ${entityType}:`, error);
				// Si hay un error, mantenemos la configuración predeterminada
			}
		};

		loadVisualConfig();
	}, [entityType, defaultOptions, visualConfigEndpoint]);

	// Renderizar estado de error
	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	// Renderizar estado de carga
	if (isLoading) {
		return <LoadingScreen />;
	}

	// Renderizar estado vacío
	if (!optimisticEntities || optimisticEntities.length === 0) {
		const EmptyIcon = emptyStateIcon;
		return <EmptyState icon={EmptyIcon} title={emptyStateTitle} description={emptyStateDescription} />;
	}

	// Renderizar la vista principal
	return (
		<ScrollArea className="h-full">
			<div className={cn('container mx-auto p-6', className)}>
				{/* Título y descripción opcionales */}
				{(title || description) && (
					<div className="mb-6">
						{title && <h1 className="text-2xl font-bold">{title}</h1>}
						{description && <p className="text-muted-foreground mt-1">{description}</p>}
					</div>
				)}

				{/* Cuadrícula de entidades */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{optimisticEntities.map((entity, index) => {
						// Verificar que la entidad tenga un id válido
						if (!entity || !entity.id) {
							console.error(`Entidad sin id válido:`, entity);
							return null;
						}

						return (
							<motion.div
								key={entity.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
							>
								<LayerPluginProvider>
									<RegisterEntityTypeLayers entityType={entityType} />
									<EntityCardAdapter
										entityType={entityType}
										entity={entity as any}
										onClick={() => onEntityClick(entity)}
										showVisualConfig={true}
										enableExplode={true}
										options={visualConfig}
									/>
								</LayerPluginProvider>
							</motion.div>
						);
					})}
				</div>
			</div>
		</ScrollArea>
	);
}
