import { Filter, Loader2, NotebookPen, PlusCircle, Save, Trash } from 'lucide-react';
import { useCallback, useId, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDeleteNote, useNotes } from '@/lib/api/notes';
import { toastService } from '@/lib/ui/toast';
import { formatDate } from '@/lib/utils/format.utils';
import type { NoteWithStats } from '@/types/entities/note';
import { CreateNoteForm } from './create-note-form';

// Tipos seguros para preview data
interface PreviewData {
	name?: string;
	content?: string;
	color?: string;
	emoji?: string;
	category?: string;
	isFavorite?: boolean;
}

export function NotesSettings() {
	const [selectedNote, setSelectedNote] = useState<NoteWithStats | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [previewData, setPreviewData] = useState<PreviewData | null>(null);

	// Filtros
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [onlyFavorites, setOnlyFavorites] = useState(false);

	// Generar IDs únicos
	const searchInputId = useId();
	const categorySelectId = useId();
	const favoritesCheckboxId = useId();

	// React Query hooks
	const { data: notesResponse, isLoading, error } = useNotes({ search: searchQuery });
	const deleteNoteMutation = useDeleteNote();

	const notes = notesResponse?.data || [];

	// Calcular estadísticas generales
	const stats = useMemo(() => {
		return {
			totalNotes: notes.length,
			totalImages: notes.reduce((acc, note) => acc + (note.statistics?.imageCount || 0), 0),
			totalAssociations: notes.reduce((acc, note) => acc + (note.statistics?.totalAssociations || 0), 0),
			unusedNotes: notes.filter((note) => (note.statistics?.imageCount || 0) === 0).length,
			favoriteNotes: notes.filter((note) => note.isFavorite).length,
		};
	}, [notes]);

	// Filtrar notas basadas en los criterios seleccionados
	const filteredNotes = useMemo(() => {
		return notes.filter((note) => {
			let matches = true;

			// Filtrar por categoría
			if (selectedCategory) {
				matches = matches && note.category === selectedCategory;
			}

			// Filtrar por favoritos
			if (onlyFavorites) {
				matches = matches && !!note.isFavorite;
			}

			return matches;
		});
	}, [notes, selectedCategory, onlyFavorites]);

	// Manejar eliminación de nota
	const handleDeleteNote = useCallback(
		async (id: string) => {
			try {
				await deleteNoteMutation.mutateAsync(id);
				setSelectedNote(null);
				setIsEditing(false);
				toastService.success('Nota eliminada');
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				toastService.error('Error al eliminar la nota', {
					description: errorMessage,
				});
			}
		},
		[deleteNoteMutation]
	);

	// Manejar edición de nota
	const handleEditNote = useCallback((note: NoteWithStats) => {
		setSelectedNote(note);
		setIsEditing(true);
	}, []);

	// Manejar la eliminación desde el botón con detención de propagación de eventos
	const handleDeleteButtonClick = useCallback(
		(noteId: string) => {
			handleDeleteNote(noteId);
		},
		[handleDeleteNote]
	);

	// Manejar creación exitosa
	const handleNoteCreated = useCallback((_newNote: NoteWithStats) => {
		toastService.success('Nota creada');
	}, []);

	// Manejar actualización exitosa
	const handleNoteUpdated = useCallback((_updatedNote: NoteWithStats) => {
		toastService.success('Nota actualizada');
	}, []);

	// Resetear formulario
	const handleReset = useCallback(() => {
		setIsEditing(false);
		setSelectedNote(null);
	}, []);

	// Manejar la previsualización en tiempo real
	const handlePreview = useCallback((data: PreviewData) => {
		setPreviewData(data);
	}, []);

	// Limpiar filtros
	const clearFilters = useCallback(() => {
		setSearchQuery('');
		setSelectedCategory(null);
		setOnlyFavorites(false);
	}, []);

	// Extraer categorías únicas de las notas
	const uniqueCategories = Array.from(new Set(notes.map((note) => note.category))).filter(Boolean) as string[];

	// Contenido condicional basado en estado de carga
	if (isLoading) {
		return (
			<Card className="rounded-sm bg-muted/30 border-none">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<p className="text-sm text-muted-foreground">Cargando notas...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="rounded-sm bg-muted/30 border-none">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-3">
						<p className="text-sm text-destructive">Error al cargar notas: {error.message}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-12 gap-3">
			{/* Panel izquierdo: Lista de notas */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="space-y-1 py-2 px-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm flex items-center">
								Notas ({filteredNotes.length})
								{filteredNotes.length !== notes.length && (
									<Badge variant="outline" className="ml-2 text-[10px]">
										Filtradas
									</Badge>
								)}
							</CardTitle>
							<div className="flex items-center gap-1">
								<Popover>
									<PopoverTrigger asChild>
										<Button size="sm" variant="ghost" className="h-6 w-6 p-0">
											<Filter className="h-3.5 w-3.5" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-72" align="end">
										<div className="space-y-4">
											<h4 className="font-medium text-sm">Filtrar Notas</h4>

											<div className="space-y-2">
												<Label htmlFor="search">Buscar</Label>
												<Input
													id="search"
													placeholder="Buscar notas..."
													value={searchQuery}
													onChange={(e) => setSearchQuery(e.target.value)}
													className="h-8 text-xs"
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="category">Categoría</Label>
												<select
													id="category"
													value={selectedCategory || ''}
													onChange={(e) => setSelectedCategory(e.target.value || null)}
													className="w-full h-8 text-xs rounded-md border border-input px-3"
												>
													<option value="">Todas las categorías</option>
													{uniqueCategories.map((category) => (
														<option key={category} value={category}>
															{category}
														</option>
													))}
												</select>
											</div>

											<div className="flex items-center space-x-2">
												<Checkbox
													id="favorites"
													checked={onlyFavorites}
													onCheckedChange={(checked) => setOnlyFavorites(!!checked)}
												/>
												<Label htmlFor="favorites" className="text-xs">
													Solo favoritas
												</Label>
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
									onClick={() => {
										setSelectedNote(null);
										setIsEditing(false);
									}}
									size="sm"
									variant="ghost"
									className="h-6 w-6 p-0"
								>
									<PlusCircle className="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>
						<div className="flex gap-2 text-xs text-muted-foreground">
							<span>{stats.totalNotes} notas</span>
							{stats.favoriteNotes > 0 && (
								<>
									<span>•</span>
									<span>{stats.favoriteNotes} favoritas</span>
								</>
							)}
							{stats.totalImages > 0 && (
								<>
									<span>•</span>
									<span>{stats.totalImages} imágenes</span>
								</>
							)}
							{stats.totalAssociations > 0 && (
								<>
									<span>•</span>
									<span>{stats.totalAssociations} asociaciones</span>
								</>
							)}
							{stats.unusedNotes > 0 && (
								<>
									<span>•</span>
									<span>{stats.unusedNotes} sin imágenes</span>
								</>
							)}
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full px-3 pb-3">
							{filteredNotes.length === 0 ? (
								<EmptyState
									icon={NotebookPen}
									title="No hay notas"
									description={
										notes.length > 0 ? 'No se encontraron notas con los filtros aplicados' : 'Crea tu primera nota'
									}
									className="py-6"
									actions={
										notes.length > 0 && (
											<Button size="sm" variant="outline" onClick={clearFilters}>
												Limpiar filtros
											</Button>
										)
									}
								/>
							) : (
								<div className="space-y-1">
									{filteredNotes.map((note) => (
										<button
											key={note.id}
											className={`flex items-center gap-2 p-1.5 rounded-md transition-colors cursor-pointer hover:bg-muted/50 w-full text-left ${selectedNote?.id === note.id ? 'bg-muted' : ''}`}
											onClick={() => handleEditNote(note)}
											type="button"
											aria-pressed={selectedNote?.id === note.id}
										>
											<div
												className="w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center text-white"
												style={{
													backgroundColor: note.color,
												}}
											>
												<span className="text-xs">{note.emoji}</span>
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="text-xs font-medium truncate">{note.title}</h4>
												<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
													<span>Actualizado {formatDate(note.updatedAt)}</span>
													{note.tags?.length > 0 && (
														<>
															<span>•</span>
															<span>{note.tags.length} etiquetas</span>
														</>
													)}
												</div>
											</div>
											<Button
												variant="ghost"
												size="icon"
												className="h-5 w-5 opacity-0 hover:opacity-100 group-hover:opacity-100"
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteButtonClick(note.id);
												}}
												type="button"
												aria-label="Eliminar nota"
											>
												<Trash className="h-3 w-3 text-gray-500 hover:text-red-500" />
											</Button>
										</button>
									))}
								</div>
							)}
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			{/* Panel derecho: Formulario y Preview */}
			<div className="col-span-12 md:col-span-7 lg:col-span-8">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="py-2 px-3">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-sm">{isEditing ? 'Editar Nota' : 'Nueva Nota'}</CardTitle>
								<CardDescription className="text-xs">
									{isEditing
										? 'Modifica los detalles de la nota seleccionada'
										: 'Completa el formulario para crear una nueva nota'}
								</CardDescription>
							</div>
							<div className="flex gap-1">
								{isEditing && selectedNote && (
									<>
										<Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleReset}>
											Cancelar
										</Button>
										<Button
											variant="destructive"
											size="sm"
											className="h-7 text-xs"
											onClick={() => handleDeleteNote(selectedNote.id)}
										>
											<Trash className="h-3 w-3 mr-1" />
											Eliminar
										</Button>
									</>
								)}
								<Button type="submit" size="sm" className="h-7 text-xs" form="note-form">
									<Save className="h-3 w-3 mr-1" />
									{isEditing ? 'Guardar' : 'Crear'}
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-3 flex-1 overflow-hidden">
						<ScrollArea className="h-full pr-3">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
								<div className="space-y-3">
									<CreateNoteForm
										key={selectedNote?.id || 'new-note'}
										note={selectedNote}
										isEditing={isEditing}
										onCreated={handleNoteCreated}
										onUpdated={handleNoteUpdated}
										onCancel={handleReset}
										onPreview={handlePreview}
									/>
								</div>
								<div className="hidden lg:flex flex-col items-center justify-start">
									<h3 className="text-xs font-medium mb-2">Vista Previa</h3>
									<div className="w-[220px] transition-all duration-300">
										{previewData || selectedNote ? (
											<div className="flex flex-col p-4 border rounded-lg bg-background">
												<div className="flex items-center mb-3 gap-2">
													<div
														className="w-10 h-10 rounded-md flex items-center justify-center text-xl"
														style={{
															backgroundColor:
																previewData?.color || (selectedNote as NoteWithStats)?.color || '#3b82f6',
														}}
													>
														{previewData?.emoji || (selectedNote as NoteWithStats)?.emoji || '📝'}
													</div>
													<div className="flex-1">
														<h3 className="text-md font-medium">
															{previewData?.name || selectedNote?.title || 'Nueva Nota'}
														</h3>
														{(previewData?.category || selectedNote?.category) && (
															<p className="text-xs text-muted-foreground">
																{previewData?.category || selectedNote?.category}
															</p>
														)}
													</div>
												</div>

												{(previewData?.content || (selectedNote as NoteWithStats)?.summary) && (
													<p className="text-muted-foreground text-sm mb-3">
														{previewData?.content || (selectedNote as NoteWithStats)?.summary}
													</p>
												)}

												<div className="bg-muted p-3 rounded-md text-xs max-h-[200px] overflow-y-auto mb-3">
													<div className="prose prose-sm prose-stone dark:prose-invert">
														{previewData?.content ||
															selectedNote?.content ||
															'El contenido de la nota aparecerá aquí...'}
													</div>
												</div>

												<div className="flex flex-wrap gap-2 mt-auto">
													{(previewData?.isFavorite || selectedNote?.isFavorite) && (
														<Badge variant="outline" className="text-xs">
															Favorita
														</Badge>
													)}
												</div>
											</div>
										) : (
											<div className="flex flex-col items-center justify-center h-[300px] bg-muted/50 rounded-lg border border-dashed">
												<NotebookPen className="h-7 w-7 text-muted-foreground/50" />
												<p className="text-[10px] text-muted-foreground mt-2">Vista previa</p>
											</div>
										)}
									</div>
								</div>
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
