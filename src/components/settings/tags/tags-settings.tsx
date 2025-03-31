'use client';

import { type TagWithStats as ServerTagWithStats, deleteTag, getTags } from '@/app/actions/tags';
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
import { TagCategory } from '@/types/entities/tag/enums';
import type { Tag } from '@/types/entities/tag/types';
import { Filter, Info, Loader2, PlusCircle, Save, Tag as TagIcon, Trash } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CreateTagForm } from './create-tag-form';

// Definir tipo para el manejador de eventos del botón
type ButtonClickHandler = React.MouseEventHandler<HTMLButtonElement>;

// Extender la interfaz TagWithStats para incluir los campos que necesitamos
interface TagWithStats extends Omit<ServerTagWithStats, 'emoji' | 'lastUpdated' | 'createdAt' | 'updatedAt' | 'description' | 'shortcut'> {
	emoji: string | null;
	category?: string | null;
	isFavorite?: boolean;
	createdAt: Date;
	updatedAt: Date;
	lastUpdated: Date;
	description: string | null;
	shortcut: string | null;
}

export function TagsSettings() {
	const [tags, setTags] = useState<TagWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [previewData, setPreviewData] = useState<any>(null);

	// Filtros
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [onlyFavorites, setOnlyFavorites] = useState(false);

	// Cargar etiquetas al montar el componente
	useEffect(() => {
		const loadTags = async () => {
			try {
				setIsLoading(true);
				const data = await getTags();
				// Convertir los datos para que coincidan con nuestra interfaz
				const formattedTags = data.map(tag => ({
					...tag,
					emoji: tag.emoji || null,
					createdAt: new Date(tag.createdAt),
					updatedAt: new Date(tag.updatedAt),
					lastUpdated: new Date(tag.lastUpdated)
				})) as TagWithStats[];

				setTags(formattedTags);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				setError(errorMessage);
				toastService.error('Error al cargar las etiquetas', {
					description: errorMessage,
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadTags();
	}, []);

	// Calcular estadísticas generales
	const stats = {
		totalTags: tags.length,
		totalImages: tags.reduce((acc, tag) => acc + (tag._count?.images || 0), 0),
		totalSize: tags.reduce((acc, tag) => acc + (tag.totalSize || 0), 0),
		unusedTags: tags.filter(tag => (tag._count?.images || 0) === 0).length,
		favoriteTags: tags.filter(tag => tag.isFavorite).length,
	};

	// Filtrar tags basados en los criterios seleccionados
	const filteredTags = tags.filter(tag => {
		let matches = true;

		// Filtrar por búsqueda
		if (searchQuery) {
			const normalizedQuery = searchQuery.toLowerCase();
			const nameMatch = tag.name.toLowerCase().includes(normalizedQuery);
			const descriptionMatch = tag.description?.toLowerCase().includes(normalizedQuery);
			matches = matches && (nameMatch || Boolean(descriptionMatch));
		}

		// Filtrar por categorías
		if (selectedCategories.length > 0) {
			matches = matches && (tag.category ? selectedCategories.includes(tag.category) : false);
		}

		// Filtrar por favoritos
		if (onlyFavorites) {
			matches = matches && !!tag.isFavorite;
		}

		return matches;
	});

	// Manejar eliminación de etiqueta
	const handleDeleteTag = useCallback(async (id: string) => {
		try {
			await deleteTag(id);
			setTags(prev => prev.filter(tag => tag.id !== id));
			setSelectedTag(null);
			setIsEditing(false);
			toastService.success('Etiqueta eliminada');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al eliminar la etiqueta', {
				description: errorMessage,
			});
		}
	}, []);

	// Manejar la eliminación desde el botón con detención de propagación de eventos
	const handleDeleteButtonClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
		if (id) {
			handleDeleteTag(id);
		}
	}, [handleDeleteTag]);

	// Manejar edición de etiqueta
	const handleEditTag = useCallback((tag: TagWithStats) => {
		// Convertir TagWithStats a Tag (UI) para edición
		const uiTag: Tag = {
			id: tag.id,
			name: tag.name,
			description: tag.description,
			color: tag.color,
			emoji: tag.emoji || '🏷️',
			category: tag.category || undefined,
			isFavorite: tag.isFavorite || false,
			createdAt: tag.createdAt,
			updatedAt: tag.updatedAt,
			_count: tag._count,
		};
		setSelectedTag(uiTag);
		setIsEditing(true);
	}, []);

	// Manejar creación exitosa
	const handleTagCreated = useCallback((newTag: Tag) => {
		// Convertir Tag (UI) a TagWithStats para la lista
		const statsTag: TagWithStats = {
			id: newTag.id,
			name: newTag.name,
			color: newTag.color,
			description: newTag.description || null,
			createdAt: new Date(newTag.createdAt),
			updatedAt: new Date(newTag.updatedAt),
			emoji: newTag.emoji || "🏷️",
			_count: { images: 0 },
			totalSize: 0,
			lastUpdated: new Date(),
			category: newTag.category || null,
			isFavorite: newTag.isFavorite || false,
			shortcut: newTag.shortcut || null
		};

		setTags(prev => [...prev, statsTag]);
		toastService.success('Etiqueta creada');
	}, []);

	// Manejar actualización exitosa
	const handleTagUpdated = useCallback((updatedTag: Tag) => {
		setTags(prev =>
			prev.map(tag =>
				tag.id === updatedTag.id
					? {
						...tag,
						name: updatedTag.name,
						description: updatedTag.description,
						color: updatedTag.color,
						emoji: updatedTag.emoji || tag.emoji,
						category: updatedTag.category,
						isFavorite: updatedTag.isFavorite,
					} as TagWithStats
					: tag
			)
		);
		toastService.success('Etiqueta actualizada');
	}, []);

	// Resetear formulario
	const handleReset = useCallback(() => {
		setIsEditing(false);
		setSelectedTag(null);
	}, []);

	// Manejar la previsualización en tiempo real
	const handlePreview = useCallback((data: any) => {
		setPreviewData(data);
	}, []);

	// Limpiar filtros
	const clearFilters = useCallback(() => {
		setSearchQuery('');
		setSelectedCategories([]);
		setOnlyFavorites(false);
	}, []);

	// Extraer categorías únicas de los tags
	const uniqueCategories = Array.from(
		new Set(tags.map(tag => tag.category).filter(Boolean))
	) as string[];

	// Contenido condicional basado en estado de carga
	if (isLoading) {
		return (
			<Card className="rounded-sm bg-muted/30 border-none">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<p className="text-sm text-muted-foreground">Cargando etiquetas...</p>
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
						title="Error al cargar etiquetas"
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
			{/* Panel izquierdo: Lista de etiquetas */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="space-y-1 py-2 px-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm flex items-center">
								Etiquetas ({filteredTags.length})
								{filteredTags.length !== tags.length && (
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
											<h4 className="font-medium text-sm">Filtrar Etiquetas</h4>

											<div className="space-y-2">
												<Label htmlFor="search">Buscar</Label>
												<Input
													id="search"
													placeholder="Buscar etiquetas..."
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
									onClick={() => { setSelectedTag(null); setIsEditing(false); }}
									size="sm"
									variant="ghost"
									className="h-6 w-6 p-0"
								>
									<PlusCircle className="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>
						<div className="flex gap-2 text-xs text-muted-foreground">
							<span>{stats.totalTags} etiquetas</span>
							<span>•</span>
							<span>{stats.totalImages} imágenes</span>
							{stats.favoriteTags > 0 && (
								<>
									<span>•</span>
									<span>{stats.favoriteTags} favoritas</span>
								</>
							)}
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<div className="h-full px-3 pb-3 overflow-auto">
							{filteredTags.length === 0 ? (
								<EmptyState
									icon={TagIcon}
									title="No hay etiquetas"
									description={
										tags.length > 0
											? "No se encontraron etiquetas con los filtros aplicados"
											: "Crea tu primera etiqueta"
									}
									className="py-6"
									actions={
										tags.length > 0 && (
											<Button size="sm" variant="outline" onClick={clearFilters}>
												Limpiar filtros
											</Button>
										)
									}
								/>
							) : (
								<div className="space-y-1">
									{filteredTags.map((tag) => (
										<button
											key={tag.id}
											className={`flex items-center gap-2 p-1.5 rounded-md transition-colors cursor-pointer hover:bg-muted/50 w-full text-left ${selectedTag?.id === tag.id ? 'bg-muted' : ''}`}
											onClick={() => handleEditTag(tag)}
											type="button"
											aria-pressed={selectedTag?.id === tag.id}
										>
											<span className="text-base">{tag.emoji}</span>
											<div className="flex-1 min-w-0">
												<h4 className="text-xs font-medium truncate">{tag.name}</h4>
												<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
													{tag.category && (
														<span>{tag.category}</span>
													)}
													{(tag._count?.images || 0) > 0 && (
														<>
															<span>•</span>
															<span>{tag._count?.images || 0} imágenes</span>
														</>
													)}
													{tag.isFavorite && (
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
												data-id={tag.id}
												onClick={handleDeleteButtonClick as unknown as () => void}
											>
												<Trash className="h-3 w-3" />
											</Button>
										</button>
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
									{isEditing ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
								</CardTitle>
								<CardDescription className="text-xs">
									{isEditing
										? 'Modifica los detalles de la etiqueta seleccionada'
										: 'Completa el formulario para crear una nueva etiqueta'}
								</CardDescription>
							</div>
							<div className="flex gap-1">
								{isEditing && selectedTag && (
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
											onClick={() => handleDeleteTag(selectedTag.id)}
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
									form="tag-form"
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
									<CreateTagForm
										key={selectedTag?.id || 'new-tag'}
										tag={selectedTag}
										isEditing={isEditing}
										onCreated={handleTagCreated}
										onUpdated={handleTagUpdated}
										onCancel={handleReset}
										onPreview={handlePreview}
									/>
								</div>
								<div className="hidden lg:flex flex-col items-center justify-start">
									<h3 className="text-xs font-medium mb-2">Vista Previa</h3>
									<div className="w-[180px] transition-all duration-300">
										{previewData || selectedTag ? (
											<div className="flex flex-col items-center p-4 border rounded-lg bg-background">
												<div className="w-12 h-12 mb-3 rounded-full flex items-center justify-center text-2xl"
													style={{ backgroundColor: (previewData?.color || selectedTag?.color || '#3b82f6') }}>
													{previewData?.emoji || selectedTag?.emoji || '🏷️'}
												</div>
												<h3 className="text-lg font-medium">
													{previewData?.name || selectedTag?.name || 'Nueva Etiqueta'}
												</h3>
												<p className="text-center text-muted-foreground mt-2 text-sm">
													{previewData?.description || selectedTag?.description || 'Sin descripción'}
												</p>

												<div className="flex flex-wrap gap-2 mt-3 justify-center">
													{(previewData?.category || selectedTag?.category) && (
														<Badge variant="secondary" className="text-xs">
															{previewData?.category || selectedTag?.category}
														</Badge>
													)}
													{(previewData?.isFavorite || selectedTag?.isFavorite) && (
														<Badge variant="outline" className="text-xs">Favorito</Badge>
													)}
												</div>

												{(previewData?._count?.images || selectedTag?._count?.images) && (
													<p className="mt-4 text-xs text-muted-foreground">
														{previewData?._count?.images || selectedTag?._count?.images} imágenes asociadas
													</p>
												)}
											</div>
										) : (
											<div className="flex flex-col items-center justify-center h-[260px] bg-muted/50 rounded-lg border border-dashed">
												<TagIcon className="h-7 w-7 text-muted-foreground/50" />
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
		</div>
	);
}

// Función auxiliar para generar colores basados en categoría
function generateCategoryColor(category: TagCategory): string {
	switch (category) {
		case TagCategory.CHARACTER:
			return 'bg-blue-500';
		case TagCategory.LOCATION:
			return 'bg-green-500';
		case TagCategory.OBJECT:
			return 'bg-yellow-500';
		case TagCategory.CONCEPT:
			return 'bg-purple-500';
		case TagCategory.EVENT:
			return 'bg-red-500';
		case TagCategory.COLOR:
			return 'bg-indigo-500';
		case TagCategory.STYLE:
			return 'bg-pink-500';
		case TagCategory.EMOTION:
			return 'bg-orange-500';
		case TagCategory.CUSTOM:
			return 'bg-cyan-500';
		default:
			return 'bg-gray-500';
	}
}
