import { Filter, Loader2, PlusCircle, Save, Trash, Users } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCharacters, useDeleteCharacter } from '@/lib/api/characters';
import toastService from '@/lib/ui/toast';
import type { CharacterWithStats } from '@/types/entities/character';
import { CharacterCategory, CharacterClass } from '@/types/entities/character/enums';
import { CreateCharacterForm } from './create-character-form';

// Tipos seguros para el manejo de eventos y datos de preview
interface PreviewData {
	name?: string;
	description?: string;
	color?: string;
	emoji?: string;
	race?: string;
	class?: string;
	category?: string;
	isFavorite?: boolean;
}

export function CharactersSettings() {
	const [selectedCharacter, setSelectedCharacter] = useState<CharacterWithStats | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [previewData, setPreviewData] = useState<PreviewData | null>(null);

	// Filtros
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
	const [onlyFavorites, setOnlyFavorites] = useState(false);

	// React Query hooks
	const { data: charactersResponse, isLoading, error } = useCharacters({ search: searchQuery });
	const deleteCharacterMutation = useDeleteCharacter();

	const characters = charactersResponse?.data || [];

	// Calcular estadísticas generales
	const stats = {
		totalCharacters: characters.length,
		totalImages: characters.reduce((acc, character) => acc + (character.statistics?.totalImages || 0), 0),
		totalSize: characters.reduce((acc, character) => acc + (character.statistics?.totalAssociations || 0), 0),
		unusedCharacters: characters.filter((character) => (character.statistics?.totalImages || 0) === 0).length,
		favoriteCharacters: characters.filter((character) => character.isFavorite).length,
	};

	// Filtrar personajes basados en los criterios seleccionados
	const filteredCharacters = characters.filter((character) => {
		let matches = true;

		// Filtrar por categorías
		if (selectedCategories.length > 0) {
			matches = matches && (character.category ? selectedCategories.includes(character.category) : false);
		}

		// Filtrar por clases
		if (selectedClasses.length > 0) {
			matches = matches && (character.class ? selectedClasses.includes(character.class) : false);
		}

		// Filtrar por favoritos
		if (onlyFavorites) {
			matches = matches && !!character.isFavorite;
		}

		return matches;
	});

	// Manejar eliminación de personaje
	const handleDeleteCharacter = useCallback(
		async (id: string) => {
			try {
				await deleteCharacterMutation.mutateAsync(id);
				setSelectedCharacter(null);
				setIsEditing(false);
				toastService.success('Personaje eliminado');
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				toastService.error('Error al eliminar el personaje', {
					description: errorMessage,
				});
			}
		},
		[deleteCharacterMutation]
	);

	// Manejar edición de personaje
	const handleEditCharacter = useCallback((character: CharacterWithStats) => {
		setSelectedCharacter(character);
		setIsEditing(true);
	}, []);

	// Manejar la eliminación desde el botón con detención de propagación de eventos
	const handleDeleteButtonClick = useCallback(
		(characterId: string) => {
			handleDeleteCharacter(characterId);
		},
		[handleDeleteCharacter]
	);

	// Manejar creación exitosa
	const handleCharacterCreated = useCallback((_newCharacter: CharacterWithStats) => {
		toastService.success('Personaje creado');
	}, []);

	// Manejar actualización exitosa
	const handleCharacterUpdated = useCallback((_updatedCharacter: CharacterWithStats) => {
		toastService.success('Personaje actualizado');
	}, []);

	// Resetear formulario
	const handleReset = useCallback(() => {
		setIsEditing(false);
		setSelectedCharacter(null);
	}, []);

	// Manejar la previsualización en tiempo real
	const handlePreview = useCallback((data: PreviewData) => {
		setPreviewData(data);
	}, []);

	// Limpiar filtros
	const clearFilters = useCallback(() => {
		setSearchQuery('');
		setSelectedCategories([]);
		setSelectedClasses([]);
		setOnlyFavorites(false);
	}, []);

	// Extraer categorías y clases únicas de los personajes
	const uniqueCategories = Array.from(
		new Set(characters.map((character) => character.category).filter(Boolean))
	) as string[];
	const uniqueClasses = Array.from(new Set(characters.map((character) => character.class).filter(Boolean))) as string[];

	// Contenido condicional basado en estado de carga
	if (isLoading) {
		return (
			<Card className="rounded-sm bg-muted/30 border-none">
				<CardContent>
					<div className="flex items-center justify-center gap-2 p-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<p className="text-sm text-muted-foreground">Cargando personajes...</p>
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
						<p className="text-sm text-destructive">Error al cargar personajes: {error.message}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-12 gap-3">
			{/* Panel izquierdo: Lista de personajes */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="space-y-1 py-2 px-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm flex items-center">
								Personajes ({filteredCharacters.length})
								{filteredCharacters.length !== characters.length && (
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
											<h4 className="font-medium text-sm">Filtrar Personajes</h4>

											<div className="space-y-2">
												<Label htmlFor="search">Buscar</Label>
												<Input
													id="search"
													placeholder="Buscar personajes..."
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

											<div className="space-y-2">
												<Label>Clases</Label>
												<div className="grid grid-cols-2 gap-2">
													{uniqueClasses.map((characterClass) => (
														<div key={characterClass} className="flex items-center space-x-2">
															<Checkbox
																id={`class-${characterClass}`}
																checked={selectedClasses.includes(characterClass)}
																onCheckedChange={(checked) => {
																	if (checked) {
																		setSelectedClasses((prev) => [...prev, characterClass]);
																	} else {
																		setSelectedClasses((prev) => prev.filter((c) => c !== characterClass));
																	}
																}}
															/>
															<Label htmlFor={`class-${characterClass}`} className="text-xs">
																{characterClass}
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
										setSelectedCharacter(null);
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
							<span>{stats.totalCharacters} personajes</span>
							<span>•</span>
							<span>{stats.totalImages} imágenes</span>
							{stats.favoriteCharacters > 0 && (
								<>
									<span>•</span>
									<span>{stats.favoriteCharacters} favoritos</span>
								</>
							)}
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full px-3 pb-3">
							{filteredCharacters.length === 0 ? (
								<EmptyState
									icon={Users}
									title="No hay personajes"
									description={
										characters.length > 0
											? 'No se encontraron personajes con los filtros aplicados'
											: 'Crea tu primer personaje'
									}
									className="py-6"
									actions={
										characters.length > 0 && (
											<Button size="sm" variant="outline" onClick={clearFilters}>
												Limpiar filtros
											</Button>
										)
									}
								/>
							) : (
								<div className="space-y-1">
									{filteredCharacters.map((character) => (
										<div
											key={character.id}
											className={`relative group/item flex items-center gap-2 p-1.5 rounded-md transition-colors hover:bg-muted/50 w-full ${selectedCharacter?.id === character.id ? 'bg-muted' : ''}`}
										>
											<button
												className="flex items-center gap-2 w-full text-left cursor-pointer"
												onClick={() => handleEditCharacter(character)}
												type="button"
												aria-pressed={selectedCharacter?.id === character.id}
												aria-label={`Editar personaje ${character.name}`}
											>
												<div
													className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-white"
													style={{ backgroundColor: character.color }}
												>
													<span className="text-xs">{character.emoji || character.name.charAt(0).toUpperCase()}</span>
												</div>
												<div className="flex-1 min-w-0">
													<h4 className="text-xs font-medium truncate">{character.name}</h4>
													<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
														{character.race && <span>{character.race}</span>}
														{character.class && (
															<>
																<span>•</span>
																<span>{character.class}</span>
															</>
														)}
														{character.isFavorite && (
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
													handleDeleteCharacter(character.id);
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
								<CardTitle className="text-sm">{isEditing ? 'Editar Personaje' : 'Nuevo Personaje'}</CardTitle>
								<CardDescription className="text-xs">
									{isEditing
										? 'Modifica los detalles del personaje seleccionado'
										: 'Completa el formulario para crear un nuevo personaje'}
								</CardDescription>
							</div>
							<div className="flex gap-1">
								{isEditing && selectedCharacter && (
									<>
										<Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleReset}>
											Cancelar
										</Button>
										<Button
											variant="destructive"
											size="sm"
											className="h-7 text-xs"
											onClick={() => handleDeleteCharacter(selectedCharacter.id)}
										>
											<Trash className="h-3 w-3 mr-1" />
											Eliminar
										</Button>
									</>
								)}
								<Button type="submit" size="sm" className="h-7 text-xs" form="character-form">
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
									<CreateCharacterForm
										character={selectedCharacter}
										isEditing={isEditing}
										onCreated={handleCharacterCreated}
										onUpdated={handleCharacterUpdated}
										onCancel={handleReset}
										onPreview={handlePreview}
									/>
								</div>
								<div className="hidden lg:flex flex-col items-center justify-start">
									<h3 className="text-xs font-medium mb-2">Vista Previa</h3>
									<div className="w-[220px] transition-all duration-300">
										{previewData || selectedCharacter ? (
											<div className="flex flex-col items-center p-4 border rounded-lg bg-background">
												<div
													className="w-16 h-16 mb-3 rounded-full flex items-center justify-center text-white"
													style={{ backgroundColor: previewData?.color || selectedCharacter?.color || '#3b82f6' }}
												>
													<span className="text-xl">{previewData?.emoji || selectedCharacter?.emoji || '👤'}</span>
												</div>
												<h3 className="text-lg font-medium text-center">
													{previewData?.name || selectedCharacter?.name || 'Nuevo Personaje'}
												</h3>

												<div className="flex flex-wrap gap-2 mt-3 justify-center">
													{(previewData?.race || selectedCharacter?.race) && (
														<Badge variant="secondary" className="text-xs">
															{previewData?.race || selectedCharacter?.race}
														</Badge>
													)}
													{(previewData?.class || selectedCharacter?.class) && (
														<Badge variant="outline" className="text-xs">
															{previewData?.class || selectedCharacter?.class}
														</Badge>
													)}
												</div>

												<p className="text-center text-muted-foreground mt-3 text-sm">
													{previewData?.description || selectedCharacter?.description || 'Sin descripción'}
												</p>

												{(previewData?.category || selectedCharacter?.category) && (
													<p className="mt-3 text-xs text-muted-foreground">
														Categoría: {previewData?.category || selectedCharacter?.category}
													</p>
												)}

												{(previewData?.isFavorite || selectedCharacter?.isFavorite) && (
													<div className="mt-2 text-xs text-yellow-500">★ Favorito</div>
												)}
											</div>
										) : (
											<div className="flex flex-col items-center justify-center h-[300px] bg-muted/50 rounded-lg border border-dashed">
												<Users className="h-7 w-7 text-muted-foreground/50" />
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

// Corregir función para generar colores de categoría
function _generateCategoryColor(category: CharacterCategory): string {
	switch (category) {
		case CharacterCategory.PROTAGONIST:
			return 'bg-blue-500';
		case CharacterCategory.ANTAGONIST:
			return 'bg-red-500';
		case CharacterCategory.ALLY:
			return 'bg-green-500';
		case CharacterCategory.VILLAIN:
			return 'bg-purple-700';
		case CharacterCategory.SUPPORTING:
			return 'bg-green-500';
		case CharacterCategory.MENTOR:
			return 'bg-amber-500';
		case CharacterCategory.SIDEKICK:
			return 'bg-teal-500';
		case CharacterCategory.ANTIHERO:
			return 'bg-indigo-500';
		case CharacterCategory.HISTORICAL:
			return 'bg-orange-500';
		case CharacterCategory.MYTHOLOGICAL:
			return 'bg-violet-500';
		case CharacterCategory.FICTIONAL:
			return 'bg-sky-500';
		case CharacterCategory.OTHER:
			return 'bg-gray-500';
		default:
			return 'bg-gray-500';
	}
}

// Corregir función para generar colores de clase
function _generateClassColor(characterClass: CharacterClass): string {
	switch (characterClass) {
		case CharacterClass.WARRIOR:
			return 'bg-red-600';
		case CharacterClass.MAGE:
			return 'bg-blue-600';
		case CharacterClass.ROGUE:
			return 'bg-green-600';
		case CharacterClass.CLERIC:
			return 'bg-yellow-600';
		case CharacterClass.RANGER:
			return 'bg-teal-600';
		case CharacterClass.BARD:
			return 'bg-purple-600';
		case CharacterClass.PALADIN:
			return 'bg-amber-600';
		case CharacterClass.DRUID:
			return 'bg-emerald-600';
		case CharacterClass.MONK:
			return 'bg-orange-600';
		case CharacterClass.WARLOCK:
			return 'bg-violet-600';
		case CharacterClass.SORCERER:
			return 'bg-indigo-600';
		case CharacterClass.BARBARIAN:
			return 'bg-rose-600';
		case CharacterClass.ARTIFICER:
			return 'bg-cyan-600';
		case CharacterClass.UNKNOWN:
			return 'bg-slate-600';
		default:
			return 'bg-gray-600';
	}
}
