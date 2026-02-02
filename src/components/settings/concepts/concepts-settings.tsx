import { Filter, LightbulbIcon, Loader2, PlusCircle, Save, Trash } from 'lucide-react';
import { useCallback, useId, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox-v3';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConcepts, useDeleteConcept } from '@/lib/api/concepts';
import { toastService } from '@/lib/ui/toast';
import type { ConceptWithStats } from '@/types/entities/concept/base';
import type { ConceptExtended } from '@/types/entities/concept/types';
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
			totalImages: concepts.reduce((acc, concept) => acc + (concept.stats?.imageCount || 0), 0),
			totalAssociations: concepts.reduce((acc, concept) => acc + (concept.stats?.totalAssociations || 0), 0),
			unusedConcepts: concepts.filter((concept) => (concept.stats?.imageCount || 0) === 0).length,
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
	const handleConceptCreated = useCallback((_newConcept: ConceptWithStats) => {
		toastService.success('Concepto creado');
	}, []);

	// Manejar actualización exitosa
	const handleConceptUpdated = useCallback((_updatedConcept: ConceptWithStats) => {
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
			<Card className="rounded-dt-md border-none bg-muted/30 shadow-sm">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<p className="text-muted-foreground text-sm">Cargando conceptos...</p>
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
						<p className="text-destructive text-sm">Error al cargar conceptos: {error.message}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-12 gap-3">
			{/* Panel izquierdo: Lista de conceptos */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="flex h-[calc(100vh-8rem)] flex-col rounded-dt-md border-none bg-muted/30 shadow-sm">
					<CardHeader className="space-y-1 px-3 py-2">
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center text-heading-sm">
								Conceptos ({filteredConcepts.length})
								{filteredConcepts.length !== concepts.length && (
									<Badge className="ml-2 text-[10px]" variant="outline">
										Filtrados
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
											<h4 className="font-medium text-sm">Filtrar Conceptos</h4>

											<div className="space-y-2">
												<Label htmlFor={searchInputId}>Buscar</Label>
												<Input
													className="h-8 text-xs"
													id={searchInputId}
													onChange={(e) => setSearchQuery(e.target.value)}
													placeholder="Buscar conceptos..."
													value={searchQuery}
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor={categorySelectId}>Categoría</Label>
												<select
													className="h-8 w-full rounded-md border border-input bg-background px-3 text-foreground text-xs"
													id={categorySelectId}
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
													id={favoritesCheckboxId}
													onCheckedChange={(checked) => setOnlyFavorites(!!checked)}
												/>
												<Label className="text-xs" htmlFor={favoritesCheckboxId}>
													Solo favoritos
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
										setSelectedConcept(null);
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
									actions={
										concepts.length > 0 && (
											<Button onClick={clearFilters} size="sm" variant="outline">
												Limpiar filtros
											</Button>
										)
									}
									className="py-6"
									description={
										concepts.length > 0
											? 'No se encontraron conceptos con los filtros aplicados'
											: 'Crea tu primer concepto'
									}
									icon={LightbulbIcon}
									title="No hay conceptos"
								/>
							) : (
								<div className="space-y-1">
									{filteredConcepts.map((concept) => (
										<div
											className={`group/item relative flex w-full items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-muted/50 ${selectedConcept?.id === concept.id ? 'bg-muted' : ''}`}
											key={concept.id}
										>
											<button
												aria-pressed={selectedConcept?.id === concept.id}
												className="flex w-full cursor-pointer items-center gap-2 text-left"
												onClick={() => handleEditConcept(concept)}
												type="button"
											>
												<div
													className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
													style={{
														backgroundColor: concept.color,
														color: 'var(--background)',
													}}
												>
													<span className="text-xs">{concept.emoji}</span>
												</div>
												<div className="min-w-0 flex-1">
													<h4 className="truncate font-medium text-body-sm">{concept.name}</h4>
													<div className="flex items-center gap-1 text-caption text-muted-foreground">
														<span>{concept.stats?.imageCount || 0} imágenes</span>
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
												className="absolute right-1 h-5 w-5 opacity-0 group-hover/item:opacity-100"
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteConcept(concept.id);
												}}
												size="icon"
												type="button"
												variant="ghost"
											>
												<Trash className="h-3 w-3 text-muted-foreground hover:text-destructive" />
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
				<Card className="flex h-[calc(100vh-8rem)] flex-col rounded-dt-md border-none bg-muted/30 shadow-sm">
					<CardHeader className="px-3 py-2">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-heading-sm">{isEditing ? 'Editar Concepto' : 'Nuevo Concepto'}</CardTitle>
								<CardDescription className="text-caption">
									{isEditing
										? 'Modifica los detalles del concepto seleccionado'
										: 'Completa el formulario para crear un nuevo concepto'}
								</CardDescription>
							</div>
							<div className="flex gap-1">
								{isEditing && selectedConcept && (
									<>
										<Button className="h-7 text-xs" onClick={handleReset} size="sm" variant="outline">
											Cancelar
										</Button>
										<Button
											className="h-7 text-xs"
											onClick={() => handleDeleteConcept(selectedConcept.id)}
											size="sm"
											variant="destructive"
										>
											<Trash className="mr-1 h-3 w-3" />
											Eliminar
										</Button>
									</>
								)}
								<Button className="h-7 text-xs" form="concept-form" size="sm" type="submit">
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
									<CreateConceptForm
										concept={selectedConcept as ConceptExtended}
										isEditing={isEditing}
										onCancel={handleReset}
										onCreated={handleConceptCreated}
										onPreview={handlePreview}
										onUpdated={handleConceptUpdated}
									/>
								</div>
								<div className="hidden flex-col items-center justify-start lg:flex">
									<h3 className="mb-2 font-medium text-caption">Vista Previa</h3>
									<div className="w-45 transition-all duration-300">
										{previewData || selectedConcept ? (
											<div className="flex flex-col items-center rounded-dt-md border bg-background p-4">
												<div
													className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-2xl"
													style={{
														backgroundColor: previewData?.color || selectedConcept?.color || 'var(--dt-primary-500)',
													}}
												>
													{previewData?.emoji || selectedConcept?.emoji || '💡'}
												</div>
												<h3 className="font-medium text-lg">
													{previewData?.name || selectedConcept?.name || 'Nuevo Concepto'}
												</h3>
												<p className="mt-2 text-center text-muted-foreground text-sm">
													{previewData?.description || selectedConcept?.description || 'Sin descripción'}
												</p>

												<div className="mt-3 flex flex-wrap justify-center gap-2">
													<Badge className="text-xs" variant="secondary">
														{previewData?.category || selectedConcept?.category || 'general'}
													</Badge>
													{(previewData?.isFavorite || selectedConcept?.isFavorite) && (
														<Badge className="text-xs" variant="outline">
															Favorito
														</Badge>
													)}
												</div>

												{(previewData?.content || selectedConcept?.content) && (
													<div className="mt-4 w-full rounded bg-muted p-2 text-xs">
														<p className="line-clamp-3">{previewData?.content || selectedConcept?.content}</p>
													</div>
												)}
											</div>
										) : (
											<div className="flex h-65 flex-col items-center justify-center rounded-dt-md border border-dashed bg-muted/50">
												<LightbulbIcon className="h-7 w-7 text-muted-foreground/50" />
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
