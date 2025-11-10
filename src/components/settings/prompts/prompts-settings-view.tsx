/**
 * @file Vista de settings para prompts con presets
 * @module components/settings/prompts/prompts-settings-view
 * @description Vista completa de gestión de prompts con formularios de presets
 *              y tarjetas dinámicas
 */

import { useState } from 'react';
import { Plus, Search, Filter, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EntityCardDynamic } from '@/components/ui/entity-card-dynamic';
import { PromptPresetForm } from './prompt-preset-form';
import { usePrompts, useDeletePrompt, useUpdatePrompt } from '@/lib/api/prompts';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import type { PromptWithStats } from '@/types/entities/prompt';

type ViewMode = 'grid' | 'list';

export function PromptsSettingsView() {
	const [showForm, setShowForm] = useState(false);
	const [editingPrompt, setEditingPrompt] = useState<PromptWithStats | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [viewMode, setViewMode] = useState<ViewMode>('grid');

	// React Query hooks
	const { data: promptsResponse, isLoading } = usePrompts();
	const deleteMutation = useDeletePrompt();
	const updateMutation = useUpdatePrompt();

	// Extraer array de prompts de la respuesta
	const prompts = promptsResponse?.data || [];

	// Filtrar prompts según búsqueda
	const filteredPrompts = prompts.filter((prompt: PromptWithStats) =>
		prompt.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Manejar creación exitosa
	const handleCreated = (prompt: PromptWithStats) => {
		toastService.success(`Prompt "${prompt.name}" creado`);
		setShowForm(false);
	};

	// Manejar actualización exitosa
	const handleUpdated = (prompt: PromptWithStats) => {
		toastService.success(`Prompt "${prompt.name}" actualizado`);
		setEditingPrompt(null);
	};

	// Manejar toggle de favorito
	const handleToggleFavorite = async (prompt: PromptWithStats) => {
		try {
			await updateMutation.mutateAsync({
				id: prompt.id,
				data: { isFavorite: !prompt.isFavorite },
			});
			toastService.success(
				prompt.isFavorite ? 'Quitado de favoritos' : 'Agregado a favoritos'
			);
		} catch (error) {
			toastService.error('Error al actualizar favorito');
		}
	};

	// Manejar eliminación
	const handleDelete = async (prompt: PromptWithStats) => {
		if (!confirm(`¿Estás seguro de eliminar el prompt "${prompt.name}"?`)) {
			return;
		}

		try {
			await deleteMutation.mutateAsync(prompt.id);
			toastService.success(`Prompt "${prompt.name}" eliminado`);
		} catch (error) {
			toastService.error('Error al eliminar prompt');
		}
	};

	// Convertir prompt a campos para EntityCardDynamic
	const getPromptFields = (prompt: PromptWithStats) => {
		const fields = [];

		if (prompt.category) fields.push({ key: 'category', label: 'Categoría', value: prompt.category, type: 'badge' as const });
		if (prompt.model) fields.push({ key: 'model', label: 'Modelo', value: prompt.model, type: 'badge' as const });
		if (prompt.content) fields.push({ key: 'content', label: 'Contenido', value: prompt.content, type: 'long-text' as const });

		return fields;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Prompts</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
						Gestiona tus prompts y plantillas
					</p>
				</div>
				<Button onClick={() => setShowForm(true)} size="lg">
					<Plus className="w-4 h-4 mr-2" />
					Crear Prompt
				</Button>
			</div>

			{/* Formulario de creación/edición */}
			{(showForm || editingPrompt) && (
				<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
					<h3 className="text-lg font-semibold mb-4">
						{editingPrompt ? 'Editar Prompt' : 'Nuevo Prompt'}
					</h3>
					<PromptPresetForm
						prompt={editingPrompt}
						isEditing={!!editingPrompt}
						onCreated={handleCreated}
						onUpdated={handleUpdated}
						onCancel={() => {
							setShowForm(false);
							setEditingPrompt(null);
						}}
					/>
				</div>
			)}

			{/* Barra de búsqueda y filtros */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<Input
						placeholder="Buscar prompts..."
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
				{filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''} encontrado
				{filteredPrompts.length !== 1 ? 's' : ''}
			</div>

			{/* Grid/Lista de prompts */}
			{isLoading ? (
				<div className="text-center py-12 text-gray-500">Cargando prompts...</div>
			) : filteredPrompts.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500 dark:text-gray-400 mb-4">
						{searchQuery ? 'No se encontraron prompts' : 'No hay prompts creados'}
					</p>
					{!searchQuery && (
						<Button onClick={() => setShowForm(true)} variant="outline">
							<Plus className="w-4 h-4 mr-2" />
							Crear tu primer prompt
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
					{filteredPrompts.map((prompt: PromptWithStats) => (
						<EntityCardDynamic
							key={prompt.id}
							id={prompt.id}
							name={prompt.name}
							emoji={prompt.emoji}
							color={prompt.color}
							description={prompt.description}
							isFavorite={prompt.isFavorite}
							featuredImage={prompt.featuredImage}
							fields={getPromptFields(prompt)}
							stats={{
								images: prompt.stats?.imageCount || prompt._count?.images || 0,
								videos: prompt.stats?.videoCount || prompt._count?.videos || 0,
							}}
							onClick={() => {
								// TODO: Navegar a vista detallada del prompt
								console.log('Ver detalles de:', prompt.name);
							}}
							onToggleFavorite={() => handleToggleFavorite(prompt)}
							actions={[
								{
									label: 'Editar',
									onClick: () => setEditingPrompt(prompt),
								},
								{
									label: 'Eliminar',
									onClick: () => handleDelete(prompt),
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
