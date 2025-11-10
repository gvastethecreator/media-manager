/**
 * @file Vista de settings para tags con presets
 * @module components/settings/tags/tags-settings-view
 * @description Vista completa de gestión de tags con formularios de presets
 *              y tarjetas dinámicas
 */

import { useState } from 'react';
import { Plus, Search, Filter, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EntityCardDynamic } from '@/components/ui/entity-card-dynamic';
import { TagPresetForm } from './tag-preset-form';
import { useTags, useDeleteTag, useUpdateTag } from '@/lib/api/tags';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import type { TagWithStats } from '@/types/entities/tag';

type ViewMode = 'grid' | 'list';

export function TagsSettingsView() {
	const [showForm, setShowForm] = useState(false);
	const [editingTag, setEditingTag] = useState<TagWithStats | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [viewMode, setViewMode] = useState<ViewMode>('grid');

	// React Query hooks
	const { data: tagsResponse, isLoading } = useTags();
	const deleteMutation = useDeleteTag();
	const updateMutation = useUpdateTag();

	// Extraer array de tags de la respuesta
	const tags = tagsResponse?.data || [];

	// Filtrar tags según búsqueda
	const filteredTags = tags.filter((tag: TagWithStats) =>
		tag.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Manejar creación exitosa
	const handleCreated = (tag: TagWithStats) => {
		toastService.success(`Tag "${tag.name}" creado`);
		setShowForm(false);
	};

	// Manejar actualización exitosa
	const handleUpdated = (tag: TagWithStats) => {
		toastService.success(`Tag "${tag.name}" actualizado`);
		setEditingTag(null);
	};

	// Manejar toggle de favorito
	const handleToggleFavorite = async (tag: TagWithStats) => {
		try {
			await updateMutation.mutateAsync({
				id: tag.id,
				data: { isFavorite: !tag.isFavorite },
			});
			toastService.success(
				tag.isFavorite ? 'Quitado de favoritos' : 'Agregado a favoritos'
			);
		} catch (error) {
			toastService.error('Error al actualizar favorito');
		}
	};

	// Manejar eliminación
	const handleDelete = async (tag: TagWithStats) => {
		if (!confirm(`¿Estás seguro de eliminar el tag "${tag.name}"?`)) {
			return;
		}

		try {
			await deleteMutation.mutateAsync(tag.id);
			toastService.success(`Tag "${tag.name}" eliminado`);
		} catch (error) {
			toastService.error('Error al eliminar tag');
		}
	};

	// Convertir tag a campos para EntityCardDynamic
	const getTagFields = (tag: TagWithStats) => {
		const fields = [];

		// Tags suelen ser simples, pero podemos mostrar información adicional si existe
		if (tag.description) fields.push({ key: 'description', label: 'Descripción', value: tag.description, type: 'long-text' as const });

		return fields;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tags</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
						Gestiona tus etiquetas y categorías
					</p>
				</div>
				<Button onClick={() => setShowForm(true)} size="lg">
					<Plus className="w-4 h-4 mr-2" />
					Crear Tag
				</Button>
			</div>

			{/* Formulario de creación/edición */}
			{(showForm || editingTag) && (
				<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
					<h3 className="text-lg font-semibold mb-4">
						{editingTag ? 'Editar Tag' : 'Nuevo Tag'}
					</h3>
					<TagPresetForm
						tag={editingTag}
						isEditing={!!editingTag}
						onCreated={handleCreated}
						onUpdated={handleUpdated}
						onCancel={() => {
							setShowForm(false);
							setEditingTag(null);
						}}
					/>
				</div>
			)}

			{/* Barra de búsqueda y filtros */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<Input
						placeholder="Buscar tags..."
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
				{filteredTags.length} tag{filteredTags.length !== 1 ? 's' : ''} encontrado
				{filteredTags.length !== 1 ? 's' : ''}
			</div>

			{/* Grid/Lista de tags */}
			{isLoading ? (
				<div className="text-center py-12 text-gray-500">Cargando tags...</div>
			) : filteredTags.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500 dark:text-gray-400 mb-4">
						{searchQuery ? 'No se encontraron tags' : 'No hay tags creados'}
					</p>
					{!searchQuery && (
						<Button onClick={() => setShowForm(true)} variant="outline">
							<Plus className="w-4 h-4 mr-2" />
							Crear tu primer tag
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
					{filteredTags.map((tag: TagWithStats) => (
						<EntityCardDynamic
							key={tag.id}
							id={tag.id}
							name={tag.name}
							emoji={tag.emoji}
							color={tag.color}
							description={tag.description}
							isFavorite={tag.isFavorite}
							featuredImage={tag.featuredImage}
							fields={getTagFields(tag)}
							stats={{
								images: tag.stats?.imageCount || tag._count?.images || 0,
								videos: tag.stats?.videoCount || tag._count?.videos || 0,
							}}
							onClick={() => {
								// TODO: Navegar a vista detallada del tag
								console.log('Ver detalles de:', tag.name);
							}}
							onToggleFavorite={() => handleToggleFavorite(tag)}
							actions={[
								{
									label: 'Editar',
									onClick: () => setEditingTag(tag),
								},
								{
									label: 'Eliminar',
									onClick: () => handleDelete(tag),
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
