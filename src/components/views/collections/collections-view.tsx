import { useCallback, useEffect, useState } from 'react';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { useCreateCollection } from '@/lib/api/collections';
import { clientLogger } from '@/lib/logger/client-logger';
import { useCollectionStore } from '@/store/entities/collection';
import type { CollectionWithStats } from '@/types/entities/collection';
import type { ViewProps } from '../types';
import CollectionsContentView from './collections-content-view';

const viewLogger = clientLogger.withContext('CollectionsView');

export function CollectionsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { getCollections, isLoading, error, fetchCollections, selectCollection } = useCollectionStore();
	const { mutate: createCollection } = useCreateCollection();

	const [showForm, setShowForm] = useState(false);
	const [newCollectionName, setNewCollectionName] = useState('');
	const [newCollectionDescription, setNewCollectionDescription] = useState('');

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

	const handleCreateCollection = useCallback(() => {
		// const { toast } = useToast();
		if (newCollectionName.trim() === '') {
			// toast({
			// 	title: '❌ Error',
			// 	description: 'El nombre de la colección no puede estar vacío.',
			// 	variant: 'destructive',
			// });
			return;
		}
		createCollection({ name: newCollectionName, description: newCollectionDescription });
		setNewCollectionName('');
		setNewCollectionDescription('');
		setShowForm(false);
	}, [newCollectionName, newCollectionDescription, createCollection]);

	return (
		<CollectionsContentView
			collections={collections}
			isLoading={isLoading}
			error={error}
			showForm={showForm}
			newCollectionName={newCollectionName}
			newCollectionDescription={newCollectionDescription}
			setShowForm={setShowForm}
			setNewCollectionName={setNewCollectionName}
			setNewCollectionDescription={setNewCollectionDescription}
			handleCollectionClick={handleCollectionClick}
			handleCreateCollection={handleCreateCollection}
		/>
	);
}
