import { BookMarked } from 'lucide-react';
import { memo } from 'react';
import { CollectionCard } from '@/components/cards/collection-card/collection-card';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type { CollectionWithStats } from '@/types/entities/collection';

interface CollectionsContentViewProps {
	className?: string;
	collections: CollectionWithStats[];
	error: string | null;
	handleCollectionClick: (collection: CollectionWithStats) => void;
	handleCreateCollection: () => void;
	isLoading: boolean;
	newCollectionDescription: string;
	newCollectionName: string;
	setNewCollectionDescription: (description: string) => void;
	setNewCollectionName: (name: string) => void;
	setShowForm: (show: boolean) => void;
	showForm: boolean;
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
				<h2 className="mb-4 font-bold text-xl">Collections</h2>

				<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
					{showForm ? 'Cancel' : 'Create Collection'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">New Collection</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="collectionName">Name</Label>
							<Input
								id="collectionName"
								onChange={(e) => setNewCollectionName(e.target.value)}
								placeholder="Collection name"
								value={newCollectionName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="collectionDescription">Description</Label>
							<Textarea
								id="collectionDescription"
								onChange={(e) => setNewCollectionDescription(e.target.value)}
								placeholder="Collection description (optional)"
								value={newCollectionDescription}
							/>
						</div>
						<Button onClick={handleCreateCollection}>Save Collection</Button>
					</div>
				)}

				{(!collections || collections.length === 0) && !isLoading && !showForm ? (
					<EmptyState
						description="Create a collection to organize related images."
						icon={BookMarked}
						title="No collections yet"
					/>
				) : (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
