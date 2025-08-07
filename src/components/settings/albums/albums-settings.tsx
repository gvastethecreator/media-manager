import { Album as AlbumIcon, Info, Loader2, PlusCircle, Trash } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlbums, useDeleteAlbum } from '@/lib/api/albums';
import { toastService } from '@/lib/ui/toast';
import { formatFileSize } from '@/lib/utils/format.utils';
import type { AlbumWithStats } from '@/types/entities/album';
import { CreateAlbumForm } from './create-album-form';

// Agregar tipo para manejar el onClick
type ReactEventHandler = (e: React.MouseEvent<HTMLButtonElement>) => void;

export function AlbumsSettings() {
	const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithStats | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [previewData, setPreviewData] = useState<any>(null);

	// Usar React Query hooks en lugar de server actions
	const { data: albumsResponse, isLoading, error, refetch: loadAlbums } = useAlbums();
	const albums = albumsResponse?.data || [];

	const deleteAlbumMutation = useDeleteAlbum();

	// Calcular estadísticas generales
	const stats = {
		totalAlbums: albums.length,
		totalImages: albums.reduce((acc: number, album: AlbumWithStats) => acc + (album.stats.imageCount || 0), 0),
		totalSize: 0, // No hay información de tamaño en el schema
		emptyAlbums: albums.filter((album: AlbumWithStats) => album.stats.imageCount === 0).length,
	};

	// Manejar eliminación de álbum
	const handleDeleteAlbum = useCallback(
		async (id: string) => {
			try {
				await deleteAlbumMutation.mutateAsync(id);
				setSelectedAlbum(null);
				setIsEditing(false);
				toastService.success('Álbum eliminado');
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				toastService.error('Error al eliminar el álbum', {
					description: errorMessage,
				});
			}
		},
		[deleteAlbumMutation]
	);

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
	const handleAlbumCreated = useCallback((_newAlbum: AlbumWithStats) => {
		// React Query actualizará automáticamente la cache
		toastService.success('Álbum creado');
	}, []);

	// Manejar actualización exitosa
	const handleAlbumUpdated = useCallback((_updatedAlbum: AlbumWithStats) => {
		// React Query actualizará automáticamente la cache
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
			<Card className="rounded-sm border-none bg-muted/30">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<p className="text-muted-foreground text-sm">Cargando álbumes...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="rounded-sm border-none bg-muted/30">
				<CardContent>
					<EmptyState
						actions={<Button onClick={() => loadAlbums()}>Intentar de nuevo</Button>}
						description={error instanceof Error ? error.message : 'Error desconocido'}
						icon={Info}
						title="Error al cargar álbumes"
					/>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-12 gap-2">
			{/* Panel izquierdo: Lista de álbumes */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="flex h-[calc(100vh-12rem)] flex-col rounded-sm border-none bg-muted/30">
					<CardHeader className="space-y-0.5 px-2 py-1.5">
						<div className="flex items-center justify-between">
							<CardTitle className="text-xs">Álbumes ({albums.length})</CardTitle>
							<Button
								className="h-5 w-5 p-0"
								onClick={() => {
									setSelectedAlbum(null);
									setIsEditing(false);
								}}
								size="sm"
								variant="ghost"
							>
								<PlusCircle className="h-3 w-3" />
							</Button>
						</div>
						<div className="flex gap-1 text-[10px] text-muted-foreground">
							<span>{stats.totalImages} imágenes</span>
							<span>•</span>
							<span>{formatFileSize(stats.totalSize)}</span>
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full px-2 pb-2">
							{albums.length === 0 ? (
								<EmptyState
									className="py-6"
									description="Crea tu primer álbum"
									icon={AlbumIcon}
									title="No hay álbumes"
								/>
							) : (
								<div className="space-y-0.5">
									{albums.map((album) => (
										<div
											className={`group/item relative flex w-full items-center gap-1.5 rounded-sm p-1 transition-colors hover:bg-muted/50 ${selectedAlbum?.id === album.id ? 'bg-muted' : ''}`}
											key={album.id}
										>
											<button
												aria-pressed={selectedAlbum?.id === album.id}
												className="flex w-full cursor-pointer items-center gap-1.5 text-left"
												onClick={() => handleEditAlbum(album)}
												type="button"
											>
												<span className="text-sm">{album.emoji}</span>
												<div className="min-w-0 flex-1">
													<h4 className="truncate font-medium text-[11px]">{album.name}</h4>
													<div className="flex items-center gap-1 text-[9px] text-muted-foreground">
														<span>{album.stats.imageCount || 0} img</span>
														{album.category && (
															<>
																<span>•</span>
																<span className="max-w-[60px] truncate">{album.category}</span>
															</>
														)}
													</div>
												</div>
											</button>
											<Button
												className="h-5 w-5 p-0 text-destructive opacity-0 hover:text-destructive group-hover/item:opacity-100"
												disabled={deleteAlbumMutation.isPending}
												onClick={(e) => _handleDeleteButtonClick(e, album.id)}
												size="sm"
												variant="ghost"
											>
												<Trash className="h-3 w-3" />
											</Button>
										</div>
									))}
								</div>
							)}
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			{/* Panel derecho: Formulario de creación/edición */}
			<div className="col-span-12 md:col-span-7 lg:col-span-8">
				<Card className="h-[calc(100vh-12rem)] rounded-sm border-none bg-muted/30">
					<CardHeader className="space-y-0.5 px-2 py-1.5">
						<CardTitle className="text-xs">
							{selectedAlbum ? (isEditing ? 'Editar álbum' : 'Vista previa') : 'Crear álbum'}
						</CardTitle>
						<CardDescription className="text-[10px]">
							{selectedAlbum
								? `${selectedAlbum.stats.imageCount || 0} imágenes asociadas`
								: 'Completa los campos para crear un nuevo álbum'}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex-1 p-2">
						<CreateAlbumForm
							album={selectedAlbum}
							isEditing={isEditing}
							onCancel={handleReset}
							onPreview={handlePreview}
							onSubmit={selectedAlbum ? handleAlbumUpdated : handleAlbumCreated}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
