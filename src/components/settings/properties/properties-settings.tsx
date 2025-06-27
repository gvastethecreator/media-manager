'use client';

// TODO: Refactorizar para mover la lógica de transformación de datos a la capa de server actions.
// Actualmente, la lógica de `loadProperties`, `handleCreateProperty`, etc., transforma los datos
// de Prisma a un tipo `PropertyWithStats` local. Esto debería hacerse en un transformador
// y ser devuelto directamente por las server actions para simplificar el componente y
// centralizar la lógica de negocio. Esta refactorización está bloqueada por fallos
// persistentes en la herramienta de edición de código en los archivos de `server actions` y `transformers`.

import {
	createProperty,
	deleteProperty,
	getProperties,
	togglePropertyFavorite,
	updateProperty,
} from '@/app/actions/properties/property.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import toastService from '@/services/toast';
import type { PropertyWithStats } from '@/types/entities/property';
import { CreatePropertySchema } from '@/types/entities/property/schema';
import { Plus, Search, Star, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { z } from 'zod';
import { CreatePropertyForm } from './create-property-form';

type PropertyCategory = z.infer<typeof CreatePropertySchema>['category'];
type PropertyFormData = z.infer<typeof CreatePropertySchema>;

// Filtros simplificados sin sortBy y sortOrder
interface PropertyFilters {
	searchQuery?: string;
	categories?: string[];
	onlyFavorites?: boolean;
}

export type { PropertyWithStats }; // Exportamos el tipo para el PropertyPreview

export function PropertiesSettings() {
	const [properties, setProperties] = useState<PropertyWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [_error, setError] = useState<string | null>(null);
	const [selectedProperty, setSelectedProperty] = useState<PropertyWithStats | null>(null);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Filtros simplificados
	const [filters, setFilters] = useState<PropertyFilters>({
		searchQuery: '',
		categories: [],
		onlyFavorites: false,
	});

	const loadProperties = useCallback(async () => {
		try {
			setIsLoading(true);
			const data = await getProperties();
			setProperties(data);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			setError(errorMessage);
			toastService.error('Error al cargar las propiedades', {
				description: errorMessage,
			});
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadProperties();
	}, [loadProperties]);

	// Filtrar propiedades basadas en los criterios validados
	const filteredProperties = properties.filter((property) => {
		let matches = true;
		if (filters.searchQuery) {
			const normalizedQuery = filters.searchQuery.toLowerCase();
			matches =
				matches &&
				(property.name.toLowerCase().includes(normalizedQuery) ||
					property.description?.toLowerCase().includes(normalizedQuery) ||
					false);
		}
		if (filters.categories && filters.categories.length > 0) {
			matches =
				matches && (property.category ? filters.categories.includes(property.category as PropertyCategory) : false);
		}
		if (filters.onlyFavorites) {
			matches = matches && property.isFavorite;
		}
		return matches;
	});

	// Ordenar propiedades por nombre
	const sortedProperties = [...filteredProperties].sort((a, b) => a.name.localeCompare(b.name));

	// Estadísticas mejoradas
	const stats = {
		totalProperties: properties.length,
		totalAssociations: properties.reduce((acc, property) => acc + property.totalAssociations, 0),
		emptyProperties: properties.filter((property) => property.totalAssociations === 0).length,
		favoriteProperties: properties.filter((property) => property.isFavorite).length,
		byCategory: properties.reduce(
			(acc, property) => {
				const category = property.category || 'sin categoría';
				acc[category] = (acc[category] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		),
	};

	// Manejadores actualizados
	const handleCreateProperty = async (data: PropertyFormData) => {
		try {
			const newProperty = await createProperty(data);
			setProperties((prev) => [...prev, newProperty]);
			setIsCreateDialogOpen(false);
			toastService.success('Propiedad creada correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al crear la propiedad', {
				description: errorMessage,
			});
		}
	};

	const handleUpdateProperty = async (id: string, data: PropertyFormData) => {
		try {
			const updatedProperty = await updateProperty(id, data);
			setProperties((prev) => prev.map((p) => (p.id === id ? updatedProperty : p)));
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
			setIsDeleting(true);
			await deleteProperty(id);
			setProperties((prev) => prev.filter((p) => p.id !== id));
			setSelectedProperty(null);
			toastService.success('Propiedad eliminada correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al eliminar la propiedad', {
				description: errorMessage,
			});
		} finally {
			setIsDeleting(false);
		}
	};

	const handleToggleFavorite = async (property: PropertyWithStats) => {
		try {
			const updatedProperty = await togglePropertyFavorite(property.id);
			setProperties((prev) => prev.map((p) => (p.id === property.id ? updatedProperty : p)));

			if (selectedProperty?.id === property.id) {
				setSelectedProperty(updatedProperty);
			}

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

	const handlePropertyDelete = (propertyId: string) => {
		handleDeleteProperty(propertyId);
	};

	return (
		<div className="grid grid-cols-12 gap-3">
			{/* Panel izquierdo: Lista de propiedades */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="space-y-1 py-2 px-3">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-xl font-bold">Propiedades</CardTitle>
								<p className="text-xs text-muted-foreground">
									{stats.totalProperties} propiedades, {stats.favoriteProperties} favoritas
								</p>
							</div>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setIsCreateDialogOpen(true)}
								title="Crear nueva propiedad"
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>

						<div className="flex gap-2">
							<div className="relative w-full">
								<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Buscar propiedades..."
									value={filters.searchQuery}
									onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
									className="h-8 pl-8"
								/>
							</div>
						</div>
						<div className="flex gap-2">
							<Select
								value={filters.sortBy}
								onValueChange={(value) => setFilters({ ...filters, sortBy: value as typeof filters.sortBy })}
							>
								<SelectTrigger className="h-8">
									<SelectValue placeholder="Ordenar por..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="name">Nombre</SelectItem>
									<SelectItem value="category">Categoría</SelectItem>
									<SelectItem value="createdAt">Fecha</SelectItem>
								</SelectContent>
							</Select>
							<Toggle
								pressed={filters.onlyFavorites}
								onPressedChange={(pressed) => setFilters({ ...filters, onlyFavorites: pressed })}
								size="sm"
							>
								<Star className="h-4 w-4" />
							</Toggle>
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full">
							<div className="space-y-1 p-2">
								{isLoading ? (
									<div className="flex justify-center p-4">
										<p className="text-sm opacity-70">Cargando propiedades...</p>
									</div>
								) : sortedProperties.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-8">
										<Search className="h-8 w-8 opacity-20 mb-2" />
										<p className="text-sm opacity-50">
											{filters.searchQuery || filters.onlyFavorites || (filters.categories?.length ?? 0) > 0
												? 'No se encontraron propiedades con los filtros aplicados'
												: 'No hay propiedades creadas'}
										</p>
										<Button variant="ghost" size="sm" className="mt-2" onClick={() => setIsCreateDialogOpen(true)}>
											Crear propiedad
										</Button>
									</div>
								) : (
									sortedProperties.map((property) => (
										<Button
											key={property.id}
											variant={selectedProperty?.id === property.id ? 'secondary' : 'ghost'}
											className="w-full justify-start h-12 relative group"
											onClick={() => setSelectedProperty(property)}
										>
											<div className="flex items-center gap-2">
												<span role="img" aria-label="emoji">
													{property.emoji}
												</span>
												<div className="flex flex-col items-start">
													<span className="font-medium">{property.name}</span>
													<span className="text-xs opacity-50">{property.totalAssociations} elementos</span>
												</div>
											</div>
											{property.isFavorite && <Star className="h-3 w-3 absolute right-2 top-2 text-yellow-500" />}
											<Button
												variant="ghost"
												size="icon"
												className="absolute right-1 opacity-0 group-hover:opacity-100"
												onClick={() => handlePropertyDelete(property.id)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</Button>
									))
								)}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			{/* Panel derecho: Vista detalle o formulario */}
			<div className="col-span-12 md:col-span-7 lg:col-span-8">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					{selectedProperty ? (
						isEditMode ? (
							<CreatePropertyForm
								property={selectedProperty}
								onSubmit={(data) => handleUpdateProperty(selectedProperty.id, data)}
								onCancel={() => setIsEditMode(false)}
							/>
						) : (
							<PropertyPreview
								property={selectedProperty}
								onEdit={() => setIsEditMode(true)}
								onDelete={() => handleDeleteProperty(selectedProperty.id)}
								onFavoriteToggle={() => handleToggleFavorite(selectedProperty)}
								onContinue={() => {
									setIsEditMode(false);
									setSelectedProperty(null);
								}}
								isDeleting={isDeleting}
							/>
						)
					) : (
						<div className="flex flex-col items-center justify-center h-full">
							<Search className="h-12 w-12 opacity-20" />
							<p className="text-sm opacity-50 mt-2">Selecciona una propiedad para ver sus detalles</p>
						</div>
					)}
				</Card>
			</div>

			{/* Dialog para crear nueva propiedad */}
			<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
				<CreatePropertyForm onSubmit={handleCreateProperty} onCancel={() => setIsCreateDialogOpen(false)} />
			</Dialog>
		</div>
	);
}
