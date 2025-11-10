/**
 * @file Vista de settings para world items con presets
 * @module components/settings/world-items/world-items-settings-view
 * @description Vista completa de gestión de world items con formularios de presets
 *              y tarjetas dinámicas
 */

import { useState } from 'react';
import { Plus, Search, Filter, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EntityCardDynamic } from '@/components/ui/entity-card-dynamic';
import { WorldItemPresetForm } from './world-item-preset-form';
import { useWorldItems, useDeleteWorldItem, useUpdateWorldItem } from '@/lib/api/world-items';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import type { WorldItemWithStats } from '@/types/entities/world-item';

type ViewMode = 'grid' | 'list';

export function WorldItemsSettingsView() {
	const [showForm, setShowForm] = useState(false);
	const [editingWorldItem, setEditingWorldItem] = useState<WorldItemWithStats | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [viewMode, setViewMode] = useState<ViewMode>('grid');

	// React Query hooks
	const { data: worldItemsResponse, isLoading } = useWorldItems();
	const deleteMutation = useDeleteWorldItem();
	const updateMutation = useUpdateWorldItem();

	// Extraer array de world items de la respuesta
	const worldItems = worldItemsResponse?.data || [];

	// Filtrar world items según búsqueda
	const filteredWorldItems = worldItems.filter((item: WorldItemWithStats) =>
		item.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Manejar creación exitosa
	const handleCreated = (worldItem: WorldItemWithStats) => {
		toastService.success(`Item "${worldItem.name}" creado`);
		setShowForm(false);
	};

	// Manejar actualización exitosa
	const handleUpdated = (worldItem: WorldItemWithStats) => {
		toastService.success(`Item "${worldItem.name}" actualizado`);
		setEditingWorldItem(null);
	};

	// Manejar toggle de favorito
	const handleToggleFavorite = async (worldItem: WorldItemWithStats) => {
		try {
			await updateMutation.mutateAsync({
				id: worldItem.id,
				data: { isFavorite: !worldItem.isFavorite },
			});
			toastService.success(
				worldItem.isFavorite ? 'Quitado de favoritos' : 'Agregado a favoritos'
			);
		} catch (error) {
			toastService.error('Error al actualizar favorito');
		}
	};

	// Manejar eliminación
	const handleDelete = async (worldItem: WorldItemWithStats) => {
		if (!confirm(`¿Estás seguro de eliminar el item "${worldItem.name}"?`)) {
			return;
		}

		try {
			await deleteMutation.mutateAsync(worldItem.id);
			toastService.success(`Item "${worldItem.name}" eliminado`);
		} catch (error) {
			toastService.error('Error al eliminar item');
		}
	};

	// Convertir world item a campos para EntityCardDynamic
	const getWorldItemFields = (item: WorldItemWithStats) => {
		const fields = [];

		if (item.type) fields.push({ key: 'type', label: 'Tipo', value: item.type, type: 'badge' as const });
		if (item.rarity) fields.push({ key: 'rarity', label: 'Rareza', value: item.rarity, type: 'badge' as const });
		if (item.value) fields.push({ key: 'value', label: 'Valor', value: item.value, type: 'text' as const });
		if (item.properties) fields.push({ key: 'properties', label: 'Propiedades', value: item.properties, type: 'long-text' as const });
		if (item.effects) fields.push({ key: 'effects', label: 'Efectos', value: item.effects, type: 'long-text' as const });

		return fields;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Items del Mundo</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
						Gestiona tus items, artefactos y recursos
					</p>
				</div>
				<Button onClick={() => setShowForm(true)} size="lg">
					<Plus className="w-4 h-4 mr-2" />
					Crear Item
				</Button>
			</div>

			{/* Formulario de creación/edición */}
			{(showForm || editingWorldItem) && (
				<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
					<h3 className="text-lg font-semibold mb-4">
						{editingWorldItem ? 'Editar Item' : 'Nuevo Item'}
					</h3>
					<WorldItemPresetForm
						worldItem={editingWorldItem}
						isEditing={!!editingWorldItem}
						onCreated={handleCreated}
						onUpdated={handleUpdated}
						onCancel={() => {
							setShowForm(false);
							setEditingWorldItem(null);
						}}
					/>
				</div>
			)}

			{/* Barra de búsqueda y filtros */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<Input
						placeholder="Buscar items..."
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
				{filteredWorldItems.length} item{filteredWorldItems.length !== 1 ? 's' : ''} encontrado
				{filteredWorldItems.length !== 1 ? 's' : ''}
			</div>

			{/* Grid/Lista de world items */}
			{isLoading ? (
				<div className="text-center py-12 text-gray-500">Cargando items...</div>
			) : filteredWorldItems.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500 dark:text-gray-400 mb-4">
						{searchQuery ? 'No se encontraron items' : 'No hay items creados'}
					</p>
					{!searchQuery && (
						<Button onClick={() => setShowForm(true)} variant="outline">
							<Plus className="w-4 h-4 mr-2" />
							Crear tu primer item
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
					{filteredWorldItems.map((worldItem: WorldItemWithStats) => (
						<EntityCardDynamic
							key={worldItem.id}
							id={worldItem.id}
							name={worldItem.name}
							emoji={worldItem.emoji}
							color={worldItem.color}
							description={worldItem.description}
							isFavorite={worldItem.isFavorite}
							featuredImage={worldItem.featuredImage}
							fields={getWorldItemFields(worldItem)}
							stats={{
								images: worldItem.stats?.imageCount || worldItem._count?.images || 0,
								videos: worldItem.stats?.videoCount || worldItem._count?.videos || 0,
							}}
							onClick={() => {
								// TODO: Navegar a vista detallada del item
								console.log('Ver detalles de:', worldItem.name);
							}}
							onToggleFavorite={() => handleToggleFavorite(worldItem)}
							actions={[
								{
									label: 'Editar',
									onClick: () => setEditingWorldItem(worldItem),
								},
								{
									label: 'Eliminar',
									onClick: () => handleDelete(worldItem),
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
