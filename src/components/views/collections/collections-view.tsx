'use client';

import { getCollections } from '@/app/actions/collections/collection.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { EntityCardAdapter } from '@/components/features/entity-cards/entity-card-adapter';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/files/file-manager.store';
import { BookMarked } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = serverLogger.withContext('CollectionsView');

// Configuración visual simplificada para colecciones
const DEFAULT_COLLECTION_OPTIONS: CardOptions = {
	primaryColor: '#9333ea',
	secondaryColor: '#6366f1',
};

// Definir la interfaz para colecciones
interface CollectionWithDetails {
	id: string;
	name: string;
	description?: string | null;
	type?: string | null;
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
			const transformedData = data.map((collectionData: any) => {
				// Filtrar valores nulos en recentImages
				const recentImages = collectionData.recentImages
					? collectionData.recentImages.filter((img: unknown): img is string =>
						typeof img === 'string' && img !== null)
					: [];

				// Crear un objeto explícito para evitar errores de tipo
				const collection: CollectionWithDetails = {
					id: collectionData.id,
					name: collectionData.name,
					description: collectionData.description,
					type: collectionData.type,
					_count: collectionData._count || { images: 0 },
					totalSize: collectionData.totalSize,
					recentImages,
					createdAt: new Date(collectionData.createdAt),
					updatedAt: new Date(collectionData.updatedAt),
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
					...config
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
							<EntityCardAdapter
								entityType="collection"
								entity={collection}
								onClick={() => handleCollectionClick(collection)}
								options={visualConfig}
								className="h-full"
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
