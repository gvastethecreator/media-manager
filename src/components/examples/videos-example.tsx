'use client';

import { findVideos, getVideo, toggleVideoFavorite } from '@/app/actions/videos/video.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { useVideoStore } from '@/store/entities/video';
import { formatDuration } from '@/transformers/video';
import { Heart, Play, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * 📹 Componente de ejemplo para demostrar la funcionalidad de videos
 */
export default function VideosExample() {
	// Estados locales para filtros
	const [search, setSearch] = useState('');
	const [folderId, setFolderId] = useState<string | null>(null);
	const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
	const [durationRange, setDurationRange] = useState([0, 3600]); // 0 a 1 hora por defecto
	const [sortBy, setSortBy] = useState('updatedAt');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
	const [loading, setLoading] = useState(true);
	const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

	// Seleccionar videos con filtros desde el store
	const selectVideos = useVideoStore(state => state.selectVideos);
	const selectVideoById = useVideoStore(state => state.selectVideoById);
	const addVideos = useVideoStore(state => state.addVideos);
	const updateVideo = useVideoStore(state => state.updateVideo);

	// Cargar videos al iniciar
	const loadVideos = useCallback(async () => {
		setLoading(true);
		try {
			const result = await findVideos({
				search: search || undefined,
				folderId: folderId || undefined,
				isFavorite: showOnlyFavorites || undefined,
				duration: {
					min: durationRange[0] || undefined,
					max: durationRange[1] || undefined
				}
			});

			if (result.items) {
				addVideos(result.items);
				toast.success(`${result.items.length} videos cargados`);
			}
		} catch (error: any) {
			toast.error('Error al cargar videos', {
				description: error.message || 'Ocurrió un error inesperado'
			});
		} finally {
			setLoading(false);
		}
	}, [search, folderId, showOnlyFavorites, durationRange, addVideos]);

	// Cargar videos al montar el componente
	useEffect(() => {
		loadVideos();
	}, [loadVideos]);

	// Obtener videos filtrados del store
	const filteredVideos = selectVideos({
		withStats: true,
		filters: {
			search: search || undefined,
			folderId: folderId || undefined,
			isFavorite: showOnlyFavorites || undefined,
			duration: {
				min: durationRange[0] || undefined,
				max: durationRange[1] || undefined
			}
		},
		sortBy: sortBy as any,
		sortDirection
	});

	// Obtener video seleccionado
	const selectedVideo = selectedVideoId ? selectVideoById(selectedVideoId, { withStats: true }) : null;

	// Marcar/desmarcar como favorito
	const handleToggleFavorite = async (videoId: string, isFavorite: boolean) => {
		try {
			const result = await toggleVideoFavorite(videoId, !isFavorite);
			if (result) {
				updateVideo(videoId, { isFavorite: !isFavorite });
				toast.success(isFavorite ? 'Eliminado de favoritos' : 'Añadido a favoritos');
			}
		} catch (error: any) {
			toast.error('Error al cambiar favorito', {
				description: error.message || 'Ocurrió un error inesperado'
			});
		}
	};

	// Cargar detalles de un video
	const handleSelectVideo = async (videoId: string) => {
		setSelectedVideoId(videoId);
		try {
			const result = await getVideo(videoId, true);
			if (result) {
				updateVideo(videoId, result);
			}
		} catch (error: any) {
			toast.error('Error al cargar detalles del video', {
				description: error.message || 'Ocurrió un error inesperado'
			});
		}
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-3xl font-bold tracking-tight">Explorador de Videos</h2>
				<Button onClick={loadVideos} variant="outline">
					<RefreshIcon className="w-4 h-4 mr-2" />
					Actualizar
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Filtros</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label htmlFor="searchInput" className="text-sm mb-1 block">Buscar</label>
							<div className="flex">
								<Input
									id="searchInput"
									placeholder="Buscar videos..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="flex-grow"
								/>
								<Button variant="ghost" onClick={() => loadVideos()}>
									<Search className="w-4 h-4" />
								</Button>
							</div>
						</div>

						<div>
							<label htmlFor="sortBy" className="text-sm mb-1 block">Ordenar por</label>
							<div className="flex gap-2">
								<Select
									value={sortBy}
									onValueChange={(value) => setSortBy(value)}
								>
									<SelectTrigger id="sortBy">
										<SelectValue placeholder="Ordenar por" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="name">Nombre</SelectItem>
										<SelectItem value="updatedAt">Última actualización</SelectItem>
										<SelectItem value="createdAt">Fecha de creación</SelectItem>
										<SelectItem value="duration">Duración</SelectItem>
										<SelectItem value="size">Tamaño</SelectItem>
									</SelectContent>
								</Select>

								<Select
									value={sortDirection}
									onValueChange={(value: 'asc' | 'desc') => setSortDirection(value)}
								>
									<SelectTrigger id="sortDirection" className="w-32">
										<SelectValue placeholder="Dirección" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="asc">Ascendente</SelectItem>
										<SelectItem value="desc">Descendente</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div>
							<label htmlFor="durationSlider" className="text-sm mb-1 block">Duración (segundos)</label>
							<Slider
								id="durationSlider"
								defaultValue={[0, 3600]}
								min={0}
								max={7200}
								step={10}
								value={durationRange}
								onValueChange={setDurationRange}
								className="my-5"
							/>
							<div className="flex justify-between text-xs">
								<span>{formatDuration(durationRange[0])}</span>
								<span>{formatDuration(durationRange[1])}</span>
							</div>
						</div>
					</div>

					<div className="flex items-center mt-4">
						<label className="flex items-center space-x-2 cursor-pointer">
							<input
								type="checkbox"
								checked={showOnlyFavorites}
								onChange={() => setShowOnlyFavorites(!showOnlyFavorites)}
								className="rounded"
							/>
							<span>Solo favoritos</span>
						</label>
					</div>
				</CardContent>
				<CardFooter>
					<Button onClick={loadVideos} className="ml-auto">
						Aplicar filtros
					</Button>
				</CardFooter>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
				{loading ? (
					// Esqueletos de carga
					Array.from({ length: 6 }).map((_, index) => (
						<Card key={`video-skeleton-${Date.now()}-${index}`}>
							<CardContent className="p-0">
								<Skeleton className="w-full h-48" />
							</CardContent>
							<CardFooter className="p-4">
								<Skeleton className="w-full h-6" />
							</CardFooter>
						</Card>
					))
				) : filteredVideos.length > 0 ? (
					// Tarjetas de videos
					filteredVideos.map((video) => (
						<Card
							key={video.id}
							onClick={() => handleSelectVideo(video.id)}
							className="overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary"
						>
							<CardContent className="p-0 relative aspect-video bg-muted">
								{video.thumbnailUrl ? (
									<img
										src={video.thumbnailUrl}
										alt={`Miniatura de ${video.name}`}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center" aria-label="Sin miniatura disponible">
										<Play className="w-10 h-10 opacity-40" />
									</div>
								)}

								<div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white">
									<div className="flex justify-between items-center">
										<div>
											{video.stats?.durationFormatted && (
												<span className="text-xs bg-black/60 px-2 py-1 rounded">
													{video.stats.durationFormatted}
												</span>
											)}
										</div>
										<Button
											size="icon"
											variant="ghost"
											className="h-8 w-8 text-white hover:text-primary"
											onClick={(e) => {
												e.stopPropagation();
												handleToggleFavorite(video.id, video.isFavorite);
											}}
										>
											<Heart
												className={`w-5 h-5 ${video.isFavorite ? 'fill-red-500 text-red-500' : ''}`}
											/>
										</Button>
									</div>
								</div>
							</CardContent>
							<CardFooter className="p-4">
								<div className="w-full">
									<h3 className="font-semibold truncate">{video.name}</h3>
									<div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
										<span>{video.stats?.sizeFormatted || ''}</span>
										<span>{video.stats?.resolution || ''}</span>
									</div>
								</div>
							</CardFooter>
						</Card>
					))
				) : (
					// Mensaje cuando no hay videos
					<div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
						<div className="rounded-full bg-muted p-6 mb-4">
							<Search className="w-10 h-10 text-muted-foreground" />
						</div>
						<h3 className="text-xl font-semibold mb-2">No se encontraron videos</h3>
						<p className="text-muted-foreground">
							Prueba con otros filtros o añade nuevos videos
						</p>
					</div>
				)}
			</div>

			{selectedVideo && (
				<Card className="mt-8">
					<CardHeader>
						<CardTitle>{selectedVideo.name}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div className="bg-muted rounded-lg overflow-hidden aspect-video">
								{selectedVideo.thumbnailUrl ? (
									<img
										src={selectedVideo.thumbnailUrl}
										alt={`Miniatura de ${selectedVideo.name}`}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center" aria-label="Sin miniatura disponible">
										<Play className="w-16 h-16 opacity-40" />
									</div>
								)}
							</div>

							<div>
								<h3 className="text-lg font-semibold mb-4">Detalles del video</h3>
								<dl className="space-y-2">
									{selectedVideo.description && (
										<>
											<dt className="text-sm font-medium text-muted-foreground">Descripción</dt>
											<dd className="text-sm">{selectedVideo.description}</dd>
											<Separator className="my-2" />
										</>
									)}

									<div className="grid grid-cols-2 gap-x-4 gap-y-2">
										<div>
											<dt className="text-sm font-medium text-muted-foreground">Duración</dt>
											<dd className="text-sm">{selectedVideo.stats?.durationFormatted || 'N/A'}</dd>
										</div>

										<div>
											<dt className="text-sm font-medium text-muted-foreground">Tamaño</dt>
											<dd className="text-sm">{selectedVideo.stats?.sizeFormatted || 'N/A'}</dd>
										</div>

										<div>
											<dt className="text-sm font-medium text-muted-foreground">Resolución</dt>
											<dd className="text-sm">{selectedVideo.stats?.resolution || 'N/A'}</dd>
										</div>

										<div>
											<dt className="text-sm font-medium text-muted-foreground">Relación de aspecto</dt>
											<dd className="text-sm">{selectedVideo.stats?.aspectRatio || 'N/A'}</dd>
										</div>

										<div>
											<dt className="text-sm font-medium text-muted-foreground">Tasa de bits</dt>
											<dd className="text-sm">{selectedVideo.stats?.bitrate || 'N/A'}</dd>
										</div>

										<div>
											<dt className="text-sm font-medium text-muted-foreground">Fecha de creación</dt>
											<dd className="text-sm">
												{new Date(selectedVideo.createdAt).toLocaleDateString()}
											</dd>
										</div>
									</div>
								</dl>

								<div className="mt-6 flex">
									<Button
										onClick={() => handleToggleFavorite(selectedVideo.id, selectedVideo.isFavorite)}
										variant={selectedVideo.isFavorite ? "default" : "outline"}
										className="mr-2"
									>
										<Heart className={`w-4 h-4 mr-2 ${selectedVideo.isFavorite ? 'fill-white' : ''}`} />
										{selectedVideo.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
									</Button>

									<Button variant="outline" onClick={() => setSelectedVideoId(null)}>
										Cerrar
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// Componente RefreshIcon
function RefreshIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			{...props}
		>
			<path d="M21 2v6h-6" />
			<path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
			<path d="M3 22v-6h6" />
			<path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
		</svg>
	);
}