'use client';

/**
 * @file Componente de ejemplo para gestión de propiedades
 * @module examples/PropertiesExample
 */

import { createProperty, deleteProperty, getProperties, getProperty, togglePropertyFavorite, updateProperty } from '@/app/actions/properties/property.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePropertyStore } from '@/store/entities/property';
import { transformPropertyToWithStats } from '@/transformers/property';
import { type CreatePropertyData, type PropertyComplete } from '@/types/entities/property/types';
import { HeartIcon, KeyIcon, PencilIcon, PlusIcon, TagIcon, TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * 🔍 Componente de ejemplo para la gestión de propiedades
 */
export default function PropertiesExample() {
	const [properties, setProperties] = useState<PropertyComplete[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedProperty, setSelectedProperty] = useState<PropertyComplete | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState<CreatePropertyData>({
		name: '',
		emoji: '🔍',
		color: '#6366F1',
		description: '',
		shortcut: '',
		category: 'general',
		isFavorite: false
	});

	// Store de propiedades
	const propertyStore = usePropertyStore();

	// Cargar propiedades al iniciar
	useEffect(() => {
		loadProperties();
	}, []);

	// Cargar propiedades desde la API
	const loadProperties = async () => {
		try {
			setLoading(true);
			const fetchedProperties = await getProperties();
			setProperties(fetchedProperties);
			propertyStore.addProperties(fetchedProperties);
			toast.success('Propiedades cargadas correctamente');
		} catch (error) {
			console.error('Error al cargar propiedades:', error);
			toast.error('Error al cargar propiedades');
		} finally {
			setLoading(false);
		}
	};

	// Seleccionar una propiedad para editar
	const selectProperty = async (id: string) => {
		try {
			setLoading(true);
			const property = await getProperty(id);
			if (property) {
				setSelectedProperty(property);
				setFormData({
					name: property.name,
					emoji: property.emoji,
					color: property.color,
					description: property.description || '',
					shortcut: property.shortcut || '',
					category: property.category || 'general',
					isFavorite: property.isFavorite
				});
				setIsEditing(true);
			}
		} catch (error) {
			console.error('Error al cargar propiedad:', error);
			toast.error('Error al cargar propiedad');
		} finally {
			setLoading(false);
		}
	};

	// Enviar formulario
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			setLoading(true);

			if (isEditing && selectedProperty) {
				// Actualizar propiedad existente
				const updatedProperty = await updateProperty(selectedProperty.id, formData);
				setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));
				propertyStore.updateProperty(updatedProperty.id, formData);
				toast.success(`Propiedad "${updatedProperty.name}" actualizada`);
			} else {
				// Crear nueva propiedad
				const newProperty = await createProperty(formData);
				setProperties(prev => [...prev, newProperty]);
				propertyStore.addProperty(newProperty);
				toast.success(`Propiedad "${newProperty.name}" creada`);
			}

			// Resetear formulario
			resetForm();
		} catch (error) {
			console.error('Error al guardar propiedad:', error);
			toast.error('Error al guardar propiedad');
		} finally {
			setLoading(false);
		}
	};

	// Eliminar propiedad
	const handleDelete = async (id: string) => {
		if (!confirm('¿Estás seguro de eliminar esta propiedad?')) return;

		try {
			setLoading(true);
			await deleteProperty(id);

			// Actualizar lista y store
			setProperties(prev => prev.filter(p => p.id !== id));
			propertyStore.deleteProperty(id);

			// Si estamos editando esta propiedad, resetear
			if (selectedProperty?.id === id) {
				resetForm();
			}

			toast.success('Propiedad eliminada');
		} catch (error) {
			console.error('Error al eliminar propiedad:', error);
			toast.error('Error al eliminar propiedad');
		} finally {
			setLoading(false);
		}
	};

	// Marcar/desmarcar como favorito
	const handleToggleFavorite = async (id: string) => {
		try {
			setLoading(true);
			const updatedProperty = await togglePropertyFavorite(id);

			// Actualizar lista y store
			setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));
			propertyStore.updateProperty(updatedProperty.id, { isFavorite: updatedProperty.isFavorite });

			// Si estamos editando esta propiedad, actualizar
			if (selectedProperty?.id === id) {
				setSelectedProperty(updatedProperty);
				setFormData(prev => ({ ...prev, isFavorite: updatedProperty.isFavorite }));
			}

			toast.success(`Propiedad ${updatedProperty.isFavorite ? 'marcada' : 'desmarcada'} como favorita`);
		} catch (error) {
			console.error('Error al actualizar favorito:', error);
			toast.error('Error al actualizar favorito');
		} finally {
			setLoading(false);
		}
	};

	// Resetear formulario
	const resetForm = () => {
		setSelectedProperty(null);
		setIsCreating(false);
		setIsEditing(false);
		setFormData({
			name: '',
			emoji: '🔍',
			color: '#6366F1',
			description: '',
			shortcut: '',
			category: 'general',
			isFavorite: false
		});
	};

	// Manejar cambios en el formulario
	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value, type } = e.target;

		if (type === 'checkbox') {
			const checked = (e.target as HTMLInputElement).checked;
			setFormData(prev => ({ ...prev, [name]: checked }));
		} else {
			setFormData(prev => ({ ...prev, [name]: value }));
		}
	};

	// Renderizar la tarjeta de propiedad con sus estadísticas
	const renderPropertyCard = (property: PropertyComplete) => {
		const propertyWithStats = transformPropertyToWithStats(property);
		const { stats } = propertyWithStats;

		return (
			<Card className={`overflow-hidden ${selectedProperty?.id === property.id ? 'ring-2 ring-primary' : ''}`}>
				<div
					className="h-2"
					style={{ backgroundColor: property.color }}
				/>
				<CardHeader className="pb-2">
					<div className="flex justify-between items-start">
						<div className="flex items-center gap-2">
							<span className="text-2xl">{property.emoji}</span>
							<CardTitle>{property.name}</CardTitle>
						</div>
						{property.isFavorite && (
							<HeartIcon className="h-4 w-4 text-red-500 fill-red-500" />
						)}
					</div>
					{property.description && (
						<CardDescription>{property.description}</CardDescription>
					)}
					{property.shortcut && (
						<div className="flex items-center text-xs text-muted-foreground mt-1">
							<KeyIcon className="h-3 w-3 mr-1" />
							<span>{property.shortcut}</span>
						</div>
					)}
				</CardHeader>

				<CardContent className="pb-3">
					<div className="text-xs text-muted-foreground">
						<div className="flex items-center mb-1">
							<TagIcon className="h-3 w-3 mr-1" />
							<span>{property.category || 'General'}</span>
						</div>

						<p className="mb-1">Total: {stats.totalContentItems} elementos</p>

						<div className="grid grid-cols-2 gap-1">
							{stats.imageCount > 0 && <span>🖼️ {stats.imageCount} imágenes</span>}
							{stats.videoCount > 0 && <span>🎥 {stats.videoCount} videos</span>}
							{stats.albumCount > 0 && <span>📁 {stats.albumCount} álbumes</span>}
							{stats.collectionCount > 0 && <span>📚 {stats.collectionCount} colecciones</span>}
							{stats.tagCount > 0 && <span>🏷️ {stats.tagCount} etiquetas</span>}
							{stats.characterCount > 0 && <span>👤 {stats.characterCount} personajes</span>}
							{stats.placeCount > 0 && <span>📍 {stats.placeCount} lugares</span>}
						</div>
					</div>
				</CardContent>

				<CardFooter className="flex justify-between pt-2">
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={() => handleToggleFavorite(property.id)}
						>
							{property.isFavorite ? <HeartIcon className="h-4 w-4 mr-1 fill-red-500 text-red-500" /> : <HeartIcon className="h-4 w-4 mr-1" />}
							{property.isFavorite ? 'Quitar favorito' : 'Favorito'}
						</Button>
						<Button
							size="sm"
							variant="destructive"
							onClick={() => handleDelete(property.id)}
						>
							<TrashIcon className="h-4 w-4 mr-1" />
							Eliminar
						</Button>
					</div>
					<Button
						size="sm"
						onClick={() => selectProperty(property.id)}
					>
						<PencilIcon className="h-4 w-4 mr-1" />
						Editar
					</Button>
				</CardFooter>
			</Card>
		);
	};

	return (
		<div className="container mx-auto p-4">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Gestión de Propiedades</h1>
				<div className="flex gap-2">
					<Button onClick={() => setIsCreating(true)} variant="default">
						<PlusIcon className="h-4 w-4 mr-2" />
						Nueva Propiedad
					</Button>
					<Button onClick={loadProperties} disabled={loading} variant="outline">
						{loading ? 'Cargando...' : 'Actualizar'}
					</Button>
				</div>
			</div>

			{/* Lista de propiedades */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
				{properties.length === 0 ? (
					<div className="col-span-full text-center py-8 bg-muted rounded-lg">
						<p className="text-muted-foreground">No hay propiedades disponibles</p>
						<Button onClick={() => setIsCreating(true)} variant="link" className="mt-2">
							Crear tu primera propiedad
						</Button>
					</div>
				) : (
					properties.map(property => (
						<div key={property.id} className="animate-fadeIn">
							{renderPropertyCard(property)}
						</div>
					))
				)}
			</div>

			{/* Modal de creación/edición */}
			<Dialog open={isCreating || isEditing} onOpenChange={(open) => {
				if (!open) resetForm();
				else if (!isCreating && !isEditing) setIsCreating(true);
			}}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>
							{isEditing ? `Editar propiedad: ${selectedProperty?.name}` : 'Crear nueva propiedad'}
						</DialogTitle>
					</DialogHeader>

					<form onSubmit={handleSubmit}>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="name" className="text-right">
									Nombre
								</Label>
								<Input
									id="name"
									name="name"
									value={formData.name}
									onChange={handleChange}
									placeholder="Nombre de la propiedad"
									className="col-span-3"
									required
								/>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="emoji" className="text-right">
									Emoji
								</Label>
								<Input
									id="emoji"
									name="emoji"
									value={formData.emoji}
									onChange={handleChange}
									placeholder="🔍"
									className="col-span-3"
								/>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="color" className="text-right">
									Color
								</Label>
								<div className="col-span-3 flex gap-2">
									<Input
										id="color"
										name="color"
										type="color"
										value={formData.color}
										onChange={handleChange}
										className="w-12 h-9 p-1"
									/>
									<Input
										value={formData.color}
										onChange={handleChange}
										name="color"
										placeholder="#6366F1"
										className="flex-1"
									/>
								</div>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="description" className="text-right">
									Descripción
								</Label>
								<Textarea
									id="description"
									name="description"
									value={formData.description || ''}
									onChange={handleChange}
									placeholder="Descripción de la propiedad"
									className="col-span-3"
									rows={3}
								/>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="shortcut" className="text-right">
									Atajo
								</Label>
								<Input
									id="shortcut"
									name="shortcut"
									value={formData.shortcut || ''}
									onChange={handleChange}
									placeholder="Atajo para usar la propiedad"
									className="col-span-3"
								/>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="category" className="text-right">
									Categoría
								</Label>
								<Select
									name="category"
									value={formData.category || 'general'}
									onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Selecciona una categoría" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="general">General</SelectItem>
										<SelectItem value="tecnico">Técnico</SelectItem>
										<SelectItem value="creativo">Creativo</SelectItem>
										<SelectItem value="estilistico">Estilístico</SelectItem>
										<SelectItem value="metadata">Metadatos</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right">Favorito</Label>
								<div className="col-span-3 flex items-center">
									<input
										id="isFavorite"
										name="isFavorite"
										type="checkbox"
										checked={formData.isFavorite}
										onChange={(e) => setFormData(prev => ({ ...prev, isFavorite: e.target.checked }))}
										className="h-4 w-4 mr-2"
									/>
									<Label htmlFor="isFavorite">Marcar como favorito</Label>
								</div>
							</div>
						</div>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={resetForm}>
								Cancelar
							</Button>
							<Button type="submit" disabled={loading}>
								{loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Vista de depuración */}
			<div className="mt-8 border-t pt-4">
				<details>
					<summary className="font-medium cursor-pointer">Vista de depuración</summary>
					<div className="mt-2 p-4 bg-muted rounded-lg overflow-auto max-h-96">
						<pre className="text-xs">{JSON.stringify(propertyStore.getProperties(), null, 2)}</pre>
					</div>
				</details>
			</div>
		</div>
	);
}