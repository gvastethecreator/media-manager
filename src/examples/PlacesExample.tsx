'use client';

/**
 * @file Componente de ejemplo para gestionar lugares (places)
 * @module examples/PlacesExample
 */

import { deletePlace, fetchPlaces, updatePlace } from '@/app/actions/places/place.actions';
import { AdminViewMode } from '@/components/admin/admin-view-mode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { usePlaceStore } from '@/store/entities/place';
import {
	transformPlace,
	transformPlaceToExtended
} from '@/transformers/place';
import { PlaceExtended } from '@/types/entities/place/types';
import { PlaceType } from '@prisma/client';
import { LucideBuildingCommunity, LucideEdit, LucideMap, LucideStar, LucideTrash2 } from 'lucide-react';
import { useState } from 'react';

/**
 * Componente de ejemplo para la gestión de lugares
 * Demuestra cómo:
 * 1. Cargar lugares desde el servidor
 * 2. Crear y editar lugares
 * 3. Eliminar lugares
 * 4. Marcar/desmarcar como favoritos
 * 5. Ver estadísticas
 */
export default function PlacesExample() {
	const { places, loading, error, setPlaces, setLoading, setError } = usePlaceStore();
	const { toast } = useToast();
	const [newPlaceName, setNewPlaceName] = useState('');
	const [newPlaceDescription, setNewPlaceDescription] = useState('');
	const [newPlaceType, setNewPlaceType] = useState<PlaceType>(PlaceType.CITY);
	const [editingPlace, setEditingPlace] = useState<PlaceExtended | null>(null);
	const [viewMode, setViewMode] = useState<'list' | 'grid' | 'stats'>('list');

	/**
	 * Carga los lugares desde el servidor
	 */
	const loadPlaces = async () => {
		try {
			setLoading(true);
			setError(null);
			const placesData = await fetchPlaces();
			if (placesData) {
				const transformedPlaces = placesData.map(place => transformPlaceToExtended(place));
				setPlaces(transformedPlaces);
			}
		} catch (error) {
			console.error('Error al cargar lugares:', error);
			setError('No se pudieron cargar los lugares');
			toast({
				title: 'Error',
				description: 'No se pudieron cargar los lugares',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Crea un nuevo lugar
	 */
	const createNewPlace = async () => {
		if (!newPlaceName) {
			toast({
				title: 'Error',
				description: 'El nombre es obligatorio',
				variant: 'destructive',
			});
			return;
		}

		try {
			setLoading(true);
			const newPlace = {
				name: newPlaceName,
				description: newPlaceDescription,
				type: newPlaceType,
				emoji: '🏛️',
				color: '#3498db',
			};

			// Aquí iría la llamada a la API para crear el lugar
			// Por ahora, simulamos agregándolo al estado local
			const createdPlace = transformPlaceToExtended({
				id: `temp-${Date.now()}`,
				...newPlace,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			setPlaces([...places, createdPlace]);
			setNewPlaceName('');
			setNewPlaceDescription('');
			toast({
				title: 'Éxito',
				description: `Lugar "${newPlaceName}" creado correctamente`,
			});
		} catch (error) {
			console.error('Error al crear lugar:', error);
			toast({
				title: 'Error',
				description: 'No se pudo crear el lugar',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Marca/desmarca un lugar como favorito
	 */
	const toggleFavorite = async (place: PlaceExtended) => {
		try {
			const updatedPlace = {
				...place,
				isFavorite: !place.isFavorite,
			};

			// Actualizar el lugar en el servidor
			await updatePlace({
				id: place.id,
				place: updatedPlace
			});

			// Actualizar el estado local
			setPlaces(
				places.map(p =>
					p.id === place.id
						? transformPlaceToExtended(updatedPlace)
						: p
				)
			);

			toast({
				title: 'Éxito',
				description: place.isFavorite
					? `"${place.name}" eliminado de favoritos`
					: `"${place.name}" añadido a favoritos`,
			});
		} catch (error) {
			console.error('Error al cambiar estado de favorito:', error);
			toast({
				title: 'Error',
				description: 'No se pudo actualizar el lugar',
				variant: 'destructive',
			});
		}
	};

	/**
	 * Elimina un lugar
	 */
	const removePlace = async (place: PlaceExtended) => {
		if (!confirm(`¿Estás seguro de eliminar "${place.name}"?`)) {
			return;
		}

		try {
			setLoading(true);
			// Eliminar del servidor
			await deletePlace(place.id);

			// Actualizar estado local
			setPlaces(places.filter(p => p.id !== place.id));
			toast({
				title: 'Éxito',
				description: `Lugar "${place.name}" eliminado correctamente`,
			});
		} catch (error) {
			console.error('Error al eliminar lugar:', error);
			toast({
				title: 'Error',
				description: 'No se pudo eliminar el lugar',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Establece un lugar para edición
	 */
	const startEditing = (place: PlaceExtended) => {
		setEditingPlace({ ...place });
	};

	/**
	 * Guarda los cambios en un lugar
	 */
	const savePlace = async () => {
		if (!editingPlace) return;

		try {
			setLoading(true);
			// Actualizar en el servidor
			await updatePlace({
				id: editingPlace.id,
				place: transformPlace(editingPlace)
			});

			// Actualizar estado local
			setPlaces(
				places.map(p =>
					p.id === editingPlace.id
						? transformPlaceToExtended(editingPlace)
						: p
				)
			);

			setEditingPlace(null);
			toast({
				title: 'Éxito',
				description: `Lugar "${editingPlace.name}" actualizado correctamente`,
			});
		} catch (error) {
			console.error('Error al actualizar lugar:', error);
			toast({
				title: 'Error',
				description: 'No se pudo actualizar el lugar',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Cancela la edición
	 */
	const cancelEditing = () => {
		setEditingPlace(null);
	};

	// Cargar lugares al montar el componente
	useState(() => {
		loadPlaces();
	});

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold flex items-center gap-2">
					<LucideMap className="h-6 w-6" />
					Gestión de Lugares
				</h2>
				<Button
					variant="outline"
					onClick={loadPlaces}
					disabled={loading}
				>
					Recargar
				</Button>
			</div>

			<Separator />

			{/* Panel de creación */}
			<Card>
				<CardContent className="pt-6">
					<h3 className="text-lg font-semibold mb-4">Crear nuevo lugar</h3>
					<div className="grid gap-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="name">Nombre</Label>
								<Input
									id="name"
									value={newPlaceName}
									onChange={(e) => setNewPlaceName(e.target.value)}
									placeholder="Nombre del lugar"
								/>
							</div>
							<div>
								<Label htmlFor="type">Tipo</Label>
								<Select
									value={newPlaceType}
									onValueChange={(value) => setNewPlaceType(value as PlaceType)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar tipo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={PlaceType.CITY}>Ciudad</SelectItem>
										<SelectItem value={PlaceType.FOREST}>Bosque</SelectItem>
										<SelectItem value={PlaceType.MOUNTAIN}>Montaña</SelectItem>
										<SelectItem value={PlaceType.CASTLE}>Castillo</SelectItem>
										<SelectItem value={PlaceType.DUNGEON}>Mazmorra</SelectItem>
										<SelectItem value={PlaceType.PORT}>Puerto</SelectItem>
										<SelectItem value={PlaceType.TEMPLE}>Templo</SelectItem>
										<SelectItem value={PlaceType.VILLAGE}>Aldea</SelectItem>
										<SelectItem value={PlaceType.ISLAND}>Isla</SelectItem>
										<SelectItem value={PlaceType.CAVE}>Cueva</SelectItem>
										<SelectItem value={PlaceType.OTHER}>Otro</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div>
							<Label htmlFor="description">Descripción</Label>
							<Textarea
								id="description"
								value={newPlaceDescription}
								onChange={(e) => setNewPlaceDescription(e.target.value)}
								placeholder="Describe este lugar..."
								rows={3}
							/>
						</div>
						<Button
							onClick={createNewPlace}
							disabled={loading || !newPlaceName}
						>
							Crear lugar
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Modo de visualización */}
			<div className="flex justify-end">
				<AdminViewMode
					viewMode={viewMode}
					setViewMode={setViewMode as any}
					modes={[
						{ value: 'list', label: 'Lista', icon: 'list' },
						{ value: 'grid', label: 'Tarjetas', icon: 'grid' },
						{ value: 'stats', label: 'Estadísticas', icon: 'pie-chart' },
					]}
				/>
			</div>

			{/* Listado de lugares */}
			{loading ? (
				<div className="text-center py-8">Cargando lugares...</div>
			) : error ? (
				<div className="text-center text-red-500 py-8">{error}</div>
			) : places.length === 0 ? (
				<div className="text-center py-8">No hay lugares. Crea uno nuevo.</div>
			) : (
				<div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-2'}>
					{places.map((place) => (
						<Card key={place.id} className={viewMode === 'list' ? 'flex justify-between p-4' : ''}>
							{editingPlace && editingPlace.id === place.id ? (
								<CardContent className="p-4">
									<h3 className="text-lg font-semibold mb-4">Editar lugar</h3>
									<div className="grid gap-4">
										<div>
											<Label htmlFor={`edit-name-${place.id}`}>Nombre</Label>
											<Input
												id={`edit-name-${place.id}`}
												value={editingPlace.name}
												onChange={(e) => setEditingPlace({ ...editingPlace, name: e.target.value })}
											/>
										</div>
										<div>
											<Label htmlFor={`edit-type-${place.id}`}>Tipo</Label>
											<Select
												value={editingPlace.type}
												onValueChange={(value) => setEditingPlace({ ...editingPlace, type: value as PlaceType })}
											>
												<SelectTrigger id={`edit-type-${place.id}`}>
													<SelectValue placeholder="Seleccionar tipo" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value={PlaceType.CITY}>Ciudad</SelectItem>
													<SelectItem value={PlaceType.FOREST}>Bosque</SelectItem>
													<SelectItem value={PlaceType.MOUNTAIN}>Montaña</SelectItem>
													<SelectItem value={PlaceType.CASTLE}>Castillo</SelectItem>
													<SelectItem value={PlaceType.DUNGEON}>Mazmorra</SelectItem>
													<SelectItem value={PlaceType.PORT}>Puerto</SelectItem>
													<SelectItem value={PlaceType.TEMPLE}>Templo</SelectItem>
													<SelectItem value={PlaceType.VILLAGE}>Aldea</SelectItem>
													<SelectItem value={PlaceType.ISLAND}>Isla</SelectItem>
													<SelectItem value={PlaceType.CAVE}>Cueva</SelectItem>
													<SelectItem value={PlaceType.OTHER}>Otro</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div>
											<Label htmlFor={`edit-description-${place.id}`}>Descripción</Label>
											<Textarea
												id={`edit-description-${place.id}`}
												value={editingPlace.description || ''}
												onChange={(e) => setEditingPlace({ ...editingPlace, description: e.target.value })}
												rows={3}
											/>
										</div>
										<div className="flex gap-2">
											<Button onClick={savePlace}>Guardar</Button>
											<Button variant="outline" onClick={cancelEditing}>Cancelar</Button>
										</div>
									</div>
								</CardContent>
							) : viewMode === 'list' ? (
								<>
									<div className="flex items-center gap-2">
										<div
											className="w-8 h-8 flex items-center justify-center rounded-full"
											style={{ backgroundColor: place.color || '#e2e8f0' }}
										>
											{place.emoji || <LucideBuildingCommunity className="h-4 w-4" />}
										</div>
										<div>
											<h3 className="font-medium">{place.name}</h3>
											<p className="text-sm text-muted-foreground">
												{place.type || 'Sin tipo'} • {place.description ? `${place.description.substring(0, 30)}...` : 'Sin descripción'}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => toggleFavorite(place)}
											title={place.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
										>
											<LucideStar className={`h-4 w-4 ${place.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => startEditing(place)}
											title="Editar"
										>
											<LucideEdit className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => removePlace(place)}
											title="Eliminar"
										>
											<LucideTrash2 className="h-4 w-4" />
										</Button>
									</div>
								</>
							) : (
								<CardContent className="p-4">
									<div className="flex justify-between items-start mb-2">
										<div className="flex items-center gap-2">
											<div
												className="w-8 h-8 flex items-center justify-center rounded-full"
												style={{ backgroundColor: place.color || '#e2e8f0' }}
											>
												{place.emoji || <LucideBuildingCommunity className="h-4 w-4" />}
											</div>
											<h3 className="font-medium">{place.name}</h3>
										</div>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => toggleFavorite(place)}
											title={place.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
										>
											<LucideStar className={`h-4 w-4 ${place.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
										</Button>
									</div>
									<div className="text-sm mb-4">
										<span className="inline-block px-2 py-1 rounded-full bg-muted text-xs mb-2">
											{place.type || 'Sin tipo'}
										</span>
										<p className="text-muted-foreground">
											{place.description || 'Sin descripción'}
										</p>
									</div>
									<div className="flex gap-2 mt-auto">
										<Button variant="outline" size="sm" onClick={() => startEditing(place)}>
											Editar
										</Button>
										<Button variant="outline" size="sm" onClick={() => removePlace(place)}>
											Eliminar
										</Button>
									</div>
								</CardContent>
							)}
						</Card>
					))}
				</div>
			)}

			{/* Vista de estadísticas */}
			{viewMode === 'stats' && (
				<Card>
					<CardContent className="p-6">
						<h3 className="text-xl font-semibold mb-4">Estadísticas de lugares</h3>
						<div className="grid gap-4">
							<div>
								<p className="text-lg">Total de lugares: <span className="font-medium">{places.length}</span></p>
								<p>Por tipo:</p>
								<ul className="list-disc list-inside pl-4 space-y-1">
									{Object.values(PlaceType).map(type => {
										const count = places.filter(p => p.type === type).length;
										if (count === 0) return null;
										return (
											<li key={type}>
												{type}: <span className="font-medium">{count}</span>
											</li>
										);
									})}
								</ul>
							</div>

							<Separator />

							<div>
								<p className="font-medium">Favoritos: <span>{places.filter(p => p.isFavorite).length}</span></p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}