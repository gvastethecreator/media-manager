import { BookMarked } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback } from 'react';
import { CollectionCard } from '@/components/cards/collection-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type { CollectionWithStats } from '@/types/entities/collection';

interface CollectionsContentViewProps {
	collections: CollectionWithStats[];
	isLoading: boolean;
	error: string | null;
	showForm: boolean;
	newCollectionName: string;
	newCollectionDescription: string;
	setShowForm: (show: boolean) => void;
	setNewCollectionName: (name: string) => void;
	setNewCollectionDescription: (description: string) => void;
	handleCollectionClick: (collection: CollectionWithStats) => void;
	handleCreateCollection: () => void;
}

const MemoizedCollectionCard = memo(CollectionCard);

const CollectionsContentView: React.FC<CollectionsContentViewProps> = ({
	collections,
	isLoading,
	error,
	showForm,
	newCollectionName,
	newCollectionDescription,
	setShowForm,
	setNewCollectionName,
	setNewCollectionDescription,
	handleCollectionClick,
	handleCreateCollection,
}) => {
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
};

export default CollectionsContentView;
