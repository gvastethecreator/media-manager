'use client';

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
import toastService from '@/services/toast';
import type { CollectionWithStats } from '@/types/entities/collection';
import {
	COLLECTION_CATEGORY_COLORS,
	COLLECTION_CATEGORY_EMOJIS,
	CollectionCategory,
} from '@/types/entities/collection/enums';
import { AlertCircle, Filter, Library, Loader2, PlusCircle, Save, Trash } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
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
	const collections = collectionsResponse?.collections || [];

	// Calcular estadísticas generales usando useMemo para optimización
	const stats = useMemo(
		() => ({
			totalCollections: collections.length,
			totalImages: collections.reduce((acc, collection) => acc + (collection.stats?.imageCount || 0), 0),
			emptyCollections: collections.filter((collection) => (collection.stats?.imageCount || 0) === 0).length,
			favoriteCollections: collections.filter((collection) => collection.isFavorite).length,
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
	const handleCollectionCreated = useCallback((newCollection: CollectionWithStats) => {
		toastService.success('Colección creada');
	}, []);

	// Manejar actualización exitosa
	const handleCollectionUpdated = useCallback((updatedCollection: CollectionWithStats) => {
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
		return Array.from(new Set(collections.map((collection) => collection.category).filter(Boolean))) as string[];
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
			<Card className="rounded-sm bg-muted/30 border-none">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<p className="text-sm text-muted-foreground">Cargando colecciones...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="rounded-sm bg-muted/30 border-none">
				<CardContent>
					<div className="flex flex-col items-center gap-4 text-center p-6">
						<AlertCircle className="h-12 w-12 text-destructive" />
						<div>
							<h3 className="text-lg font-semibold">Error al cargar colecciones</h3>
							<p className="text-sm text-muted-foreground mt-1">
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
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="space-y-1 py-2 px-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm flex items-center">
								Colecciones ({filteredCollections.length})
								{filteredCollections.length !== collections.length && (
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
											<h4 className="font-medium text-sm">Filtrar Colecciones</h4>

											<div className="space-y-2">
												<Label htmlFor="search">Buscar</Label>
												<Input
													id="search"
													placeholder="Buscar colecciones..."
													value={searchQuery}
													onChange={(e) => setSearchQuery(e.target.value)}
													className="h-8 text-xs"
												/>
											</div>

											<div className="space-y-2">
												<Label>Categorías</Label>
												<div className="grid grid-cols-2 gap-2">
													{uniqueCategories.map((category) => (
														<div key={category} className="flex items-center space-x-2">
															<Checkbox
																id={`category-${category}`}
																checked={selectedCategories.includes(category)}
																onCheckedChange={(checked) => {
																	if (checked) {
																		setSelectedCategories((prev) => [...prev, category]);
																	} else {
																		setSelectedCategories((prev) => prev.filter((cat) => cat !== category));
																	}
																}}
															/>
															<Label htmlFor={`category-${category}`} className="text-xs">
																{category}
															</Label>
														</div>
													))}
												</div>
											</div>

											<div className="flex items-center space-x-2">
												<Checkbox
													id="favorites"
													checked={onlyFavorites}
													onCheckedChange={(checked) => setOnlyFavorites(!!checked)}
												/>
												<Label htmlFor="favorites" className="text-xs">
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
										setSelectedCollection(null);
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
							<span>{stats.totalCollections} colecciones</span>
							<span>•</span>
							<span>{stats.totalImages} imágenes</span>
							{stats.favoriteCollections > 0 && (
								<>
									<span>•</span>
									<span>{stats.favoriteCollections} favoritas</span>
								</>
							)}
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full px-3 pb-3">
							{filteredCollections.length === 0 ? (
								<EmptyState
									icon={Library}
									title="No hay colecciones"
									description={
										collections.length > 0
											? 'No se encontraron colecciones con los filtros aplicados'
											: 'Crea tu primera colección'
									}
									className="py-6"
									actions={
										collections.length > 0 && (
											<Button size="sm" variant="outline" onClick={clearFilters}>
												Limpiar filtros
											</Button>
										)
									}
								/>
							) : (
								<div className="space-y-1">
									{filteredCollections.map((collection) => (
										<div
											key={collection.id}
											className={`relative group/item flex items-center gap-2 p-1.5 rounded-md transition-colors hover:bg-muted/50 w-full ${selectedCollection?.id === collection.id ? 'bg-muted' : ''}`}
										>
											<button
												className="flex items-center gap-2 w-full text-left cursor-pointer"
												onClick={() => handleEditCollection(collection)}
												type="button"
												aria-pressed={selectedCollection?.id === collection.id}
												aria-label={`Editar colección ${collection.name}`}
											>
												<div
													className="w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center text-white"
													style={{
														backgroundColor:
															COLLECTION_CATEGORY_COLORS[collection.category as CollectionCategory] || '#3b82f6',
													}}
												>
													{COLLECTION_CATEGORY_EMOJIS[collection.category as CollectionCategory] || '📚'}
												</div>
												<div className="flex-1 min-w-0">
													<h4 className="text-xs font-medium truncate">{collection.name}</h4>
													<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
														{collection.category && <span>{collection.category}</span>}
														{(collection.stats?.imageCount || 0) > 0 && (
															<>
																<span>•</span>
																<span>{collection.stats?.imageCount || 0} imágenes</span>
															</>
														)}
														{collection.isFavorite && (
															<>
																<span>•</span>
																<span className="text-yellow-500">★</span>
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
													handleDeleteButtonClick(collection.id);
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
								<CardTitle className="text-sm">{isEditing ? 'Editar Colección' : 'Nueva Colección'}</CardTitle>
								<CardDescription className="text-xs">
									{isEditing
										? 'Modifica los detalles de la colección seleccionada'
										: 'Completa el formulario para crear una nueva colección'}
								</CardDescription>
							</div>
							<div className="flex gap-1">
								{isEditing && selectedCollection && (
									<>
										<Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleReset}>
											Cancelar
										</Button>
										<Button
											variant="destructive"
											size="sm"
											className="h-7 text-xs"
											onClick={() => handleDeleteCollection(selectedCollection.id)}
										>
											<Trash className="h-3 w-3 mr-1" />
											Eliminar
										</Button>
									</>
								)}
								<Button type="submit" size="sm" className="h-7 text-xs" form="collection-form">
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
									<CreateCollectionForm
										key={selectedCollection?.id || 'new-collection'}
										collection={selectedCollection}
										isEditing={isEditing}
										onCreated={handleCollectionCreated}
										onUpdated={handleCollectionUpdated}
										onCancel={handleReset}
										onPreview={handlePreview}
									/>
								</div>
								<div className="hidden lg:flex flex-col items-center justify-start">
									<h3 className="text-xs font-medium mb-2">Vista Previa</h3>
									<div className="w-[220px] transition-all duration-300">
										{previewData || selectedCollection ? (
											<div className="flex flex-col p-4 border rounded-lg bg-background">
												<div
													className="w-full aspect-video mb-3 rounded-md flex items-center justify-center bg-muted"
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
												<h3 className="text-lg font-medium">
													{previewData?.name || selectedCollection?.name || 'Nueva Colección'}
												</h3>
												<p className="text-muted-foreground mt-2 text-sm">
													{previewData?.description || selectedCollection?.description || 'Sin descripción'}
												</p>

												<div className="flex flex-wrap gap-2 mt-3">
													{(previewData?.category || selectedCollection?.category) && (
														<Badge variant="secondary" className="text-xs">
															{previewData?.category || selectedCollection?.category}
														</Badge>
													)}
													{(previewData?.isFavorite || selectedCollection?.isFavorite) && (
														<Badge variant="outline" className="text-xs">
															Favorito
														</Badge>
													)}
												</div>

												{selectedCollection?.stats?.imageCount ? (
													<p className="mt-4 text-xs text-muted-foreground">
														{selectedCollection.stats.imageCount} imágenes asociadas
													</p>
												) : null}
											</div>
										) : (
											<div className="flex flex-col items-center justify-center h-[260px] bg-muted/50 rounded-lg border border-dashed">
												<Library className="h-7 w-7 text-muted-foreground/50" />
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
