'use client';

import { CollectionCard } from '@/components/cards/collection-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientLogger } from '@/lib/logger/client-logger';
import { useCollectionStore } from '@/store/entities/collection';
import type { CollectionWithStats } from '@/types/entities/collection';
import { BookMarked } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback, useEffect } from 'react';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('CollectionsView');

const MemoizedCollectionCard = memo(CollectionCard);

export function CollectionsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const {
		getCollections,
		isLoading,
		error,
		fetchCollections,
		selectCollection
	} = useCollectionStore();

	// Obtener las colecciones del store
	const collections = getCollections();

	useEffect(() => {
		if (collections.length === 0 && !isLoading) {
			viewLogger.info('🔄 No hay colecciones en el store, cargando desde el servidor...');
			fetchCollections();
		}
	}, [collections.length, isLoading, fetchCollections]);

	const handleCollectionClick = useCallback(
		(collection: CollectionWithStats) => {
			viewLogger.info('🖱️ Click en colección:', collection.name);
			selectCollection(collection.id);
			setCurrentView('collection-content');
		},
		[setCurrentView, selectCollection]
	);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && collections.length === 0) {
		return <LoadingScreen />;
	}

	if (collections.length === 0) {
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
					{collections.map((collection, index) => (
						<motion.div
							key={collection.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<MemoizedCollectionCard
								collection={collection}
								onClick={() => handleCollectionClick(collection)}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
