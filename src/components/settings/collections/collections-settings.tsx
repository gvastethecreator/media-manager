'use client';

import { CollectionWithStats, deleteCollection, getCollections } from '@/app/actions/collections/collection.actions';
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
import toastService from '@/services/toast.service';
import { CollectionBase as Collection } from '@/types/entities/collection/base';
import { CollectionCategory } from '@/types/entities/collection/enums';
import { Filter, Info, Library, Loader2, PlusCircle, Save, Trash } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CreateCollectionForm } from './create-collection-form';

// Tipo ampliado para Collection que incluye _count
interface CollectionWithUI extends Collection {
	_count?: {
		images: number;
	};
}

// Definir tipo para el event handler
type ButtonClickHandler = React.MouseEventHandler<HTMLButtonElement>;

export function CollectionsSettings() {
	const [collections, setCollections] = useState<CollectionWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedCollection, setSelectedCollection] = useState<CollectionWithUI | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [previewData, setPreviewData] = useState<any>(null);

	// Filtros
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
	const [onlyFavorites, setOnlyFavorites] = useState(false);

	// Cargar colecciones al montar el componente
	useEffect(() => {
		const loadCollections = async () => {
			try {
				setIsLoading(true);
				const data = await getCollections();
				setCollections(data);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				setError(errorMessage);
				toastService.error('Error al cargar las colecciones', {
					description: errorMessage,
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadCollections();
	}, []);

	// Calcular estadísticas generales
	const stats = {
		totalCollections: collections.length,
		totalImages: collections.reduce((acc, collection) => acc + (collection._count?.images || 0), 0),
		totalSize: collections.reduce((acc, collection) => acc + (collection.totalSize || 0), 0),
		emptyCollections: collections.filter(collection => (collection._count?.images || 0) === 0).length,
		favoriteCollections: collections.filter(collection => collection.isFavorite).length,
	};

	// Filtrar colecciones basadas en los criterios seleccionados
	const filteredCollections = collections.filter(collection => {
		let matches = true;

		// Filtrar por búsqueda
		if (searchQuery) {
			const normalizedQuery = searchQuery.toLowerCase();
			matches = matches && Boolean(
				collection.name.toLowerCase().includes(normalizedQuery) ||
				(collection.description && collection.description.toLowerCase().includes(normalizedQuery))
			);
		}

		// Filtrar por categorías
		if (selectedCategories.length > 0) {
			matches = matches && (collection.category ? selectedCategories.includes(collection.category) : false);
		}

		// Filtrar por plataformas
		if (selectedPlatforms.length > 0) {
			matches = matches && (collection.platform ? selectedPlatforms.includes(collection.platform) : false);
		}

		// Filtrar por favoritos
		if (onlyFavorites) {
			matches = matches && !!collection.isFavorite;
		}

		return matches;
	});

	// Manejar eliminación de colección
	const handleDeleteCollection = useCallback(async (id: string) => {
		try {
			await deleteCollection(id);
			setCollections(prev => prev.filter(collection => collection.id !== id));
			setSelectedCollection(null);
			setIsEditing(false);
			toastService.success('Colección eliminada');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al eliminar la colección', {
				description: errorMessage,
			});
		}
	}, []);

	// Manejar edición de colección
	const handleEditCollection = useCallback((collection: CollectionWithStats) => {
		setSelectedCollection(collection as unknown as CollectionWithUI);
		setIsEditing(true);
	}, []);

	// Manejar creación exitosa
	const handleCollectionCreated = useCallback((newCollection: Collection) => {
		setCollections(prev => [...prev, newCollection as unknown as CollectionWithStats]);
		toastService.success('Colección creada');
	}, []);

	// Manejar actualización exitosa
	const handleCollectionUpdated = useCallback((updatedCollection: Collection) => {
		setCollections(prev =>
			prev.map(collection =>
				collection.id === updatedCollection.id
					? { ...collection, ...updatedCollection } as CollectionWithStats
					: collection
			)
		);
		toastService.success('Colección actualizada');
	}, []);

	// Resetear formulario
	const handleReset = useCallback(() => {
		setIsEditing(false);
		setSelectedCollection(null);
	}, []);

	// Manejar la previsualización en tiempo real
	const handlePreview = useCallback((data: any) => {
		setPreviewData(data);
	}, []);

	// Limpiar filtros
	const clearFilters = useCallback(() => {
		setSearchQuery('');
		setSelectedCategories([]);
		setSelectedPlatforms([]);
		setOnlyFavorites(false);
	}, []);

	// Extraer categorías y plataformas únicas de las colecciones
	const uniqueCategories = Array.from(new Set(collections.map(collection => collection.category).filter(Boolean))) as string[];
	const uniquePlatforms = Array.from(new Set(collections.map(collection => collection.platform).filter(Boolean))) as string[];

	// Manejar la eliminación desde el botón con detención de propagación de eventos
	const handleDeleteButtonClick = useCallback<ButtonClickHandler>((e) => {
		const id = (e.currentTarget as HTMLButtonElement).dataset.id;
		if (id) {
			e.stopPropagation();
			handleDeleteCollection(id);
		}
	}, [handleDeleteCollection]);

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
					<EmptyState
						icon={Info}
						title="Error al cargar colecciones"
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
													{uniqueCategories.map(category => (
														<div key={category} className="flex items-center space-x-2">
															<Checkbox
																id={`category-${category}`}
																checked={selectedCategories.includes(category)}
																onCheckedChange={(checked) => {
																	if (checked) {
																		setSelectedCategories(prev => [...prev, category]);
																	} else {
																		setSelectedCategories(prev =>
																			prev.filter(cat => cat !== category)
																		);
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

											<div className="space-y-2">
												<Label>Plataformas</Label>
												<div className="grid grid-cols-2 gap-2">
													{uniquePlatforms.map(platform => (
														<div key={platform} className="flex items-center space-x-2">
															<Checkbox
																id={`platform-${platform}`}
																checked={selectedPlatforms.includes(platform)}
																onCheckedChange={(checked) => {
																	if (checked) {
																		setSelectedPlatforms(prev => [...prev, platform]);
																	} else {
																		setSelectedPlatforms(prev =>
																			prev.filter(p => p !== platform)
																		);
																	}
																}}
															/>
															<Label htmlFor={`platform-${platform}`} className="text-xs">
																{platform}
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
									onClick={() => { setSelectedCollection(null); setIsEditing(false); }}
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
						<div className="h-full px-3 pb-3 overflow-auto">
							{filteredCollections.length === 0 ? (
								<EmptyState
									icon={Library}
									title="No hay colecciones"
									description={
										collections.length > 0
											? "No se encontraron colecciones con los filtros aplicados"
											: "Crea tu primera colección"
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
											className={`flex items-center gap-2 p-1.5 rounded-md transition-colors cursor-pointer hover:bg-muted/50 ${selectedCollection?.id === collection.id ? 'bg-muted' : ''}`}
											onClick={() => handleEditCollection(collection)}
										>
											<div
												className="w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center text-white"
												style={{ backgroundColor: collection.color }}
											>
												{collection.emoji}
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="text-xs font-medium truncate">{collection.name}</h4>
												<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
													{collection.category && (
														<span>{collection.category}</span>
													)}
													{collection.platform && (
														<>
															<span>•</span>
															<span>{collection.platform}</span>
														</>
													)}
													{(collection._count?.images || 0) > 0 && (
														<>
															<span>•</span>
															<span>{collection._count?.images || 0} imágenes</span>
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
											<Button
												variant="ghost"
												size="icon"
												type="button"
												className="h-5 w-5 opacity-0 hover:opacity-100 group-hover:opacity-100"
												onClick={() => {
													// Capturar el evento de clic en línea
													const e = window.event as MouseEvent;
													if (e) e.stopPropagation();
													handleDeleteCollection(collection.id);
												}}
											>
												<Trash className="h-3 w-3" />
											</Button>
										</div>
									))}
								</div>
							)}
						</div>
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
									{isEditing ? 'Editar Colección' : 'Nueva Colección'}
								</CardTitle>
								<CardDescription className="text-xs">
									{isEditing
										? 'Modifica los detalles de la colección seleccionada'
										: 'Completa el formulario para crear una nueva colección'}
								</CardDescription>
							</div>
							<div className="flex gap-1">
								{isEditing && selectedCollection && (
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
											onClick={() => handleDeleteCollection(selectedCollection.id)}
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
									form="collection-form"
								>
									<Save className="h-3 w-3 mr-1" />
									{isEditing ? 'Guardar' : 'Crear'}
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-3 flex-1 overflow-hidden">
						<div className="h-full pr-3 overflow-auto">
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
												<div className="w-full aspect-video mb-3 rounded-md flex items-center justify-center bg-muted"
													style={{ backgroundColor: (previewData?.color || selectedCollection?.color || '#3b82f6') }}>
													<span className="text-4xl">{previewData?.emoji || selectedCollection?.emoji || '📚'}</span>
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
													{(previewData?.platform || selectedCollection?.platform) && (
														<Badge variant="outline" className="text-xs">
															{previewData?.platform || selectedCollection?.platform}
														</Badge>
													)}
													{(previewData?.isFavorite || selectedCollection?.isFavorite) && (
														<Badge variant="outline" className="text-xs">Favorito</Badge>
													)}
												</div>

												{selectedCollection && selectedCollection._count && selectedCollection._count.images > 0 && (
													<p className="mt-4 text-xs text-muted-foreground">
														{selectedCollection._count.images} imágenes asociadas
													</p>
												)}
											</div>
										) : (
											<div className="flex flex-col items-center justify-center h-[260px] bg-muted/50 rounded-lg border border-dashed">
												<Library className="h-7 w-7 text-muted-foreground/50" />
												<p className="text-[10px] text-muted-foreground mt-2">
													Vista previa
												</p>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div >
	);
}

// Función auxiliar para generar colores basados en categoría
function generateCategoryColor(category: CollectionCategory): string {
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
