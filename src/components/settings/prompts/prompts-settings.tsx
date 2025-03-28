'use client';

import { deletePrompt, getPrompts } from '@/app/actions/prompts/prompt.actions';
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
import { toast } from '@/services/toast.service';
import { Prompt, PromptWithStats } from '@/types/entities/prompt/base';
import { Filter, Info, Loader2, MessageSquare, PlusCircle, Save, Trash } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreatePromptForm } from './create-prompt-form';

export function PromptsSettings() {
	const [prompts, setPrompts] = useState<PromptWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [previewData, setPreviewData] = useState<any>(null);

	// Filtros
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [onlyFavorites, setOnlyFavorites] = useState(false);

	// Cargar prompts al montar el componente
	useEffect(() => {
		const loadPrompts = async () => {
			try {
				setIsLoading(true);
				const data = await getPrompts();
				setPrompts(data);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				setError(errorMessage);
				toast.error('Error al cargar los prompts', {
					description: errorMessage,
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadPrompts();
	}, []);

	// Calcular estadísticas generales
	const stats = useMemo(() => ({
		total: prompts.length,
		favorites: prompts.filter(prompt => prompt.isFavorite).length,
		withRelations: prompts.filter(prompt =>
			(prompt._count?.images || 0) > 0 ||
			(prompt._count?.usages || 0) > 0 ||
			(prompt._count?.concepts || 0) > 0
		).length,
	}), [prompts]);

	// Filtrar prompts basados en los criterios seleccionados
	const getFilteredPrompts = useCallback(() => {
		return prompts.filter(prompt => {
			let matches = true;

			// Filtrar por búsqueda
			if (searchQuery) {
				const normalizedQuery = searchQuery.toLowerCase();
				matches = matches && (
					prompt.name.toLowerCase().includes(normalizedQuery) ||
					(prompt.description && prompt.description.toLowerCase().includes(normalizedQuery)) ||
					(prompt.content && prompt.content.toLowerCase().includes(normalizedQuery))
				);
			}

			// Filtrar por categoría
			if (selectedCategory) {
				matches = matches && prompt.category === selectedCategory;
			}

			// Filtrar por favoritos
			if (onlyFavorites) {
				matches = matches && !!prompt.isFavorite;
			}

			return matches;
		});
	}, [prompts, searchQuery, selectedCategory, onlyFavorites]);

	// Memoizar los resultados filtrados para evitar cálculos repetidos
	const filteredPrompts = useMemo(() => getFilteredPrompts(), [getFilteredPrompts]);

	// Manejar eliminación de prompt
	const handleDeletePrompt = useCallback(async (id: string) => {
		try {
			await deletePrompt(id);
			setPrompts(prev => prev.filter(prompt => prompt.id !== id));
			setSelectedPrompt(null);
			setIsEditing(false);
			toast.success('Prompt eliminado');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toast.error('Error al eliminar el prompt', {
				description: errorMessage,
			});
		}
	}, []);

	// Manejar edición de prompt
	const handleEditPrompt = useCallback((prompt: Prompt) => {
		setSelectedPrompt(prompt);
		setIsEditing(true);
	}, []);

	// Manejar creación exitosa
	const handlePromptCreated = useCallback((newPrompt: Prompt) => {
		setPrompts(prev => [
			{
				...newPrompt,
				_count: {
					images: 0,
					usages: 0,
					concepts: 0,
					notes: 0,
					characters: 0,
					places: 0,
					worldItems: 0
				}
			} as PromptWithStats,
			...prev
		]);
		toast.success('Prompt creado');
	}, []);

	// Manejar actualización exitosa
	const handlePromptUpdated = useCallback((updatedPrompt: Prompt) => {
		setPrompts(prev =>
			prev.map(prompt =>
				prompt.id === updatedPrompt.id
					? { ...prompt, ...updatedPrompt } as PromptWithStats
					: prompt
			)
		);
		toast.success('Prompt actualizado');
	}, []);

	// Resetear formulario
	const handleReset = useCallback(() => {
		setIsEditing(false);
		setSelectedPrompt(null);
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

	// Extraer categorías únicas de los prompts
	const uniqueCategories = useMemo(() =>
		Array.from(new Set(prompts.map(prompt => prompt.category).filter(Boolean))) as string[],
		[prompts]);

	// Contenido condicional basado en estado de carga
	if (isLoading) {
		return (
			<Card className="rounded-sm bg-muted/30 border-none">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<p className="text-sm text-muted-foreground">Cargando prompts...</p>
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
						title="Error al cargar prompts"
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
			{/* Panel izquierdo: Lista de prompts */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="space-y-1 py-2 px-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm flex items-center">
								Prompts ({filteredPrompts.length})
								{filteredPrompts.length !== prompts.length && (
									<Badge variant="outline" className="ml-2 text-[10px]">
										Filtrados
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
											<h4 className="font-medium text-sm">Filtrar Prompts</h4>

											<div className="space-y-2">
												<Label htmlFor="search">Buscar</Label>
												<Input
													id="search"
													placeholder="Buscar prompts..."
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
												<Label htmlFor="favorites" className="text-xs">Solo favoritos</Label>
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
									onClick={() => { setSelectedPrompt(null); setIsEditing(false); }}
									size="sm"
									variant="ghost"
									className="h-6 w-6 p-0"
								>
									<PlusCircle className="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>
						<div className="flex gap-2 text-xs text-muted-foreground">
							<span>{stats.total} prompts</span>
							{stats.favorites > 0 && (
								<>
									<span>•</span>
									<span>{stats.favorites} favoritos</span>
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
							{filteredPrompts.length === 0 ? (
								<EmptyState
									icon={MessageSquare}
									title="No hay prompts"
									description={
										prompts.length > 0
											? "No se encontraron prompts con los filtros aplicados"
											: "Crea tu primer prompt"
									}
									className="py-6"
									actions={
										prompts.length > 0 && (
											<Button size="sm" variant="outline" onClick={clearFilters}>
												Limpiar filtros
											</Button>
										)
									}
								/>
							) : (
								<div className="space-y-1">
									{filteredPrompts.map((prompt) => (
										<div
											key={prompt.id}
											className={`flex items-center gap-2 p-1.5 rounded-md transition-colors cursor-pointer hover:bg-muted/50 ${selectedPrompt?.id === prompt.id ? 'bg-muted' : ''}`}
											onClick={() => handleEditPrompt(prompt as unknown as Prompt)}
										>
											<div
												className="w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center text-white"
												style={{ backgroundColor: prompt.color || '#3b82f6' }}
											>
												{prompt.emoji || '💬'}
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="text-xs font-medium truncate">{prompt.name}</h4>
												<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
													{prompt.category && (
														<span>{prompt.category}</span>
													)}
													{(prompt._count?.usages || 0) > 0 && (
														<>
															<span>•</span>
															<span>{prompt._count.usages} usos</span>
														</>
													)}
													{prompt.isFavorite && (
														<>
															<span>•</span>
															<span className="text-yellow-500">★</span>
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
													handleDeletePrompt(prompt.id);
												}}
											>
												<Trash className="h-3 w-3" />
											</Button>
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
									{isEditing ? 'Editar Prompt' : 'Nuevo Prompt'}
								</CardTitle>
								<CardDescription className="text-xs">
									{isEditing
										? 'Modifica los detalles del prompt seleccionado'
										: 'Completa el formulario para crear un nuevo prompt'}
								</CardDescription>
							</div>
							<div className="flex gap-1">
								{isEditing && selectedPrompt && (
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
											onClick={() => handleDeletePrompt(selectedPrompt.id)}
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
									form="prompt-form"
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
									<CreatePromptForm
										key={selectedPrompt?.id || 'new-prompt'}
										prompt={selectedPrompt}
										isEditing={isEditing}
										onCreated={handlePromptCreated}
										onUpdated={handlePromptUpdated}
										onCancel={handleReset}
										onPreview={handlePreview}
									/>
								</div>
								<div className="hidden lg:flex flex-col items-center justify-start">
									<h3 className="text-xs font-medium mb-2">Vista Previa</h3>
									<div className="w-[220px] transition-all duration-300">
										{previewData || selectedPrompt ? (
											<div className="flex flex-col p-4 border rounded-lg bg-background">
												<div className="flex items-center mb-3 gap-2">
													<div className="w-10 h-10 rounded-md flex items-center justify-center text-xl"
														style={{ backgroundColor: (previewData?.color || selectedPrompt?.color || '#3b82f6') }}>
														{previewData?.emoji || selectedPrompt?.emoji || '💬'}
													</div>
													<div className="flex-1">
														<h3 className="text-md font-medium">
															{previewData?.name || selectedPrompt?.name || 'Nuevo Prompt'}
														</h3>
														{(previewData?.category || selectedPrompt?.category) && (
															<p className="text-xs text-muted-foreground">
																{previewData?.category || selectedPrompt?.category}
															</p>
														)}
													</div>
												</div>

												<p className="text-muted-foreground text-sm mb-3">
													{previewData?.description || selectedPrompt?.description || 'Sin descripción'}
												</p>

												<div className="bg-muted p-3 rounded-md text-xs whitespace-pre-wrap max-h-[200px] overflow-y-auto mb-3">
													{previewData?.content || selectedPrompt?.content || 'El contenido del prompt aparecerá aquí...'}
												</div>

												<div className="flex flex-wrap gap-2 mt-auto">
													{(previewData?.model || selectedPrompt?.model) && (
														<Badge variant="secondary" className="text-xs">
															{previewData?.model || selectedPrompt?.model}
														</Badge>
													)}
													{(previewData?.isFavorite || selectedPrompt?.isFavorite) && (
														<Badge variant="outline" className="text-xs">Favorito</Badge>
													)}
												</div>
											</div>
										) : (
											<div className="flex flex-col items-center justify-center h-[300px] bg-muted/50 rounded-lg border border-dashed">
												<MessageSquare className="h-7 w-7 text-muted-foreground/50" />
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
