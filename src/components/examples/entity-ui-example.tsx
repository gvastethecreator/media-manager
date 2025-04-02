'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EntityFilter, EntityFilterDefinition, SavedFilter } from '@/components/ui/entity-filter';
import { EntityForm, EntityFormField } from '@/components/ui/entity-form';
import { EntityHeader } from '@/components/ui/entity-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toastService } from '@/services/toast.service';
import { BookIcon, FilterIcon, FormInputIcon, LayoutIcon, PenSquare } from 'lucide-react';
import { useState } from 'react';

export function EntityUIExample() {
	const [formData, setFormData] = useState<Record<string, any>>({
		name: 'Entidad de ejemplo',
		description: 'Esta es una descripción de ejemplo',
		emoji: '🔍',
		color: '#6366f1',
		category: 'general',
		isPublic: true,
	});

	const [filterValues, setFilterValues] = useState<Record<string, any>>({});
	const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([
		{
			name: 'Recientes y públicos',
			values: {
				status: 'active',
				isPublic: true,
				sortBy: 'recent',
			}
		}
	]);

	// Campos de formulario de ejemplo
	const formFields: EntityFormField[] = [
		{
			name: 'name',
			label: 'Nombre',
			type: 'text',
			placeholder: 'Nombre de la entidad',
			required: true,
			order: 1,
			validation: {
				minLength: 3,
				maxLength: 50,
			}
		},
		{
			name: 'emoji',
			label: 'Emoji',
			type: 'emoji',
			order: 2,
		},
		{
			name: 'color',
			label: 'Color',
			type: 'color',
			order: 3,
		},
		{
			name: 'category',
			label: 'Categoría',
			type: 'select',
			options: [
				{ label: 'General', value: 'general' },
				{ label: 'Técnico', value: 'technical' },
				{ label: 'Artístico', value: 'artistic' },
				{ label: 'Gestión', value: 'management' },
			],
			order: 4,
		},
		{
			name: 'description',
			label: 'Descripción',
			type: 'textarea',
			placeholder: 'Describe la entidad...',
			fullWidth: true,
			order: 5,
			props: {
				rows: 4,
			}
		},
		{
			name: 'tags',
			label: 'Etiquetas',
			type: 'text',
			placeholder: 'Etiquetas separadas por comas',
			order: 6,
		},
		{
			name: 'isPublic',
			label: 'Es público',
			type: 'switch',
			order: 7,
			description: 'Si está activo, será visible para todos los usuarios',
		},
	];

	// Definiciones de filtros
	const filterDefinitions: EntityFilterDefinition[] = [
		{
			id: 'searchTerm',
			label: 'Búsqueda',
			type: 'text',
			placeholder: 'Buscar por nombre o descripción',
			icon: <FilterIcon className="h-4 w-4" />,
		},
		{
			id: 'category',
			label: 'Categoría',
			type: 'select',
			options: [
				{ label: 'General', value: 'general' },
				{ label: 'Técnico', value: 'technical' },
				{ label: 'Artístico', value: 'artistic' },
				{ label: 'Gestión', value: 'management' },
			],
		},
		{
			id: 'status',
			label: 'Estado',
			type: 'radio',
			options: [
				{ label: 'Todos', value: 'all' },
				{ label: 'Activos', value: 'active' },
				{ label: 'Inactivos', value: 'inactive' },
				{ label: 'Archivados', value: 'archived' },
			],
		},
		{
			id: 'isPublic',
			label: 'Es público',
			type: 'boolean',
		},
		{
			id: 'createdAfter',
			label: 'Creado después de',
			type: 'date',
		},
		{
			id: 'tags',
			label: 'Etiquetas',
			type: 'checkbox',
			options: [
				{ label: 'Importante', value: 'important' },
				{ label: 'Destacado', value: 'featured' },
				{ label: 'Promocionado', value: 'promoted' },
				{ label: 'En revisión', value: 'review' },
			],
		},
		{
			id: 'sortBy',
			label: 'Ordenar por',
			type: 'select',
			options: [
				{ label: 'Más recientes', value: 'recent' },
				{ label: 'Más antiguos', value: 'oldest' },
				{ label: 'Nombre (A-Z)', value: 'name_asc' },
				{ label: 'Nombre (Z-A)', value: 'name_desc' },
			],
		},
	];

	// Manejar envío del formulario
	const handleFormSubmit = async (data: Record<string, any>) => {
		// Simular una petición
		await new Promise(resolve => setTimeout(resolve, 1000));
		setFormData(data);
		return Promise.resolve();
	};

	// Manejar guardado de filtro
	const handleSaveFilter = (filter: SavedFilter) => {
		setSavedFilters([...savedFilters, filter]);
		toastService.success(`Filtro "${filter.name}" guardado correctamente`);
	};

	// Manejar eliminación de filtro
	const handleDeleteFilter = (name: string) => {
		setSavedFilters(savedFilters.filter(f => f.name !== name));
		toastService.success(`Filtro "${name}" eliminado correctamente`);
	};

	return (
		<div className="space-y-8">
			<Alert>
				<PenSquare className="h-4 w-4" />
				<AlertTitle>Componentes UI reutilizables para entidades</AlertTitle>
				<AlertDescription>
					Estos componentes facilitan la creación de interfaces consistentes para la gestión de entidades en la aplicación.
				</AlertDescription>
			</Alert>

			<Tabs defaultValue="form">
				<TabsList className="grid grid-cols-3 mb-8">
					<TabsTrigger value="header">
						<LayoutIcon className="h-4 w-4 mr-2" />
						EntityHeader
					</TabsTrigger>
					<TabsTrigger value="form">
						<FormInputIcon className="h-4 w-4 mr-2" />
						EntityForm
					</TabsTrigger>
					<TabsTrigger value="filter">
						<FilterIcon className="h-4 w-4 mr-2" />
						EntityFilter
					</TabsTrigger>
				</TabsList>

				<TabsContent value="header" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Componente EntityHeader</CardTitle>
							<CardDescription>
								Encabezado para páginas de entidades que incluye título, descripción, breadcrumbs, acciones y estadísticas.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="border rounded-lg p-4">
								<EntityHeader
									title="Entidad de ejemplo"
									subtitle="Ejemplo de encabezado de entidad"
									description="Este es un encabezado de ejemplo que muestra las distintas características disponibles, como título, descripción, estadísticas y acciones."
									icon={<BookIcon className="h-5 w-5" />}
									backUrl="#"
									primaryColor="#6366f1"
									stats={[
										{ label: 'Elementos', value: 42 },
										{ label: 'Vistas', value: 1024 },
										{ label: 'Descargas', value: 128 },
									]}
									breadcrumbItems={[
										{ label: 'Dashboard', href: '#' },
										{ label: 'Entidades', href: '#' },
										{ label: 'Entidad de ejemplo' },
									]}
									showFavoriteButton={true}
									isFavorite={false}
									onToggleFavorite={() => toastService.info('Favorito alternado')}
									actions={[
										{
											label: 'Editar',
											icon: <PenSquare className="h-4 w-4" />,
											variant: 'outline',
											onClick: () => toastService.info('Editar pulsado'),
										},
										{
											label: 'Eliminar',
											variant: 'destructive',
											inDropdown: true,
											onClick: () => toastService.error('Eliminar pulsado'),
										},
										{
											label: 'Duplicar',
											inDropdown: true,
											onClick: () => toastService.info('Duplicar pulsado'),
										},
									]}
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="form" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Componente EntityForm</CardTitle>
							<CardDescription>
								Formulario dinámico para la creación y edición de entidades con validación y múltiples tipos de campos.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<EntityForm
								title="Formulario de ejemplo"
								description="Este formulario muestra las capacidades del componente EntityForm con diferentes tipos de campos."
								fields={formFields}
								initialData={formData}
								onSubmit={handleFormSubmit}
								onCancel={() => toastService.info('Cancelado')}
								formStyle="card"
							/>

							<div className="mt-6 p-4 border rounded-lg bg-muted/30">
								<h3 className="text-base font-medium mb-2">Datos del formulario:</h3>
								<pre className="text-sm bg-slate-900 text-slate-50 p-4 rounded-md overflow-auto">
									{JSON.stringify(formData, null, 2)}
								</pre>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="filter" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Componente EntityFilter</CardTitle>
							<CardDescription>
								Sistema avanzado de filtros para entidades, con guardado y aplicación de filtros personalizados.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<EntityFilter
								filters={filterDefinitions}
								initialValues={filterValues}
								onChange={setFilterValues}
								allowSavedFilters={true}
								savedFilters={savedFilters}
								onSaveFilter={handleSaveFilter}
								onDeleteSavedFilter={handleDeleteFilter}
							/>

							<div className="p-4 border rounded-lg bg-muted/30">
								<h3 className="text-base font-medium mb-2">Valores de filtro aplicados:</h3>
								<pre className="text-sm bg-slate-900 text-slate-50 p-4 rounded-md overflow-auto">
									{JSON.stringify(filterValues, null, 2)}
								</pre>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}