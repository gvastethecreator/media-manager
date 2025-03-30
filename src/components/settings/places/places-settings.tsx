'use client';

import { deletePlace, getPlaces, type PlaceWithStats } from '@/app/actions/places/place.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import toastService from '@/services/toast.service';
import type { Place } from '@/types/entities/place';
import { ClimateType, PlaceType } from '@/types/entities/place/enums';
import { Filter, Info, Loader2, MapPin, PlusCircle, Save, Trash } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CreatePlaceForm } from './create-place-form';

// Agregar type para manejar el onClick
type ReactEventHandler = (e: React.MouseEvent<HTMLButtonElement>) => void;

export function PlacesSettings() {
	const [places, setPlaces] = useState<PlaceWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [previewData, setPreviewData] = useState<any>(null);

	// Filtros
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
	const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
	const [onlyFavorites, setOnlyFavorites] = useState(false);

	// Cargar lugares al montar el componente
	useEffect(() => {
		const loadPlaces = async () => {
			try {
				setIsLoading(true);
				const data = await getPlaces();
				setPlaces(data);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				setError(errorMessage);
				toastService.error('Error al cargar los lugares', {
					description: errorMessage,
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadPlaces();
	}, []);

	// Calcular estadísticas generales
	const stats = {
		totalPlaces: places.length,
		totalImages: places.reduce((acc, place) => acc + (place._count?.images || 0), 0),
		totalSize: places.reduce((acc, place) => acc + (place.totalSize || 0), 0),
		unusedPlaces: places.filter(place => (place._count?.images || 0) === 0).length,
		favoritePlaces: places.filter(place => place.isFavorite).length,
	};

	// Filtrar lugares basados en los criterios seleccionados
	const filteredPlaces = places.filter(place => {
		let matches = true;

		// Filtrar por búsqueda
		if (searchQuery) {
			const normalizedQuery = searchQuery.toLowerCase();
			matches = matches && Boolean(
				place.name.toLowerCase().includes(normalizedQuery) ||
				(place.description?.toLowerCase().includes(normalizedQuery)) ||
				(place.region?.toLowerCase().includes(normalizedQuery))
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

	// Manejar eliminación de lugar
	const handleDeletePlace = useCallback(async (id: string) => {
		try {
			await deletePlace(id);
			setPlaces(prev => prev.filter(place => place.id !== id));
			setSelectedPlace(null);
			setIsEditing(false);
			toastService.success('Lugar eliminado');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al eliminar el lugar', {
				description: errorMessage,
			});
		}
	}, []);

	// Manejar edición de lugar
	const handleEditPlace = useCallback((place: Place) => {
		setSelectedPlace(place);
		setIsEditing(true);
	}, []);

	// Manejar creación exitosa
	const handlePlaceCreated = useCallback((newPlace: Place) => {
		setPlaces(prev => [...prev, newPlace as unknown as PlaceWithStats]);
		toastService.success('Lugar creado');
	}, []);

	// Manejar actualización exitosa
	const handlePlaceUpdated = useCallback((updatedPlace: Place) => {
		setPlaces(prev =>
			prev.map(place =>
				place.id === updatedPlace.id
					? { ...place, ...updatedPlace } as PlaceWithStats
					: place
			)
		);
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

	// Extraer tipos y regiones únicos de los lugares
	const uniqueTypes = Array.from(new Set(places.map(place => place.type).filter(Boolean))) as string[];
	const uniqueRegions = Array.from(new Set(places.map(place => place.region).filter(Boolean))) as string[];

	// Contenido condicional basado en estado de carga
	if (isLoading) {
		return (
			<Card className="rounded-sm bg-muted/30 border-none">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<p className="text-sm text-muted-foreground">Cargando lugares...</p>
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
						title="Error al cargar lugares"
						description={error}
						actions={
							<Button onClick={() => window.location.reload()}>
								Intentar de nuevo
							</Button>
						}
					/>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-12 gap-3">
			{/* Panel izquierdo: Lista de lugares */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="space-y-1 py-2 px-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm flex items-center">
								Lugares ({filteredPlaces.length})
								{filteredPlaces.length !== places.length && (
									<Badge variant="outline" className="ml-2 text-[10px]">
										Filtrados
									</Badge>
								)}
							</CardTitle>
							<div className="flex items-center gap-1">
								<Popover>
									<PopoverTrigger asChild>
										<Button
											size="sm"
											variant="ghost"
											className="h-6 w-6 p-0"
										>
											<Filter className="h-3.5 w-3.5" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-72" align="end">
										<div className="space-y-4">
											<h4 className="font-medium text-sm">Filtrar Lugares</h4>

											<div className="space-y-2">
												<Label htmlFor="search">Buscar</Label>
												<Input
													id="search"
													placeholder="Buscar lugares..."
													value={searchQuery}
													onChange={(e) => setSearchQuery(e.target.value)}
													className="h-8 text-xs"
												/>
											</div>

											<div className="space-y-2">
												<Label>Tipos</Label>
												<div className="grid grid-cols-2 gap-2">
													{uniqueTypes.map(type => (
														<div key={type} className="flex items-center space-x-2">
															<Checkbox
																id={`type-${type}`}
																checked={selectedTypes.includes(type)}
																onCheckedChange={(checked) => {
																	if (checked) {
																		setSelectedTypes(prev => [...prev, type]);
																	} else {
																		setSelectedTypes(prev =>
																			prev.filter(t => t !== type)
																		);
																	}
																}}
															/>
															<Label htmlFor={`type-${type}`} className="text-xs">
																{type}
															</Label>
														</div>
													))}
												</div>
											</div>

											<div className="space-y-2">
												<Label>Regiones</Label>
												<div className="grid grid-cols-2 gap-2">
													{uniqueRegions.map(region => (
														<div key={region} className="flex items-center space-x-2">
															<Checkbox
																id={`region-${region}`}
																checked={selectedRegions.includes(region)}
																onCheckedChange={(checked) => {
																	if (checked) {
																		setSelectedRegions(prev => [...prev, region]);
																	} else {
																		setSelectedRegions(prev =>
																			prev.filter(r => r !== region)
																		);
																	}
																}}
															/>
															<Label htmlFor={`region-${region}`} className="text-xs">
																{region}
															</Label>
														</div>
													))}
												</div>
											</div>

											<div className="flex items-center space-x-2">
												<Checkbox
													id="favorites"
													checked={onlyFavorites}
													onCheckedChange={(checked) => setOnlyFavorites(!!checked)}
												/>
												<Label htmlFor="favorites" className="text-xs">Solo favoritos</Label>
											</div>

											<div className="flex justify-between">
												<Button size="sm" variant="outline" onClick={clearFilters} className="h-8 text-xs">
													Limpiar filtros
												</Button>
												<Button size="sm" className="h-8 text-xs">
													Aplicar
												</Button>
											</div>
										</div>
									</PopoverContent>
								</Popover>
								<Button
									onClick={() => { setSelectedPlace(null); setIsEditing(false); }}
									size="sm"
									variant="ghost"
									className="h-6 w-6 p-0"
								>
									<PlusCircle className="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>
						<div className="flex gap-2 text-xs text-muted-foreground">
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
						<div className="h-full px-3 pb-3 overflow-auto">
							{filteredPlaces.length === 0 ? (
								<EmptyState
									icon={MapPin}
									title="No hay lugares"
									description={
										places.length > 0
											? "No se encontraron lugares con los filtros aplicados"
											: "Crea tu primer lugar"
									}
									className="py-6"
									actions={
										places.length > 0 && (
											<Button size="sm" variant="outline" onClick={clearFilters}>
												Limpiar filtros
											</Button>
										)
									}
								/>
							) : (
								<div className="space-y-1">
									{filteredPlaces.map((place) => (
										<button
											key={place.id}
											className={`flex items-center gap-2 p-1.5 rounded-md transition-colors cursor-pointer hover:bg-muted/50 w-full text-left ${selectedPlace?.id === place.id ? 'bg-muted' : ''}`}
											onClick={() => handleEditPlace(place as unknown as Place)}
											type="button"
											aria-pressed={selectedPlace?.id === place.id}
										>
											<div
												className="w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center text-white"
												style={{
													backgroundColor: place.color || '#888',
												}}
											>
												<span className="text-xs">{place.emoji}</span>
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="text-xs font-medium truncate">{place.name}</h4>
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
											<Button
												variant="ghost"
												size="icon"
												type="button"
												className="h-5 w-5 opacity-0 hover:opacity-100 group-hover:opacity-100"
												onClick={(e) => {
													e.stopPropagation();
													handleDeletePlace(place.id);
												}}
											>
												<Trash className="h-3 w-3 text-gray-500 hover:text-red-500" />
											</Button>
										</button>
									))}
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Panel derecho: Formulario y Preview */}
			<div className="col-span-12 md:col-span-7 lg:col-span-8">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="py-2 px-3">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-sm">
									{isEditing ? 'Editar Lugar' : 'Nuevo Lugar'}
								</CardTitle>
								<CardDescription className="text-xs">
									{isEditing
										? 'Modifica los detalles del lugar seleccionado'
										: 'Completa el formulario para crear un nuevo lugar'}
								</CardDescription>
							</div>
							<div className="flex gap-1">
								{isEditing && selectedPlace && (
									<>
										<Button
											variant="outline"
											size="sm"
											className="h-7 text-xs"
											onClick={handleReset}
										>
											Cancelar
										</Button>
										<Button
											variant="destructive"
											size="sm"
											className="h-7 text-xs"
											onClick={() => handleDeletePlace(selectedPlace.id)}
										>
											<Trash className="h-3 w-3 mr-1" />
											Eliminar
										</Button>
									</>
								)}
								<Button
									type="submit"
									size="sm"
									className="h-7 text-xs"
									form="place-form"
								>
									<Save className="h-3 w-3 mr-1" />
									{isEditing ? 'Guardar' : 'Crear'}
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-3 flex-1 overflow-hidden">
						<div className="h-full pr-3 overflow-auto">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
								<div className="space-y-3">
									<CreatePlaceForm
										key={selectedPlace?.id || 'new-place'}
										place={selectedPlace}
										isEditing={isEditing}
										onCreated={handlePlaceCreated}
										onUpdated={handlePlaceUpdated}
										onCancel={handleReset}
										onPreview={handlePreview}
									/>
								</div>
								<div className="hidden lg:flex flex-col items-center justify-start">
									<h3 className="text-xs font-medium mb-2">Vista Previa</h3>
									<div className="w-[220px] transition-all duration-300">
										{previewData || selectedPlace ? (
											<div className="flex flex-col p-4 border rounded-lg bg-background">
												<div
													className="w-full aspect-video mb-3 rounded-md flex items-center justify-center"
													style={{ backgroundColor: (previewData?.color || selectedPlace?.color || '#3b82f6') }}
												>
													<span className="text-4xl text-white">{previewData?.emoji || selectedPlace?.emoji || '📍'}</span>
												</div>
												<h3 className="text-lg font-medium">
													{previewData?.name || selectedPlace?.name || 'Nuevo Lugar'}
												</h3>

												<div className="flex flex-wrap gap-2 mt-3">
													{(previewData?.type || selectedPlace?.type) && (
														<Badge variant="secondary" className="text-xs">
															{previewData?.type || selectedPlace?.type}
														</Badge>
													)}
													{(previewData?.region || selectedPlace?.region) && (
														<Badge variant="outline" className="text-xs">
															{previewData?.region || selectedPlace?.region}
														</Badge>
													)}
												</div>

												<p className="text-muted-foreground mt-3 text-sm">
													{previewData?.description || selectedPlace?.description || 'Sin descripción'}
												</p>

												{(previewData?.climate || selectedPlace?.climate) && (
													<p className="mt-3 text-xs">
														<span className="font-medium">Clima:</span> {previewData?.climate || selectedPlace?.climate}
													</p>
												)}

												{(previewData?.population || selectedPlace?.population) && (
													<p className="mt-1 text-xs">
														<span className="font-medium">Población:</span> {previewData?.population || selectedPlace?.population}
													</p>
												)}

												{(previewData?.isFavorite || selectedPlace?.isFavorite) && (
													<div className="mt-2 text-xs text-yellow-500">★ Favorito</div>
												)}
											</div>
										) : (
											<div className="flex flex-col items-center justify-center h-[260px] bg-muted/50 rounded-lg border border-dashed">
												<MapPin className="h-7 w-7 text-muted-foreground/50" />
												<p className="text-[10px] text-muted-foreground mt-2">
													Vista previa
												</p>
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
function generateTypeColor(placeType: PlaceType): string {
	switch (placeType) {
		case PlaceType.CITY:
			return 'bg-blue-500';
		case PlaceType.TOWN:
			return 'bg-indigo-500';
		case PlaceType.VILLAGE:
			return 'bg-teal-500';
		case PlaceType.FOREST:
			return 'bg-green-500';
		case PlaceType.MOUNTAIN:
			return 'bg-gray-500';
		case PlaceType.DESERT:
			return 'bg-yellow-500';
		case PlaceType.CASTLE:
			return 'bg-purple-500';
		case PlaceType.RUIN:
			return 'bg-zinc-500';
		case PlaceType.DUNGEON:
			return 'bg-red-500';
		case PlaceType.CAVE:
			return 'bg-amber-500';
		case PlaceType.FORTRESS:
			return 'bg-slate-500';
		case PlaceType.OTHER:
			return 'bg-gray-500';
		default:
			return 'bg-gray-500';
	}
}

// Función auxiliar para generar colores basados en tipo de clima
function generateClimateColor(climate: ClimateType): string {
	switch (climate) {
		case ClimateType.TROPICAL:
			return 'bg-red-400';
		case ClimateType.ARID:
			return 'bg-yellow-400';
		case ClimateType.TEMPERATE:
			return 'bg-green-400';
		case ClimateType.CONTINENTAL:
			return 'bg-orange-400';
		case ClimateType.POLAR:
			return 'bg-blue-200';
		default:
			return 'bg-gray-400';
	}
}
