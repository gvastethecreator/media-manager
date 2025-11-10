/**
 * @file Vista de settings para notas con presets
 * @module components/settings/notes/notes-settings-view
 * @description Vista completa de gestión de notas con formularios de presets
 *              y tarjetas dinámicas
 */

import { useState } from 'react';
import { Plus, Search, Filter, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EntityCardDynamic } from '@/components/ui/entity-card-dynamic';
import { NotePresetForm } from './note-preset-form';
import { useNotes, useDeleteNote, useUpdateNote } from '@/lib/api/notes';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import type { NoteWithStats } from '@/types/entities/note';

type ViewMode = 'grid' | 'list';

export function NotesSettingsView() {
	const [showForm, setShowForm] = useState(false);
	const [editingNote, setEditingNote] = useState<NoteWithStats | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [viewMode, setViewMode] = useState<ViewMode>('grid');

	// React Query hooks
	const { data: notesResponse, isLoading } = useNotes();
	const deleteMutation = useDeleteNote();
	const updateMutation = useUpdateNote();

	// Extraer array de notas de la respuesta
	const notes = notesResponse?.data || [];

	// Filtrar notas según búsqueda
	const filteredNotes = notes.filter((note: NoteWithStats) =>
		note.title.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Manejar creación exitosa
	const handleCreated = (note: NoteWithStats) => {
		toastService.success(`Nota "${note.title}" creada`);
		setShowForm(false);
	};

	// Manejar actualización exitosa
	const handleUpdated = (note: NoteWithStats) => {
		toastService.success(`Nota "${note.title}" actualizada`);
		setEditingNote(null);
	};

	// Manejar toggle de favorito
	const handleToggleFavorite = async (note: NoteWithStats) => {
		try {
			await updateMutation.mutateAsync({
				id: note.id,
				data: { isFavorite: !note.isFavorite },
			});
			toastService.success(
				note.isFavorite ? 'Quitado de favoritos' : 'Agregado a favoritos'
			);
		} catch (error) {
			toastService.error('Error al actualizar favorito');
		}
	};

	// Manejar eliminación
	const handleDelete = async (note: NoteWithStats) => {
		if (!confirm(`¿Estás seguro de eliminar la nota "${note.title}"?`)) {
			return;
		}

		try {
			await deleteMutation.mutateAsync(note.id);
			toastService.success(`Nota "${note.title}" eliminada`);
		} catch (error) {
			toastService.error('Error al eliminar nota');
		}
	};

	// Convertir note a campos para EntityCardDynamic
	const getNoteFields = (note: NoteWithStats) => {
		const fields = [];

		if (note.category) fields.push({ key: 'category', label: 'Categoría', value: note.category, type: 'badge' as const });
		if (note.content) fields.push({ key: 'content', label: 'Contenido', value: note.content, type: 'long-text' as const });

		return fields;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notas</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
						Gestiona tus notas y apuntes
					</p>
				</div>
				<Button onClick={() => setShowForm(true)} size="lg">
					<Plus className="w-4 h-4 mr-2" />
					Crear Nota
				</Button>
			</div>

			{/* Formulario de creación/edición */}
			{(showForm || editingNote) && (
				<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
					<h3 className="text-lg font-semibold mb-4">
						{editingNote ? 'Editar Nota' : 'Nueva Nota'}
					</h3>
					<NotePresetForm
						note={editingNote}
						isEditing={!!editingNote}
						onCreated={handleCreated}
						onUpdated={handleUpdated}
						onCancel={() => {
							setShowForm(false);
							setEditingNote(null);
						}}
					/>
				</div>
			)}

			{/* Barra de búsqueda y filtros */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<Input
						placeholder="Buscar notas..."
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
				{filteredNotes.length} nota{filteredNotes.length !== 1 ? 's' : ''} encontrada
				{filteredNotes.length !== 1 ? 's' : ''}
			</div>

			{/* Grid/Lista de notas */}
			{isLoading ? (
				<div className="text-center py-12 text-gray-500">Cargando notas...</div>
			) : filteredNotes.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500 dark:text-gray-400 mb-4">
						{searchQuery ? 'No se encontraron notas' : 'No hay notas creadas'}
					</p>
					{!searchQuery && (
						<Button onClick={() => setShowForm(true)} variant="outline">
							<Plus className="w-4 h-4 mr-2" />
							Crear tu primera nota
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
					{filteredNotes.map((note: NoteWithStats) => (
						<EntityCardDynamic
							key={note.id}
							id={note.id}
							name={note.title}
							emoji={note.emoji}
							color={note.color}
							description={note.summary || note.content?.substring(0, 100)}
							isFavorite={note.isFavorite}
							featuredImage={note.featuredImage}
							fields={getNoteFields(note)}
							stats={{
								images: note.stats?.imageCount || note._count?.images || 0,
								videos: note.stats?.videoCount || note._count?.videos || 0,
							}}
							onClick={() => {
								// TODO: Navegar a vista detallada de la nota
								console.log('Ver detalles de:', note.title);
							}}
							onToggleFavorite={() => handleToggleFavorite(note)}
							actions={[
								{
									label: 'Editar',
									onClick: () => setEditingNote(note),
								},
								{
									label: 'Eliminar',
									onClick: () => handleDelete(note),
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
