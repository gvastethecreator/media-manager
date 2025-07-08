import { Album as AlbumIcon, Edit, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlbumCard } from '@/components/cards/album-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientLogger } from '@/lib/logger/client-logger';
import { useAlbumStore } from '@/store/entities/album';
import type { AlbumWithStats } from '@/types/entities/album';
import type { ViewProps } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAlbum, useUpdateAlbum, useDeleteAlbum } from '@/lib/api/albums';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const viewLogger = clientLogger.withContext('AlbumsView');

const MemoizedAlbumCard = React.memo(
	({ album, onAlbumClick, onEdit, onDelete }: { album: AlbumWithStats; onAlbumClick: () => void; onEdit: (album: AlbumWithStats) => void; onDelete: (albumId: string) => void }) => (
		<AlbumCard album={album} onClick={onAlbumClick} className="h-full">
			<div className="absolute top-2 right-2 flex gap-1">
				<Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(album); }}>
					<Edit className="h-4 w-4" />
				</Button>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => e.stopPropagation()}>
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
							<AlertDialogAction onClick={() => onDelete(album.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
								Eliminar
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</AlbumCard>
	),
	(prevProps, nextProps) =>
		prevProps.album.id === nextProps.album.id &&
		prevProps.album.name === nextProps.album.name &&
		prevProps.album.updatedAt === nextProps.album.updatedAt
);
MemoizedAlbumCard.displayName = 'MemoizedAlbumCard';

export function AlbumsView(_props: ViewProps) {
	const albumsRecord = useAlbumStore((s) => s.albums);
	const isLoading = useAlbumStore((s) => s.isLoading);
	const error = useAlbumStore((s) => s.error);
	const loadAlbums = useAlbumStore((s) => s.loadAlbums);
	const getSortedAlbums = useAlbumStore((s) => s.getSortedAlbums);
	const { mutate: createAlbum } = useCreateAlbum();
	const { mutate: updateAlbum } = useUpdateAlbum();
	const { mutate: deleteAlbum } = useDeleteAlbum();

	const [showForm, setShowForm] = useState(false);
	const [editingAlbum, setEditingAlbum] = useState<AlbumWithStats | null>(null);
	const [albumName, setAlbumName] = useState('');
	const [albumDescription, setAlbumDescription] = useState('');

	useEffect(() => {
		if (Object.keys(albumsRecord).length === 0) {
			viewLogger.info('Store de álbumes vacío, cargando desde el servidor...');
			loadAlbums();
		}
	}, [loadAlbums, albumsRecord]);

	const handleAlbumClick = useCallback((album: AlbumWithStats) => {
		viewLogger.info('🖱️ Click en álbum:', album.name);
		// TODO: Lógica de navegación o apertura de visor aquí
	}, []);

	const handleEditAlbum = useCallback((album: AlbumWithStats) => {
		setEditingAlbum(album);
		setAlbumName(album.name);
		setAlbumDescription(album.description || '');
		setShowForm(true);
	}, []);

	const handleDeleteAlbum = useCallback((albumId: string) => {
		deleteAlbum(albumId);
	}, [deleteAlbum]);

	const handleSubmitForm = useCallback(() => {
		if (albumName.trim() === '') {
			toast({
				title: '❌ Error',
				description: 'El nombre del álbum no puede estar vacío.',
				variant: 'destructive',
			});
			return;
		}

		if (editingAlbum) {
			updateAlbum({ id: editingAlbum.id, data: { name: albumName, description: albumDescription } });
		} else {
			createAlbum({ name: albumName, description: albumDescription });
		}
		setAlbumName('');
		setAlbumDescription('');
		setEditingAlbum(null);
		setShowForm(false);
	}, [albumName, albumDescription, editingAlbum, createAlbum, updateAlbum]);

	const sortedAlbums = useMemo(() => {
		return getSortedAlbums();
	}, [getSortedAlbums]);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && Object.keys(albumsRecord).length === 0) {
		return <LoadingScreen />;
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<h2 className="text-xl font-bold mb-4">Vista de Álbumes</h2>

				<Button onClick={() => {
					setShowForm(!showForm);
					setEditingAlbum(null);
					setAlbumName('');
					setAlbumDescription('');
				}} className="mb-4">
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

				{sortedAlbums.length === 0 && !isLoading && !showForm ? (
					<EmptyState
						icon={AlbumIcon}
						title="No hay álbumes creados"
						description="Crea un álbum para organizar tus imágenes."
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{sortedAlbums.map((album, index) => {
							const onAlbumClick = () => handleAlbumClick(album);
							return (							<motion.div
								key={album.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
								className="perspective-1000"
							>
								<MemoizedAlbumCard album={album} onAlbumClick={onAlbumClick} onEdit={handleEditAlbum} onDelete={handleDeleteAlbum} />
							</motion.div>
							);
						})}
					</div>
				)}
			</div>
		</ScrollArea>
	);
}
