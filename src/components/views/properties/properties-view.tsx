import { Edit, Trash2 } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { ViewProps } from '@/components/views/types';
// ViewContainer removido - obsoleto
import { useCategoryData } from '@/lib/api/navigation';
import { useCreateProperty, useDeleteProperty, useUpdateProperty } from '@/lib/api/properties'; // Importar los hooks de mutación

export const PropertiesView = memo(function PropertiesView({ className }: ViewProps) {
	const { data: properties, isLoading } = useCategoryData<any>('properties');
	const { mutate: createProperty } = useCreateProperty();
	const { mutate: updateProperty } = useUpdateProperty();
	const { mutate: deleteProperty } = useDeleteProperty();

	const [showForm, setShowForm] = useState(false);
	const [editingProperty, setEditingProperty] = useState<any | null>(null);
	const [propertyName, setPropertyName] = useState('');
	const [propertyValue, setPropertyValue] = useState('');

	const handleEditProperty = useCallback((property: any) => {
		setEditingProperty(property);
		setPropertyName(property.name);
		setPropertyValue(property.value || '');
		setShowForm(true);
	}, []);

	const handleDeleteProperty = useCallback(
		(propertyId: string) => {
			deleteProperty(propertyId);
		},
		[deleteProperty]
	);

	const { toast } = useToast();
	const handleSubmitForm = useCallback(() => {
		if (propertyName.trim() === '') {
			toast({
				title: '❌ Error',
				description: 'El nombre de la propiedad no puede estar vacío.',
				variant: 'destructive',
			});
			return;
		}

		if (editingProperty) {
			updateProperty({ id: editingProperty.id, data: { name: propertyName, description: propertyValue } });
		} else {
			createProperty({ name: propertyName, description: propertyValue });
		}
		setPropertyName('');
		setPropertyValue('');
		setEditingProperty(null);
		setShowForm(false);
	}, [propertyName, propertyValue, editingProperty, createProperty, updateProperty]);

	return (
		<div className={className}>
			<div className="p-4">
				<h2 className="text-xl font-bold mb-4">Vista de Propiedades</h2>

				<Button
					onClick={() => {
						setShowForm(!showForm);
						setEditingProperty(null);
						setPropertyName('');
						setPropertyValue('');
					}}
					className="mb-4"
				>
					{showForm ? 'Cancelar' : 'Crear Propiedad'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">{editingProperty ? 'Editar Propiedad' : 'Nueva Propiedad'}</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="propertyName">Nombre</Label>
							<Input
								id="propertyName"
								value={propertyName}
								onChange={(e) => setPropertyName(e.target.value)}
								placeholder="Nombre de la propiedad"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="propertyValue">Valor</Label>
							<Input
								id="propertyValue"
								value={propertyValue}
								onChange={(e) => setPropertyValue(e.target.value)}
								placeholder="Valor de la propiedad"
							/>
						</div>
						<Button onClick={handleSubmitForm}>{editingProperty ? 'Guardar Cambios' : 'Guardar Propiedad'}</Button>
					</div>
				)}

				{isLoading ? (
					<p>Cargando propiedades...</p>
				) : properties && properties.length > 0 ? (
					<ScrollArea className="h-[calc(100vh-200px)]">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{properties.map((property: any) => (
								<Card key={property.id}>
									<CardHeader>
										<CardTitle>{property.name}</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">{property.value}</p>
										<div className="flex gap-2 mt-2">
											<Button variant="outline" size="sm" onClick={() => handleEditProperty(property)}>
												<Edit className="h-4 w-4 mr-1" /> Editar
											</Button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button variant="destructive" size="sm">
														<Trash2 className="h-4 w-4 mr-1" /> Eliminar
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
														<AlertDialogDescription>
															Esta acción eliminará permanentemente la propiedad "{property.name}".
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancelar</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => handleDeleteProperty(property.id)}
															className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
														>
															Eliminar
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</ScrollArea>
				) : (
					<p>No hay propiedades disponibles.</p>
				)}
			</div>
		</div>
	);
});
