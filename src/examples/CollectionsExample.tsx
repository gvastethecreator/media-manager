'use client';

import { createCollection, deleteCollection, getCollections, updateCollection } from '@/app/actions/collections/collection.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useCollectionStore } from '@/store/entities/collection';
import { transformCollectionToWithStats } from '@/transformers/collection';
import type { Collection } from '@/types/entities/collection/types';
import { FolderIcon, HeartIcon, ImageIcon, PencilIcon, PlusIcon, TagIcon, TrashIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * 🗂️ Componente de ejemplo para las colecciones
 * Demuestra la creación, edición, eliminación y visualización de colecciones
 */
export default function CollectionsExample() {
	const [isCreating, setIsCreating] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		emoji: '📁',
		color: '#3B82F6',
		category: 'PERSONAL',
		isPublic: false,
		isPinned: false,
	});

	// Obtener colecciones del store
	const collections = useCollectionStore(state => state.collections);
	const setCollections = useCollectionStore(state => state.setCollections);
	const setIsLoading = useCollectionStore(state => state.setIsLoading);
	const toggleFavorite = useCollectionStore(state => state.toggleCollectionFavorite);

	// Cargar colecciones al montar el componente
	useEffect(() => {
		async function loadCollections() {
			setIsLoading(true);
			try {
				const result = await getCollections();
				if (result.success && result.data) {
					setCollections(result.data);
				} else {
					toast.error('Error al cargar colecciones');
				}
			} catch (error) {
				console.error('Error cargando colecciones:', error);
				toast.error('Error al cargar colecciones');
			} finally {
				setIsLoading(false);
			}
		}

		loadCollections();
	}, [setCollections, setIsLoading]);

	// Manejar cambios en el formulario
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleSelectChange = (name: string, value: string) => {
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleCheckboxChange = (name: string) => {
		setFormData(prev => ({ ...prev, [name]: !prev[name as keyof typeof prev] }));
	};

	// Resetear formulario
	const resetForm = () => {
		setFormData({
			name: '',
			description: '',
			emoji: '📁',
			color: '#3B82F6',
			category: 'PERSONAL',
			isPublic: false,
			isPinned: false,
		});
	};

	// Crear nueva colección
	const handleCreate = async () => {
		if (!formData.name.trim()) {
			toast.error('El nombre es obligatorio');
			return;
		}

		setLoading(true);
		try {
			const result = await createCollection({
				name: formData.name,
				description: formData.description,
				emoji: formData.emoji,
				color: formData.color,
				category: formData.category,
				isPublic: formData.isPublic,
				isPinned: formData.isPinned,
			});

			if (result.success && result.data) {
				toast.success('Colección creada con éxito');
				setCollections([...collections, result.data]);
				setIsCreating(false);
				resetForm();
			} else {
				toast.error(result.error || 'Error al crear la colección');
			}
		} catch (error) {
			console.error('Error creando colección:', error);
			toast.error('Error al crear la colección');
		} finally {
			setLoading(false);
		}
	};

	// Actualizar colección existente
	const handleUpdate = async () => {
		if (!selectedCollection || !formData.name.trim()) {
			toast.error('El nombre es obligatorio');
			return;
		}

		setLoading(true);
		try {
			const result = await updateCollection({
				id: selectedCollection.id,
				name: formData.name,
				description: formData.description,
				emoji: formData.emoji,
				color: formData.color,
				category: formData.category,
				isPublic: formData.isPublic,
				isPinned: formData.isPinned,
			});

			if (result.success && result.data) {
				toast.success('Colección actualizada con éxito');
				setCollections(
					collections.map(c => (c.id === selectedCollection.id ? result.data : c))
				);
				setIsEditing(false);
				setSelectedCollection(null);
				resetForm();
			} else {
				toast.error(result.error || 'Error al actualizar la colección');
			}
		} catch (error) {
			console.error('Error actualizando colección:', error);
			toast.error('Error al actualizar la colección');
		} finally {
			setLoading(false);
		}
	};

	// Eliminar colección
	const handleDelete = async (collection: Collection) => {
		if (confirm(`¿Estás seguro de eliminar la colección "${collection.name}"?`)) {
			try {
				const result = await deleteCollection({ id: collection.id });
				if (result.success) {
					toast.success('Colección eliminada con éxito');
					setCollections(collections.filter(c => c.id !== collection.id));
				} else {
					toast.error(result.error || 'Error al eliminar la colección');
				}
			} catch (error) {
				console.error('Error eliminando colección:', error);
				toast.error('Error al eliminar la colección');
			}
		}
	};

	// Preparar edición de colección
	const handleEdit = (collection: Collection) => {
		setSelectedCollection(collection);
		setFormData({
			name: collection.name,
			description: collection.description || '',
			emoji: collection.emoji || '📁',
			color: collection.color || '#3B82F6',
			category: collection.category || 'PERSONAL',
			isPublic: collection.isPublic || false,
			isPinned: collection.isPinned || false,
		});
		setIsEditing(true);
	};

	// Manejar favorito
	const handleToggleFavorite = async (collection: Collection) => {
		toggleFavorite(collection.id);
		toast.success(`Colección ${collection.isFavorite ? 'eliminada de' : 'añadida a'} favoritos`);
	};

	return (
		<div className="container mx-auto p-4">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Ejemplo de Colecciones</h1>
				<Dialog open={isCreating} onOpenChange={setIsCreating}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="h-4 w-4 mr-2" />
							Nueva Colección
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Crear Nueva Colección</DialogTitle>
							<DialogDescription>
								Introduce la información para la nueva colección.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="emoji" className="text-right">
									Emoji
								</Label>
								<Input
									id="emoji"
									name="emoji"
									value={formData.emoji}
									onChange={handleInputChange}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="name" className="text-right">
									Nombre
								</Label>
								<Input
									id="name"
									name="name"
									value={formData.name}
									onChange={handleInputChange}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="description" className="text-right">
									Descripción
								</Label>
								<Textarea
									id="description"
									name="description"
									value={formData.description}
									onChange={handleInputChange}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="color" className="text-right">
									Color
								</Label>
								<div className="flex gap-2 col-span-3">
									<Input
										type="color"
										id="color"
										name="color"
										value={formData.color}
										onChange={handleInputChange}
										className="w-12 h-9 p-1"
									/>
									<Input
										type="text"
										value={formData.color}
										onChange={handleInputChange}
										name="color"
										className="flex-1"
									/>
								</div>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="category" className="text-right">
									Categoría
								</Label>
								<Select
									value={formData.category}
									onValueChange={(value) => handleSelectChange('category', value)}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Selecciona una categoría" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="PERSONAL">Personal</SelectItem>
										<SelectItem value="WORK">Trabajo</SelectItem>
										<SelectItem value="PROJECT">Proyecto</SelectItem>
										<SelectItem value="OTHER">Otro</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right">Opciones</Label>
								<div className="flex gap-4 col-span-3">
									<div className="flex items-center space-x-2">
										<input
											type="checkbox"
											id="isPublic"
											checked={formData.isPublic}
											onChange={() => handleCheckboxChange('isPublic')}
											className="h-4 w-4"
										/>
										<Label htmlFor="isPublic">Público</Label>
									</div>
									<div className="flex items-center space-x-2">
										<input
											type="checkbox"
											id="isPinned"
											checked={formData.isPinned}
											onChange={() => handleCheckboxChange('isPinned')}
											className="h-4 w-4"
										/>
										<Label htmlFor="isPinned">Anclado</Label>
									</div>
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsCreating(false)}>
								Cancelar
							</Button>
							<Button onClick={handleCreate} disabled={loading}>
								{loading ? 'Creando...' : 'Crear Colección'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<Dialog open={isEditing} onOpenChange={setIsEditing}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Colección</DialogTitle>
						<DialogDescription>
							Actualiza la información de la colección.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-emoji" className="text-right">
								Emoji
							</Label>
							<Input
								id="edit-emoji"
								name="emoji"
								value={formData.emoji}
								onChange={handleInputChange}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-name" className="text-right">
								Nombre
							</Label>
							<Input
								id="edit-name"
								name="name"
								value={formData.name}
								onChange={handleInputChange}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-description" className="text-right">
								Descripción
							</Label>
							<Textarea
								id="edit-description"
								name="description"
								value={formData.description}
								onChange={handleInputChange}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-color" className="text-right">
								Color
							</Label>
							<div className="flex gap-2 col-span-3">
								<Input
									type="color"
									id="edit-color"
									name="color"
									value={formData.color}
									onChange={handleInputChange}
									className="w-12 h-9 p-1"
								/>
								<Input
									type="text"
									value={formData.color}
									onChange={handleInputChange}
									name="color"
									className="flex-1"
								/>
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-category" className="text-right">
								Categoría
							</Label>
							<Select
								value={formData.category}
								onValueChange={(value) => handleSelectChange('category', value)}
							>
								<SelectTrigger className="col-span-3">
									<SelectValue placeholder="Selecciona una categoría" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="PERSONAL">Personal</SelectItem>
									<SelectItem value="WORK">Trabajo</SelectItem>
									<SelectItem value="PROJECT">Proyecto</SelectItem>
									<SelectItem value="OTHER">Otro</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label className="text-right">Opciones</Label>
							<div className="flex gap-4 col-span-3">
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="edit-isPublic"
										checked={formData.isPublic}
										onChange={() => handleCheckboxChange('isPublic')}
										className="h-4 w-4"
									/>
									<Label htmlFor="edit-isPublic">Público</Label>
								</div>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="edit-isPinned"
										checked={formData.isPinned}
										onChange={() => handleCheckboxChange('isPinned')}
										className="h-4 w-4"
									/>
									<Label htmlFor="edit-isPinned">Anclado</Label>
								</div>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => {
							setIsEditing(false);
							setSelectedCollection(null);
							resetForm();
						}}>
							Cancelar
						</Button>
						<Button onClick={handleUpdate} disabled={loading}>
							{loading ? 'Actualizando...' : 'Actualizar Colección'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{collections.map((collection) => {
					const stats = transformCollectionToWithStats(collection);
					return (
						<Card key={collection.id} className="overflow-hidden">
							<CardHeader style={{ backgroundColor: collection.color || '#3B82F6', color: 'white' }}>
								<div className="flex justify-between items-center">
									<CardTitle className="flex items-center gap-2">
										<span>{collection.emoji || '📁'}</span>
										<span>{collection.name}</span>
									</CardTitle>
									<Badge variant={collection.category === 'PERSONAL' ? 'default' :
										collection.category === 'WORK' ? 'destructive' :
											collection.category === 'PROJECT' ? 'secondary' :
												'outline'}>
										{collection.category}
									</Badge>
								</div>
								<CardDescription className="text-white opacity-90">
									{collection.description || 'Sin descripción'}
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-6">
								<div className="grid grid-cols-2 gap-4">
									<div className="flex items-center gap-2">
										<ImageIcon className="h-4 w-4" />
										<span>{stats.imageCount} imágenes</span>
									</div>
									<div className="flex items-center gap-2">
										<FolderIcon className="h-4 w-4" />
										<span>{stats.albumCount} álbumes</span>
									</div>
									<div className="flex items-center gap-2">
										<TagIcon className="h-4 w-4" />
										<span>{stats.tagCount} etiquetas</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs">Actualización:</span>
										<span className="text-xs">
											{stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : 'N/A'}
										</span>
									</div>
								</div>
							</CardContent>
							<Separator />
							<CardFooter className="flex justify-between p-4">
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="icon"
										onClick={() => handleEdit(collection)}
									>
										<PencilIcon className="h-4 w-4" />
									</Button>
									<Button
										variant="outline"
										size="icon"
										onClick={() => handleDelete(collection)}
									>
										<TrashIcon className="h-4 w-4" />
									</Button>
								</div>
								<Button
									variant={collection.isFavorite ? "default" : "outline"}
									size="icon"
									onClick={() => handleToggleFavorite(collection)}
								>
									<HeartIcon
										className={`h-4 w-4 ${collection.isFavorite ? 'fill-current' : ''}`}
									/>
								</Button>
							</CardFooter>
						</Card>
					);
				})}
			</div>

			{collections.length === 0 && (
				<div className="text-center py-10">
					<p className="text-muted-foreground">No hay colecciones disponibles</p>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => setIsCreating(true)}
					>
						Crear tu primera colección
					</Button>
				</div>
			)}
		</div>
	);
}