'use client';

import { deleteAlbum, getAlbums } from '@/app/actions/albums/album.actions';
import { AlbumCard } from '@/components/cards/album-card/album-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatFileSize } from '@/lib/utils/format.utils';
import { toastService } from '@/services/toast';
import type { AlbumWithStats } from '@/types/entities/album';
import { Album as AlbumIcon, Info, Loader2, PlusCircle, Trash } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CreateAlbumForm } from './create-album-form';

// Agregar tipo para manejar el onClick
type ReactEventHandler = (e: React.MouseEvent<HTMLButtonElement>) => void;

export function AlbumsSettings() {
	const [albums, setAlbums] = useState<AlbumWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithStats | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [previewData, setPreviewData] = useState<any>(null);

	// Cargar álbumes al montar el componente
	useEffect(() => {
		const loadAlbums = async () => {
			try {
				setIsLoading(true);
				const data = await getAlbums();
				setAlbums(data);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				setError(errorMessage);
				toastService.error('Error al cargar los álbumes', {
					description: errorMessage,
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadAlbums();
	}, []);

	// Calcular estadísticas generales
	const stats = {
		totalAlbums: albums.length,
		totalImages: albums.reduce((acc, album) => acc + (album.stats.imageCount || 0), 0),
		totalSize: 0, // No hay información de tamaño en el schema
		emptyAlbums: albums.filter((album) => album.stats.imageCount === 0).length,
	};

	// Manejar eliminación de álbum
	const handleDeleteAlbum = useCallback(async (id: string) => {
		try {
			await deleteAlbum(id);
			setAlbums((prev) => prev.filter((album) => album.id !== id));
			setSelectedAlbum(null);
			setIsEditing(false);
			toastService.success('Álbum eliminado');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al eliminar el álbum', {
				description: errorMessage,
			});
		}
	}, []);

	// Manejar edición de álbum
	const handleEditAlbum = useCallback((album: AlbumWithStats) => {
		setSelectedAlbum(album);
		setIsEditing(true);
	}, []);

	// Manejar la eliminación desde el botón con detención de propagación de eventos
	const _handleDeleteButtonClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>, id: string) => {
			e.stopPropagation();
			handleDeleteAlbum(id);
		},
		[handleDeleteAlbum]
	);

	// Manejar creación exitosa
	const handleAlbumCreated = useCallback((newAlbum: AlbumWithStats) => {
		setAlbums((prev) => [...prev, newAlbum]);
		toastService.success('Álbum creado');
	}, []);

	// Manejar actualización exitosa
	const handleAlbumUpdated = useCallback((updatedAlbum: AlbumWithStats) => {
		setAlbums((prev) => prev.map((album) => (album.id === updatedAlbum.id ? { ...album, ...updatedAlbum } : album)));
		toastService.success('Álbum actualizado');
	}, []);

	// Resetear formulario
	const handleReset = useCallback(() => {
		setIsEditing(false);
		setSelectedAlbum(null);
	}, []);

	// Manejar la previsualización en tiempo real
	const handlePreview = useCallback((data: any) => {
		setPreviewData(data);
	}, []);

	// Contenido condicional basado en estado de carga
	if (isLoading) {
		return (
			<Card className="rounded-sm bg-muted/30 border-none">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<p className="text-sm text-muted-foreground">Cargando álbumes...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="rounded-sm bg-muted/30 border-none">
				<CardContent>
					<EmptyState
						icon={Info}
						title="Error al cargar álbumes"
						description={error}
						actions={<Button onClick={() => window.location.reload()}>Intentar de nuevo</Button>}
					/>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-12 gap-3">
			{/* Panel izquierdo: Lista de álbumes */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="space-y-1 py-2 px-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm">Álbumes ({albums.length})</CardTitle>
							<Button
								onClick={() => {
									setSelectedAlbum(null);
									setIsEditing(false);
								}}
								size="sm"
								variant="ghost"
								className="h-6 w-6 p-0"
							>
								<PlusCircle className="h-3.5 w-3.5" />
							</Button>
						</div>
						<div className="flex gap-2 text-xs text-muted-foreground">
							<span>{stats.totalImages} imágenes</span>
							<span>•</span>
							<span>{formatFileSize(stats.totalSize)}</span>
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full px-3 pb-3">
							{albums.length === 0 ? (
								<EmptyState
									icon={AlbumIcon}
									title="No hay álbumes"
									description="Crea tu primer álbum"
									className="py-6"
								/>
							) : (
								<div className="space-y-1">
									{albums.map((album) => (
										<button
											key={album.id}
											className={`flex items-center gap-2 p-1.5 rounded-md transition-colors cursor-pointer hover:bg-muted/50 w-full text-left ${selectedAlbum?.id === album.id ? 'bg-muted' : ''}`}
											onClick={() => handleEditAlbum(album)}
											aria-pressed={selectedAlbum?.id === album.id}
											type="button"
										>
											<span className="text-base">{album.emoji}</span>
											<div className="flex-1 min-w-0">
												<h4 className="text-xs font-medium truncate">{album.name}</h4>
												<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
													<span>{album.stats.imageCount || 0} imágenes</span>
													{album.category && (
														<>
															<span>•</span>
															<span>{album.category}</span>
														</>
													)}
												</div>
											</div>
											<Button
												size="sm"
												variant="ghost"
												className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
												onClick={(e) => _handleDeleteButtonClick(e, album.id)}
											>
												<Trash className="h-3 w-3" />
											</Button>
										</button>
									))}
								</div>
							)}
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			{/* Panel derecho: Formulario */}
			<div className="col-span-12 md:col-span-7 lg:col-span-8">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)]">
					<CardHeader className="space-y-1 py-2 px-3">
						<CardTitle className="text-sm">{isEditing ? 'Editar álbum' : 'Crear álbum'}</CardTitle>
						<CardDescription className="text-xs">
							{isEditing
								? 'Modifica los detalles del álbum seleccionado'
								: 'Crea un nuevo álbum para organizar tus imágenes'}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex-1 p-3">
						<CreateAlbumForm
							album={selectedAlbum}
							isEditing={isEditing}
							onCreated={handleAlbumCreated}
							onUpdated={handleAlbumUpdated}
							onReset={handleReset}
							onPreview={handlePreview}
						/>
					</CardContent>
				</Card>
			</div>

			{/* Panel de vista previa (opcional) */}
			{previewData && (
				<div className="col-span-12">
					<Card className="rounded-sm bg-muted/30 border-none">
						<CardHeader className="space-y-1 py-2 px-3">
							<CardTitle className="text-sm">Vista previa</CardTitle>
						</CardHeader>
						<CardContent className="p-3">
							<AlbumCard
								album={{
									...previewData,
									id: 'preview',
									createdAt: new Date(),
									updatedAt: new Date(),
									userId: null,
									sortBy: previewData.sortBy || null,
									filters: previewData.filters || null,
									stats: {
										imageCount: 0,
										videoCount: 0,
										collectionCount: 0,
										tagCount: 0,
										characterCount: 0,
										placeCount: 0,
										worldItemCount: 0,
										conceptCount: 0,
										promptCount: 0,
										noteCount: 0,
										wildcardCount: 0,
										propertyCount: 0,
										groupCount: 0,
									},
								}}
								className="max-w-sm"
							/>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
