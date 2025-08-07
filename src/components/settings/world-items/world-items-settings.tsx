import { Filter, Package, PlusCircle, Trash, X } from 'lucide-react';
import React, { useCallback, useId, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { WorldItemCreateInput, WorldItemUpdateInput } from '@/lib/api/world-items';
import { useCreateWorldItem, useDeleteWorldItem, useUpdateWorldItem, useWorldItems } from '@/lib/api/world-items';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import type { WorldItemComplete } from '@/types/entities/world-item';
import { CreateWorldItemForm } from './create-world-item-form';

export function WorldItemsSettings() {
	// State local para UI
	const [selectedItem, setSelectedItem] = useState<WorldItemComplete | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [previewData, setPreviewData] = useState<WorldItemComplete | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterTypes, setFilterTypes] = useState<string[]>([]);
	const [filterRarities, setFilterRarities] = useState<string[]>([]);
	const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

	// Hook useId debe estar fuera de condiciones
	const idShowFavorites = useId();

	// React Query hooks
	const { data: worldItemsResponse, isLoading, error } = useWorldItems({ search: searchTerm });
	const createWorldItemMutation = useCreateWorldItem();
	const updateWorldItemMutation = useUpdateWorldItem();
	const deleteWorldItemMutation = useDeleteWorldItem();

	const worldItems = worldItemsResponse?.data || [];

	// Obtener tipos únicos para el filtro
	const uniqueTypes = useMemo(() => {
		const types = worldItems
			.map((item) => item.type)
			.filter((type): type is string => type !== null && type !== undefined && type !== 'none');

		return [...new Set(types)];
	}, [worldItems]);

	// Obtener rarezas únicas para el filtro
	const uniqueRarities = useMemo(() => {
		const rarities = worldItems
			.map((item) => item.rarity)
			.filter((rarity): rarity is string => rarity !== null && rarity !== undefined && rarity !== 'none');

		return [...new Set(rarities)];
	}, [worldItems]);

	// Calcular estadísticas generales
	const stats = useMemo(
		() => ({
			totalItems: worldItems.length,
			totalImages: worldItems.reduce((acc, item) => acc + (item._count?.images || 0), 0),
			unusedItems: worldItems.filter((item) => (item._count?.images || 0) === 0).length,
			favoriteItems: worldItems.filter((item) => item.isFavorite).length,
		}),
		[worldItems]
	);

	// Filtrar objetos según criterios
	const filteredItemsList = useMemo(() => {
		let result = [...worldItems];

		// Aplicar búsqueda por término (ya se maneja en la query)
		// if (searchTerm.trim() !== '') {
		// 	const term = searchTerm.toLowerCase().trim();
		// 	result = result.filter(
		// 		(item) =>
		// 			item.name.toLowerCase().includes(term) ||
		// 			item.description?.toLowerCase().includes(term) ||
		// 			item.origin?.toLowerCase().includes(term)
		// 	);
		// }

		// Filtrar por tipos si hay alguno seleccionado
		if (filterTypes.length > 0) {
			result = result.filter((item) => item.type && item.type !== 'none' && filterTypes.includes(item.type));
		}

		// Filtrar por rareza si hay alguna seleccionada
		if (filterRarities.length > 0) {
			result = result.filter((item) => item.rarity && item.rarity !== 'none' && filterRarities.includes(item.rarity));
		}

		// Filtrar por favoritos si está activado
		if (showOnlyFavorites) {
			result = result.filter((item) => item.isFavorite);
		}

		return result;
	}, [worldItems, filterTypes, filterRarities, showOnlyFavorites]);

	// Manejar eliminación de objeto
	const handleDeleteItem = useCallback(
		async (id: string) => {
			try {
				await deleteWorldItemMutation.mutateAsync(id);
				toastService.success('Objeto eliminado correctamente');

				// Reset selection if deleted item was selected
				if (selectedItem?.id === id) {
					setSelectedItem(null);
					setIsEditing(false);
					setPreviewData(null);
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				toastService.error('Error al eliminar el objeto', {
					description: errorMessage,
				});
			}
		},
		[selectedItem, deleteWorldItemMutation]
	);

	// Manejar edición de objeto
	const handleEditItem = useCallback((item: WorldItemComplete) => {
		setSelectedItem(item);
		setIsEditing(true);
		setPreviewData(item);
	}, []);

	// Manejar creación exitosa
	const handleItemCreated = useCallback(
		async (data: WorldItemCreateInput) => {
			try {
				await createWorldItemMutation.mutateAsync(data);
				toastService.success('Objeto creado correctamente');
				setPreviewData(null);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				toastService.error('Error al crear el objeto', {
					description: errorMessage,
				});
			}
		},
		[createWorldItemMutation]
	);

	// Manejar actualización exitosa
	const handleItemUpdated = useCallback(
		async (id: string, data: WorldItemUpdateInput) => {
			try {
				await updateWorldItemMutation.mutateAsync({ id, data });
				setIsEditing(false);
				setSelectedItem(null);
				setPreviewData(null);
				toastService.success('Objeto actualizado correctamente');
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				toastService.error('Error al actualizar el objeto', {
					description: errorMessage,
				});
			}
		},
		[updateWorldItemMutation]
	);

	// Resetear formulario
	const handleReset = useCallback(() => {
		setIsEditing(false);
		setSelectedItem(null);
		setPreviewData(null);
	}, []);

	// Manejar vista previa
	const handlePreview = useCallback((data: WorldItemComplete) => {
		setPreviewData(data);
	}, []);

	// Alternar tipo en filtro
	const toggleType = useCallback((type: string) => {
		setFilterTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
	}, []);

	// Alternar rareza en filtro
	const toggleRarity = useCallback((rarity: string) => {
		setFilterRarities((prev) => (prev.includes(rarity) ? prev.filter((r) => r !== rarity) : [...prev, rarity]));
	}, []);

	// Limpiar todos los filtros
	const clearFilters = useCallback(() => {
		setFilterTypes([]);
		setFilterRarities([]);
		setShowOnlyFavorites(false);
		setSearchTerm('');
	}, []);

	// Mostrar loading state
	if (isLoading) {
		return (
			<div className="flex h-[calc(100vh-8rem)] items-center justify-center">
				<div className="text-center">
					<div className="mx-auto h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2" />
					<p className="mt-2 text-gray-500 text-sm">Cargando objetos del mundo...</p>
				</div>
			</div>
		);
	}

	// Mostrar error state
	if (error) {
		return (
			<div className="flex h-[calc(100vh-8rem)] items-center justify-center">
				<div className="text-center">
					<p className="text-red-500">Error al cargar los objetos del mundo</p>
					<p className="mt-1 text-gray-500 text-sm">{error instanceof Error ? error.message : 'Error desconocido'}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="grid h-[calc(100vh-8rem)] grid-cols-12 gap-3">
			{/* Panel izquierdo: Lista de objetos */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="flex h-full flex-col rounded-sm border-none bg-muted/30">
					<CardHeader className="space-y-1 px-3 py-2">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="font-bold text-xl">Objetos del Mundo</CardTitle>
								<CardDescription className="text-xs">
									{stats.totalItems} objetos • {stats.favoriteItems} favoritos
								</CardDescription>
							</div>
							<Button
								onClick={() => {
									setIsEditing(false);
									setSelectedItem(null);
									setPreviewData(null);
								}}
								size="sm"
								variant="ghost"
							>
								<PlusCircle className="h-4 w-4" />
							</Button>
						</div>

						{/* Filtros */}
						<div className="space-y-2">
							{/* Búsqueda */}
							<div className="relative">
								<Input
									className="h-8"
									onChange={(e) => setSearchTerm(e.target.value)}
									placeholder="Buscar objetos..."
									value={searchTerm}
								/>
							</div>

							{/* Filtros avanzados */}
							<div className="flex gap-2">
								{/* Filtro por tipos */}
								{uniqueTypes.length > 0 && (
									<Popover>
										<PopoverTrigger asChild>
											<Button className="h-8" size="sm" variant="outline">
												<Filter className="mr-1 h-4 w-4" />
												Tipos
												{filterTypes.length > 0 && (
													<Badge className="ml-1 h-4 px-1 text-xs" variant="secondary">
														{filterTypes.length}
													</Badge>
												)}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-48 p-2">
											<div className="space-y-2">
												{uniqueTypes.map((type) => (
													<div className="flex items-center space-x-2" key={type}>
														<Checkbox
															checked={filterTypes.includes(type)}
															id={`type-${type}`}
															onCheckedChange={() => toggleType(type)}
														/>
														<Label className="text-sm" htmlFor={`type-${type}`}>
															{type}
														</Label>
													</div>
												))}
											</div>
										</PopoverContent>
									</Popover>
								)}

								{/* Filtro por rareza */}
								{uniqueRarities.length > 0 && (
									<Popover>
										<PopoverTrigger asChild>
											<Button className="h-8" size="sm" variant="outline">
												<Filter className="mr-1 h-4 w-4" />
												Rareza
												{filterRarities.length > 0 && (
													<Badge className="ml-1 h-4 px-1 text-xs" variant="secondary">
														{filterRarities.length}
													</Badge>
												)}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-48 p-2">
											<div className="space-y-2">
												{uniqueRarities.map((rarity) => (
													<div className="flex items-center space-x-2" key={rarity}>
														<Checkbox
															checked={filterRarities.includes(rarity)}
															id={`rarity-${rarity}`}
															onCheckedChange={() => toggleRarity(rarity)}
														/>
														<Label className="text-sm" htmlFor={`rarity-${rarity}`}>
															{rarity}
														</Label>
													</div>
												))}
											</div>
										</PopoverContent>
									</Popover>
								)}

								{/* Favoritos */}
								<div className="flex items-center space-x-2">
									<Checkbox
										checked={showOnlyFavorites}
										id={idShowFavorites}
										onCheckedChange={(checked) => setShowOnlyFavorites(!!checked)}
									/>
									<Label className="text-sm" htmlFor={idShowFavorites}>
										Solo favoritos
									</Label>
								</div>
							</div>

							{/* Limpiar filtros */}
							{(filterTypes.length > 0 || filterRarities.length > 0 || showOnlyFavorites || searchTerm) && (
								<Button className="h-6 px-2 text-xs" onClick={clearFilters} size="sm" variant="ghost">
									<X className="mr-1 h-3 w-3" />
									Limpiar filtros
								</Button>
							)}
						</div>
					</CardHeader>

					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full">
							<div className="space-y-1 p-2">
								{filteredItemsList.length === 0 ? (
									<EmptyState
										description={
											searchTerm || filterTypes.length > 0 || filterRarities.length > 0 || showOnlyFavorites
												? 'Intenta ajustar los filtros de búsqueda'
												: 'Crea tu primer objeto del mundo'
										}
										icon={Package}
										title="No se encontraron objetos"
									/>
								) : (
									filteredItemsList.map((item) => (
										<div
											className={cn(
												'group/item relative rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
												selectedItem?.id === item.id && 'bg-secondary text-secondary-foreground'
											)}
											key={item.id}
										>
											<Button
												className="relative h-12 w-full justify-start"
												onClick={() => setSelectedItem(item as unknown as WorldItemComplete)}
												variant="ghost"
											>
												<div className="flex w-full items-center gap-2">
													<div className="flex flex-1 flex-col items-start">
														<span className="font-medium">{item.name}</span>
														<span className="text-xs opacity-50">{item._count?.images || 0} imágenes</span>
													</div>
													{item.isFavorite && (
														<Badge className="text-xs" variant="secondary">
															⭐
														</Badge>
													)}
												</div>
											</Button>
											<Button
												className="absolute top-1 right-1 h-10 w-10 opacity-0 group-hover/item:opacity-100"
												onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
													e.stopPropagation();
													handleDeleteItem(item.id);
												}}
												size="icon"
												variant="ghost"
											>
												<Trash className="h-4 w-4" />
											</Button>
										</div>
									))
								)}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			{/* Panel derecho: Formulario o vista previa */}
			<div className="col-span-12 md:col-span-7 lg:col-span-8">
				<Card className="flex h-full flex-col rounded-sm border-none bg-muted/30">
					{isEditing && selectedItem ? (
						<>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle>Editar Objeto</CardTitle>
									<Button onClick={handleReset} size="sm" variant="ghost">
										<X className="h-4 w-4" />
									</Button>
								</div>
							</CardHeader>
							<CardContent className="flex-1">
								<CreateWorldItemForm
									isEditing={true}
									onCancel={handleReset}
									onPreview={handlePreview}
									onUpdated={(updatedItem) => handleItemUpdated(selectedItem.id, updatedItem as WorldItemUpdateInput)}
									worldItem={selectedItem}
								/>
							</CardContent>
						</>
					) : selectedItem ? (
						<>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle>{selectedItem.name}</CardTitle>
										<CardDescription>{selectedItem.description}</CardDescription>
									</div>
									<div className="flex gap-2">
										<Button onClick={() => handleEditItem(selectedItem)} size="sm" variant="outline">
											Editar
										</Button>
										<Button onClick={() => handleDeleteItem(selectedItem.id)} size="sm" variant="destructive">
											Eliminar
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{selectedItem.type && selectedItem.type !== 'none' && (
										<div>
											<h4 className="mb-2 font-medium">Tipo</h4>
											<Badge variant="outline">{selectedItem.type}</Badge>
										</div>
									)}
									{selectedItem.rarity && selectedItem.rarity !== 'none' && (
										<div>
											<h4 className="mb-2 font-medium">Rareza</h4>
											<Badge variant="outline">{selectedItem.rarity}</Badge>
										</div>
									)}
									{selectedItem.origin && (
										<div>
											<h4 className="mb-2 font-medium">Origen</h4>
											<p className="text-muted-foreground text-sm">{selectedItem.origin}</p>
										</div>
									)}
								</div>
							</CardContent>
						</>
					) : (
						<>
							<CardHeader>
								<CardTitle>Crear Nuevo Objeto</CardTitle>
							</CardHeader>
							<CardContent className="flex-1">
								<CreateWorldItemForm onCancel={handleReset} onCreated={handleItemCreated} onPreview={handlePreview} />
							</CardContent>
						</>
					)}
				</Card>
			</div>
		</div>
	);
}
