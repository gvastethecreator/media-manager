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
import type { WorldItemCreateInput, WorldItemUpdateInput } from '@/lib/api/world-items';
import { useCreateWorldItem, useDeleteWorldItem, useUpdateWorldItem, useWorldItems } from '@/lib/api/world-items';
import { cn } from '@/lib/utils';
import toastService from '@/services/toast';
import type { WorldItemComplete } from '@/types/entities/world-item';
import { Filter, Package, PlusCircle, Trash, X } from 'lucide-react';
import { useCallback, useId, useMemo, useState } from 'react';
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
			totalSize: worldItems.reduce((acc, item) => acc + (item.totalSize || 0), 0),
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
			<div className="flex items-center justify-center h-[calc(100vh-8rem)]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
					<p className="mt-2 text-sm text-gray-500">Cargando objetos del mundo...</p>
				</div>
			</div>
		);
	}

	// Mostrar error state
	if (error) {
		return (
			<div className="flex items-center justify-center h-[calc(100vh-8rem)]">
				<div className="text-center">
					<p className="text-red-500">Error al cargar los objetos del mundo</p>
					<p className="text-sm text-gray-500 mt-1">{error instanceof Error ? error.message : 'Error desconocido'}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-12 gap-3 h-[calc(100vh-8rem)]">
			{/* Panel izquierdo: Lista de objetos */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="rounded-sm bg-muted/30 border-none h-full flex flex-col">
					<CardHeader className="space-y-1 py-2 px-3">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-xl font-bold">Objetos del Mundo</CardTitle>
								<CardDescription className="text-xs">
									{stats.totalItems} objetos • {stats.favoriteItems} favoritos
								</CardDescription>
							</div>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => {
									setIsEditing(false);
									setSelectedItem(null);
									setPreviewData(null);
								}}
							>
								<PlusCircle className="h-4 w-4" />
							</Button>
						</div>

						{/* Filtros */}
						<div className="space-y-2">
							{/* Búsqueda */}
							<div className="relative">
								<Input
									placeholder="Buscar objetos..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="h-8"
								/>
							</div>

							{/* Filtros avanzados */}
							<div className="flex gap-2">
								{/* Filtro por tipos */}
								{uniqueTypes.length > 0 && (
									<Popover>
										<PopoverTrigger asChild>
											<Button variant="outline" size="sm" className="h-8">
												<Filter className="h-4 w-4 mr-1" />
												Tipos
												{filterTypes.length > 0 && (
													<Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
														{filterTypes.length}
													</Badge>
												)}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-48 p-2">
											<div className="space-y-2">
												{uniqueTypes.map((type) => (
													<div key={type} className="flex items-center space-x-2">
														<Checkbox
															id={`type-${type}`}
															checked={filterTypes.includes(type)}
															onCheckedChange={() => toggleType(type)}
														/>
														<Label htmlFor={`type-${type}`} className="text-sm">
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
											<Button variant="outline" size="sm" className="h-8">
												<Filter className="h-4 w-4 mr-1" />
												Rareza
												{filterRarities.length > 0 && (
													<Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
														{filterRarities.length}
													</Badge>
												)}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-48 p-2">
											<div className="space-y-2">
												{uniqueRarities.map((rarity) => (
													<div key={rarity} className="flex items-center space-x-2">
														<Checkbox
															id={`rarity-${rarity}`}
															checked={filterRarities.includes(rarity)}
															onCheckedChange={() => toggleRarity(rarity)}
														/>
														<Label htmlFor={`rarity-${rarity}`} className="text-sm">
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
									<Checkbox id={idShowFavorites} checked={showOnlyFavorites} onCheckedChange={setShowOnlyFavorites} />
									<Label htmlFor={idShowFavorites} className="text-sm">
										Solo favoritos
									</Label>
								</div>
							</div>

							{/* Limpiar filtros */}
							{(filterTypes.length > 0 || filterRarities.length > 0 || showOnlyFavorites || searchTerm) && (
								<Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
									<X className="h-3 w-3 mr-1" />
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
										icon={Package}
										title="No se encontraron objetos"
										description={
											searchTerm || filterTypes.length > 0 || filterRarities.length > 0 || showOnlyFavorites
												? 'Intenta ajustar los filtros de búsqueda'
												: 'Crea tu primer objeto del mundo'
										}
									/>
								) : (
									filteredItemsList.map((item) => (
										<div
											key={item.id}
											className={cn(
												'relative group/item rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
												selectedItem?.id === item.id && 'bg-secondary text-secondary-foreground'
											)}
										>
											<Button
												variant="ghost"
												className="w-full justify-start h-12 relative"
												onClick={() => setSelectedItem(item as unknown as WorldItemComplete)}
											>
												<div className="flex items-center gap-2 w-full">
													<div className="flex flex-col items-start flex-1">
														<span className="font-medium">{item.name}</span>
														<span className="text-xs opacity-50">{item._count?.images || 0} imágenes</span>
													</div>
													{item.isFavorite && (
														<Badge variant="secondary" className="text-xs">
															⭐
														</Badge>
													)}
												</div>
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="absolute right-1 top-1 opacity-0 group-hover/item:opacity-100 h-10 w-10"
												onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
													e.stopPropagation();
													handleDeleteItem(item.id);
												}}
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
				<Card className="rounded-sm bg-muted/30 border-none h-full flex flex-col">
					{isEditing && selectedItem ? (
						<>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle>Editar Objeto</CardTitle>
									<Button variant="ghost" size="sm" onClick={handleReset}>
										<X className="h-4 w-4" />
									</Button>
								</div>
							</CardHeader>
							<CardContent className="flex-1">
								<CreateWorldItemForm
									worldItem={selectedItem}
									isEditing={true}
									onUpdated={(updatedItem) => handleItemUpdated(selectedItem.id, updatedItem as WorldItemUpdateInput)}
									onCancel={handleReset}
									onPreview={handlePreview}
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
										<Button size="sm" variant="outline" onClick={() => handleEditItem(selectedItem)}>
											Editar
										</Button>
										<Button size="sm" variant="destructive" onClick={() => handleDeleteItem(selectedItem.id)}>
											Eliminar
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{selectedItem.type && selectedItem.type !== 'none' && (
										<div>
											<h4 className="font-medium mb-2">Tipo</h4>
											<Badge variant="outline">{selectedItem.type}</Badge>
										</div>
									)}
									{selectedItem.rarity && selectedItem.rarity !== 'none' && (
										<div>
											<h4 className="font-medium mb-2">Rareza</h4>
											<Badge variant="outline">{selectedItem.rarity}</Badge>
										</div>
									)}
									{selectedItem.origin && (
										<div>
											<h4 className="font-medium mb-2">Origen</h4>
											<p className="text-sm text-muted-foreground">{selectedItem.origin}</p>
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
								<CreateWorldItemForm onCreated={handleItemCreated} onCancel={handleReset} onPreview={handlePreview} />
							</CardContent>
						</>
					)}
				</Card>
			</div>
		</div>
	);
}
