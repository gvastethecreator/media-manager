import { BookMarked } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback, useEffect, useState } from 'react';
import { CollectionCard } from '@/components/cards/collection-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { clientLogger } from '@/lib/logger/client-logger';
import { useCollectionStore } from '@/store/entities/collection';
import type { CollectionWithStats } from '@/types/entities/collection';
import type { ViewProps } from '../types';
import { useCreateCollection } from '@/lib/api/collections';
import { useToast } from '@/components/ui/use-toast';

const viewLogger = clientLogger.withContext('CollectionsView');

const MemoizedCollectionCard = memo(CollectionCard);

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
		const { toast } = useToast();
		if (newCollectionName.trim() === '') {
			toast({
				title: '❌ Error',
				description: 'El nombre de la colección no puede estar vacío.',
				variant: 'destructive',
			});
			return;
		}
		createCollection({ name: newCollectionName, description: newCollectionDescription });
		setNewCollectionName('');
		setNewCollectionDescription('');
		setShowForm(false);
	}, [newCollectionName, newCollectionDescription, createCollection]);

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

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<h2 className="text-xl font-bold mb-4">Vista de Colecciones</h2>

				<Button onClick={() => setShowForm(!showForm)} className="mb-4">
					{showForm ? 'Cancelar' : 'Crear Colección'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">Nueva Colección</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="collectionName">Nombre</Label>
							<Input
								id="collectionName"
								value={newCollectionName}
								onChange={(e) => setNewCollectionName(e.target.value)}
								placeholder="Nombre de la colección"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="collectionDescription">Descripción</Label>
							<Textarea
								id="collectionDescription"
								value={newCollectionDescription}
								onChange={(e) => setNewCollectionDescription(e.target.value)}
								placeholder="Descripción de la colección (opcional)"
							/>
						</div>
						<Button onClick={handleCreateCollection}>Guardar Colección</Button>
					</div>
				)}

				{collections.length === 0 && !isLoading && !showForm ? (
					<EmptyState
						icon={BookMarked}
						title="No hay colecciones creadas"
						description="Crea una colección para organizar tus imágenes de forma temática."
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{collections.map((collection, index) => (
							<motion.div
								key={collection.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
							>
								<MemoizedCollectionCard collection={collection} onClick={() => handleCollectionClick(collection)} />
							</motion.div>
						))}
					</div>
				)}
			</div>
		</ScrollArea>
	);
}
