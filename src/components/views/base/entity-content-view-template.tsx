'use client';

/**
 * 🧩 Plantilla base para vistas de contenido de entidades
 *
 * Esta plantilla proporciona una estructura común para todas las vistas de contenido de entidades,
 * integrando correctamente el sistema de tarjetas EntityCard para mostrar los elementos relacionados.
 */

import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { type Entity, EntityCardAdapter } from '@/components/features/entity-cards/entity-card-adapter';
import { LayerPluginProvider } from '@/components/features/entity-cards/layers/layer-plugin-system';
import { RegisterLayersForEntity } from '@/components/features/entity-cards/layers/unified-layer-registration';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { serverLogger } from '@/lib/logger/server-logger';
import { cn } from '@/lib/utils';
import { useImageViewer } from '@/store/image-viewer.store';
import type { FileItem } from '@/types/file-item';
import { FolderIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ViewProps } from '../types';

// Tipos genéricos para la plantilla
export interface EntityContentViewProps<T> extends ViewProps {
	// Propiedades específicas para la vista
	title?: string;
	description?: string;
	emptyStateIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	emptyStateTitle?: string;
	emptyStateDescription?: string;
	// ID de la entidad padre
	entityId: string | null;
	// Nombre de la entidad padre
	entityName?: string;
	// Función para cargar elementos relacionados
	fetchRelatedItems: (entityId: string) => Promise<T[]>;
	// Función para manejar el clic en un elemento
	onItemClick?: (item: T) => void;
	// Función para manejar el doble clic en un elemento
	onItemDoubleClick?: (item: T) => void;
	// Tipo de entidad para el sistema de tarjetas
	entityType: string;
	// Opciones visuales predeterminadas
	defaultOptions: CardOptions;
	// Endpoint para cargar configuración visual
	visualConfigEndpoint?: string;
	// Función para transformar datos (opcional)
	transformData?: (data: Record<string, unknown>[]) => T[];
	// Clase CSS adicional
	className?: string;
}

/**
 * Componente base para vistas de contenido de entidades
 */
export function EntityContentView<T extends FileItem>({
	title,
	description,
	emptyStateIcon = FolderIcon,
	emptyStateTitle = 'No hay elementos',
	emptyStateDescription = 'No se encontraron elementos para mostrar.',
	entityId,
	entityName = 'entidad',
	fetchRelatedItems,
	onItemClick,
	onItemDoubleClick,
	entityType,
	defaultOptions,
	visualConfigEndpoint,
	transformData,
	className,
	...props
}: EntityContentViewProps<T>) {
	// Estado para los elementos
	const [items, setItems] = useState<T[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [visualConfig, setVisualConfig] = useState<CardOptions>(defaultOptions);

	// Logger contextual
	const viewLogger = serverLogger.withContext(`${entityType}ContentView`);

	// Visor de imágenes
	const { openViewer } = useImageViewer();

	// Usar el hook de eventos optimistas del cliente
	const [optimisticItems, _addEvent] = clientEvents.useEvents<T[]>(items);

	// Título dinámico basado en el nombre de la entidad
	const dynamicTitle = useMemo(() => {
		if (title) return title;
		if (entityName) return `Contenido de ${entityName}`;
		return `Contenido de ${entityType}`;
	}, [title, entityName, entityType]);

	// Cargar elementos
	const loadItems = useCallback(async () => {
		if (!entityId) return;

		try {
			setIsLoading(true);
			viewLogger.info(`🔄 Cargando elementos de ${entityType} (${entityId})...`);

			const data = await fetchRelatedItems(entityId);

			// Transformar datos si es necesario
			const transformedData = transformData ? transformData(data) : data;

			setItems(transformedData);
			viewLogger.info(`✅ ${transformedData.length} elementos cargados para ${entityType} (${entityId})`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			viewLogger.error(`❌ Error cargando elementos de ${entityType}:`, error);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [entityId, fetchRelatedItems, transformData, entityType, viewLogger]);

	// Cargar elementos al montar el componente o cambiar el ID de la entidad
	useEffect(() => {
		if (entityId) {
			loadItems();
		} else {
			setIsLoading(false);
		}
	}, [entityId, loadItems]);

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

	// Manejar clic en un elemento
	const handleItemClick = useCallback(
		(item: T) => {
			if (onItemClick) {
				onItemClick(item);
			}
		},
		[onItemClick]
	);

	// Manejar doble clic en un elemento (por defecto abre el visor de imágenes)
	const handleItemDoubleClick = useCallback(
		(item: T) => {
			if (onItemDoubleClick) {
				onItemDoubleClick(item);
				return;
			}

			// Comportamiento predeterminado: abrir visor de imágenes
			if (item.type === 'image' && optimisticItems) {
				const imageItems = optimisticItems.filter((i) => i.type === 'image');
				const currentIndex = imageItems.findIndex((i) => i.id === item.id);
				openViewer(imageItems as unknown as Entity[], currentIndex);
			}
		},
		[onItemDoubleClick, optimisticItems, openViewer]
	);

	// Si no hay ID de entidad, mostrar estado vacío
	if (!entityId) {
		const EmptyIcon = emptyStateIcon;
		return (
			<EmptyState
				icon={EmptyIcon}
				title={`No hay ${entityName} seleccionado`}
				description={`Selecciona un ${entityName} para ver su contenido`}
			/>
		);
	}

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
	if (!optimisticItems || optimisticItems.length === 0) {
		const EmptyIcon = emptyStateIcon;
		return <EmptyState icon={EmptyIcon} title={emptyStateTitle} description={emptyStateDescription} />;
	}

	// Renderizar la vista principal
	return (
		<ScrollArea className="h-full">
			<div className={cn('container mx-auto p-6', className)}>
				{/* Título y descripción opcionales */}
				{(dynamicTitle || description) && (
					<div className="mb-6">
						{dynamicTitle && <h1 className="text-2xl font-bold">{dynamicTitle}</h1>}
						{description && <p className="text-muted-foreground mt-1">{description}</p>}
					</div>
				)}

				{/* Cuadrícula de elementos */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{optimisticItems.map((item, index) => {
						// Verificar que el elemento tenga un id válido
						if (!item || !item.id) {
							console.error('Elemento sin id válido:', item);
							return null;
						}

						return (
							<motion.div
								key={item.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
							>
								<LayerPluginProvider>
									<RegisterLayersForEntity
										entityType={entityType}
										debug={false}
									/>
									<EntityCardAdapter
										entityType={entityType}
										entity={item as unknown as Entity}
										onClick={() => handleItemClick(item)}
										onDoubleClick={() => handleItemDoubleClick(item)}
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
