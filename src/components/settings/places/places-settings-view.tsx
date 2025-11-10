/**
 * @file Vista de settings para lugares con presets
 * @module components/settings/places/places-settings-view
 * @description Vista completa de gestión de lugares con formularios de presets
 *              y tarjetas dinámicas
 */

import { useState } from 'react';
import { Plus, Search, Filter, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EntityCardDynamic } from '@/components/ui/entity-card-dynamic';
import { PlacePresetForm } from './place-preset-form';
import { usePlaces, useDeletePlace, useUpdatePlace } from '@/lib/api/places';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import type { PlaceWithStats } from '@/types/entities/place';

type ViewMode = 'grid' | 'list';

export function PlacesSettingsView() {
	const [showForm, setShowForm] = useState(false);
	const [editingPlace, setEditingPlace] = useState<PlaceWithStats | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [viewMode, setViewMode] = useState<ViewMode>('grid');

	// React Query hooks
	const { data: placesResponse, isLoading } = usePlaces({});
	const deleteMutation = useDeletePlace();
	const updateMutation = useUpdatePlace();

	// Extraer array de lugares de la respuesta
	const places = placesResponse?.data || [];

	// Filtrar lugares según búsqueda
	const filteredPlaces = places.filter((place: PlaceWithStats) =>
		place.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Manejar creación exitosa
	const handleCreated = (place: PlaceWithStats) => {
		toastService.success(`Lugar "${place.name}" creado`);
		setShowForm(false);
	};

	// Manejar actualización exitosa
	const handleUpdated = (place: PlaceWithStats) => {
		toastService.success(`Lugar "${place.name}" actualizado`);
		setEditingPlace(null);
	};

	// Manejar toggle de favorito
	const handleToggleFavorite = async (place: PlaceWithStats) => {
		try {
			await updateMutation.mutateAsync({
				id: place.id,
				data: { isFavorite: !place.isFavorite },
			});
			toastService.success(
				place.isFavorite ? 'Quitado de favoritos' : 'Agregado a favoritos'
			);
		} catch (error) {
			toastService.error('Error al actualizar favorito');
		}
	};

	// Manejar eliminación
	const handleDelete = async (place: PlaceWithStats) => {
		if (!confirm(`¿Estás seguro de eliminar el lugar "${place.name}"?`)) {
			return;
		}

		try {
			await deleteMutation.mutateAsync(place.id);
			toastService.success(`Lugar "${place.name}" eliminado`);
		} catch (error) {
			toastService.error('Error al eliminar lugar');
		}
	};

	// Convertir place a campos para EntityCardDynamic
	const getPlaceFields = (place: PlaceWithStats) => {
		const fields = [];

		if (place.type) fields.push({ key: 'type', label: 'Tipo', value: place.type, type: 'badge' as const });
		if (place.location) fields.push({ key: 'location', label: 'Ubicación', value: place.location, type: 'text' as const });
		if (place.climate) fields.push({ key: 'climate', label: 'Clima', value: place.climate, type: 'text' as const });
		if (place.population) fields.push({ key: 'population', label: 'Población', value: place.population, type: 'text' as const });
		if (place.history) fields.push({ key: 'history', label: 'Historia', value: place.history, type: 'long-text' as const });
		if (place.landmarks) fields.push({ key: 'landmarks', label: 'Puntos de interés', value: place.landmarks, type: 'long-text' as const });

		return fields;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lugares</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
						Gestiona tus lugares y sus detalles
					</p>
				</div>
				<Button onClick={() => setShowForm(true)} size="lg">
					<Plus className="w-4 h-4 mr-2" />
					Crear Lugar
				</Button>
			</div>

			{/* Formulario de creación/edición */}
			{(showForm || editingPlace) && (
				<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
					<h3 className="text-lg font-semibold mb-4">
						{editingPlace ? 'Editar Lugar' : 'Nuevo Lugar'}
					</h3>
					<PlacePresetForm
						place={editingPlace}
						isEditing={!!editingPlace}
						onCreated={handleCreated}
						onUpdated={handleUpdated}
						onCancel={() => {
							setShowForm(false);
							setEditingPlace(null);
						}}
					/>
				</div>
			)}

			{/* Barra de búsqueda y filtros */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<Input
						placeholder="Buscar lugares..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Button variant="outline" size="icon">
					<Filter className="w-4 h-4" />
				</Button>
				<div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md">
					<Button
						variant="ghost"
						size="icon"
						className={cn(viewMode === 'grid' && 'bg-gray-100 dark:bg-gray-700')}
						onClick={() => setViewMode('grid')}
					>
						<Grid3x3 className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className={cn(viewMode === 'list' && 'bg-gray-100 dark:bg-gray-700')}
						onClick={() => setViewMode('list')}
					>
						<List className="w-4 h-4" />
					</Button>
				</div>
			</div>

			{/* Contador de resultados */}
			<div className="text-sm text-gray-600 dark:text-gray-400">
				{filteredPlaces.length} lugar{filteredPlaces.length !== 1 ? 'es' : ''} encontrado
				{filteredPlaces.length !== 1 ? 's' : ''}
			</div>

			{/* Grid/Lista de lugares */}
			{isLoading ? (
				<div className="text-center py-12 text-gray-500">Cargando lugares...</div>
			) : filteredPlaces.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500 dark:text-gray-400 mb-4">
						{searchQuery ? 'No se encontraron lugares' : 'No hay lugares creados'}
					</p>
					{!searchQuery && (
						<Button onClick={() => setShowForm(true)} variant="outline">
							<Plus className="w-4 h-4 mr-2" />
							Crear tu primer lugar
						</Button>
					)}
				</div>
			) : (
				<div
					className={cn(
						'grid gap-4',
						viewMode === 'grid'
							? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
							: 'grid-cols-1'
					)}
				>
					{filteredPlaces.map((place: PlaceWithStats) => (
						<EntityCardDynamic
							key={place.id}
							id={place.id}
							name={place.name}
							emoji={place.emoji}
							color={place.color}
							description={place.description}
							isFavorite={place.isFavorite}
							featuredImage={place.featuredImage}
							fields={getPlaceFields(place)}
							stats={{
								images: place.stats?.imageCount || place.totalImages || place._count?.images || 0,
								videos: place.stats?.videoCount || place.totalVideos || place._count?.videos || 0,
							}}
							onClick={() => {
								// TODO: Navegar a vista detallada del lugar
								console.log('Ver detalles de:', place.name);
							}}
							onToggleFavorite={() => handleToggleFavorite(place)}
							actions={[
								{
									label: 'Editar',
									onClick: () => setEditingPlace(place),
								},
								{
									label: 'Eliminar',
									onClick: () => handleDelete(place),
									variant: 'destructive',
								},
							]}
						/>
					))}
				</div>
			)}
		</div>
	);
}
