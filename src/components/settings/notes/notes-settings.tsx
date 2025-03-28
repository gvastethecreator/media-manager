'use client';

import { deleteNote, getNotes } from '@/app/actions/notes/note.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import toastService from '@/services/toast.service';
import { Note } from '@/types/entities/notes';
import { FileText, Filter, Info, Loader2, PlusCircle, Save, Trash } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreateNoteForm } from './create-note-form';

// Actualizar el tipo Note para incluir propiedades auxiliares
interface ExtendedNote extends Note {
	color?: string;
	emoji?: string;
	summary?: string;
	_count?: {
		images?: number;
		concepts?: number;
		prompts?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
	};
}

export function NotesSettings() {
	const [notes, setNotes] = useState<ExtendedNote[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedNote, setSelectedNote] = useState<ExtendedNote | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [previewData, setPreviewData] = useState<any>(null);

	// Filtros
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [onlyFavorites, setOnlyFavorites] = useState(false);

	// Cargar notas al montar el componente
	useEffect(() => {
		const loadNotes = async () => {
			try {
				setIsLoading(true);
				const data = await getNotes();
				setNotes(data);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				setError(errorMessage);
				toastService.error('Error al cargar las notas', {
					description: errorMessage,
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadNotes();
	}, []);

	// Calcular estadísticas generales
	const stats = useMemo(() => ({
		total: notes.length,
		favorites: notes.filter(note => note.isFavorite).length,
		withRelations: notes.filter(note =>
			(note._count?.images || 0) > 0 ||
			(note._count?.concepts || 0) > 0 ||
			(note._count?.prompts || 0) > 0
		).length,
	}), [notes]);

	// Filtrar notas basados en los criterios seleccionados
	const getFilteredNotes = useCallback(() => {
		return notes.filter(note => {
			let matches = true;

			// Filtrar por búsqueda
			if (searchQuery) {
				const normalizedQuery = searchQuery.toLowerCase();
				matches = matches && Boolean(
					note.title.toLowerCase().includes(normalizedQuery) ||
					(note.content && note.content.toLowerCase().includes(normalizedQuery))
				);
			}

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
	}, [notes, searchQuery, selectedCategory, onlyFavorites]);

	// Memoizar los resultados filtrados para evitar cálculos repetidos
	const filteredNotes = useMemo(() => getFilteredNotes(), [getFilteredNotes]);

	// Manejar eliminación de nota
	const handleDeleteNote = useCallback(async (id: string) => {
		try {
			await deleteNote(id);
			setNotes(prev => prev.filter(note => note.id !== id));
			setSelectedNote(null);
			setIsEditing(false);
			toastService.success('Nota eliminada');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al eliminar la nota', {
				description: errorMessage,
			});
		}
	}, []);

	// Manejar edición de nota
	const handleEditNote = useCallback((note: ExtendedNote) => {
		setSelectedNote(note);
		setIsEditing(true);
	}, []);

	// Manejar creación exitosa
	const handleNoteCreated = useCallback((newNote: ExtendedNote) => {
		setNotes(prev => [
			{
				...newNote,
				_count: {
					images: 0,
					concepts: 0,
					prompts: 0,
					characters: 0,
					places: 0,
					worldItems: 0
				}
			} as ExtendedNote,
			...prev
		]);
		toastService.success('Nota creada');
	}, []);

	// Manejar actualización exitosa
	const handleNoteUpdated = useCallback((updatedNote: ExtendedNote) => {
		setNotes(prev =>
			prev.map(note =>
				note.id === updatedNote.id
					? { ...note, ...updatedNote } as ExtendedNote
					: note
			)
		);
		toastService.success('Nota actualizada');
	}, []);

	// Resetear formulario
	const handleReset = useCallback(() => {
		setIsEditing(false);
		setSelectedNote(null);
	}, []);

	// Manejar la previsualización en tiempo real
	const handlePreview = useCallback((data: any) => {
		setPreviewData(data);
	}, []);

	// Limpiar filtros
	const clearFilters = useCallback(() => {
		setSearchQuery('');
		setSelectedCategory(null);
		setOnlyFavorites(false);
	}, []);

	// Extraer categorías únicas de las notas
	const uniqueCategories = useMemo(() =>
		Array.from(new Set(notes.map(note => note.category).filter(Boolean))) as string[],
		[notes]);

	// Componente de botón de eliminación
	const DeleteButton = ({ noteId }: { noteId: string }) => {
		return (
			<div
				className="h-5 w-5 opacity-0 hover:opacity-100 group-hover:opacity-100 cursor-pointer flex items-center justify-center"
				onClick={(e) => {
					e.stopPropagation();
					handleDeleteNote(noteId);
				}}
			>
				<Trash className="h-3 w-3 text-gray-500 hover:text-red-500" />
			</div>
		);
	};

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
					<EmptyState
						icon={Info}
						title="Error al cargar notas"
						description={error}
						actions={
							<Button onClick={() => window.location.reload()}>
								Intentar de nuevo
							</Button>
						}
					/>
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
										<Button
											size="sm"
											variant="ghost"
											className="h-6 w-6 p-0"
										>
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
													{uniqueCategories.map(category => (
														<option key={category} value={category}>{category}</option>
													))}
												</select>
											</div>

											<div className="flex items-center space-x-2">
												<Checkbox
													id="favorites"
													checked={onlyFavorites}
													onCheckedChange={(checked) => setOnlyFavorites(!!checked)}
												/>
												<Label htmlFor="favorites" className="text-xs">Solo favoritas</Label>
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
									onClick={() => { setSelectedNote(null); setIsEditing(false); }}
									size="sm"
									variant="ghost"
									className="h-6 w-6 p-0"
								>
									<PlusCircle className="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>
						<div className="flex gap-2 text-xs text-muted-foreground">
							<span>{stats.total} notas</span>
							{stats.favorites > 0 && (
								<>
									<span>•</span>
									<span>{stats.favorites} favoritas</span>
								</>
							)}
							{stats.withRelations > 0 && (
								<>
									<span>•</span>
									<span>{stats.withRelations} con relaciones</span>
								</>
							)}
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full px-3 pb-3">
							{filteredNotes.length === 0 ? (
								<EmptyState
									icon={FileText}
									title="No hay notas"
									description={
										notes.length > 0
											? "No se encontraron notas con los filtros aplicados"
											: "Crea tu primera nota"
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
										<div
											key={note.id}
											className={`flex items-center gap-2 p-1.5 rounded-md transition-colors cursor-pointer hover:bg-muted/50 ${selectedNote?.id === note.id ? 'bg-muted' : ''}`}
											onClick={() => handleEditNote(note as ExtendedNote)}
										>
											<div
												className="w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center text-white"
												style={{ backgroundColor: (note as ExtendedNote).color || '#3b82f6' }}
											>
												{(note as ExtendedNote).emoji || '📝'}
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="text-xs font-medium truncate">{note.title}</h4>
												<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
													{note.category && (
														<span>{note.category}</span>
													)}
													{(note._count?.concepts && note._count.concepts > 0) && (
														<>
															<span>•</span>
															<span>{note._count.concepts} conceptos</span>
														</>
													)}
													{note.isFavorite && (
														<>
															<span>•</span>
															<span className="text-yellow-500">★</span>
														</>
													)}
												</div>
											</div>
											<DeleteButton noteId={note.id} />
										</div>
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
								<CardTitle className="text-sm">
									{isEditing ? 'Editar Nota' : 'Nueva Nota'}
								</CardTitle>
								<CardDescription className="text-xs">
									{isEditing
										? 'Modifica los detalles de la nota seleccionada'
										: 'Completa el formulario para crear una nueva nota'}
								</CardDescription>
							</div>
							<div className="flex gap-1">
								{isEditing && selectedNote && (
									<>
										<Button
											variant="outline"
											size="sm"
											className="h-7 text-xs"
											onClick={handleReset}
										>
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
								<Button
									type="submit"
									size="sm"
									className="h-7 text-xs"
									form="note-form"
								>
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
													<div className="w-10 h-10 rounded-md flex items-center justify-center text-xl"
														style={{ backgroundColor: (previewData?.color || (selectedNote as ExtendedNote)?.color || '#3b82f6') }}>
														{previewData?.emoji || (selectedNote as ExtendedNote)?.emoji || '📝'}
													</div>
													<div className="flex-1">
														<h3 className="text-md font-medium">
															{previewData?.title || selectedNote?.title || 'Nueva Nota'}
														</h3>
														{(previewData?.category || selectedNote?.category) && (
															<p className="text-xs text-muted-foreground">
																{previewData?.category || selectedNote?.category}
															</p>
														)}
													</div>
												</div>

												{(previewData?.summary || (selectedNote as ExtendedNote)?.summary) && (
													<p className="text-muted-foreground text-sm mb-3">
														{previewData?.summary || (selectedNote as ExtendedNote)?.summary}
													</p>
												)}

												<div className="bg-muted p-3 rounded-md text-xs max-h-[200px] overflow-y-auto mb-3">
													<div className="prose prose-sm prose-stone dark:prose-invert">
														{previewData?.content || selectedNote?.content || 'El contenido de la nota aparecerá aquí...'}
													</div>
												</div>

												<div className="flex flex-wrap gap-2 mt-auto">
													{(previewData?.isFavorite || selectedNote?.isFavorite) && (
														<Badge variant="outline" className="text-xs">Favorita</Badge>
													)}
												</div>
											</div>
										) : (
											<div className="flex flex-col items-center justify-center h-[300px] bg-muted/50 rounded-lg border border-dashed">
												<FileText className="h-7 w-7 text-muted-foreground/50" />
												<p className="text-[10px] text-muted-foreground mt-2">
													Vista previa
												</p>
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
