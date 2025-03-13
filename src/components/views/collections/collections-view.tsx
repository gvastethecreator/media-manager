'use client';

import { getCollections } from '@/app/actions/collections/collection.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { CollectionCard } from '@/components/features/entity-cards/layouts/collection-card-layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { logger } from '@/lib/logger/logger';
import { useFileManager } from '@/store/file-manager.store';
import { useNavigationStore } from '@/store/navigation.store';
import type { Collection } from '@prisma/client';
import { BookMarked } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = logger.withContext('CollectionsView');

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
							<CollectionCard
								data={collection}
								onClick={() => handleCollectionClick(collection)}
								options={{
									useImageGrid: true,
									imageGridLayout: 'quad',
									imageGridGap: 4,
									imageGridStyle: 'standard',
									enableGlow: true,
									enableBorderEffect: true,
								}}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
