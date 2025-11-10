import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntitySelection } from '@/hooks/use-entity-selection';
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
	const { handleItemClick: updateSelection } = useEntitySelection();

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

			// Actualizar panel de detalles con la colección seleccionada
			updateSelection(collection as any);

			navigate('/collection-content');
		},
		[navigate, selectCollection, updateSelection]
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
