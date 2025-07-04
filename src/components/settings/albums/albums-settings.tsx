import { Album as AlbumIcon, Info, Loader2, PlusCircle, Trash } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlbums, useDeleteAlbum } from '@/lib/api/albums';
import { formatFileSize } from '@/lib/utils/format.utils';
import toastService from '@/lib/ui/toast';
import type { AlbumWithStats } from '@/types/entities/album';
import { CreateAlbumForm } from './create-album-form';

// Agregar tipo para manejar el onClick
type ReactEventHandler = (e: React.MouseEvent<HTMLButtonElement>) => void;

export function AlbumsSettings() {
	const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithStats | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [previewData, setPreviewData] = useState<any>(null);

	// Usar React Query hooks en lugar de server actions
	const { data: albums = [], isLoading, error, refetch: loadAlbums } = useAlbums();

	const deleteAlbumMutation = useDeleteAlbum();

	// Calcular estadísticas generales
	const stats = {
		totalAlbums: albums.length,
		totalImages: albums.reduce((acc, album) => acc + (album.stats.imageCount || 0), 0),
		totalSize: 0, // No hay información de tamaño en el schema
		emptyAlbums: albums.filter((album) => album.stats.imageCount === 0).length,
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
	const handleAlbumCreated = useCallback((newAlbum: AlbumWithStats) => {
		// React Query actualizará automáticamente la cache
		toastService.success('Álbum creado');
	}, []);

	// Manejar actualización exitosa
	const handleAlbumUpdated = useCallback((updatedAlbum: AlbumWithStats) => {
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
						description={error instanceof Error ? error.message : 'Error desconocido'}
						actions={<Button onClick={() => loadAlbums()}>Intentar de nuevo</Button>}
					/>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-12 gap-2">
			{/* Panel izquierdo: Lista de álbumes */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-12rem)] flex flex-col">
					<CardHeader className="space-y-0.5 py-1.5 px-2">
						<div className="flex items-center justify-between">
							<CardTitle className="text-xs">Álbumes ({albums.length})</CardTitle>
							<Button
								onClick={() => {
									setSelectedAlbum(null);
									setIsEditing(false);
								}}
								size="sm"
								variant="ghost"
								className="h-5 w-5 p-0"
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
									icon={AlbumIcon}
									title="No hay álbumes"
									description="Crea tu primer álbum"
									className="py-6"
								/>
							) : (
								<div className="space-y-0.5">
									{albums.map((album) => (
										<div
											key={album.id}
											className={`relative group/item flex items-center gap-1.5 p-1 rounded-sm transition-colors hover:bg-muted/50 w-full ${selectedAlbum?.id === album.id ? 'bg-muted' : ''}`}
										>
											<button
												className="flex items-center gap-1.5 w-full text-left cursor-pointer"
												onClick={() => handleEditAlbum(album)}
												aria-pressed={selectedAlbum?.id === album.id}
												type="button"
											>
												<span className="text-sm">{album.emoji}</span>
												<div className="flex-1 min-w-0">
													<h4 className="text-[11px] font-medium truncate">{album.name}</h4>
													<div className="flex items-center gap-1 text-[9px] text-muted-foreground">
														<span>{album.stats.imageCount || 0} img</span>
														{album.category && (
															<>
																<span>•</span>
																<span className="truncate max-w-[60px]">{album.category}</span>
															</>
														)}
													</div>
												</div>
											</button>
											<Button
												variant="ghost"
												size="sm"
												onClick={(e) => _handleDeleteButtonClick(e, album.id)}
												disabled={deleteAlbumMutation.isPending}
												className="opacity-0 group-hover/item:opacity-100 h-5 w-5 p-0 text-destructive hover:text-destructive"
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
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-12rem)]">
					<CardHeader className="space-y-0.5 py-1.5 px-2">
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
							onSubmit={selectedAlbum ? handleAlbumUpdated : handleAlbumCreated}
							onCancel={handleReset}
							onPreview={handlePreview}
							isEditing={isEditing}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
