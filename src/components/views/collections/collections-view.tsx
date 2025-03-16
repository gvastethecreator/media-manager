'use client';

import { getCollections } from '@/app/actions/collections/collection.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { EntityCardAdapter } from '@/components/features/entity-cards/adapters/entity-card-adapter';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/file-manager.store';
import type { Collection } from '@prisma/client';
import { BookMarked } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = serverLogger.withContext('CollectionsView');

// Configuración visual predeterminada para colecciones
const DEFAULT_COLLECTION_OPTIONS: CardOptions = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,
	useImageGrid: true,
	imageGridLayout: 'quad',
	imageGridGap: 4,
	imageGridStyle: 'standard',
	designSystem: {
		preset: 'collection',
		variant: 'default',
		aspectRatio: '1/1',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft',
	},
	layerSystem: {
		order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
		layerBlending: 'screen',
		layerSpacing: 2,
	},
	primaryColor: '#9333ea',
	secondaryColor: '#6366f1',
	hoverLiftHeight: 12,
	maxRotation: 15,
};

// Extender el tipo Collection para incluir los campos adicionales
interface CollectionWithDetails extends Collection {
	_count?: { images: number };
	totalSize?: number;
	recentImages?: string[];
	createdAt: Date;
	updatedAt: Date;
}

export function CollectionsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentCollection } = useFileManager();
	const [collections, setCollections] = useState<CollectionWithDetails[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [visualConfig, setVisualConfig] = useState<CardOptions>(DEFAULT_COLLECTION_OPTIONS);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticCollections, _addEvent] = clientEvents.useEvents<CollectionWithDetails[]>(collections);

	const loadCollections = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando colecciones...');
			const data = await getCollections();
			const transformedData = data.map((collectionData) => {
				// Filtrar valores nulos en recentImages
				const recentImages = collectionData.recentImages
					? collectionData.recentImages.filter((img): img is string => img !== null)
					: [];

				return {
					...collectionData,
					recentImages,
					_count: collectionData._count || { images: 0 },
					createdAt: new Date(collectionData.createdAt),
					updatedAt: new Date(collectionData.updatedAt),
				} as CollectionWithDetails;
			});

			setCollections(transformedData);
			viewLogger.info(`✅ ${data.length} colecciones cargadas`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando colecciones:', error);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadCollections();
	}, [loadCollections]);

	useEffect(() => {
		const loadVisualConfig = async () => {
			try {
				const response = await fetch('/api/entities/collections/visual-config');
				if (!response.ok) {
					throw new Error('Error al cargar la configuración visual');
				}
				const config = await response.json();
				// Combinar la configuración del servidor con las opciones predeterminadas
				setVisualConfig({
					...DEFAULT_COLLECTION_OPTIONS,
					...config,
					// Asegurar que las propiedades anidadas se combinen correctamente
					designSystem: {
						...(DEFAULT_COLLECTION_OPTIONS.designSystem || {}),
						...(config.designSystem || {}),
					},
					layerSystem: {
						...(DEFAULT_COLLECTION_OPTIONS.layerSystem || {}),
						...(config.layerSystem || {}),
					},
				});
			} catch (error) {
				console.error('Error al cargar la configuración visual:', error);
				// Si hay un error, mantenemos la configuración predeterminada
			}
		};

		loadVisualConfig();
	}, []);

	const handleCollectionClick = useCallback(
		(collection: CollectionWithDetails) => {
			viewLogger.info('🖱️ Click en colección:', collection.name);
			setCurrentView('collection-content');
			setCurrentCollection(collection.id);
			// Actualizar la información completa de la colección en el store
			useFileManager.setState({
				currentCollection: {
					id: collection.id,
					name: collection.name,
					description: collection.description,
					type: collection.type,
					_count: collection._count,
					totalSize: collection.totalSize,
					createdAt: collection.createdAt,
					updatedAt: collection.updatedAt,
				},
			});
		},
		[setCurrentView, setCurrentCollection]
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

	if (!optimisticCollections || optimisticCollections.length === 0) {
		return (
			<EmptyState
				icon={BookMarked}
				title="No hay colecciones creadas"
				description="Crea una colección para organizar tus imágenes de forma temática."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{optimisticCollections.map((collection, index) => (
						<motion.div
							key={collection.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<EntityCardAdapter
								entityType="collection"
								entity={collection}
								onClick={() => handleCollectionClick(collection)}
								showVisualConfig={true}
								enableExplode={true}
								options={visualConfig}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
