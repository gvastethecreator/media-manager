'use client';

import { deleteAlbum, getAlbums } from '@/app/actions/albums/album.actions';
import { AlbumCard } from '@/components/cards/album-card/album-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import toastService from '@/services/toast.service';
import type { Album } from '@/types/entities/album';
import type { AlbumWithStats } from '@/types/entities/album/extended';
import { formatBytes } from '@/utils/file/helpers';
import { Album as AlbumIcon, Info, Loader2, PlusCircle, Save, Trash } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CreateAlbumForm } from './create-album-form';

// Extender el tipo Album para añadir las propiedades que faltan
interface AlbumWithUI extends Album {
	emoji: string;
	color: string;
}

// Agregar tipo para manejar el onClick
type ReactEventHandler = (e: React.MouseEvent<HTMLButtonElement>) => void;

export function AlbumsSettings() {
	const [albums, setAlbums] = useState<AlbumWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [previewData, setPreviewData] = useState<any>(null);

	// Cargar álbumes al montar el componente
	useEffect(() => {
		const loadAlbums = async () => {
			try {
				setIsLoading(true);
				const data = await getAlbums();
				// Añadir type assertion para evitar error
				setAlbums(data as unknown as AlbumWithStats[]);
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
		totalImages: albums.reduce((acc, album) => acc + (album._count?.images || 0), 0),
		totalSize: albums.reduce((acc, album) => acc + (album.totalSize || 0), 0),
		emptyAlbums: albums.filter((album) => (album._count?.images || 0) === 0).length,
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
	const handleEditAlbum = useCallback((album: Album) => {
		setSelectedAlbum(album);
		setIsEditing(true);
	}, []);

	// Manejar la eliminación desde el botón con detención de propagación de eventos
	const handleDeleteButtonClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>, id: string) => {
			e.stopPropagation();
			handleDeleteAlbum(id);
		},
		[handleDeleteAlbum]
	);

	// Manejar creación exitosa
	const handleAlbumCreated = useCallback((newAlbum: Album) => {
		setAlbums((prev) => [...prev, newAlbum as unknown as AlbumWithStats]);
		toastService.success('Álbum creado');
	}, []);

	// Manejar actualización exitosa
	const handleAlbumUpdated = useCallback((updatedAlbum: Album) => {
		setAlbums((prev) =>
			prev.map((album) => (album.id === updatedAlbum.id ? ({ ...album, ...updatedAlbum } as AlbumWithStats) : album))
		);
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
							<span>{formatBytes(stats.totalSize)}</span>
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
											onClick={() => handleEditAlbum(album as unknown as Album)}
											aria-pressed={selectedAlbum?.id === album.id}
											type="button"
										>
											<span className="text-base">{album.emoji}</span>
											<div className="flex-1 min-w-0">
												<h4 className="text-xs font-medium truncate">{album.name}</h4>
												<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
													<span>{album._count?.images || 0} imágenes</span>
													{album.category && (
														<>
															<span>•</span>
															<span>{album.category}</span>
														</>
													)}
												</div>
											</div>
											<Button
												variant="ghost"
												size="icon"
												type="button"
												className="h-5 w-5 opacity-0 hover:opacity-100 group-hover:opacity-100"
												onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
													e.stopPropagation();
													handleDeleteAlbum(album.id);
												}}
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

			{/* Panel derecho: Formulario y Preview */}
			<div className="col-span-12 md:col-span-7 lg:col-span-8">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="py-2 px-3">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-sm">{isEditing ? 'Editar Álbum' : 'Nuevo Álbum'}</CardTitle>
								<CardDescription className="text-xs">
									{isEditing
										? 'Modifica los detalles del álbum seleccionado'
										: 'Completa el formulario para crear un nuevo álbum'}
								</CardDescription>
							</div>
							<div className="flex gap-1">
								{isEditing && selectedAlbum && (
									<>
										<Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleReset}>
											Cancelar
										</Button>
										<Button
											variant="destructive"
											size="sm"
											className="h-7 text-xs"
											onClick={() => handleDeleteAlbum(selectedAlbum.id)}
										>
											<Trash className="h-3 w-3 mr-1" />
											Eliminar
										</Button>
									</>
								)}
								<Button type="submit" size="sm" className="h-7 text-xs" form="album-form">
									<Save className="h-3 w-3 mr-1" />
									{isEditing ? 'Guardar' : 'Crear'}
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-3 flex-1 overflow-hidden">
						<ScrollArea className="h-full pr-3">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
								<div className="space-y-3">
									<CreateAlbumForm
										album={selectedAlbum}
										isEditing={isEditing}
										onCreated={handleAlbumCreated}
										onUpdated={handleAlbumUpdated}
										onCancel={handleReset}
										onPreview={handlePreview}
									/>
								</div>
								<div className="hidden lg:flex flex-col items-center justify-start">
									<h3 className="text-xs font-medium mb-2">Vista Previa</h3>
									<div className="w-[180px] transition-all duration-300">
										{previewData ? (
											<AlbumCard
												album={{
													id: selectedAlbum?.id || 'preview',
													name: previewData.name || 'Album Preview',
													emoji: previewData.emoji || '📔',
													color: previewData.color || '#3b82f6',
													description: previewData.description || '',
													category: previewData.category || null,
													createdAt: new Date(),
													updatedAt: new Date(),
													shortcut: '',
													type: 'default',
													privacyLevel: 'private',
													viewMode: 'grid',
													filters: 'empty_array',
													version: 1,
												}}
											/>
										) : selectedAlbum ? (
											<AlbumCard album={selectedAlbum as unknown as typeof AlbumCard.prototype.props.album} />
										) : (
											<div className="flex flex-col items-center justify-center h-[260px] bg-muted/50 rounded-lg border border-dashed">
												<AlbumIcon className="h-7 w-7 text-muted-foreground/50" />
												<p className="text-[10px] text-muted-foreground mt-2">Vista previa</p>
											</div>
										)}
									</div>
								</div>
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
