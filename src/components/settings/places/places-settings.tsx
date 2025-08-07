import { Filter, Info, Loader2, MapPin, PlusCircle, Save, Trash } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDeletePlace, usePlaces } from '@/lib/api/places';
import { toastService } from '@/lib/ui/toast';
import type { PlaceWithStats } from '@/types/entities/place';
import { CreatePlaceForm } from './create-place-form';

// Agregar type para manejar el onClick
type ReactEventHandler = (e: React.MouseEvent<HTMLButtonElement>) => void;

export function PlacesSettings() {
	const [selectedPlace, setSelectedPlace] = useState<PlaceWithStats | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [previewData, setPreviewData] = useState<any>(null);

	// Filtros
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
	const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
	const [onlyFavorites, setOnlyFavorites] = useState(false);

	// React Query hooks
	const { data: placesResponse, isLoading, error } = usePlaces({});
	const places = placesResponse?.data || [];
	const deletePlace = useDeletePlace();

	// Calcular estadísticas generales usando useMemo para optimización
	const stats = useMemo(
		() => ({
			totalPlaces: places.length,
			totalImages: places.reduce((acc, place) => acc + (place._count?.images || 0), 0),
			unusedPlaces: places.filter((place) => (place._count?.images || 0) === 0).length,
			favoritePlaces: places.filter((place) => place.isFavorite).length,
		}),
		[places]
	);

	// Filtrar lugares basados en los criterios seleccionados usando useMemo
	const filteredPlaces = useMemo(() => {
		return places.filter((place) => {
			let matches = true;

			// Filtrar por búsqueda
			if (searchQuery) {
				const normalizedQuery = searchQuery.toLowerCase();
				matches =
					matches &&
					Boolean(
						place.name.toLowerCase().includes(normalizedQuery) ||
							place.description?.toLowerCase().includes(normalizedQuery) ||
							place.region?.toLowerCase().includes(normalizedQuery)
					);
			}

			// Filtrar por tipos
			if (selectedTypes.length > 0) {
				matches = matches && (place.type ? selectedTypes.includes(place.type) : false);
			}

			// Filtrar por regiones
			if (selectedRegions.length > 0) {
				matches = matches && (place.region ? selectedRegions.includes(place.region) : false);
			}

			// Filtrar por favoritos
			if (onlyFavorites) {
				matches = matches && !!place.isFavorite;
			}

			return matches;
		});
	}, [places, searchQuery, selectedTypes, selectedRegions, onlyFavorites]);

	// Manejar eliminación de lugar
	const handleDeletePlace = useCallback(
		async (id: string) => {
			try {
				await deletePlace.mutateAsync(id);
				setSelectedPlace(null);
				setIsEditing(false);
				toastService.success('Lugar eliminado');
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				toastService.error('Error al eliminar el lugar', {
					description: errorMessage,
				});
			}
		},
		[deletePlace]
	);

	// Manejar edición de lugar
	const handleEditPlace = useCallback((place: PlaceWithStats) => {
		setSelectedPlace(place);
	}, []);

	// Manejar creación exitosa
	const handlePlaceCreated = useCallback((_newPlace: PlaceWithStats) => {
		toastService.success('Lugar creado');
	}, []);

	// Manejar actualización exitosa
	const handlePlaceUpdated = useCallback((_updatedPlace: PlaceWithStats) => {
		toastService.success('Lugar actualizado');
	}, []);

	// Resetear formulario
	const handleReset = useCallback(() => {
		setIsEditing(false);
		setSelectedPlace(null);
	}, []);

	// Manejar la previsualización en tiempo real
	const handlePreview = useCallback((data: any) => {
		setPreviewData(data);
	}, []);

	// Limpiar filtros
	const clearFilters = useCallback(() => {
		setSearchQuery('');
		setSelectedTypes([]);
		setSelectedRegions([]);
		setOnlyFavorites(false);
	}, []);

	// Extraer tipos y regiones únicos de los lugares usando useMemo
	const uniqueTypes = useMemo(
		() => Array.from(new Set(places.map((place) => place.type).filter(Boolean))) as string[],
		[places]
	);
	const uniqueRegions = useMemo(
		() => Array.from(new Set(places.map((place) => place.region).filter(Boolean))) as string[],
		[places]
	);

	// Contenido condicional basado en estado de carga
	if (isLoading) {
		return (
			<Card className="rounded-sm border-none bg-muted/30">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<p className="text-muted-foreground text-sm">Cargando lugares...</p>
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
						actions={<Button onClick={() => window.location.reload()}>Intentar de nuevo</Button>}
						description={error instanceof Error ? error.message : 'Error desconocido'}
						icon={Info}
						title="Error al cargar lugares"
					/>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-12 gap-3">
			{/* Panel izquierdo: Lista de lugares */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="flex h-[calc(100vh-8rem)] flex-col rounded-sm border-none bg-muted/30">
					<CardHeader className="space-y-1 px-3 py-2">
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center text-sm">
								Lugares ({filteredPlaces.length})
								{filteredPlaces.length !== places.length && (
									<Badge className="ml-2 text-[10px]" variant="outline">
										Filtrados
									</Badge>
								)}
							</CardTitle>
							<div className="flex items-center gap-1">
								<Popover>
									<PopoverTrigger>
										<Button className="h-6 w-6 p-0" size="sm" variant="ghost">
											<Filter className="h-3.5 w-3.5" />
										</Button>
									</PopoverTrigger>
									<PopoverContent align="end" className="w-72">
										<div className="space-y-4">
											<h4 className="font-medium text-sm">Filtrar Lugares</h4>

											<div className="space-y-2">
												<Label htmlFor="search">Buscar</Label>
												<Input
													className="h-8 text-xs"
													id="search"
													onChange={(e) => setSearchQuery(e.target.value)}
													placeholder="Buscar lugares..."
													value={searchQuery}
												/>
											</div>

											<div className="space-y-2">
												<Label>Tipos</Label>
												<div className="grid grid-cols-2 gap-2">
													{uniqueTypes.map((type) => (
														<div className="flex items-center space-x-2" key={type}>
															<Checkbox
																checked={selectedTypes.includes(type)}
																id={`type-${type}`}
																onCheckedChange={(checked) => {
																	if (checked) {
																		setSelectedTypes((prev) => [...prev, type]);
																	} else {
																		setSelectedTypes((prev) => prev.filter((t) => t !== type));
																	}
																}}
															/>
															<Label className="text-xs" htmlFor={`type-${type}`}>
																{type}
															</Label>
														</div>
													))}
												</div>
											</div>

											<div className="space-y-2">
												<Label>Regiones</Label>
												<div className="grid grid-cols-2 gap-2">
													{uniqueRegions.map((region) => (
														<div className="flex items-center space-x-2" key={region}>
															<Checkbox
																checked={selectedRegions.includes(region)}
																id={`region-${region}`}
																onCheckedChange={(checked) => {
																	if (checked) {
																		setSelectedRegions((prev) => [...prev, region]);
																	} else {
																		setSelectedRegions((prev) => prev.filter((r) => r !== region));
																	}
																}}
															/>
															<Label className="text-xs" htmlFor={`region-${region}`}>
																{region}
															</Label>
														</div>
													))}
												</div>
											</div>

											<div className="flex items-center space-x-2">
												<Checkbox
													checked={onlyFavorites}
													id="favorites"
													onCheckedChange={(checked) => setOnlyFavorites(!!checked)}
												/>
												<Label className="text-xs" htmlFor="favorites">
													Solo favoritos
												</Label>
											</div>

											<div className="flex justify-between">
												<Button className="h-8 text-xs" onClick={clearFilters} size="sm" variant="outline">
													Limpiar filtros
												</Button>
												<Button className="h-8 text-xs" size="sm">
													Aplicar
												</Button>
											</div>
										</div>
									</PopoverContent>
								</Popover>
								<Button
									className="h-6 w-6 p-0"
									onClick={() => {
										setSelectedPlace(null);
										setIsEditing(false);
									}}
									size="sm"
									variant="ghost"
								>
									<PlusCircle className="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>
						<div className="flex gap-2 text-muted-foreground text-xs">
							<span>{stats.totalPlaces} lugares</span>
							<span>•</span>
							<span>{stats.totalImages} imágenes</span>
							{stats.favoritePlaces > 0 && (
								<>
									<span>•</span>
									<span>{stats.favoritePlaces} favoritos</span>
								</>
							)}
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full max-h-[400px] px-3 pb-3">
							{filteredPlaces.length === 0 ? (
								<EmptyState
									actions={
										places.length > 0 && (
											<Button onClick={clearFilters} size="sm" variant="outline">
												Limpiar filtros
											</Button>
										)
									}
									className="py-6"
									description={
										places.length > 0 ? 'No se encontraron lugares con los filtros aplicados' : 'Crea tu primer lugar'
									}
									icon={MapPin}
									title="No hay lugares"
								/>
							) : (
								<div className="space-y-1">
									{filteredPlaces.map((place) => (
										<div
											className={`group/item relative flex w-full items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-muted/50 ${selectedPlace?.id === place.id ? 'bg-muted' : ''}`}
											key={place.id}
										>
											<button
												aria-pressed={selectedPlace?.id === place.id}
												className="flex w-full cursor-pointer items-center gap-2 text-left"
												onClick={() => handleEditPlace(place)}
												type="button"
											>
												<div
													className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-white"
													style={{
														backgroundColor: place.color || '#888',
													}}
												>
													<span className="text-xs">{place.emoji}</span>
												</div>
												<div className="min-w-0 flex-1">
													<h4 className="truncate font-medium text-xs">{place.name}</h4>
													<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
														<span>{place._count?.images || 0} imágenes</span>
														{place.region && (
															<>
																<span>•</span>
																<span>{place.region}</span>
															</>
														)}
													</div>
												</div>
											</button>
											<Button
												className="absolute right-1 h-5 w-5 opacity-0 group-hover/item:opacity-100"
												onClick={(e) => {
													e.stopPropagation();
													handleDeletePlace(place.id);
												}}
												size="icon"
												type="button"
												variant="ghost"
											>
												<Trash className="h-3 w-3 text-gray-500 hover:text-red-500" />
											</Button>
										</div>
									))}
								</div>
							)}
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			{/* Panel derecho: Formulario y Preview */}
			<div className="col-span-12 md:col-span-7 lg:col-span-8">
				<Card className="flex h-[calc(100vh-8rem)] flex-col rounded-sm border-none bg-muted/30">
					<CardHeader className="px-3 py-2">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-sm">{isEditing ? 'Editar Lugar' : 'Nuevo Lugar'}</CardTitle>
								<CardDescription className="text-xs">
									{isEditing
										? 'Modifica los detalles del lugar seleccionado'
										: 'Completa el formulario para crear un nuevo lugar'}
								</CardDescription>
							</div>
							<div className="flex gap-1">
								{isEditing && selectedPlace && (
									<>
										<Button className="h-7 text-xs" onClick={handleReset} size="sm" variant="outline">
											Cancelar
										</Button>
										<Button
											className="h-7 text-xs"
											onClick={() => handleDeletePlace(selectedPlace.id)}
											size="sm"
											variant="destructive"
										>
											<Trash className="mr-1 h-3 w-3" />
											Eliminar
										</Button>
									</>
								)}
								<Button className="h-7 text-xs" form="place-form" size="sm" type="submit">
									<Save className="mr-1 h-3 w-3" />
									{isEditing ? 'Guardar' : 'Crear'}
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="flex-1 overflow-hidden p-3">
						<div className="h-full overflow-auto pr-3">
							<div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
								<div className="space-y-3">
									<CreatePlaceForm
										isEditing={isEditing}
										key={selectedPlace?.id || 'new-place'}
										onCancel={handleReset}
										onCreated={handlePlaceCreated}
										onPreview={handlePreview}
										onUpdated={handlePlaceUpdated}
										place={selectedPlace || undefined}
									/>
								</div>
								<div className="hidden flex-col items-center justify-start lg:flex">
									<h3 className="mb-2 font-medium text-xs">Vista Previa</h3>
									<div className="w-[220px] transition-all duration-300">
										{previewData || selectedPlace ? (
											<div className="flex flex-col rounded-lg border bg-background p-4">
												<div
													className="mb-3 flex aspect-video w-full items-center justify-center rounded-md"
													style={{ backgroundColor: previewData?.color || selectedPlace?.color || '#3b82f6' }}
												>
													<span className="text-4xl text-white">
														{previewData?.emoji || selectedPlace?.emoji || '📍'}
													</span>
												</div>
												<h3 className="font-medium text-lg">
													{previewData?.name || selectedPlace?.name || 'Nuevo Lugar'}
												</h3>

												<div className="mt-3 flex flex-wrap gap-2">
													{(previewData?.type || selectedPlace?.type) && (
														<Badge className="text-xs" variant="secondary">
															{previewData?.type || selectedPlace?.type}
														</Badge>
													)}
													{(previewData?.region || selectedPlace?.region) && (
														<Badge className="text-xs" variant="outline">
															{previewData?.region || selectedPlace?.region}
														</Badge>
													)}
												</div>

												<p className="mt-3 text-muted-foreground text-sm">
													{previewData?.description || selectedPlace?.description || 'Sin descripción'}
												</p>

												{(previewData?.climate || selectedPlace?.climate) && (
													<p className="mt-3 text-xs">
														<span className="font-medium">Clima:</span> {previewData?.climate || selectedPlace?.climate}
													</p>
												)}

												{(previewData?.population || selectedPlace?.population) && (
													<p className="mt-1 text-xs">
														<span className="font-medium">Población:</span>{' '}
														{previewData?.population || selectedPlace?.population}
													</p>
												)}

												{(previewData?.isFavorite || selectedPlace?.isFavorite) && (
													<div className="mt-2 text-xs text-yellow-500">★ Favorito</div>
												)}
											</div>
										) : (
											<div className="flex h-[260px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50">
												<MapPin className="h-7 w-7 text-muted-foreground/50" />
												<p className="mt-2 text-[10px] text-muted-foreground">Vista previa</p>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

// Función auxiliar para generar colores basados en tipo de lugar
function _generateTypeColor(placeType: string): string {
	switch (placeType) {
		case 'city':
			return 'bg-blue-500';
		case 'town':
			return 'bg-indigo-500';
		case 'village':
			return 'bg-teal-500';
		case 'forest':
			return 'bg-green-500';
		case 'mountain':
			return 'bg-gray-500';
		case 'desert':
			return 'bg-yellow-500';
		case 'castle':
			return 'bg-purple-500';
		case 'ruin':
			return 'bg-zinc-500';
		case 'cave':
			return 'bg-amber-500';
		case 'other':
			return 'bg-gray-500';
		default:
			return 'bg-gray-500';
	}
}

// Función auxiliar para generar colores basados en tipo de clima
function _generateClimateColor(climate: string): string {
	switch (climate) {
		case 'tropical':
			return 'bg-red-400';
		case 'arid':
			return 'bg-yellow-400';
		case 'temperate':
			return 'bg-green-400';
		case 'continental':
			return 'bg-orange-400';
		case 'polar':
			return 'bg-blue-200';
		default:
			return 'bg-gray-400';
	}
}
