'use client';

import { type CollectionWithStats, getCollections } from '@/app/actions/collections/collection.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { CollectionCard } from '@/components/features/entity-cards/layouts/collection-card-layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { logger } from '@/lib/logger/logger';
import { useFileManager } from '@/store/file-manager.store';
import { useNavigationStore } from '@/store/navigation.store';
import { LibraryBig } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = logger.withContext('CollectionsView');

export function CollectionsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentCollection } = useFileManager();
	const router = useRouter();
	const [collections, setCollections] = useState<CollectionWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticCollections, _addEvent] = clientEvents.useEvents<CollectionWithStats[]>(collections);

	const fetchCollections = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando colecciones...');
			const data = await getCollections();
			setCollections(data);
			viewLogger.info(`✅ ${data.length} colecciones cargadas`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando colecciones:', err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		// Cargar colecciones inicialmente
		fetchCollections();
	}, [fetchCollections]);

	const handleCollectionClick = useCallback(
		(collection: CollectionWithStats) => {
			viewLogger.info('🖱️ Click en colección:', collection.name);
			setCurrentView('collection-content');
			setCurrentCollection(collection.id);
		},
		[setCurrentView, setCurrentCollection]
	);

	const handleEdit = useCallback(
		(collection: { id: string; name: string }) => {
			viewLogger.info('⚙️ Editando colección:', collection.name);
			router.push('/settings/collections');
		},
		[router]
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
				icon={LibraryBig}
				title="No hay colecciones"
				description="Las colecciones te ayudan a organizar tus imágenes. Crea una nueva colección desde el panel de configuración."
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
								onEdit={() => handleEdit(collection)}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
