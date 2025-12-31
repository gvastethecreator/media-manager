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
			totalImages: notes.reduce((acc, note) => acc + (note.stats?.imageCount || 0), 0),
			totalAssociations: notes.reduce((acc, note) => acc + (note.stats?.totalAssociations || 0), 0),
			unusedNotes: notes.filter((note) => (note.stats?.imageCount || 0) === 0).length,
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
			<Card className="rounded-dt-md border-none bg-muted/30 shadow-sm">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<p className="text-muted-foreground text-sm">Cargando notas...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="rounded-dt-md border-none bg-muted/30 shadow-sm">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-3">
						<p className="text-destructive text-sm">Error al cargar notas: {error.message}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-12 gap-3">
			{/* Panel izquierdo: Lista de notas */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="flex h-[calc(100vh-8rem)] flex-col rounded-dt-md border-none bg-muted/30 shadow-sm">
					<CardHeader className="space-y-1 px-3 py-2">
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center text-heading-sm">
								Notas ({filteredNotes.length})
								{filteredNotes.length !== notes.length && (
									<Badge className="ml-2 text-[10px]" variant="outline">
										Filtradas
									</Badge>
								)}
							</CardTitle>
							<div className="flex items-center gap-1">
								<Popover>
									<PopoverTrigger asChild>
										<Button className="h-6 w-6 p-0" size="sm" variant="ghost">
											<Filter className="h-3.5 w-3.5" />
										</Button>
									</PopoverTrigger>
									<PopoverContent align="end" className="w-72">
										<div className="space-y-4">
											<h4 className="font-medium text-sm">Filtrar Notas</h4>

											<div className="space-y-2">
												<Label htmlFor="search">Buscar</Label>
												<Input
													className="h-8 text-xs"
													id="search"
													onChange={(e) => setSearchQuery(e.target.value)}
													placeholder="Buscar notas..."
													value={searchQuery}
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="category">Categoría</Label>
												<select
													className="h-8 w-full rounded-md border border-input px-3 text-xs"
													id="category"
													onChange={(e) => setSelectedCategory(e.target.value || null)}
													value={selectedCategory || ''}
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
													checked={onlyFavorites}
													id="favorites"
													onCheckedChange={(checked) => setOnlyFavorites(!!checked)}
												/>
												<Label className="text-xs" htmlFor="favorites">
													Solo favoritas
												</Label>
											</div>

											<div className="flex justify-between">
												<Button className="h-8 text-xs" onClick={clearFilters} size="sm" variant="outline">
													Limpiar filtros
												</Button>
												<Button className="h-8 text-xs" size="sm">
													Aplicar
												</Button>
											</div>
										</div>
									</PopoverContent>
								</Popover>
								<Button
									className="h-6 w-6 p-0"
									onClick={() => {
										setSelectedNote(null);
										setIsEditing(false);
									}}
									size="sm"
									variant="ghost"
								>
									<PlusCircle className="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>
						<div className="flex gap-2 text-caption text-muted-foreground">
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
									actions={
										notes.length > 0 && (
											<Button onClick={clearFilters} size="sm" variant="outline">
												Limpiar filtros
											</Button>
										)
									}
									className="py-6"
									description={
										notes.length > 0 ? 'No se encontraron notas con los filtros aplicados' : 'Crea tu primera nota'
									}
									icon={NotebookPen}
									title="No hay notas"
								/>
							) : (
								<div className="space-y-1">
									{filteredNotes.map((note) => (
										<button
											aria-pressed={selectedNote?.id === note.id}
											className={`flex w-full cursor-pointer items-center gap-2 rounded-md p-1.5 text-left transition-colors hover:bg-muted/50 ${selectedNote?.id === note.id ? 'bg-muted' : ''}`}
											key={note.id}
											onClick={() => handleEditNote(note)}
											type="button"
										>
											<div
												className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white"
												style={{
													backgroundColor: note.color || '#3b82f6',
												}}
											>
												<span className="text-xs">{note.emoji}</span>
											</div>
											<div className="min-w-0 flex-1">
												<h4 className="truncate font-medium text-body-sm">{note.title}</h4>
												<div className="flex items-center gap-1 text-caption text-muted-foreground">
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
												aria-label="Eliminar nota"
												className="h-5 w-5 opacity-0 hover:opacity-100 group-hover:opacity-100"
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteButtonClick(note.id);
												}}
												size="icon"
												type="button"
												variant="ghost"
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
				<Card className="flex h-[calc(100vh-8rem)] flex-col rounded-dt-md border-none bg-muted/30 shadow-sm">
					<CardHeader className="px-3 py-2">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-heading-sm">{isEditing ? 'Editar Nota' : 'Nueva Nota'}</CardTitle>
								<CardDescription className="text-caption">
									{isEditing
										? 'Modifica los detalles de la nota seleccionada'
										: 'Completa el formulario para crear una nueva nota'}
								</CardDescription>
							</div>
							<div className="flex gap-1">
								{isEditing && selectedNote && (
									<>
										<Button className="h-7 text-xs" onClick={handleReset} size="sm" variant="outline">
											Cancelar
										</Button>
										<Button
											className="h-7 text-xs"
											onClick={() => handleDeleteNote(selectedNote.id)}
											size="sm"
											variant="destructive"
										>
											<Trash className="mr-1 h-3 w-3" />
											Eliminar
										</Button>
									</>
								)}
								<Button className="h-7 text-xs" form="note-form" size="sm" type="submit">
									<Save className="mr-1 h-3 w-3" />
									{isEditing ? 'Guardar' : 'Crear'}
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="flex-1 overflow-hidden p-3">
						<ScrollArea className="h-full pr-3">
							<div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
								<div className="space-y-3">
									<CreateNoteForm
										isEditing={isEditing}
										key={selectedNote?.id || 'new-note'}
										note={selectedNote}
										onCancel={handleReset}
										onPreview={handlePreview}
										onSuccess={handleNoteCreated}
										onUpdated={handleNoteUpdated}
									/>
								</div>
								<div className="hidden flex-col items-center justify-start lg:flex">
									<h3 className="mb-2 font-medium text-caption">Vista Previa</h3>
									<div className="w-55 transition-all duration-300">
										{previewData || selectedNote ? (
											<div className="flex flex-col rounded-dt-md border bg-background p-4">
												<div className="mb-3 flex items-center gap-2">
													<div
														className="flex h-10 w-10 items-center justify-center rounded-md text-xl"
														style={{
															backgroundColor:
																previewData?.color || (selectedNote as NoteWithStats)?.color || '#3b82f6',
														}}
													>
														{previewData?.emoji || (selectedNote as NoteWithStats)?.emoji || '📝'}
													</div>
													<div className="flex-1">
														<h3 className="font-medium text-md">
															{previewData?.name || selectedNote?.title || 'Nueva Nota'}
														</h3>
														{(previewData?.category || selectedNote?.category) && (
															<p className="text-muted-foreground text-xs">
																{previewData?.category || selectedNote?.category}
															</p>
														)}
													</div>
												</div>

												{(previewData?.content || (selectedNote as NoteWithStats)?.summary) && (
													<p className="mb-3 text-muted-foreground text-sm">
														{previewData?.content || (selectedNote as NoteWithStats)?.summary}
													</p>
												)}

												<div className="mb-3 max-h-[200px] overflow-y-auto rounded-md bg-muted p-3 text-xs">
													<div className="prose prose-sm prose-stone dark:prose-invert">
														{previewData?.content ||
															selectedNote?.content ||
															'El contenido de la nota aparecerá aquí...'}
													</div>
												</div>

												<div className="mt-auto flex flex-wrap gap-2">
													{(previewData?.isFavorite || selectedNote?.isFavorite) && (
														<Badge className="text-xs" variant="outline">
															Favorita
														</Badge>
													)}
												</div>
											</div>
										) : (
											<div className="flex h-75 flex-col items-center justify-center rounded-dt-md border border-dashed bg-muted/50">
												<NotebookPen className="h-7 w-7 text-muted-foreground/50" />
												<p className="mt-2 text-caption text-muted-foreground">Vista previa</p>
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
