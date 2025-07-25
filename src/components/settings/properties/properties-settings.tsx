import { Plus, Search, Star, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toggle } from '@/components/ui/toggle';
import type { PropertyCreateInput, PropertyUpdateInput } from '@/lib/api/properties';
import { useCreateProperty, useDeleteProperty, useProperties, useUpdateProperty } from '@/lib/api/properties';
import { toastService } from '@/lib/ui/toast';
import type { PropertyWithStats } from '@/types/entities/property';
import { CreatePropertyForm } from './create-property-form';

export type { PropertyWithStats }; // Exportamos el tipo para el PropertyPreview

export function PropertiesSettings() {
	// State local para UI
	const [selectedProperty, setSelectedProperty] = useState<PropertyWithStats | null>(null);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [onlyFavorites, setOnlyFavorites] = useState(false);

	// React Query hooks
	const { data: propertiesResponse, isLoading, error } = useProperties({ search: searchQuery });
	const createPropertyMutation = useCreateProperty();
	const updatePropertyMutation = useUpdateProperty();
	const deletePropertyMutation = useDeleteProperty();

	const properties = propertiesResponse?.data || [];

	// Filtrar propiedades basadas en los criterios
	const filteredProperties = useMemo(() => {
		return properties.filter((property) => {
			let matches = true;

			if (searchQuery) {
				const normalizedQuery = searchQuery.toLowerCase();
				matches =
					matches &&
					(property.name.toLowerCase().includes(normalizedQuery) ||
						property.description?.toLowerCase().includes(normalizedQuery) ||
						false);
			}

			if (selectedCategories.length > 0) {
				matches = matches && (property.type ? selectedCategories.includes(property.type) : false);
			}

			if (onlyFavorites) {
				matches = matches && property.isFavorite;
			}

			return matches;
		});
	}, [properties, searchQuery, selectedCategories, onlyFavorites]);

	// Ordenar propiedades por nombre
	const sortedProperties = useMemo(() => {
		return [...filteredProperties].sort((a, b) => a.name.localeCompare(b.name));
	}, [filteredProperties]);

	// Estadísticas
	const stats = useMemo(() => {
		return {
			totalProperties: properties.length,
			totalAssociations: properties.reduce((acc, property) => acc + (property.stats?.totalAssociations || 0), 0),
			emptyProperties: properties.filter((property) => (property.stats?.totalAssociations || 0) === 0).length,
			favoriteProperties: properties.filter((property) => property.isFavorite).length,
			byCategory: properties.reduce(
				(acc, property) => {
					const category = property.type || 'sin categoría';
					acc[category] = (acc[category] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			),
		};
	}, [properties]);

	// Manejadores
	const handleCreateProperty = async (data: PropertyCreateInput) => {
		try {
			await createPropertyMutation.mutateAsync(data);
			setIsCreateDialogOpen(false);
			toastService.success('Propiedad creada correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al crear la propiedad', {
				description: errorMessage,
			});
		}
	};

	const handleUpdateProperty = async (id: string, data: PropertyUpdateInput) => {
		try {
			await updatePropertyMutation.mutateAsync({ id, data });
			setSelectedProperty(null);
			setIsEditMode(false);
			toastService.success('Propiedad actualizada correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al actualizar la propiedad', {
				description: errorMessage,
			});
		}
	};

	const handleDeleteProperty = async (id: string) => {
		try {
			await deletePropertyMutation.mutateAsync(id);
			if (selectedProperty?.id === id) {
				setSelectedProperty(null);
			}
			toastService.success('Propiedad eliminada correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al eliminar la propiedad', {
				description: errorMessage,
			});
		}
	};

	const handleToggleFavorite = async (property: PropertyWithStats) => {
		try {
			// Implementar toggle favorite cuando esté disponible en la API
			// const updatedProperty = await togglePropertyFavorite(property.id);
			toastService.success(
				`${property.name} ${!property.isFavorite ? 'marcada como favorita' : 'desmarcada como favorita'}`
			);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al actualizar favorito', {
				description: errorMessage,
			});
		}
	};

	// Mostrar loading state
	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[calc(100vh-8rem)]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
					<p className="mt-2 text-sm text-gray-500">Cargando propiedades...</p>
				</div>
			</div>
		);
	}

	// Mostrar error state
	if (error) {
		return (
			<div className="flex items-center justify-center h-[calc(100vh-8rem)]">
				<div className="text-center">
					<p className="text-red-500">Error al cargar las propiedades</p>
					<p className="text-sm text-gray-500 mt-1">{error instanceof Error ? error.message : 'Error desconocido'}</p>
				</div>
			</div>
		);
	}

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<div className="grid grid-cols-12 gap-3">
				{/* Panel izquierdo: Lista de propiedades */}
				<div className="col-span-12 md:col-span-5 lg:col-span-4">
					<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
						<CardHeader className="space-y-1 py-2 px-3">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-xl font-bold">Propiedades</CardTitle>
									<p className="text-xs text-muted-foreground">
										{stats.totalProperties} total • {stats.favoriteProperties} favoritas
									</p>
								</div>
								<Button size="sm" variant="ghost" onClick={() => setIsCreateDialogOpen(true)}>
									<Plus className="h-4 w-4" />
								</Button>
							</div>

							{/* Filtros */}
							<div className="space-y-2">
								{/* Búsqueda */}
								<div className="flex items-center gap-2 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors">
									<Search className="h-4 w-4 opacity-50" />
									<Input
										placeholder="Buscar propiedades..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="h-8 p-0 border-0 bg-transparent focus-visible:outline-none focus-visible:ring-0"
									/>
								</div>

								{/* Filtros adicionales */}
								<div className="flex gap-2">
									<Toggle pressed={onlyFavorites} onPressedChange={setOnlyFavorites} size="sm">
										<Star className="h-4 w-4" />
									</Toggle>
								</div>
							</div>
						</CardHeader>

						<CardContent className="flex-1 p-0">
							<ScrollArea className="h-full">
								<div className="space-y-1 p-2">
									{sortedProperties.map((property) => (
										<div
											key={property.id}
											className={`relative group/item rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
												selectedProperty?.id === property.id ? 'bg-secondary text-secondary-foreground' : ''
											}`}
										>
											<Button
												variant="ghost"
												className="w-full justify-start h-12 relative"
												onClick={() => setSelectedProperty(property)}
											>
												<div className="flex items-center gap-2 w-full">
													<div className="flex flex-col items-start flex-1">
														<span className="font-medium">{property.name}</span>
														<span className="text-xs opacity-50">
															{property.stats?.totalAssociations || 0} asociaciones
														</span>
													</div>
												</div>
												{property.isFavorite && <Star className="h-3 w-3 absolute right-8 top-2" />}
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="absolute right-1 top-1 opacity-0 group-hover/item:opacity-100 h-10 w-10"
												onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
													e.stopPropagation();
													handleDeleteProperty(property.id);
												}}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>
				</div>

				{/* Panel derecho: Detalles o creación */}
				<div className="col-span-12 md:col-span-7 lg:col-span-8">
					{selectedProperty && !isEditMode ? (
						<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)]">
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle>{selectedProperty.name}</CardTitle>
									<div className="flex gap-2">
										<Button size="sm" variant="outline" onClick={() => setIsEditMode(true)}>
											Editar
										</Button>
										<Button size="sm" variant="destructive" onClick={() => handleDeleteProperty(selectedProperty.id)}>
											Eliminar
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<h4 className="font-medium mb-2">Valor</h4>
										<p className="text-sm text-muted-foreground">{selectedProperty.value}</p>
									</div>
									{selectedProperty.description && (
										<div>
											<h4 className="font-medium mb-2">Descripción</h4>
											<p className="text-sm text-muted-foreground">{selectedProperty.description}</p>
										</div>
									)}
									<div>
										<h4 className="font-medium mb-2">Estadísticas</h4>
										<p className="text-sm text-muted-foreground">
											{selectedProperty.stats?.totalAssociations || 0} asociaciones totales
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					) : isEditMode && selectedProperty ? (
						<CreatePropertyForm
							property={selectedProperty}
							isEditing
							onUpdated={(data) => {
								setIsEditMode(false);
								setSelectedProperty(data);
							}}
							onCreated={() => {}}
							onCancel={() => setIsEditMode(false)}
						/>
					) : (
						<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
							<div className="text-center">
								<Plus className="mx-auto h-12 w-12 text-gray-400" />
								<h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Selecciona una propiedad</h3>
								<p className="mt-1 text-sm text-gray-500">O crea una nueva para empezar</p>
							</div>
						</Card>
					)}
				</div>

				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<CreatePropertyForm
						onCreated={(data) => {
							setIsCreateDialogOpen(false);
							toastService.success('Propiedad creada correctamente');
						}}
						onUpdated={() => {}}
						onCancel={() => setIsCreateDialogOpen(false)}
					/>
				</Dialog>
			</div>
		</ScrollArea>
	);
}
