/**
 * @file Vista de settings para colecciones con presets
 * @module components/settings/collections/collections-settings-view
 * @description Vista completa de gestión de colecciones con formularios de presets
 *              y tarjetas dinámicas
 */

import { useState } from 'react';
import { Plus, Search, Filter, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EntityCardDynamic } from '@/components/ui/entity-card-dynamic';
import { CollectionPresetForm } from './collection-preset-form';
import { useCollections, useDeleteCollection, useUpdateCollection } from '@/lib/api/collections';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import type { CollectionWithStats } from '@/types/entities/collection';

type ViewMode = 'grid' | 'list';

export function CollectionsSettingsView() {
	const [showForm, setShowForm] = useState(false);
	const [editingCollection, setEditingCollection] = useState<CollectionWithStats | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [viewMode, setViewMode] = useState<ViewMode>('grid');

	// React Query hooks
	const { data: collectionsResponse, isLoading } = useCollections({});
	const deleteMutation = useDeleteCollection();
	const updateMutation = useUpdateCollection();

	// Extraer array de colecciones de la respuesta
	const collections = collectionsResponse?.data || [];

	// Filtrar colecciones según búsqueda
	const filteredCollections = collections.filter((collection: CollectionWithStats) =>
		collection.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Manejar creación exitosa
	const handleCreated = (collection: CollectionWithStats) => {
		toastService.success(`Colección "${collection.name}" creada`);
		setShowForm(false);
	};

	// Manejar actualización exitosa
	const handleUpdated = (collection: CollectionWithStats) => {
		toastService.success(`Colección "${collection.name}" actualizada`);
		setEditingCollection(null);
	};

	// Manejar toggle de favorito
	const handleToggleFavorite = async (collection: CollectionWithStats) => {
		try {
			await updateMutation.mutateAsync({
				id: collection.id,
				data: { isFavorite: !collection.isFavorite },
			});
			toastService.success(
				collection.isFavorite ? 'Quitado de favoritos' : 'Agregado a favoritos'
			);
		} catch (error) {
			toastService.error('Error al actualizar favorito');
		}
	};

	// Manejar eliminación
	const handleDelete = async (collection: CollectionWithStats) => {
		if (!confirm(`¿Estás seguro de eliminar la colección "${collection.name}"?`)) {
			return;
		}

		try {
			await deleteMutation.mutateAsync(collection.id);
			toastService.success(`Colección "${collection.name}" eliminada`);
		} catch (error) {
			toastService.error('Error al eliminar colección');
		}
	};

	// Convertir collection a campos para EntityCardDynamic
	const getCollectionFields = (collection: CollectionWithStats) => {
		const fields = [];

		if (collection.totalSize) {
			const sizeInMB = (collection.totalSize / (1024 * 1024)).toFixed(2);
			fields.push({ key: 'size', label: 'Tamaño', value: `${sizeInMB} MB`, type: 'text' as const });
		}

		return fields;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Colecciones</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
						Gestiona tus colecciones de contenido
					</p>
				</div>
				<Button onClick={() => setShowForm(true)} size="lg">
					<Plus className="w-4 h-4 mr-2" />
					Crear Colección
				</Button>
			</div>

			{/* Formulario de creación/edición */}
			{(showForm || editingCollection) && (
				<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
					<h3 className="text-lg font-semibold mb-4">
						{editingCollection ? 'Editar Colección' : 'Nueva Colección'}
					</h3>
					<CollectionPresetForm
						collection={editingCollection}
						isEditing={!!editingCollection}
						onCreated={handleCreated}
						onUpdated={handleUpdated}
						onCancel={() => {
							setShowForm(false);
							setEditingCollection(null);
						}}
					/>
				</div>
			)}

			{/* Barra de búsqueda y filtros */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<Input
						placeholder="Buscar colecciones..."
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
				{filteredCollections.length} colección{filteredCollections.length !== 1 ? 'es' : ''} encontrada
				{filteredCollections.length !== 1 ? 's' : ''}
			</div>

			{/* Grid/Lista de colecciones */}
			{isLoading ? (
				<div className="text-center py-12 text-gray-500">Cargando colecciones...</div>
			) : filteredCollections.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500 dark:text-gray-400 mb-4">
						{searchQuery ? 'No se encontraron colecciones' : 'No hay colecciones creadas'}
					</p>
					{!searchQuery && (
						<Button onClick={() => setShowForm(true)} variant="outline">
							<Plus className="w-4 h-4 mr-2" />
							Crear tu primera colección
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
					{filteredCollections.map((collection: CollectionWithStats) => (
						<EntityCardDynamic
							key={collection.id}
							id={collection.id}
							name={collection.name}
							emoji={collection.emoji}
							color={collection.color}
							description={collection.description}
							isFavorite={collection.isFavorite}
							featuredImage={collection.featuredImage}
							fields={getCollectionFields(collection)}
							stats={{
								images: collection.stats?.imageCount || collection.totalImages,
								videos: collection.stats?.videoCount || collection.totalVideos,
							}}
							onClick={() => {
								// TODO: Navegar a vista detallada de la colección
								console.log('Ver detalles de:', collection.name);
							}}
							onToggleFavorite={() => handleToggleFavorite(collection)}
							actions={[
								{
									label: 'Editar',
									onClick: () => setEditingCollection(collection),
								},
								{
									label: 'Eliminar',
									onClick: () => handleDelete(collection),
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
