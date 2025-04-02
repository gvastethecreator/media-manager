'use client';

import { createAlbum, deleteAlbum, getAlbums, updateAlbum } from '@/app/actions/albums/album.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useAlbumStore } from '@/store/entities/album';
import { transformAlbumToWithStats } from '@/transformers/album';
import type { Album } from '@/types/entities/album/types';
import { HeartIcon, ImageIcon, PencilIcon, PlusIcon, TagIcon, TrashIcon, VideoIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * 🗂️ Componente de ejemplo para los álbumes
 * Demuestra la creación, edición, eliminación y visualización de álbumes
 */
export default function AlbumsExample() {
	const [isCreating, setIsCreating] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		emoji: '📸',
		color: '#3B82F6',
		category: 'general',
		isFavorite: false,
		sortBy: 'createdAt',
		filters: '[]'
	});

	// Obtener álbumes del store
	const albums = useAlbumStore(state => state.getAlbums());
	const addAlbums = useAlbumStore(state => state.addAlbums);
	const setLoading_store = useAlbumStore(state => state.setLoading);
	const updateAlbum_store = useAlbumStore(state => state.updateAlbum);
	const deleteAlbum_store = useAlbumStore(state => state.deleteAlbum);

	// Cargar álbumes al montar el componente
	useEffect(() => {
		async function loadAlbums() {
			setLoading_store(true);
			try {
				const result = await getAlbums();
				if (result && result.length > 0) {
					addAlbums(result);
				} else {
					toast.error('Error al cargar álbumes');
				}
			} catch (error) {
				console.error('Error cargando álbumes:', error);
				toast.error('Error al cargar álbumes');
			} finally {
				setLoading_store(false);
			}
		}

		loadAlbums();
	}, [addAlbums, setLoading_store]);

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
			emoji: '📸',
			color: '#3B82F6',
			category: 'general',
			isFavorite: false,
			sortBy: 'createdAt',
			filters: '[]'
		});
	};

	// Crear nuevo álbum
	const handleCreate = async () => {
		if (!formData.name.trim()) {
			toast.error('El nombre es obligatorio');
			return;
		}

		setLoading(true);
		try {
			const result = await createAlbum({
				name: formData.name,
				description: formData.description,
				emoji: formData.emoji,
				color: formData.color,
				category: formData.category,
				isFavorite: formData.isFavorite,
				sortBy: formData.sortBy,
				filters: formData.filters
			});

			if (result) {
				toast.success('Álbum creado con éxito');
				addAlbums([result]);
				setIsCreating(false);
				resetForm();
			} else {
				toast.error('Error al crear el álbum');
			}
		} catch (error) {
			console.error('Error creando álbum:', error);
			toast.error('Error al crear el álbum');
		} finally {
			setLoading(false);
		}
	};

	// Actualizar álbum existente
	const handleUpdate = async () => {
		if (!selectedAlbum || !formData.name.trim()) {
			toast.error('El nombre es obligatorio');
			return;
		}

		setLoading(true);
		try {
			const result = await updateAlbum(selectedAlbum.id, {
				name: formData.name,
				description: formData.description,
				emoji: formData.emoji,
				color: formData.color,
				category: formData.category,
				isFavorite: formData.isFavorite,
				sortBy: formData.sortBy,
				filters: formData.filters
			});

			if (result) {
				toast.success('Álbum actualizado con éxito');
				updateAlbum_store(selectedAlbum.id, result);
				setIsEditing(false);
				setSelectedAlbum(null);
				resetForm();
			} else {
				toast.error('Error al actualizar el álbum');
			}
		} catch (error) {
			console.error('Error actualizando álbum:', error);
			toast.error('Error al actualizar el álbum');
		} finally {
			setLoading(false);
		}
	};

	// Eliminar álbum
	const handleDelete = async (album: Album) => {
		if (confirm(`¿Estás seguro de eliminar el álbum "${album.name}"?`)) {
			try {
				await deleteAlbum(album.id);
				toast.success('Álbum eliminado con éxito');
				deleteAlbum_store(album.id);
			} catch (error) {
				console.error('Error eliminando álbum:', error);
				toast.error('Error al eliminar el álbum');
			}
		}
	};

	// Preparar edición de álbum
	const handleEdit = (album: Album) => {
		setSelectedAlbum(album);
		setFormData({
			name: album.name,
			description: album.description || '',
			emoji: album.emoji || '📸',
			color: album.color || '#3B82F6',
			category: album.category || 'general',
			isFavorite: album.isFavorite || false,
			sortBy: album.sortBy || 'createdAt',
			filters: album.filters || '[]'
		});
		setIsEditing(true);
	};

	// Manejar favorito
	const handleToggleFavorite = async (album: Album) => {
		try {
			const result = await updateAlbum(album.id, {
				isFavorite: !album.isFavorite
			});

			if (result) {
				updateAlbum_store(album.id, result);
				toast.success(`Álbum ${album.isFavorite ? 'eliminado de' : 'añadido a'} favoritos`);
			}
		} catch (error) {
			console.error('Error al actualizar favorito:', error);
			toast.error('Error al actualizar favorito');
		}
	};

	return (
		<div className="container mx-auto p-4">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Ejemplo de Álbumes</h1>
				<Dialog open={isCreating} onOpenChange={setIsCreating}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="h-4 w-4 mr-2" />
							Nuevo Álbum
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Crear Nuevo Álbum</DialogTitle>
							<DialogDescription>
								Introduce la información para el nuevo álbum.
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
										<SelectItem value="general">General</SelectItem>
										<SelectItem value="favoritos">Favoritos</SelectItem>
										<SelectItem value="estilo">Estilo</SelectItem>
										<SelectItem value="temática">Temática</SelectItem>
										<SelectItem value="técnico">Técnico</SelectItem>
										<SelectItem value="tipo">Tipo</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="sortBy" className="text-right">
									Ordenar por
								</Label>
								<Select
									value={formData.sortBy}
									onValueChange={(value) => handleSelectChange('sortBy', value)}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Selecciona criterio de ordenación" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="name">Nombre</SelectItem>
										<SelectItem value="createdAt">Fecha creación</SelectItem>
										<SelectItem value="updatedAt">Fecha actualización</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right">Opciones</Label>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="isFavorite"
										checked={formData.isFavorite}
										onChange={() => handleCheckboxChange('isFavorite')}
										className="h-4 w-4"
									/>
									<Label htmlFor="isFavorite">Favorito</Label>
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsCreating(false)}>
								Cancelar
							</Button>
							<Button onClick={handleCreate} disabled={loading}>
								{loading ? 'Creando...' : 'Crear Álbum'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<Dialog open={isEditing} onOpenChange={setIsEditing}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Álbum</DialogTitle>
						<DialogDescription>
							Actualiza la información del álbum.
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
									<SelectItem value="general">General</SelectItem>
									<SelectItem value="favoritos">Favoritos</SelectItem>
									<SelectItem value="estilo">Estilo</SelectItem>
									<SelectItem value="temática">Temática</SelectItem>
									<SelectItem value="técnico">Técnico</SelectItem>
									<SelectItem value="tipo">Tipo</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-sortBy" className="text-right">
								Ordenar por
							</Label>
							<Select
								value={formData.sortBy}
								onValueChange={(value) => handleSelectChange('sortBy', value)}
							>
								<SelectTrigger className="col-span-3">
									<SelectValue placeholder="Selecciona criterio de ordenación" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="name">Nombre</SelectItem>
									<SelectItem value="createdAt">Fecha creación</SelectItem>
									<SelectItem value="updatedAt">Fecha actualización</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label className="text-right">Opciones</Label>
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="edit-isFavorite"
									checked={formData.isFavorite}
									onChange={() => handleCheckboxChange('isFavorite')}
									className="h-4 w-4"
								/>
								<Label htmlFor="edit-isFavorite">Favorito</Label>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => {
							setIsEditing(false);
							setSelectedAlbum(null);
							resetForm();
						}}>
							Cancelar
						</Button>
						<Button onClick={handleUpdate} disabled={loading}>
							{loading ? 'Actualizando...' : 'Actualizar Álbum'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{albums.map((album) => {
					const stats = transformAlbumToWithStats(album);
					return (
						<Card key={album.id} className="overflow-hidden">
							<CardHeader style={{ backgroundColor: album.color || '#3B82F6', color: 'white' }}>
								<div className="flex justify-between items-center">
									<CardTitle className="flex items-center gap-2">
										<span>{album.emoji || '📸'}</span>
										<span>{album.name}</span>
									</CardTitle>
									<Badge variant={album.category === 'favoritos' ? 'default' :
										album.category === 'estilo' ? 'destructive' :
											album.category === 'temática' ? 'secondary' :
												'outline'}>
										{album.category}
									</Badge>
								</div>
								<CardDescription className="text-white opacity-90">
									{album.description || 'Sin descripción'}
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-6">
								<div className="grid grid-cols-2 gap-4">
									<div className="flex items-center gap-2">
										<ImageIcon className="h-4 w-4" />
										<span>{stats.imageCount} imágenes</span>
									</div>
									<div className="flex items-center gap-2">
										<VideoIcon className="h-4 w-4" />
										<span>{stats.videoCount} videos</span>
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
										onClick={() => handleEdit(album)}
									>
										<PencilIcon className="h-4 w-4" />
									</Button>
									<Button
										variant="outline"
										size="icon"
										onClick={() => handleDelete(album)}
									>
										<TrashIcon className="h-4 w-4" />
									</Button>
								</div>
								<Button
									variant={album.isFavorite ? "default" : "outline"}
									size="icon"
									onClick={() => handleToggleFavorite(album)}
								>
									<HeartIcon
										className={`h-4 w-4 ${album.isFavorite ? 'fill-current' : ''}`}
									/>
								</Button>
							</CardFooter>
						</Card>
					);
				})}
			</div>

			{albums.length === 0 && (
				<div className="text-center py-10">
					<p className="text-muted-foreground">No hay álbumes disponibles</p>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => setIsCreating(true)}
					>
						Crear tu primer álbum
					</Button>
				</div>
			)}
		</div>
	);
}