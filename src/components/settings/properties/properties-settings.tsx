import { Plus, Search, Star, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PageState } from '@/components/ui/page-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toggle } from '@/components/ui/toggle';
import type { PropertyCreateInput, PropertyUpdateInput } from '@/lib/api/properties';
import { useCreateProperty, useDeleteProperty, useProperties, useUpdateProperty } from '@/lib/api/properties';
import { toastService } from '@/lib/ui/toast';
import type { PropertyWithStats } from '@/types/entities/property';
import { CreatePropertyForm } from './create-property-form';

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

	// Filtrar propiedades basadas en los criterios (baja complejidad)
	const filteredProperties = useMemo(() => {
		const normalizedQuery = searchQuery.trim().toLowerCase();
		const hasQuery = normalizedQuery.length > 0;
		const hasCategories = selectedCategories.length > 0;
		return properties.filter((property) => {
			const nameLower = property.name.toLowerCase();
			const descLower = typeof property.description === 'string' ? property.description.toLowerCase() : '';
			const queryMatches =
				!hasQuery || nameLower.includes(normalizedQuery) || (descLower !== '' && descLower.includes(normalizedQuery));
			const categoryMatches = !hasCategories || (!!property.type && selectedCategories.includes(property.type));
			const favoriteMatches = !onlyFavorites || Boolean(property.isFavorite);
			return queryMatches && categoryMatches && favoriteMatches;
		});
	}, [onlyFavorites, properties, searchQuery, selectedCategories]);

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

	// Callback estable para eliminar propiedad
	const onDelete = useCallback(
		async (id: string) => {
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
		},
		[deletePropertyMutation, selectedProperty]
	);

	// Panel derecho memoizado para evitar ternarios anidados
	const rightPanel = useMemo(() => {
		if (selectedProperty && !isEditMode) {
			return (
				<Card className="h-[calc(100vh-8rem)] rounded-dt-md border-none bg-muted/30 shadow-sm">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>{selectedProperty.name}</CardTitle>
							<div className="flex gap-2">
								<Button onClick={() => setIsEditMode(true)} size="sm" variant="outline">
									Editar
								</Button>
								<Button onClick={() => onDelete(selectedProperty.id)} size="sm" variant="destructive">
									Eliminar
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div>
								<h4 className="mb-2 font-medium">Valor</h4>
								<p className="text-muted-foreground text-sm">{selectedProperty.value}</p>
							</div>
							{selectedProperty.description && (
								<div>
									<h4 className="mb-2 font-medium">Descripción</h4>
									<p className="text-muted-foreground text-sm">{selectedProperty.description}</p>
								</div>
							)}
							<div>
								<h4 className="mb-2 font-medium">Estadísticas</h4>
								<p className="text-muted-foreground text-sm">
									{selectedProperty.stats?.totalAssociations || 0} asociaciones totales
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			);
		}

		if (isEditMode && selectedProperty) {
			return (
				<CreatePropertyForm
					isEditing
					onCancel={() => setIsEditMode(false)}
					onCreated={() => {
						// no-op: creación manejada por mutateAsync arriba
					}}
					onUpdated={(data) => {
						setIsEditMode(false);
						setSelectedProperty(data);
					}}
					property={selectedProperty}
				/>
			);
		}

		return (
			<Card className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center rounded-dt-md border-none bg-muted/30 shadow-sm">
				<div className="text-center">
					<Plus className="mx-auto h-12 w-12 text-muted-foreground" />
					<h3 className="mt-2 font-medium text-foreground text-heading-sm">Selecciona una propiedad</h3>
					<p className="mt-1 text-caption text-muted-foreground">O crea una nueva para empezar</p>
				</div>
			</Card>
		);
	}, [isEditMode, onDelete, selectedProperty]);

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

	const handleToggleFavorite = (property: PropertyWithStats) => {
		try {
			// Implementar toggle favorite cuando esté disponible en la API
			// const updatedProperty = await togglePropertyFavorite(property.id);
			toastService.success(
				`${property.name} ${property.isFavorite ? 'desmarcada como favorita' : 'marcada como favorita'}`
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
		return <PageState mode="loading" title="Cargando propiedades..." />;
	}

	// Mostrar error state
	if (error) {
		return (
			<PageState
				description={error instanceof Error ? error.message : 'Error desconocido'}
				mode="error"
				title="Error al cargar las propiedades"
			/>
		);
	}

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<div className="grid grid-cols-12 gap-3">
				{/* Panel izquierdo: Lista de propiedades */}
				<div className="col-span-12 md:col-span-5 lg:col-span-4">
					<Card className="flex h-[calc(100vh-8rem)] flex-col rounded-dt-md border-none bg-muted/30 shadow-sm">
						<CardHeader className="space-y-1 px-3 py-2">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-heading-lg">Propiedades</CardTitle>
									<p className="text-caption text-muted-foreground">
										{stats.totalProperties} total • {stats.favoriteProperties} favoritas
									</p>
								</div>
								<Button onClick={() => setIsCreateDialogOpen(true)} size="sm" variant="ghost">
									<Plus className="h-4 w-4" />
								</Button>
							</div>

							{/* Filtros */}
							<div className="space-y-2">
								{/* Búsqueda */}
								<div className="flex w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors">
									<Search className="h-4 w-4 opacity-50" />
									<Input
										className="h-8 border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-0"
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Buscar propiedades..."
										value={searchQuery}
									/>
								</div>

								{/* Filtros adicionales */}
								<div className="flex gap-2">
									<Toggle onPressedChange={setOnlyFavorites} pressed={onlyFavorites} size="sm">
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
											className={`group/item relative rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${selectedProperty?.id === property.id ? 'bg-secondary text-secondary-foreground' : ''
												}`}
											key={property.id}
										>
											<Button
												className="relative h-12 w-full justify-start"
												onClick={() => setSelectedProperty(property)}
												variant="ghost"
											>
												<div className="flex w-full items-center gap-2">
													<div className="flex flex-1 flex-col items-start">
														<span className="font-medium">{property.name}</span>
														<span className="text-xs opacity-50">
															{property.stats?.totalAssociations || 0} asociaciones
														</span>
													</div>
												</div>
												{property.isFavorite && <Star className="absolute top-2 right-8 h-3 w-3" />}
											</Button>
											<Button
												className="absolute top-1 right-1 h-10 w-10 opacity-0 group-hover/item:opacity-100"
												onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
													e.stopPropagation();
													onDelete(property.id);
												}}
												size="icon"
												variant="ghost"
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
				<div className="col-span-12 md:col-span-7 lg:col-span-8">{rightPanel}</div>

				<Dialog onOpenChange={setIsCreateDialogOpen} open={isCreateDialogOpen}>
					<CreatePropertyForm
						onCancel={() => setIsCreateDialogOpen(false)}
						onCreated={(_data) => {
							setIsCreateDialogOpen(false);
							toastService.success('Propiedad creada correctamente');
						}}
						onUpdated={(_data) => {
							// no-op: no se actualiza en diálogo de creación
						}}
					/>
				</Dialog>
			</div>
		</ScrollArea>
	);
}
