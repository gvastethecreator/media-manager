'use client';

/**
 * @file Componente de ejemplo para grupos
 * @module components/examples/GroupsExample
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import groupService from '@/services/group-service-export';
import type { CreateGroupData, GroupComplete, GroupWithStats } from '@/types/entities/group';
import { useEffect, useState } from 'react';

/**
 * Componente de ejemplo para la gestión de grupos
 */
export default function GroupsExample() {
	const { toast } = useToast();
	const [groups, setGroups] = useState<GroupWithStats[]>([]);
	const [selectedGroup, setSelectedGroup] = useState<GroupComplete | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Formulario de creación
	const [formData, setFormData] = useState<CreateGroupData>({
		name: '',
		emoji: '🔹',
		color: '#2563eb',
		description: '',
		category: 'general',
		isFavorite: false
	});

	// Cargar grupos al iniciar
	useEffect(() => {
		loadGroups();
	}, []);

	// Función para cargar grupos
	const loadGroups = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const result = await groupService.search({}, {
				page: 1,
				pageSize: 20,
				sortBy: 'name',
				sortOrder: 'asc'
			});
			setGroups(result.items);
		} catch (error) {
			setError(`Error al cargar grupos: ${error.message}`);
			toast({
				title: 'Error',
				description: `No se pudieron cargar los grupos: ${error.message}`,
				variant: 'destructive'
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Función para seleccionar un grupo
	const selectGroup = async (id: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const group = await groupService.get(id);
			setSelectedGroup(group);
		} catch (error) {
			setError(`Error al cargar grupo: ${error.message}`);
			toast({
				title: 'Error',
				description: `No se pudo cargar el grupo: ${error.message}`,
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

	// Crear un nuevo grupo
	const handleCreateGroup = async () => {
		setIsLoading(true);
		setError(null);

		try {
			await groupService.create(formData);
			toast({
				title: 'Éxito',
				description: `Grupo "${formData.name}" creado correctamente`,
			});

			// Resetear formulario y recargar
			setFormData({
				name: '',
				emoji: '🔹',
				color: '#2563eb',
				description: '',
				category: 'general',
				isFavorite: false
			});

			await loadGroups();
		} catch (error) {
			setError(`Error al crear grupo: ${error.message}`);
			toast({
				title: 'Error',
				description: `No se pudo crear el grupo: ${error.message}`,
				variant: 'destructive'
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Actualizar un grupo
	const handleUpdateGroup = async () => {
		if (!selectedGroup) return;

		setIsLoading(true);
		setError(null);

		try {
			const updateData = {
				name: formData.name || selectedGroup.name,
				description: formData.description || selectedGroup.description,
				emoji: formData.emoji || selectedGroup.emoji,
				color: formData.color || selectedGroup.color,
				category: formData.category || selectedGroup.category,
				isFavorite: formData.isFavorite
			};

			await groupService.update(selectedGroup.id, updateData);
			toast({
				title: 'Éxito',
				description: `Grupo "${updateData.name}" actualizado correctamente`,
			});

			await loadGroups();
			setSelectedGroup(null);
		} catch (error) {
			setError(`Error al actualizar grupo: ${error.message}`);
			toast({
				title: 'Error',
				description: `No se pudo actualizar el grupo: ${error.message}`,
				variant: 'destructive'
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Eliminar un grupo
	const handleDeleteGroup = async (id: string) => {
		if (!confirm('¿Estás seguro de que deseas eliminar este grupo?')) return;

		setIsLoading(true);
		setError(null);

		try {
			await groupService.delete(id);
			toast({
				title: 'Éxito',
				description: 'Grupo eliminado correctamente',
			});

			await loadGroups();
			if (selectedGroup?.id === id) {
				setSelectedGroup(null);
			}
		} catch (error) {
			setError(`Error al eliminar grupo: ${error.message}`);
			toast({
				title: 'Error',
				description: `No se pudo eliminar el grupo: ${error.message}`,
				variant: 'destructive'
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Obtener estadísticas de un grupo
	const handleGetStats = async (id: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const stats = await groupService.getStats(id);
			toast({
				title: 'Estadísticas',
				description: `El grupo contiene ${stats.totalEntities} elementos en total (${stats._count.images} imágenes, ${stats._count.videos} videos)`,
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
					<TabsTrigger value="list">Lista de Grupos</TabsTrigger>
					<TabsTrigger value="create">Crear Grupo</TabsTrigger>
					<TabsTrigger value="detail" disabled={!selectedGroup}>Detalle de Grupo</TabsTrigger>
				</TabsList>

				{/* Tab de listado */}
				<TabsContent value="list">
					<Card>
						<CardHeader>
							<CardTitle>Grupos</CardTitle>
							<CardDescription>Gestiona tus grupos de contenido</CardDescription>
						</CardHeader>
						<CardContent>
							{error && <div className="my-2 p-2 bg-red-100 text-red-800 rounded">{error}</div>}

							<div className="mb-4 flex justify-end">
								<Button
									variant="outline"
									size="sm"
									disabled={isLoading}
									onClick={loadGroups}
								>
									{isLoading ? 'Cargando...' : 'Refrescar'}
								</Button>
							</div>

							{groups.length === 0 ? (
								<div className="text-center p-4 bg-slate-50 rounded">
									{isLoading ? 'Cargando grupos...' : 'No hay grupos disponibles'}
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{groups.map(group => (
										<Card key={group.id} className="relative">
											<CardHeader className="pb-2">
												<div className="flex items-center gap-2">
													<div
														className="w-8 h-8 rounded-full flex items-center justify-center text-white"
														style={{ backgroundColor: group.color || '#2563eb' }}
													>
														{group.emoji}
													</div>
													<CardTitle className="text-lg">{group.name}</CardTitle>
												</div>
												<CardDescription className="line-clamp-2">
													{group.description || 'Sin descripción'}
												</CardDescription>
											</CardHeader>
											<CardContent>
												<div className="flex flex-wrap gap-2 text-xs text-gray-500">
													<span className="px-2 py-1 bg-blue-50 rounded-full">
														{group.totalEntities} elementos
													</span>
													{group.category && (
														<span className="px-2 py-1 bg-gray-100 rounded-full">
															{group.category}
														</span>
													)}
													{group.isFavorite && (
														<span className="px-2 py-1 bg-amber-50 rounded-full">
															⭐ Favorito
														</span>
													)}
												</div>
											</CardContent>
											<CardFooter className="pt-2 flex justify-between">
												<div className="flex gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => selectGroup(group.id)}
													>
														Ver
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleGetStats(group.id)}
													>
														Estadísticas
													</Button>
												</div>
												<Button
													variant="destructive"
													size="sm"
													onClick={() => handleDeleteGroup(group.id)}
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
							<CardTitle>{selectedGroup ? 'Editar Grupo' : 'Crear Nuevo Grupo'}</CardTitle>
							<CardDescription>
								{selectedGroup
									? `Editando grupo: ${selectedGroup.name}`
									: 'Completa el formulario para crear un nuevo grupo'}
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
											placeholder="Mi grupo"
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
											placeholder="🔹"
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
												placeholder="#2563eb"
											/>
										</div>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="description">Descripción</Label>
									<Input
										id="description"
										name="description"
										placeholder="Descripción del grupo"
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
								setSelectedGroup(null);
								setFormData({
									name: '',
									emoji: '🔹',
									color: '#2563eb',
									description: '',
									category: 'general',
									isFavorite: false
								});
							}}>
								Cancelar
							</Button>

							<Button
								onClick={selectedGroup ? handleUpdateGroup : handleCreateGroup}
								disabled={isLoading || !formData.name}
							>
								{isLoading
									? 'Procesando...'
									: selectedGroup
										? 'Actualizar Grupo'
										: 'Crear Grupo'
								}
							</Button>
						</CardFooter>
					</Card>
				</TabsContent>

				{/* Tab de detalle */}
				<TabsContent value="detail">
					{selectedGroup && (
						<Card>
							<CardHeader>
								<div className="flex items-center gap-2">
									<div
										className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl"
										style={{ backgroundColor: selectedGroup.color || '#2563eb' }}
									>
										{selectedGroup.emoji}
									</div>
									<div>
										<CardTitle>{selectedGroup.name}</CardTitle>
										<CardDescription>
											Creado: {new Date(selectedGroup.createdAt).toLocaleDateString()}
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<h3 className="text-sm font-medium text-gray-500">Descripción</h3>
										<p className="mt-1">{selectedGroup.description || 'Sin descripción'}</p>
									</div>

									<div>
										<h3 className="text-sm font-medium text-gray-500">Categoría</h3>
										<p className="mt-1">{selectedGroup.category || 'Sin categoría'}</p>
									</div>
								</div>

								{selectedGroup._count && (
									<div>
										<h3 className="text-sm font-medium text-gray-500 mb-2">Contenido del grupo</h3>
										<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
											{selectedGroup._count.images > 0 && (
												<div className="rounded bg-blue-50 p-2 text-center">
													<div className="font-semibold">{selectedGroup._count.images}</div>
													<div className="text-xs text-gray-600">Imágenes</div>
												</div>
											)}
											{selectedGroup._count.videos > 0 && (
												<div className="rounded bg-purple-50 p-2 text-center">
													<div className="font-semibold">{selectedGroup._count.videos}</div>
													<div className="text-xs text-gray-600">Videos</div>
												</div>
											)}
											{selectedGroup._count.albums > 0 && (
												<div className="rounded bg-green-50 p-2 text-center">
													<div className="font-semibold">{selectedGroup._count.albums}</div>
													<div className="text-xs text-gray-600">Álbumes</div>
												</div>
											)}
											{selectedGroup._count.tags > 0 && (
												<div className="rounded bg-amber-50 p-2 text-center">
													<div className="font-semibold">{selectedGroup._count.tags}</div>
													<div className="text-xs text-gray-600">Etiquetas</div>
												</div>
											)}
										</div>
									</div>
								)}

								<div className="border-t pt-4">
									<h3 className="text-sm font-medium text-gray-500 mb-2">Detalles adicionales</h3>
									<div className="grid grid-cols-2 gap-2 text-sm">
										<div>
											<span className="text-gray-500">ID: </span>
											<code className="bg-gray-100 p-1 rounded text-xs">{selectedGroup.id}</code>
										</div>
										<div>
											<span className="text-gray-500">Favorito: </span>
											<span>{selectedGroup.isFavorite ? 'Sí' : 'No'}</span>
										</div>
										<div>
											<span className="text-gray-500">Última actualización: </span>
											<span>{new Date(selectedGroup.updatedAt).toLocaleString()}</span>
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
											name: selectedGroup.name,
											emoji: selectedGroup.emoji,
											color: selectedGroup.color,
											description: selectedGroup.description,
											category: selectedGroup.category,
											isFavorite: selectedGroup.isFavorite
										});

										// Cambiar a tab de creación (que se convierte en edición)
										document.querySelector('[data-value="create"]')?.click();
									}}
								>
									Editar
								</Button>

								<Button
									variant="destructive"
									onClick={() => handleDeleteGroup(selectedGroup.id)}
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