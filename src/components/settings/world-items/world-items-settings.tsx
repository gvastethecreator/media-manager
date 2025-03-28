'use client';

import { deleteWorldItem, getWorldItems, WorldItemWithStats } from '@/app/actions/world-items/world-item.actions';
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
import { cn } from '@/lib/utils';
import toastService from '@/services/toast.service';
import { WorldItem } from '@/types/entities/world-item';
import { formatBytes } from '@/utils/file/helpers';
import { Filter, Info, Loader2, Package, PlusCircle, Trash, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreateWorldItemForm } from './create-world-item-form';

export function WorldItemsSettings() {
	const [worldItems, setWorldItems] = useState<WorldItemWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedItem, setSelectedItem] = useState<WorldItem | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [previewData, setPreviewData] = useState<WorldItem | null>(null);

	// Filtros
	const [searchTerm, setSearchTerm] = useState('');
	const [filterTypes, setFilterTypes] = useState<string[]>([]);
	const [filterRarities, setFilterRarities] = useState<string[]>([]);
	const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

	// Cargar objetos al montar el componente
	useEffect(() => {
		const loadWorldItems = async () => {
			try {
				setIsLoading(true);
				const data = await getWorldItems();
				setWorldItems(data);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				setError(errorMessage);
				toastService.error('Error al cargar los objetos', {
					description: errorMessage,
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadWorldItems();
	}, []);

	// Obtener tipos únicos para el filtro
	const uniqueTypes = useMemo(() => {
		const types = worldItems
			.map(item => item.type)
			.filter((type): type is string =>
				type !== null && type !== undefined && type !== 'none'
			);

		return [...new Set(types)];
	}, [worldItems]);

	// Obtener rarezas únicas para el filtro
	const uniqueRarities = useMemo(() => {
		const rarities = worldItems
			.map(item => item.rarity)
			.filter((rarity): rarity is string =>
				rarity !== null && rarity !== undefined && rarity !== 'none'
			);

		return [...new Set(rarities)];
	}, [worldItems]);

	// Calcular estadísticas generales
	const stats = useMemo(() => ({
		totalItems: worldItems.length,
		totalImages: worldItems.reduce((acc, item) => acc + (item._count?.images || 0), 0),
		totalSize: worldItems.reduce((acc, item) => acc + (item.totalSize || 0), 0),
		unusedItems: worldItems.filter(item => (item._count?.images || 0) === 0).length,
		favoriteItems: worldItems.filter(item => item.isFavorite).length,
	}), [worldItems]);

	// Filtrar objetos según criterios
	const filteredItemsList = useMemo(() => {
		let result = [...worldItems];

		// Aplicar búsqueda por término
		if (searchTerm.trim() !== '') {
			const term = searchTerm.toLowerCase().trim();
			result = result.filter(item =>
				item.name.toLowerCase().includes(term) ||
				(item.description && item.description.toLowerCase().includes(term)) ||
				(item.origin && item.origin.toLowerCase().includes(term))
			);
		}

		// Filtrar por tipos si hay alguno seleccionado
		if (filterTypes.length > 0) {
			result = result.filter(item =>
				item.type && item.type !== 'none' && filterTypes.includes(item.type)
			);
		}

		// Filtrar por rareza si hay alguna seleccionada
		if (filterRarities.length > 0) {
			result = result.filter(item =>
				item.rarity && item.rarity !== 'none' && filterRarities.includes(item.rarity)
			);
		}

		// Filtrar por favoritos si está activado
		if (showOnlyFavorites) {
			result = result.filter(item => item.isFavorite);
		}

		return result;
	}, [worldItems, filterTypes, filterRarities, showOnlyFavorites, searchTerm]);

	// Manejar eliminación de objeto
	const handleDeleteItem = useCallback(async (id: string) => {
		try {
			await deleteWorldItem(id);
			setWorldItems(prev => prev.filter(item => item.id !== id));
			toastService.worldItem.deleted();

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
	}, [selectedItem]);

	// Manejar edición de objeto
	const handleEditItem = useCallback((item: WorldItem) => {
		setSelectedItem(item);
		setIsEditing(true);
		setPreviewData(item);
	}, []);

	// Manejar creación exitosa
	const handleItemCreated = useCallback((newItem: WorldItem) => {
		setWorldItems(prev => [...prev, newItem as unknown as WorldItemWithStats]);
		toastService.worldItem.created();
		setPreviewData(null);
	}, []);

	// Manejar actualización exitosa
	const handleItemUpdated = useCallback((updatedItem: WorldItem) => {
		setWorldItems(prev =>
			prev.map(item =>
				item.id === updatedItem.id
					? { ...item, ...updatedItem } as WorldItemWithStats
					: item
			)
		);
		setIsEditing(false);
		setSelectedItem(null);
		setPreviewData(null);
		toastService.worldItem.updated();
	}, []);

	// Resetear formulario
	const handleReset = useCallback(() => {
		setIsEditing(false);
		setSelectedItem(null);
		setPreviewData(null);
	}, []);

	// Manejar vista previa
	const handlePreview = useCallback((data: WorldItem) => {
		setPreviewData(data);
	}, []);

	// Alternar tipo en filtro
	const toggleType = useCallback((type: string) => {
		setFilterTypes(prev =>
			prev.includes(type)
				? prev.filter(t => t !== type)
				: [...prev, type]
		);
	}, []);

	// Alternar rareza en filtro
	const toggleRarity = useCallback((rarity: string) => {
		setFilterRarities(prev =>
			prev.includes(rarity)
				? prev.filter(r => r !== rarity)
				: [...prev, rarity]
		);
	}, []);

	// Limpiar todos los filtros
	const clearFilters = useCallback(() => {
		setFilterTypes([]);
		setFilterRarities([]);
		setShowOnlyFavorites(false);
		setSearchTerm('');
	}, []);

	// Generar color basado en el tipo de objeto
	const generateTypeColor = useCallback((type?: string | null) => {
		if (!type || type === 'none') return "#6b7280";

		switch (type.toLowerCase()) {
			case "arma": return "#ef4444";
			case "armadura": return "#3b82f6";
			case "amuleto": return "#8b5cf6";
			case "poción": return "#10b981";
			case "herramienta": return "#f59e0b";
			case "libro": return "#6366f1";
			case "reliquia": return "#d946ef";
			default: return "#6b7280";
		}
	}, []);

	// Generar color basado en la rareza
	const generateRarityColor = useCallback((rarity?: string | null) => {
		if (!rarity || rarity === 'none') return "#6b7280";

		switch (rarity.toLowerCase()) {
			case "común": return "#6b7280";
			case "poco común": return "#22c55e";
			case "raro": return "#3b82f6";
			case "épico": return "#8b5cf6";
			case "legendario": return "#f59e0b";
			case "mítico": return "#ef4444";
			case "único": return "#d946ef";
			default: return "#6b7280";
		}
	}, []);

	// Contenido condicional basado en estado de carga
	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[calc(100vh-10rem)]">
				<Loader2 className="h-8 w-8 animate-spin text-primary/70" />
				<span className="ml-2 text-muted-foreground">Cargando objetos...</span>
			</div>
		);
	}

	if (error) {
		return (
			<Card className="rounded-sm bg-muted/30 border-none">
				<CardContent>
					<EmptyState
						icon={Info}
						title="Error al cargar objetos"
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
		<div className="grid grid-cols-12 gap-4">
			{/* Panel izquierdo: Lista de objetos */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden border-none bg-muted/30 rounded-sm">
					<CardHeader className="space-y-1 py-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-base">Objetos ({filteredItemsList.length})</CardTitle>
							<div className="flex items-center gap-1">
								<Button
									onClick={() => { setSelectedItem(null); setIsEditing(false); setPreviewData(null); }}
									size="sm"
									variant="ghost"
									className="h-7 w-7 p-0"
								>
									<PlusCircle className="h-4 w-4" />
								</Button>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											size="sm"
											variant="ghost"
											className={cn(
												"h-7 w-7 p-0",
												(filterTypes.length > 0 || filterRarities.length > 0 || showOnlyFavorites) && "text-primary"
											)}
										>
											<Filter className="h-4 w-4" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-72">
										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<h4 className="text-sm font-medium">Filtros</h4>
												<Button
													size="sm"
													variant="ghost"
													className="h-7 px-2 text-xs"
													onClick={clearFilters}
													disabled={filterTypes.length === 0 && filterRarities.length === 0 && !showOnlyFavorites && searchTerm === ''}
												>
													Limpiar
												</Button>
											</div>

											<div className="space-y-2">
												<div className="flex items-center space-x-2">
													<Checkbox
														id="show-favorites"
														checked={showOnlyFavorites}
														onCheckedChange={(checked) =>
															setShowOnlyFavorites(checked === true)
														}
													/>
													<Label htmlFor="show-favorites" className="text-sm">Solo favoritos</Label>
												</div>
											</div>

											<div className="space-y-1">
												<Label className="text-xs">Buscar</Label>
												<div className="flex items-center">
													<Input
														value={searchTerm}
														onChange={(e) => setSearchTerm(e.target.value)}
														placeholder="Buscar objetos..."
														className="h-8 text-xs"
													/>
													{searchTerm && (
														<Button
															variant="ghost"
															size="icon"
															className="h-6 w-6 absolute right-3"
															onClick={() => setSearchTerm('')}
														>
															<X className="h-3 w-3" />
														</Button>
													)}
												</div>
											</div>

											{uniqueTypes.length > 0 && (
												<div className="space-y-1">
													<Label className="text-xs">Tipos</Label>
													<div className="grid grid-cols-2 gap-1">
														{uniqueTypes.map((type) => (
															<div key={type} className="flex items-center space-x-2">
																<Checkbox
																	id={`type-${type}`}
																	checked={filterTypes.includes(type)}
																	onCheckedChange={() => toggleType(type)}
																/>
																<Label htmlFor={`type-${type}`} className="text-xs">{type}</Label>
															</div>
														))}
													</div>
												</div>
											)}

											{uniqueRarities.length > 0 && (
												<div className="space-y-1">
													<Label className="text-xs">Rarezas</Label>
													<div className="grid grid-cols-2 gap-1">
														{uniqueRarities.map((rarity) => (
															<div key={rarity} className="flex items-center space-x-2">
																<Checkbox
																	id={`rarity-${rarity}`}
																	checked={filterRarities.includes(rarity)}
																	onCheckedChange={() => toggleRarity(rarity)}
																/>
																<Label htmlFor={`rarity-${rarity}`} className="text-xs">{rarity}</Label>
															</div>
														))}
													</div>
												</div>
											)}
										</div>
									</PopoverContent>
								</Popover>
							</div>
						</div>
						<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
							<span>{stats.totalItems} objetos</span>
							<span>•</span>
							<span>{stats.totalImages} imágenes</span>
							<span>•</span>
							<span>{formatBytes(stats.totalSize)}</span>
							{stats.unusedItems > 0 && (
								<>
									<span>•</span>
									<span>{stats.unusedItems} sin usar</span>
								</>
							)}
							{stats.favoriteItems > 0 && (
								<>
									<span>•</span>
									<span>{stats.favoriteItems} favoritos</span>
								</>
							)}
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<div className="h-full px-4 pb-4 overflow-auto">
							{filteredItemsList.length === 0 ? (
								<EmptyState
									icon={Package}
									title="No hay objetos"
									description={
										filterTypes.length > 0 || filterRarities.length > 0 || showOnlyFavorites || searchTerm
											? "No hay objetos que coincidan con los filtros"
											: "Crea tu primer objeto"
									}
									className="py-8"
								/>
							) : (
								<div className="space-y-2 pt-2">
									{filteredItemsList.map((item) => (
										<div
											key={item.id}
											className={cn(
												"group flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer hover:bg-muted/50",
												selectedItem?.id === item.id ? 'bg-muted' : ''
											)}
											onClick={() => handleEditItem(item as unknown as WorldItem)}
										>
											<div
												className="w-5 h-5 rounded-full flex items-center justify-center"
												style={{ backgroundColor: item.color || generateTypeColor(item.type) }}
											>
												<span className="text-[12px]">{item.emoji || '📦'}</span>
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="text-sm font-medium truncate">{item.name}</h4>
												<div className="flex items-center gap-1 text-xs text-muted-foreground">
													<span>{item._count?.images || 0} imágenes</span>
													{item.type && (
														<>
															<span>•</span>
															<span>{item.type}</span>
														</>
													)}
													{item.isFavorite && (
														<>
															<span>•</span>
															<Badge variant="outline" className="h-4 text-[10px] px-1">Favorito</Badge>
														</>
													)}
												</div>
											</div>
											<div
												className="opacity-0 group-hover:opacity-100"
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteItem(item.id);
												}}
											>
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6"
													type="button"
												>
													<Trash className="h-3 w-3" />
												</Button>
											</div>
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
				<Card className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden border-none bg-muted/30 rounded-sm">
					<CardHeader className="py-3">
						<CardTitle className="text-base">
							{isEditing ? 'Editar Objeto' : 'Nuevo Objeto'}
						</CardTitle>
						<CardDescription className="text-xs">
							{isEditing
								? 'Modifica los detalles del objeto seleccionado'
								: 'Completa el formulario para crear un nuevo objeto'}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex-1 p-4 overflow-hidden">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
							<div className="space-y-4 overflow-auto pr-2">
								<CreateWorldItemForm
									key={selectedItem?.id || 'new-item'}
									worldItem={selectedItem}
									isEditing={isEditing}
									onCreated={handleItemCreated}
									onUpdated={handleItemUpdated}
									onCancel={handleReset}
									onPreview={handlePreview}
								/>
							</div>
							<div className="hidden lg:flex flex-col items-center justify-start pt-4">
								<h3 className="text-sm font-medium mb-2">Vista Previa</h3>
								<div className="transition-all duration-300">
									{previewData ? (
										<div className="flex flex-col items-center p-4 border rounded-lg bg-background">
											<div className="w-12 h-12 mb-3 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: previewData.color || generateTypeColor(previewData.type) }}>
												{previewData.emoji || '📦'}
											</div>
											<h3 className="text-lg font-medium">{previewData.name}</h3>
											{previewData.description && (
												<p className="text-center text-muted-foreground mt-2 text-sm">{previewData.description}</p>
											)}

											<div className="flex flex-wrap gap-2 mt-3 justify-center">
												{previewData.type && (
													<Badge variant="secondary" className="text-xs">{previewData.type}</Badge>
												)}
												{previewData.rarity && (
													<Badge
														variant="outline"
														className="capitalize text-xs"
														style={{
															borderColor: generateRarityColor(previewData.rarity),
															color: generateRarityColor(previewData.rarity)
														}}
													>
														{previewData.rarity}
													</Badge>
												)}
											</div>

											{previewData.origin && (
												<p className="text-xs mt-2">
													<span className="font-medium">Origen:</span> {previewData.origin}
												</p>
											)}
										</div>
									) : (
										<div className="flex flex-col items-center justify-center h-[280px] w-[200px] bg-muted/50 rounded-lg border border-dashed">
											<Package className="h-8 w-8 text-muted-foreground/50" />
											<p className="text-xs text-muted-foreground mt-2">
												Vista previa
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
