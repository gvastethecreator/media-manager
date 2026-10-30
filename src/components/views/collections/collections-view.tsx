import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCollection } from '@/lib/api/collections';
import { clientLogger } from '@/lib/logger/client-logger';
import { useCollectionStore } from '@/store/entities/collection';
import type { CollectionWithStats } from '@/types/entities/collection';
import type { ViewProps } from '../types';
import CollectionsContentView from './collections-content-view';

const viewLogger = clientLogger.withContext('CollectionsView');

export function CollectionsView(_props: ViewProps) {
	const navigate = useNavigate();
	const { getCollections, isLoading, error, fetchCollections, selectCollection } = useCollectionStore();
	const { mutate: createCollection } = useCreateCollection();

	const [showForm, setShowForm] = useState(false);
	const [newCollectionName, setNewCollectionName] = useState('');
	const [newCollectionDescription, setNewCollectionDescription] = useState('');

	// Obtener las colecciones del store
	const collections = getCollections();

	// Fetch once per mount: an empty library stays empty after loading, so emptiness alone would refetch forever.
	const hasRequestedCollections = useRef(false);
	useEffect(() => {
		if (hasRequestedCollections.current || collections.length > 0) return;
		hasRequestedCollections.current = true;
		viewLogger.info('🔄 Collection store is empty, loading from the server...');
		fetchCollections();
	}, [collections.length, fetchCollections]);

	const handleCollectionClick = useCallback(
		(collection: CollectionWithStats) => {
			viewLogger.info('🖱️ Collection clicked:', collection.name);
			selectCollection(collection.id);
			navigate('/collection-content');
		},
		[navigate, selectCollection]
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
		// The view reads the collection store; the React Query mutation does not update it.
		createCollection(
			{ name: newCollectionName, description: newCollectionDescription },
			{ onSuccess: () => void fetchCollections() }
		);
		setNewCollectionName('');
		setNewCollectionDescription('');
		setShowForm(false);
	}, [newCollectionName, newCollectionDescription, createCollection, fetchCollections]);

	return (
		<CollectionsContentView
			collections={collections}
			error={error}
			handleCollectionClick={handleCollectionClick}
			handleCreateCollection={handleCreateCollection}
			isLoading={isLoading}
			newCollectionDescription={newCollectionDescription}
			newCollectionName={newCollectionName}
			setNewCollectionDescription={setNewCollectionDescription}
			setNewCollectionName={setNewCollectionName}
			setShowForm={setShowForm}
			showForm={showForm}
		/>
	);
}
