import { BookMarked } from 'lucide-react';
import { memo } from 'react';
import { CollectionCard } from '@/components/cards/collection-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
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
	className?: string;
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
	className,
}) => {
	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && (!collections || collections.length === 0)) {
		return <LoadingScreen />;
	}

	return (
		<ScrollArea className={className || 'h-full'}>
			<div className="container mx-auto p-6">
				<h2 className="mb-4 font-bold text-xl">Vista de Colecciones</h2>

				<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
					{showForm ? 'Cancelar' : 'Crear Colección'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">Nueva Colección</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="collectionName">Nombre</Label>
							<Input
								id="collectionName"
								onChange={(e) => setNewCollectionName(e.target.value)}
								placeholder="Nombre de la colección"
								value={newCollectionName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="collectionDescription">Descripción</Label>
							<Textarea
								id="collectionDescription"
								onChange={(e) => setNewCollectionDescription(e.target.value)}
								placeholder="Descripción de la colección (opcional)"
								value={newCollectionDescription}
							/>
						</div>
						<Button onClick={handleCreateCollection}>Guardar Colección</Button>
					</div>
				)}

				{(!collections || collections.length === 0) && !isLoading && !showForm ? (
					<EmptyState
						description="Crea una colección para organizar tus imágenes de forma temática."
						icon={BookMarked}
						title="No hay colecciones creadas"
					/>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{collections?.map((collection, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 20 }}
								key={collection.id}
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
