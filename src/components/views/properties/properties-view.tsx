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
				description: 'Property name cannot be empty.',
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
	}, [propertyName, propertyValue, editingProperty, createProperty, updateProperty, toast]);

	return (
		<div className={className}>
			<div className="p-4">
				<h2 className="mb-4 font-bold text-xl">Properties</h2>

				<Button
					className="mb-4"
					onClick={() => {
						setShowForm(!showForm);
						setEditingProperty(null);
						setPropertyName('');
						setPropertyValue('');
					}}
				>
					{showForm ? 'Cancel' : 'Create Property'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">{editingProperty ? 'Edit Property' : 'New Property'}</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="propertyName">Name</Label>
							<Input
								id="propertyName"
								onChange={(e) => setPropertyName(e.target.value)}
								placeholder="Property name"
								value={propertyName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="propertyValue">Value</Label>
							<Input
								id="propertyValue"
								onChange={(e) => setPropertyValue(e.target.value)}
								placeholder="Property value"
								value={propertyValue}
							/>
						</div>
						<Button onClick={handleSubmitForm}>{editingProperty ? 'Save Changes' : 'Save Property'}</Button>
					</div>
				)}

				{isLoading ? (
					<p>Loading properties...</p>
				) : properties && properties.length > 0 ? (
					<ScrollArea className="h-[calc(100vh-200px)]">
						<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
							{properties.map((property: any) => (
								<Card key={property.id}>
									<CardHeader>
										<CardTitle>{property.name}</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-muted-foreground text-sm">{property.value}</p>
										<div className="mt-2 flex gap-2">
											<Button onClick={() => handleEditProperty(property)} size="sm" variant="outline">
												<Edit className="mr-1 h-4 w-4" /> Edit
											</Button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button size="sm" variant="destructive">
														<Trash2 className="mr-1 h-4 w-4" /> Delete
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>Delete this property?</AlertDialogTitle>
														<AlertDialogDescription>
															This will permanently delete the property "{property.name}".
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction
															className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
															onClick={() => handleDeleteProperty(property.id)}
														>
															Delete
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
					<p>No properties available.</p>
				)}
			</div>
		</div>
	);
});
