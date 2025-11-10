/**
 * @file Vista de settings para conceptos con presets
 * @module components/settings/concepts/concepts-settings-view
 * @description Vista completa de gestión de conceptos con formularios de presets
 *              y tarjetas dinámicas
 */

import { useState } from 'react';
import { Plus, Search, Filter, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EntityCardDynamic } from '@/components/ui/entity-card-dynamic';
import { ConceptPresetForm } from './concept-preset-form';
import { useConcepts, useDeleteConcept, useUpdateConcept } from '@/lib/api/concepts';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import type { ConceptWithStats } from '@/types/entities/concept';

type ViewMode = 'grid' | 'list';

export function ConceptsSettingsView() {
	const [showForm, setShowForm] = useState(false);
	const [editingConcept, setEditingConcept] = useState<ConceptWithStats | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [viewMode, setViewMode] = useState<ViewMode>('grid');

	// React Query hooks
	const { data: conceptsResponse, isLoading } = useConcepts();
	const deleteMutation = useDeleteConcept();
	const updateMutation = useUpdateConcept();

	// Extraer array de conceptos de la respuesta
	const concepts = conceptsResponse?.data || [];

	// Filtrar conceptos según búsqueda
	const filteredConcepts = concepts.filter((concept: ConceptWithStats) =>
		concept.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Manejar creación exitosa
	const handleCreated = (concept: ConceptWithStats) => {
		toastService.success(`Concepto "${concept.name}" creado`);
		setShowForm(false);
	};

	// Manejar actualización exitosa
	const handleUpdated = (concept: ConceptWithStats) => {
		toastService.success(`Concepto "${concept.name}" actualizado`);
		setEditingConcept(null);
	};

	// Manejar toggle de favorito
	const handleToggleFavorite = async (concept: ConceptWithStats) => {
		try {
			await updateMutation.mutateAsync({
				id: concept.id,
				data: { isFavorite: !concept.isFavorite },
			});
			toastService.success(
				concept.isFavorite ? 'Quitado de favoritos' : 'Agregado a favoritos'
			);
		} catch (error) {
			toastService.error('Error al actualizar favorito');
		}
	};

	// Manejar eliminación
	const handleDelete = async (concept: ConceptWithStats) => {
		if (!confirm(`¿Estás seguro de eliminar el concepto "${concept.name}"?`)) {
			return;
		}

		try {
			await deleteMutation.mutateAsync(concept.id);
			toastService.success(`Concepto "${concept.name}" eliminado`);
		} catch (error) {
			toastService.error('Error al eliminar concepto');
		}
	};

	// Convertir concept a campos para EntityCardDynamic
	const getConceptFields = (concept: ConceptWithStats) => {
		const fields = [];

		if (concept.category) fields.push({ key: 'category', label: 'Categoría', value: concept.category, type: 'badge' as const });
		if (concept.content) fields.push({ key: 'content', label: 'Definición', value: concept.content, type: 'long-text' as const });
		if (concept.examples) fields.push({ key: 'examples', label: 'Ejemplos', value: concept.examples, type: 'long-text' as const });

		return fields;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Conceptos</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
						Gestiona tus conceptos y definiciones
					</p>
				</div>
				<Button onClick={() => setShowForm(true)} size="lg">
					<Plus className="w-4 h-4 mr-2" />
					Crear Concepto
				</Button>
			</div>

			{/* Formulario de creación/edición */}
			{(showForm || editingConcept) && (
				<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
					<h3 className="text-lg font-semibold mb-4">
						{editingConcept ? 'Editar Concepto' : 'Nuevo Concepto'}
					</h3>
					<ConceptPresetForm
						concept={editingConcept}
						isEditing={!!editingConcept}
						onCreated={handleCreated}
						onUpdated={handleUpdated}
						onCancel={() => {
							setShowForm(false);
							setEditingConcept(null);
						}}
					/>
				</div>
			)}

			{/* Barra de búsqueda y filtros */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<Input
						placeholder="Buscar conceptos..."
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
				{filteredConcepts.length} concepto{filteredConcepts.length !== 1 ? 's' : ''} encontrado
				{filteredConcepts.length !== 1 ? 's' : ''}
			</div>

			{/* Grid/Lista de conceptos */}
			{isLoading ? (
				<div className="text-center py-12 text-gray-500">Cargando conceptos...</div>
			) : filteredConcepts.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500 dark:text-gray-400 mb-4">
						{searchQuery ? 'No se encontraron conceptos' : 'No hay conceptos creados'}
					</p>
					{!searchQuery && (
						<Button onClick={() => setShowForm(true)} variant="outline">
							<Plus className="w-4 h-4 mr-2" />
							Crear tu primer concepto
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
					{filteredConcepts.map((concept: ConceptWithStats) => (
						<EntityCardDynamic
							key={concept.id}
							id={concept.id}
							name={concept.name}
							emoji={concept.emoji}
							color={concept.color}
							description={concept.description}
							isFavorite={concept.isFavorite}
							featuredImage={concept.featuredImage}
							fields={getConceptFields(concept)}
							stats={{
								images: concept.stats?.imageCount || concept._count?.images || 0,
								videos: concept.stats?.videoCount || concept._count?.videos || 0,
							}}
							onClick={() => {
								// TODO: Navegar a vista detallada del concepto
								console.log('Ver detalles de:', concept.name);
							}}
							onToggleFavorite={() => handleToggleFavorite(concept)}
							actions={[
								{
									label: 'Editar',
									onClick: () => setEditingConcept(concept),
								},
								{
									label: 'Eliminar',
									onClick: () => handleDelete(concept),
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
