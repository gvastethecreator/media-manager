import { Album as AlbumIcon, Edit, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useMemo } from 'react';
import { AlbumCard } from '@/components/cards/album-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type { AlbumWithStats } from '@/types/entities/album';

interface AlbumsContentViewProps {
	albums: AlbumWithStats[];
	isLoading: boolean;
	error: string | null;
	showForm: boolean;
	editingAlbum: AlbumWithStats | null;
	albumName: string;
	albumDescription: string;
	setShowForm: (show: boolean) => void;
	setEditingAlbum: (album: AlbumWithStats | null) => void;
	setAlbumName: (name: string) => void;
	setAlbumDescription: (description: string) => void;
	handleAlbumClick: (album: AlbumWithStats) => void;
	handleEditAlbum: (album: AlbumWithStats) => void;
	handleDeleteAlbum: (albumId: string) => void;
	handleSubmitForm: () => void;
	className?: string;
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
						itemCount: album.stats?.imageCount || 0,
						imageCount: album.stats?.imageCount || 0,
						videoCount: album.stats?.videoCount || 0,
						lastModified: album.updatedAt
					}
				}} 
				onClick={onAlbumClick} 
				className="h-full"
			/>
			<div className="absolute top-2 right-2 flex gap-1">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={(e) => {
						e.stopPropagation();
						onEdit(album);
					}}
				>
					<Edit className="h-4 w-4" />
				</Button>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-destructive"
							onClick={(e) => e.stopPropagation()}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
							<AlertDialogDescription>
								Esta acción eliminará permanentemente el álbum "{album.name}".
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancelar</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => onDelete(album.id)}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								Eliminar
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
			<div className="flex items-center justify-center h-full">
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
				<h2 className="text-xl font-bold mb-4">Vista de Álbumes</h2>

				<Button
					onClick={() => {
						setShowForm(!showForm);
						setEditingAlbum(null);
						setAlbumName('');
						setAlbumDescription('');
					}}
					className="mb-4"
				>
					{showForm ? 'Cancelar' : 'Crear Álbum'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">{editingAlbum ? 'Editar Álbum' : 'Nuevo Álbum'}</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="albumName">Nombre</Label>
							<Input
								id="albumName"
								value={albumName}
								onChange={(e) => setAlbumName(e.target.value)}
								placeholder="Nombre del álbum"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="albumDescription">Descripción</Label>
							<Textarea
								id="albumDescription"
								value={albumDescription}
								onChange={(e) => setAlbumDescription(e.target.value)}
								placeholder="Descripción del álbum (opcional)"
							/>
						</div>
						<Button onClick={handleSubmitForm}>{editingAlbum ? 'Guardar Cambios' : 'Guardar Álbum'}</Button>
					</div>
				)}

				{(!albums || albums.length === 0) && !isLoading && !showForm ? (
					<EmptyState
						icon={AlbumIcon}
						title="No hay álbumes creados"
						description="Crea un álbum para organizar tus imágenes."
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{albums?.map((album, index) => {
							const onAlbumClick = () => handleAlbumClick(album);
							return (
								<motion.div
									key={album.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className="perspective-1000"
								>
									<MemoizedAlbumCard
										album={album}
										onAlbumClick={onAlbumClick}
										onEdit={handleEditAlbum}
										onDelete={handleDeleteAlbum}
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
