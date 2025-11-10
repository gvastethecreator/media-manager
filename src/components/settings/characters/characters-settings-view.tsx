/**
 * @file Vista de settings para personajes con presets
 * @module components/settings/characters/characters-settings-view
 * @description Vista completa de gestión de personajes con formularios de presets
 *              y tarjetas dinámicas
 */

import { useState } from 'react';
import { Plus, Search, Filter, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EntityCardDynamic } from '@/components/ui/entity-card-dynamic';
import { CharacterPresetForm } from './character-preset-form';
import { useCharacters, useDeleteCharacter, useUpdateCharacter } from '@/lib/api/characters';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import type { CharacterWithStats } from '@/types/entities/character/types';

type ViewMode = 'grid' | 'list';

export function CharactersSettingsView() {
	const [showForm, setShowForm] = useState(false);
	const [editingCharacter, setEditingCharacter] = useState<CharacterWithStats | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [viewMode, setViewMode] = useState<ViewMode>('grid');

	// React Query hooks
	const { data: charactersResponse, isLoading } = useCharacters();
	const deleteMutation = useDeleteCharacter();
	const updateMutation = useUpdateCharacter();

	// Extraer array de personajes de la respuesta
	const characters = charactersResponse?.data || [];

	// Filtrar personajes según búsqueda
	const filteredCharacters = characters.filter((char: CharacterWithStats) =>
		char.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Manejar creación exitosa
	const handleCreated = (character: CharacterWithStats) => {
		toastService.success(`Personaje "${character.name}" creado`);
		setShowForm(false);
	};

	// Manejar actualización exitosa
	const handleUpdated = (character: CharacterWithStats) => {
		toastService.success(`Personaje "${character.name}" actualizado`);
		setEditingCharacter(null);
	};

	// Manejar toggle de favorito
	const handleToggleFavorite = async (character: CharacterWithStats) => {
		try {
			await updateMutation.mutateAsync({
				id: character.id,
				data: { isFavorite: !character.isFavorite },
			});
			toastService.success(
				character.isFavorite ? 'Quitado de favoritos' : 'Agregado a favoritos'
			);
		} catch (error) {
			toastService.error('Error al actualizar favorito');
		}
	};

	// Manejar eliminación
	const handleDelete = async (character: CharacterWithStats) => {
		if (!confirm(`¿Estás seguro de eliminar el personaje "${character.name}"?`)) {
			return;
		}

		try {
			await deleteMutation.mutateAsync(character.id);
			toastService.success(`Personaje "${character.name}" eliminado`);
		} catch (error) {
			toastService.error('Error al eliminar personaje');
		}
	};

	// Convertir character a campos para EntityCardDynamic
	const getCharacterFields = (char: CharacterWithStats) => {
		const fields = [];

		if (char.age) fields.push({ key: 'age', label: 'Edad', value: char.age, type: 'text' as const });
		if (char.gender) fields.push({ key: 'gender', label: 'Género', value: char.gender, type: 'text' as const });
		if (char.species) fields.push({ key: 'species', label: 'Especie', value: char.species, type: 'badge' as const });
		if (char.occupation) fields.push({ key: 'occupation', label: 'Ocupación', value: char.occupation, type: 'badge' as const });
		if (char.class) fields.push({ key: 'class', label: 'Clase', value: char.class, type: 'badge' as const });
		if (char.level) fields.push({ key: 'level', label: 'Nivel', value: `Nv. ${char.level}`, type: 'text' as const });
		if (char.background) fields.push({ key: 'background', label: 'Historia', value: char.background, type: 'long-text' as const });
		if (char.personality) fields.push({ key: 'personality', label: 'Personalidad', value: char.personality, type: 'long-text' as const });

		return fields;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Personajes</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
						Gestiona tus personajes y sus detalles
					</p>
				</div>
				<Button onClick={() => setShowForm(true)} size="lg">
					<Plus className="w-4 h-4 mr-2" />
					Crear Personaje
				</Button>
			</div>

			{/* Formulario de creación/edición */}
			{(showForm || editingCharacter) && (
				<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
					<h3 className="text-lg font-semibold mb-4">
						{editingCharacter ? 'Editar Personaje' : 'Nuevo Personaje'}
					</h3>
					<CharacterPresetForm
						character={editingCharacter}
						isEditing={!!editingCharacter}
						onCreated={handleCreated}
						onUpdated={handleUpdated}
						onCancel={() => {
							setShowForm(false);
							setEditingCharacter(null);
						}}
					/>
				</div>
			)}

			{/* Barra de búsqueda y filtros */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<Input
						placeholder="Buscar personajes..."
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
				{filteredCharacters.length} personaje{filteredCharacters.length !== 1 ? 's' : ''} encontrado
				{filteredCharacters.length !== 1 ? 's' : ''}
			</div>

			{/* Grid/Lista de personajes */}
			{isLoading ? (
				<div className="text-center py-12 text-gray-500">Cargando personajes...</div>
			) : filteredCharacters.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500 dark:text-gray-400 mb-4">
						{searchQuery ? 'No se encontraron personajes' : 'No hay personajes creados'}
					</p>
					{!searchQuery && (
						<Button onClick={() => setShowForm(true)} variant="outline">
							<Plus className="w-4 h-4 mr-2" />
							Crear tu primer personaje
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
					{filteredCharacters.map((character: CharacterWithStats) => (
						<EntityCardDynamic
							key={character.id}
							id={character.id}
							name={character.name}
							emoji={character.emoji}
							color={character.color}
							description={character.description}
							isFavorite={character.isFavorite}
							featuredImage={character.featuredImage}
							fields={getCharacterFields(character)}
							stats={{
								images: character.stats?.totalImages || character.totalImages,
								videos: character.stats?.totalVideos || character.totalVideos,
							}}
							onClick={() => {
								// TODO: Navegar a vista detallada del personaje
								console.log('Ver detalles de:', character.name);
							}}
							onToggleFavorite={() => handleToggleFavorite(character)}
							actions={[
								{
									label: 'Editar',
									onClick: () => setEditingCharacter(character),
								},
								{
									label: 'Eliminar',
									onClick: () => handleDelete(character),
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
