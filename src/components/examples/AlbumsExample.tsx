'use client';

/**
 * @file Componente de ejemplo para álbumes
 * @module components/examples/AlbumsExample
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import albumService from '@/services/album.service';
import type { Album, AlbumCreateInput, AlbumUpdateInput } from '@/types/entities/album';
import { useEffect, useState } from 'react';

/**
 * Componente de ejemplo para la gestión de álbumes
 */
export default function AlbumsExample() {
	const { toast } = useToast();
	const [albums, setAlbums] = useState<Album[]>([]);
	const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Formulario de creación
	const [formData, setFormData] = useState<AlbumCreateInput>({
		name: '',
		emoji: '📚',
		color: '#3498db',
		description: '',
		category: 'general',
		sortBy: 'createdAt:desc',
		filters: '{}',
		isFavorite: false
	});

	// Cargar álbumes al iniciar
	useEffect(() => {
		loadAlbums();
	}, []);

	// Función para cargar álbumes
	const loadAlbums = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const result = await albumService.search({
				take: 20,
				orderBy: { field: 'name', direction: 'asc' }
			});
			setAlbums(result.items);
		} catch (error) {
			setError(`Error al cargar álbumes: ${error.message}`);
			toast({
				title: 'Error',
				description: `No se pudieron cargar los álbumes: ${error.message}`,
				variant: 'destructive'
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Función para seleccionar un álbum
	const selectAlbum = async (id: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const album = await albumService.get(id);
			setSelectedAlbum(album);
		} catch (error) {
			setError(`Error al cargar álbum: ${error.message}`);
			toast({
				title: 'Error',
				description: `No se pudo cargar el álbum: ${error.message}`,
				variant: 'destructive'
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Manejar cambios en el formulario
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value
		}));
	};

	// Crear un nuevo álbum
	const handleCreateAlbum = async () => {
		setIsLoading(true);
		setError(null);

		try {
			await albumService.create(formData);
			toast({
				title: 'Éxito',
				description: `Álbum "${formData.name}" creado correctamente`,
			});

			// Resetear formulario y recargar
			setFormData({
				name: '',
				emoji: '📚',
				color: '#3498db',
				description: '',
				category: 'general',
				sortBy: 'createdAt:desc',
				filters: '{}',
				isFavorite: false
			});

			await loadAlbums();
		} catch (error) {
			setError(`Error al crear álbum: ${error.message}`);
			toast({
				title: 'Error',
				description: `No se pudo crear el álbum: ${error.message}`,
				variant: 'destructive'
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Actualizar un álbum
	const handleUpdateAlbum = async () => {
		if (!selectedAlbum) return;

		setIsLoading(true);
		setError(null);

		try {
			const updateData: AlbumUpdateInput = {
				name: formData.name || selectedAlbum.name,
				description: formData.description || selectedAlbum.description,
				emoji: formData.emoji || selectedAlbum.emoji,
				color: formData.color || selectedAlbum.color
			};

			await albumService.update(selectedAlbum.id, updateData);
			toast({
				title: 'Éxito',
				description: `Álbum "${updateData.name}" actualizado correctamente`,
			});

			await loadAlbums();
			setSelectedAlbum(null);
		} catch (error) {
			setError(`Error al actualizar álbum: ${error.message}`);
			toast({
				title: 'Error',
				description: `No se pudo actualizar el álbum: ${error.message}`,
				variant: 'destructive'
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Eliminar un álbum
	const handleDeleteAlbum = async (id: string) => {
		if (!confirm('¿Estás seguro de que deseas eliminar este álbum?')) return;

		setIsLoading(true);
		setError(null);

		try {
			await albumService.delete(id);
			toast({
				title: 'Éxito',
				description: 'Álbum eliminado correctamente',
			});

			await loadAlbums();
			if (selectedAlbum?.id === id) {
				setSelectedAlbum(null);
			}
		} catch (error) {
			setError(`Error al eliminar álbum: ${error.message}`);
			toast({
				title: 'Error',
				description: `No se pudo eliminar el álbum: ${error.message}`,
				variant: 'destructive'
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Obtener estadísticas de un álbum
	const handleGetStats = async (id: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const stats = await albumService.getStats(id);
			toast({
				title: 'Estadísticas',
				description: `El álbum tiene ${stats._count.images} imágenes y ocupa ${(stats.totalSize / (1024 * 1024)).toFixed(2)} MB`,
			});
		} catch (error) {
			setError(`Error al obtener estadísticas: ${error.message}`);
			toast({
				title: 'Error',
				description: `No se pudieron obtener estadísticas: ${error.message}`,
				variant: 'destructive'
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="container mx-auto py-4">
			<Tabs defaultValue="list">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="list">Lista de Álbumes</TabsTrigger>
					<TabsTrigger value="create">Crear Álbum</TabsTrigger>
					<TabsTrigger value="detail" disabled={!selectedAlbum}>Detalle de Álbum</TabsTrigger>
				</TabsList>

				{/* Tab de listado */}
				<TabsContent value="list">
					<Card>
						<CardHeader>
							<CardTitle>Álbumes</CardTitle>
							<CardDescription>Gestiona tus álbumes de imágenes</CardDescription>
						</CardHeader>
						<CardContent>
							{error && <div className="my-2 p-2 bg-red-100 text-red-800 rounded">{error}</div>}

							<div className="mb-4 flex justify-end">
								<Button
									variant="outline"
									size="sm"
									disabled={isLoading}
									onClick={loadAlbums}
								>
									{isLoading ? 'Cargando...' : 'Refrescar'}
								</Button>
							</div>

							{albums.length === 0 ? (
								<div className="text-center p-4 bg-slate-50 rounded">
									{isLoading ? 'Cargando álbumes...' : 'No hay álbumes disponibles'}
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{albums.map(album => (
										<Card key={album.id} className="relative">
											<CardHeader className="pb-2">
												<div className="flex items-center gap-2">
													<div
														className="w-8 h-8 rounded-full flex items-center justify-center text-white"
														style={{ backgroundColor: album.color || '#3498db' }}
													>
														{album.emoji}
													</div>
													<CardTitle className="text-lg">{album.name}</CardTitle>
												</div>
												<CardDescription className="line-clamp-2">
													{album.description || 'Sin descripción'}
												</CardDescription>
											</CardHeader>
											<CardFooter className="pt-2 flex justify-between">
												<div className="flex gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => selectAlbum(album.id)}
													>
														Ver
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleGetStats(album.id)}
													>
														Estadísticas
													</Button>
												</div>
												<Button
													variant="destructive"
													size="sm"
													onClick={() => handleDeleteAlbum(album.id)}
												>
													Eliminar
												</Button>
											</CardFooter>
										</Card>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab de creación */}
				<TabsContent value="create">
					<Card>
						<CardHeader>
							<CardTitle>{selectedAlbum ? 'Editar Álbum' : 'Crear Nuevo Álbum'}</CardTitle>
							<CardDescription>
								{selectedAlbum
									? `Editando álbum: ${selectedAlbum.name}`
									: 'Completa el formulario para crear un nuevo álbum'}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{error && <div className="my-2 p-2 bg-red-100 text-red-800 rounded">{error}</div>}

							<form className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="name">Nombre</Label>
										<Input
											id="name"
											name="name"
											placeholder="Mi álbum"
											value={formData.name}
											onChange={handleChange}
											required
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="category">Categoría</Label>
										<Input
											id="category"
											name="category"
											placeholder="general"
											value={formData.category}
											onChange={handleChange}
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="emoji">Emoji</Label>
										<Input
											id="emoji"
											name="emoji"
											placeholder="📚"
											value={formData.emoji}
											onChange={handleChange}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="color">Color</Label>
										<div className="flex gap-2">
											<Input
												id="color"
												name="color"
												type="color"
												value={formData.color}
												onChange={handleChange}
												className="w-12"
											/>
											<Input
												value={formData.color}
												onChange={handleChange}
												name="color"
												placeholder="#3498db"
											/>
										</div>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="description">Descripción</Label>
									<Input
										id="description"
										name="description"
										placeholder="Descripción del álbum"
										value={formData.description || ''}
										onChange={handleChange}
									/>
								</div>

								<div className="flex items-center space-x-2">
									<input
										id="isFavorite"
										name="isFavorite"
										type="checkbox"
										checked={formData.isFavorite || false}
										onChange={handleChange}
										className="h-4 w-4 rounded border-gray-300"
									/>
									<Label htmlFor="isFavorite">Marcar como favorito</Label>
								</div>
							</form>
						</CardContent>
						<CardFooter className="flex justify-between">
							<Button variant="outline" onClick={() => {
								setSelectedAlbum(null);
								setFormData({
									name: '',
									emoji: '📚',
									color: '#3498db',
									description: '',
									category: 'general',
									sortBy: 'createdAt:desc',
									filters: '{}',
									isFavorite: false
								});
							}}>
								Cancelar
							</Button>

							<Button
								onClick={selectedAlbum ? handleUpdateAlbum : handleCreateAlbum}
								disabled={isLoading || !formData.name}
							>
								{isLoading
									? 'Procesando...'
									: selectedAlbum
										? 'Actualizar Álbum'
										: 'Crear Álbum'
								}
							</Button>
						</CardFooter>
					</Card>
				</TabsContent>

				{/* Tab de detalle */}
				<TabsContent value="detail">
					{selectedAlbum && (
						<Card>
							<CardHeader>
								<div className="flex items-center gap-2">
									<div
										className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl"
										style={{ backgroundColor: selectedAlbum.color || '#3498db' }}
									>
										{selectedAlbum.emoji}
									</div>
									<div>
										<CardTitle>{selectedAlbum.name}</CardTitle>
										<CardDescription>
											Creado: {new Date(selectedAlbum.createdAt).toLocaleDateString()}
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<h3 className="text-sm font-medium text-gray-500">Descripción</h3>
										<p className="mt-1">{selectedAlbum.description || 'Sin descripción'}</p>
									</div>

									<div>
										<h3 className="text-sm font-medium text-gray-500">Categoría</h3>
										<p className="mt-1">{selectedAlbum.category}</p>
									</div>
								</div>

								<div className="border-t pt-4">
									<h3 className="text-sm font-medium text-gray-500 mb-2">Detalles adicionales</h3>
									<div className="grid grid-cols-2 gap-2 text-sm">
										<div>
											<span className="text-gray-500">ID: </span>
											<code className="bg-gray-100 p-1 rounded text-xs">{selectedAlbum.id}</code>
										</div>
										<div>
											<span className="text-gray-500">Favorito: </span>
											<span>{selectedAlbum.isFavorite ? 'Sí' : 'No'}</span>
										</div>
										<div>
											<span className="text-gray-500">Última actualización: </span>
											<span>{new Date(selectedAlbum.updatedAt).toLocaleString()}</span>
										</div>
									</div>
								</div>
							</CardContent>
							<CardFooter className="flex justify-between">
								<Button
									variant="outline"
									onClick={() => {
										// Prepopular formulario para edición
										setFormData({
											name: selectedAlbum.name,
											emoji: selectedAlbum.emoji,
											color: selectedAlbum.color,
											description: selectedAlbum.description || '',
											category: selectedAlbum.category,
											sortBy: selectedAlbum.sortBy,
											filters: selectedAlbum.filters,
											isFavorite: selectedAlbum.isFavorite
										});

										// Cambiar a tab de creación (que se convierte en edición)
										document.querySelector('[data-value="create"]')?.click();
									}}
								>
									Editar
								</Button>

								<Button
									variant="destructive"
									onClick={() => handleDeleteAlbum(selectedAlbum.id)}
								>
									Eliminar
								</Button>
							</CardFooter>
						</Card>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}