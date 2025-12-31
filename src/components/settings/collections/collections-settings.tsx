import { AlertCircle, Filter, Library, Loader2, PlusCircle, Save, Trash } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCollections, useDeleteCollection } from '@/lib/api/collections';
import { toastService } from '@/lib/ui/toast';
import type { CollectionWithStats } from '@/types/entities/collection';
import {
	COLLECTION_CATEGORY_COLORS,
	COLLECTION_CATEGORY_EMOJIS,
	CollectionCategory,
} from '@/types/entities/collection/enums';
import { CreateCollectionForm } from './create-collection-form';

// Tipos seguros para preview data
interface PreviewData {
	name?: string;
	description?: string;
	category?: CollectionCategory;
	color?: string;
	isFavorite?: boolean;
}

export function CollectionsSettings() {
	const [selectedCollection, setSelectedCollection] = useState<CollectionWithStats | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [previewData, setPreviewData] = useState<PreviewData | null>(null);

	// Filtros
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [onlyFavorites, setOnlyFavorites] = useState(false);

	// React Query hooks
	const { data: collectionsResponse, isLoading, error } = useCollections({});
	const deleteCollectionMutation = useDeleteCollection();

	// Extraer las colecciones de la respuesta
	const collections = collectionsResponse?.data || [];

	// Calcular estadísticas generales usando useMemo para optimización
	const stats = useMemo(
		() => ({
			totalCollections: collections.length,
			totalImages: collections.reduce(
				(acc: number, collection: CollectionWithStats) => acc + (collection.stats?.imageCount || 0),
				0
			),
			emptyCollections: collections.filter(
				(collection: CollectionWithStats) => (collection.stats?.imageCount || 0) === 0
			).length,
			favoriteCollections: collections.filter((collection: CollectionWithStats) => collection.isFavorite).length,
		}),
		[collections]
	);

	// Filtrar colecciones basadas en los criterios seleccionados usando useMemo
	const filteredCollections = useMemo(() => {
		return collections.filter((collection) => {
			let matches = true;

			// Filtrar por búsqueda
			if (searchQuery.trim() !== '') {
				const normalizedQuery = searchQuery.toLowerCase();
				matches =
					matches &&
					Boolean(
						collection.name.toLowerCase().includes(normalizedQuery) ||
							collection.description?.toLowerCase().includes(normalizedQuery)
					);
			}

			// Filtrar por categorías
			if (selectedCategories.length > 0) {
				matches = matches && (collection.category ? selectedCategories.includes(collection.category) : false);
			}

			// Filtrar por favoritos
			if (onlyFavorites) {
				matches = matches && !!collection.isFavorite;
			}

			return matches;
		});
	}, [collections, searchQuery, selectedCategories, onlyFavorites]);

	// Manejar eliminación de colección
	const handleDeleteCollection = useCallback(
		async (id: string) => {
			try {
				await deleteCollectionMutation.mutateAsync(id);
				setSelectedCollection(null);
				setIsEditing(false);
				toastService.success('Colección eliminada');
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				toastService.error('Error al eliminar la colección', {
					description: errorMessage,
				});
			}
		},
		[deleteCollectionMutation]
	);

	// Manejar edición de colección
	const handleEditCollection = useCallback((collection: CollectionWithStats) => {
		setSelectedCollection(collection);
		setIsEditing(true);
	}, []);

	// Manejar creación exitosa
	const handleCollectionCreated = useCallback((_newCollection: CollectionWithStats) => {
		toastService.success('Colección creada');
	}, []);

	// Manejar actualización exitosa
	const handleCollectionUpdated = useCallback((_updatedCollection: CollectionWithStats) => {
		toastService.success('Colección actualizada');
	}, []);

	// Resetear formulario
	const handleReset = useCallback(() => {
		setIsEditing(false);
		setSelectedCollection(null);
	}, []);

	// Manejar la previsualización en tiempo real
	const handlePreview = useCallback((data: PreviewData) => {
		setPreviewData(data);
	}, []);

	// Limpiar filtros
	const clearFilters = useCallback(() => {
		setSearchQuery('');
		setSelectedCategories([]);
		setOnlyFavorites(false);
	}, []);

	// Extraer categorías únicas de las colecciones usando useMemo
	const uniqueCategories = useMemo(() => {
		return Array.from(
			new Set(collections.map((collection: CollectionWithStats) => collection.category).filter(Boolean))
		) as string[];
	}, [collections]);

	// Manejar la eliminación desde el botón con detención de propagación de eventos
	const handleDeleteButtonClick = useCallback(
		(collectionId: string) => {
			handleDeleteCollection(collectionId);
		},
		[handleDeleteCollection]
	);

	// Contenido condicional basado en estado de carga
	if (isLoading) {
		return (
			<Card className="rounded-dt-md border-none bg-muted/30 shadow-sm">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<p className="text-body-sm text-muted-foreground">Cargando colecciones...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="rounded-dt-md border-none bg-muted/30 shadow-sm">
				<CardContent>
					<div className="flex flex-col items-center gap-4 p-6 text-center">
						<AlertCircle className="h-12 w-12 text-destructive" />
						<div>
							<h3 className="text-heading-sm">Error al cargar colecciones</h3>
							<p className="mt-1 text-body-sm text-muted-foreground">
								{error instanceof Error ? error.message : 'Error desconocido'}
							</p>
						</div>
						<Button onClick={() => window.location.reload()} variant="outline">
							Intentar de nuevo
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-12 gap-3">
			{/* Panel izquierdo: Lista de colecciones */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="flex h-[calc(100vh-8rem)] flex-col rounded-dt-md border-none bg-muted/30 shadow-sm">
					<CardHeader className="space-y-1 px-3 py-2">
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center text-body-sm">
								Colecciones ({filteredCollections.length})
								{filteredCollections.length !== collections.length && (
									<Badge className="ml-2 text-caption" variant="outline">
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
										<div className="space-y-stack-sm">
											<h4 className="font-medium text-body-sm">Filtrar Colecciones</h4>

											<div className="space-y-1.5">
												<Label className="text-caption" htmlFor="search">
													Buscar
												</Label>
												<Input
													id="search"
													onChange={(e) => setSearchQuery(e.target.value)}
													placeholder="Buscar colecciones..."
													value={searchQuery}
												/>
											</div>

											<div className="space-y-1.5">
												<Label className="text-caption">Categorías</Label>
												<div className="grid grid-cols-2 gap-2">
													{Object.values(CollectionCategory).map((category) => (
														<div className="flex items-center space-x-2" key={category}>
															<Checkbox
																checked={selectedCategories.includes(category)}
																id={`category-${category}`}
																onCheckedChange={(checked) => {
																	setSelectedCategories((prev) =>
																		checked ? [...prev, category] : prev.filter((c) => c !== category)
																	);
																}}
															/>
															<Label className="text-body-sm" htmlFor={`category-${category}`}>
																{category}
															</Label>
														</div>
													))}
												</div>
											</div>

											<div className="flex items-center space-x-2">
												<Checkbox
													checked={onlyFavorites}
													id="only-favorites"
													onCheckedChange={(checked) => setOnlyFavorites(Boolean(checked))}
												/>
												<Label className="text-body-sm" htmlFor="only-favorites">
													Solo favoritos
												</Label>
											</div>

											<Button className="w-full" onClick={clearFilters} variant="outline">
												Limpiar Filtros
											</Button>
										</div>
									</PopoverContent>
								</Popover>
								<Button onClick={() => setIsEditing(false)} size="sm">
									<PlusCircle className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="flex-1 overflow-y-auto p-3 pt-0">
						<ScrollArea className="h-full pr-3">
							<div className="space-y-2">
								{filteredCollections.length === 0 && (
									<EmptyState
										description="Crea tu primera colección para organizar tus imágenes."
										icon={Library}
										title="No hay colecciones"
									/>
								)}
								{filteredCollections.map((collection: CollectionWithStats) => (
									<div
										className={`flex items-center justify-between rounded-dt-sm p-2 transition-colors${
											selectedCollection?.id === collection.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
										}`}
										key={collection.id}
									>
										<button
											className="flex flex-1 items-center gap-2 text-left"
											onClick={() => handleEditCollection(collection)}
											type="button"
										>
											<span className="text-lg">
												{COLLECTION_CATEGORY_EMOJIS[collection.category as CollectionCategory] || '📚'}
											</span>
											<div className="flex flex-col">
												<span className="text-body-sm">{collection.name}</span>
												<span className="text-caption text-muted-foreground">
													{collection.stats?.imageCount || 0} imágenes
												</span>
											</div>
										</button>
										<Button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteButtonClick(collection.id);
											}}
											size="sm"
											variant="ghost"
										>
											<Trash className="h-4 w-4 text-destructive" />
										</Button>
									</div>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>
			{/* Panel derecho: Formulario de edición/creación */}
			<div className="col-span-12 md:col-span-7 lg:col-span-8">
				<Card className="flex h-[calc(100vh-8rem)] flex-col rounded-dt-md border-none bg-muted/30 shadow-sm">
					<CardHeader className="px-3 py-2">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-body-sm">{isEditing ? 'Editar Colección' : 'Nueva Colección'}</CardTitle>
								<CardDescription className="text-caption">
									{isEditing
										? 'Modifica los detalles de la colección seleccionada'
										: 'Completa el formulario para crear una nueva colección'}
								</CardDescription>
							</div>
							<div className="flex gap-1">
								{isEditing && selectedCollection && (
									<>
										<Button className="h-7 text-caption" onClick={handleReset} size="sm" variant="outline">
											Cancelar
										</Button>
										<Button
											className="h-7 text-caption"
											onClick={() => handleDeleteCollection(selectedCollection.id)}
											size="sm"
											variant="destructive"
										>
											<Trash className="mr-1 h-3 w-3" />
											Eliminar
										</Button>
									</>
								)}
								<Button className="h-7 text-xs" form="collection-form" size="sm" type="submit">
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
									<CreateCollectionForm
										collection={selectedCollection}
										isEditing={isEditing}
										key={selectedCollection?.id || 'new-collection'}
										onCancel={handleReset}
										onCreated={handleCollectionCreated}
										onPreview={handlePreview}
										onUpdated={handleCollectionUpdated}
									/>
								</div>
								<div className="hidden flex-col items-center justify-start lg:flex">
									<h3 className="mb-2 font-medium text-caption">Vista Previa</h3>
									<div className="w-55 transition-all duration-300">
										{previewData || selectedCollection ? (
											<div className="flex flex-col rounded-dt-md border bg-background p-4">
												<div
													className="mb-3 flex aspect-video w-full items-center justify-center rounded-dt-sm bg-muted"
													style={{
														backgroundColor:
															COLLECTION_CATEGORY_COLORS[
																(previewData?.category || selectedCollection?.category) as CollectionCategory
															] || '#3b82f6',
													}}
												>
													<span className="text-4xl">
														{COLLECTION_CATEGORY_EMOJIS[
															(previewData?.category || selectedCollection?.category) as CollectionCategory
														] || '📚'}
													</span>
												</div>
												<h3 className="text-heading-sm">
													{previewData?.name || selectedCollection?.name || 'Nueva Colección'}
												</h3>
												<p className="mt-2 text-body-sm text-muted-foreground">
													{previewData?.description || selectedCollection?.description || 'Sin descripción'}
												</p>

												<div className="mt-3 flex flex-wrap gap-2">
													{(previewData?.category || selectedCollection?.category) && (
														<Badge className="text-caption" variant="secondary">
															{previewData?.category || selectedCollection?.category}
														</Badge>
													)}
													{(previewData?.isFavorite || selectedCollection?.isFavorite) && (
														<Badge className="text-caption" variant="outline">
															Favorito
														</Badge>
													)}
												</div>

												{selectedCollection?.stats?.imageCount ? (
													<p className="mt-4 text-caption text-muted-foreground">
														{selectedCollection.stats.imageCount} imágenes asociadas
													</p>
												) : null}
											</div>
										) : (
											<div className="flex h-65 flex-col items-center justify-center rounded-dt-md border border-dashed bg-muted/50">
												<Library className="h-7 w-7 text-muted-foreground/50" />
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

// Función auxiliar para generar colores basados en categoría
function _generateCategoryColor(category: CollectionCategory): string {
	switch (category) {
		case CollectionCategory.ART:
			return 'bg-blue-500';
		case CollectionCategory.PHOTOGRAPHY:
			return 'bg-green-500';
		case CollectionCategory.DIGITAL:
			return 'bg-yellow-500';
		case CollectionCategory.NFT:
			return 'bg-purple-500';
		case CollectionCategory.GAME:
			return 'bg-red-500';
		case CollectionCategory.COMIC:
			return 'bg-indigo-500';
		case CollectionCategory.MUSIC:
			return 'bg-pink-500';
		case CollectionCategory.MOVIE:
			return 'bg-orange-500';
		case CollectionCategory.OTHER:
			return 'bg-cyan-500';
		default:
			return 'bg-gray-500';
	}
}
