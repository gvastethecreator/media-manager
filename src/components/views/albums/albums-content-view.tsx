import { Album as AlbumIcon, Edit, Trash2 } from 'lucide-react';
import React from 'react';
import { AlbumCard } from '@/components/cards/album-card/album-card';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type { AlbumWithStats } from '@/types/entities/album';

interface AlbumsContentViewProps {
	albumDescription: string;
	albumName: string;
	albums: AlbumWithStats[];
	className?: string;
	editingAlbum: AlbumWithStats | null;
	error: string | null;
	handleAlbumClick: (album: AlbumWithStats) => void;
	handleDeleteAlbum: (albumId: string) => void;
	handleEditAlbum: (album: AlbumWithStats) => void;
	handleSubmitForm: () => void;
	isLoading: boolean;
	setAlbumDescription: (description: string) => void;
	setAlbumName: (name: string) => void;
	setEditingAlbum: (album: AlbumWithStats | null) => void;
	setShowForm: (show: boolean) => void;
	showForm: boolean;
}

const MemoizedAlbumCard = React.memo(
	({
		album,
		onAlbumClick,
		onEdit,
		onDelete,
	}: {
		album: AlbumWithStats;
		onAlbumClick: () => void;
		onEdit: (album: AlbumWithStats) => void;
		onDelete: (albumId: string) => void;
	}) => (
		<div className="relative h-full">
			<AlbumCard
				album={{
					...album,
					metadata: {
						itemCount: (album.stats?.imageCount || 0) + (album.stats?.videoCount || 0),
						imageCount: album.stats?.imageCount || 0,
						videoCount: album.stats?.videoCount || 0,
						coverImageUrl: album.featuredImage || undefined,
						thumbnailUrls: [],
						lastModified: album.updatedAt,
					},
				}}
				className="h-full"
				onClick={onAlbumClick}
			/>
			<div className="absolute top-2 right-2 flex gap-1">
				<Button
					className="h-7 w-7"
					onClick={(e) => {
						e.stopPropagation();
						onEdit(album);
					}}
					size="icon"
					variant="ghost"
				>
					<Edit className="h-4 w-4" />
				</Button>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							className="h-7 w-7 text-destructive"
							onClick={(e) => e.stopPropagation()}
							size="icon"
							variant="ghost"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete this album?</AlertDialogTitle>
							<AlertDialogDescription>
								This will permanently delete the album "{album.name}".
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								onClick={() => onDelete(album.id)}
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	),
	(prevProps, nextProps) =>
		prevProps.album.id === nextProps.album.id &&
		prevProps.album.name === nextProps.album.name &&
		prevProps.album.updatedAt === nextProps.album.updatedAt
);
MemoizedAlbumCard.displayName = 'MemoizedAlbumCard';

const AlbumsContentView: React.FC<AlbumsContentViewProps> = ({
	albums,
	isLoading,
	error,
	showForm,
	editingAlbum,
	albumName,
	albumDescription,
	setShowForm,
	setEditingAlbum,
	setAlbumName,
	setAlbumDescription,
	handleAlbumClick,
	handleEditAlbum,
	handleDeleteAlbum,
	handleSubmitForm,
	className,
}) => {
	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && (!albums || albums.length === 0)) {
		return <LoadingScreen />;
	}

	return (
		<ScrollArea className={className || 'h-full'}>
			<div className="container mx-auto p-6">
				<h2 className="mb-4 font-bold text-xl">Albums</h2>

				<Button
					className="mb-4"
					onClick={() => {
						setShowForm(!showForm);
						setEditingAlbum(null);
						setAlbumName('');
						setAlbumDescription('');
					}}
				>
					{showForm ? 'Cancel' : 'Create Album'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">{editingAlbum ? 'Edit Album' : 'New Album'}</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="albumName">Name</Label>
							<Input
								id="albumName"
								onChange={(e) => setAlbumName(e.target.value)}
								placeholder="Album name"
								value={albumName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="albumDescription">Description</Label>
							<Textarea
								id="albumDescription"
								onChange={(e) => setAlbumDescription(e.target.value)}
								placeholder="Album description (optional)"
								value={albumDescription}
							/>
						</div>
						<Button onClick={handleSubmitForm}>{editingAlbum ? 'Save Changes' : 'Save Album'}</Button>
					</div>
				)}

				{(!albums || albums.length === 0) && !isLoading && !showForm ? (
					<EmptyState
						description="Create an album to organize your images."
						icon={AlbumIcon}
						title="No albums yet"
					/>
				) : (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{albums?.map((album, index) => {
							const onAlbumClick = () => handleAlbumClick(album);
							return (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									className="perspective-1000"
									initial={{ opacity: 0, y: 20 }}
									key={album.id}
									transition={{ delay: index * 0.1 }}
								>
									<MemoizedAlbumCard
										album={album}
										onAlbumClick={onAlbumClick}
										onDelete={handleDeleteAlbum}
										onEdit={handleEditAlbum}
									/>
								</motion.div>
							);
						})}
					</div>
				)}
			</div>
		</ScrollArea>
	);
};

export default AlbumsContentView;
