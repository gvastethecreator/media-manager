import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConcepts, useDeleteConcept } from '@/lib/api/concepts';
import toastService from '@/services/toast';
import type { ConceptWithStats } from '@/types/entities/concept';
import { Filter, LightbulbIcon, Loader2, PlusCircle, Save, Trash } from 'lucide-react';
import { useCallback, useId, useMemo, useState } from 'react';
import { CreateConceptForm } from './create-concept-form';

// Tipos seguros para preview data
interface PreviewData {
	name?: string;
	description?: string;
	content?: string;
	color?: string;
	emoji?: string;
	category?: string;
	isFavorite?: boolean;
}

export function ConceptsSettings() {
	const [selectedConcept, setSelectedConcept] = useState<ConceptWithStats | null>(null);
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
	const { data: conceptsResponse, isLoading, error } = useConcepts({ search: searchQuery });
	const deleteConceptMutation = useDeleteConcept();

	const concepts = conceptsResponse?.data || [];

	// Calcular estadísticas generales
	const stats = useMemo(() => {
		return {
			totalConcepts: concepts.length,
			totalImages: concepts.reduce((acc, concept) => acc + (concept.statistics?.totalImages || 0), 0),
			totalAssociations: concepts.reduce((acc, concept) => acc + (concept.statistics?.totalAssociations || 0), 0),
			unusedConcepts: concepts.filter((concept) => (concept.statistics?.totalImages || 0) === 0).length,
			favoriteConcepts: concepts.filter((concept) => concept.isFavorite).length,
		};
	}, [concepts]);

	// Filtrar conceptos basados en los criterios seleccionados
	const getFilteredConcepts = useCallback(() => {
		return concepts.filter((concept) => {
			let matches = true;

			// Filtrar por categoría
			if (selectedCategory) {
				matches = matches && concept.category === selectedCategory;
			}

			// Filtrar por favoritos
			if (onlyFavorites) {
				matches = matches && !!concept.isFavorite;
			}

			return matches;
		});
	}, [concepts, selectedCategory, onlyFavorites]);

	// Memoizar los resultados filtrados para evitar cálculos repetidos
	const filteredConcepts = useMemo(() => getFilteredConcepts(), [getFilteredConcepts]);

	// Manejar eliminación de concepto
	const handleDeleteConcept = useCallback(
		async (id: string) => {
			try {
				await deleteConceptMutation.mutateAsync(id);
				setSelectedConcept(null);
				setIsEditing(false);
				toastService.success('Concepto eliminado');
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				toastService.error('Error al eliminar el concepto', {
					description: errorMessage,
				});
			}
		},
		[deleteConceptMutation]
	);

	// Manejar edición de concepto
	const handleEditConcept = useCallback((concept: ConceptWithStats) => {
		setSelectedConcept(concept);
		setIsEditing(true);
	}, []);

	// Manejar la eliminación desde el botón con detención de propagación de eventos
	const handleDeleteButtonClick = useCallback(
		(conceptId: string) => {
			handleDeleteConcept(conceptId);
		},
		[handleDeleteConcept]
	);

	// Manejar creación exitosa
	const handleConceptCreated = useCallback((newConcept: ConceptWithStats) => {
		toastService.success('Concepto creado');
	}, []);

	// Manejar actualización exitosa
	const handleConceptUpdated = useCallback((updatedConcept: ConceptWithStats) => {
		toastService.success('Concepto actualizado');
	}, []);

	// Resetear formulario
	const handleReset = useCallback(() => {
		setIsEditing(false);
		setSelectedConcept(null);
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

	// Extraer categorías únicas de los conceptos
	const uniqueCategories = Array.from(new Set(concepts.map((concept) => concept.category))).filter(Boolean) as string[];

	// Contenido condicional basado en estado de carga
	if (isLoading) {
		return (
			<Card className="rounded-sm bg-muted/30 border-none">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<p className="text-sm text-muted-foreground">Cargando conceptos...</p>
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
						<p className="text-sm text-destructive">Error al cargar conceptos: {error.message}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-12 gap-3">
			{/* Panel izquierdo: Lista de conceptos */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="space-y-1 py-2 px-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm flex items-center">
								Conceptos ({filteredConcepts.length})
								{filteredConcepts.length !== concepts.length && (
									<Badge variant="outline" className="ml-2 text-[10px]">
										Filtrados
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
											<h4 className="font-medium text-sm">Filtrar Conceptos</h4>

											<div className="space-y-2">
												<Label htmlFor={searchInputId}>Buscar</Label>
												<Input
													id={searchInputId}
													placeholder="Buscar conceptos..."
													value={searchQuery}
													onChange={(e) => setSearchQuery(e.target.value)}
													className="h-8 text-xs"
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor={categorySelectId}>Categoría</Label>
												<select
													id={categorySelectId}
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
													id={favoritesCheckboxId}
													checked={onlyFavorites}
													onCheckedChange={(checked) => setOnlyFavorites(!!checked)}
												/>
												<Label htmlFor={favoritesCheckboxId} className="text-xs">
													Solo favoritos
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
										setSelectedConcept(null);
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
							<span>{stats.totalConcepts} conceptos</span>
							{stats.favoriteConcepts > 0 && (
								<>
									<span>•</span>
									<span>{stats.favoriteConcepts} favoritos</span>
								</>
							)}
							{stats.unusedConcepts > 0 && (
								<>
									<span>•</span>
									<span>{stats.unusedConcepts} sin imágenes</span>
								</>
							)}
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full px-3 pb-3">
							{filteredConcepts.length === 0 ? (
								<EmptyState
									icon={LightbulbIcon}
									title="No hay conceptos"
									description={
										concepts.length > 0
											? 'No se encontraron conceptos con los filtros aplicados'
											: 'Crea tu primer concepto'
									}
									className="py-6"
									actions={
										concepts.length > 0 && (
											<Button size="sm" variant="outline" onClick={clearFilters}>
												Limpiar filtros
											</Button>
										)
									}
								/>
							) : (
								<div className="space-y-1">
									{filteredConcepts.map((concept) => (
										<div
											key={concept.id}
											className={`relative group/item flex items-center gap-2 p-1.5 rounded-md transition-colors hover:bg-muted/50 w-full ${selectedConcept?.id === concept.id ? 'bg-muted' : ''}`}
										>
											<button
												className="flex items-center gap-2 w-full text-left cursor-pointer"
												onClick={() => handleEditConcept(concept)}
												type="button"
												aria-pressed={selectedConcept?.id === concept.id}
											>
												<div
													className="w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center text-white"
													style={{
														backgroundColor: concept.color,
													}}
												>
													<span className="text-xs">{concept.emoji}</span>
												</div>
												<div className="flex-1 min-w-0">
													<h4 className="text-xs font-medium truncate">{concept.name}</h4>
													<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
														<span>{concept.statistics?.totalImages || 0} imágenes</span>
														{concept.category && (
															<>
																<span>•</span>
																<span>{concept.category}</span>
															</>
														)}
													</div>
												</div>
											</button>
											<Button
												variant="ghost"
												size="icon"
												type="button"
												className="h-5 w-5 opacity-0 group-hover/item:opacity-100 absolute right-1"
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteConcept(concept.id);
												}}
											>
												<Trash className="h-3 w-3 text-gray-500 hover:text-red-500" />
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
								<CardTitle className="text-sm">{isEditing ? 'Editar Concepto' : 'Nuevo Concepto'}</CardTitle>
								<CardDescription className="text-xs">
									{isEditing
										? 'Modifica los detalles del concepto seleccionado'
										: 'Completa el formulario para crear un nuevo concepto'}
								</CardDescription>
							</div>
							<div className="flex gap-1">
								{isEditing && selectedConcept && (
									<>
										<Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleReset}>
											Cancelar
										</Button>
										<Button
											variant="destructive"
											size="sm"
											className="h-7 text-xs"
											onClick={() => handleDeleteConcept(selectedConcept.id)}
										>
											<Trash className="h-3 w-3 mr-1" />
											Eliminar
										</Button>
									</>
								)}
								<Button type="submit" size="sm" className="h-7 text-xs" form="concept-form">
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
									<CreateConceptForm
										key={selectedConcept?.id || 'new-concept'}
										concept={selectedConcept}
										isEditing={isEditing}
										onCreated={handleConceptCreated}
										onUpdated={handleConceptUpdated}
										onCancel={handleReset}
										onPreview={handlePreview}
									/>
								</div>
								<div className="hidden lg:flex flex-col items-center justify-start">
									<h3 className="text-xs font-medium mb-2">Vista Previa</h3>
									<div className="w-[180px] transition-all duration-300">
										{previewData || selectedConcept ? (
											<div className="flex flex-col items-center p-4 border rounded-lg bg-background">
												<div
													className="w-12 h-12 mb-3 rounded-full flex items-center justify-center text-2xl"
													style={{ backgroundColor: previewData?.color || selectedConcept?.color || '#3b82f6' }}
												>
													{previewData?.emoji || selectedConcept?.emoji || '💡'}
												</div>
												<h3 className="text-lg font-medium">
													{previewData?.name || selectedConcept?.name || 'Nuevo Concepto'}
												</h3>
												<p className="text-center text-muted-foreground mt-2 text-sm">
													{previewData?.description || selectedConcept?.description || 'Sin descripción'}
												</p>

												<div className="flex flex-wrap gap-2 mt-3 justify-center">
													<Badge variant="secondary" className="text-xs">
														{previewData?.category || selectedConcept?.category || 'general'}
													</Badge>
													{(previewData?.isFavorite || selectedConcept?.isFavorite) && (
														<Badge variant="outline" className="text-xs">
															Favorito
														</Badge>
													)}
												</div>

												{(previewData?.content || selectedConcept?.content) && (
													<div className="mt-4 p-2 text-xs bg-muted rounded w-full">
														<p className="line-clamp-3">{previewData?.content || selectedConcept?.content}</p>
													</div>
												)}
											</div>
										) : (
											<div className="flex flex-col items-center justify-center h-[260px] bg-muted/50 rounded-lg border border-dashed">
												<LightbulbIcon className="h-7 w-7 text-muted-foreground/50" />
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
