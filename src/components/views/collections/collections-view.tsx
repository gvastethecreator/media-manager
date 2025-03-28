'use client';

import { getCollections } from '@/app/actions/collections/collection.actions';
import { CollectionCard } from '@/components/cards/collection-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/files/file-manager.store';
import type { Collection } from '@/types/entities/collections';
import { BookMarked } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = serverLogger.withContext('CollectionsView');

// Definir la interfaz para colecciones con datos adicionales
interface CollectionWithDetails extends Collection {
	_count?: { images: number };
	totalSize?: number;
	recentImages?: string[];
}

// Crear un componente de tarjeta memorizada para optimizar
const MemoizedCollectionCard = memo(
	({ collection, onClick }: { collection: CollectionWithDetails; onClick: () => void }) => (
		<CollectionCard collection={collection} onClick={onClick} />
	),
	(prevProps, nextProps) => {
		// Solo re-renderizar si cambian estos valores
		return (
			prevProps.collection.id === nextProps.collection.id &&
			prevProps.collection.updatedAt === nextProps.collection.updatedAt &&
			prevProps.collection._count?.images === nextProps.collection._count?.images
		);
	}
);
MemoizedCollectionCard.displayName = 'MemoizedCollectionCard';

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
			const transformedData = data.map((collectionData: any) => {
				// Filtrar valores nulos en recentImages
				const recentImages = collectionData.recentImages
					? collectionData.recentImages.filter((img: unknown): img is string => typeof img === 'string' && img !== null)
					: [];

				// Crear un objeto explícito para evitar errores de tipo
				const collection: CollectionWithDetails = {
					id: collectionData.id,
					name: collectionData.name,
					emoji: collectionData.emoji || '📚',
					description: collectionData.description,
					color: collectionData.color || '#10b981',
					shortcut: collectionData.shortcut,
					sortBy: collectionData.sortBy,
					filters: collectionData.filters,
					url: collectionData.url,
					alternativeUrl: collectionData.alternativeUrl,
					sourceImage: collectionData.sourceImage,
					platform: collectionData.platform,
					price: collectionData.price,
					editions: collectionData.editions,
					featuredImage: collectionData.featuredImage,
					isFavorite: collectionData.isFavorite || false,
					createdAt: new Date(collectionData.createdAt),
					updatedAt: new Date(collectionData.updatedAt),
					category: collectionData.category,
					rarity: collectionData.rarity,
					texture: collectionData.texture,
					_count: collectionData._count || { images: 0 },
					totalSize: collectionData.totalSize,
					recentImages,
				};

				return collection;
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
					count: collection._count?.images || 0,
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
							{collection.id && (
								<MemoizedCollectionCard
									collection={collection}
									onClick={() => handleCollectionClick(collection)}
								/>
							)}
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
