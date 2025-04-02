'use client'

/**
 * @file Componente de ejemplo para gestión de grupos
 * @module examples/GroupsExample
 */

import { createGroup, deleteGroup, getGroup, getGroups, toggleGroupFavorite, updateGroup } from '@/app/actions/groups/group.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGroupStore } from '@/store/entities/group';
import { transformGroupToWithStats } from '@/transformers/group';
import { type CreateGroupData, type GroupWithStats } from '@/types/entities/group/types';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * 👥 Componente de ejemplo para la gestión de grupos
 */
export function GroupsExample() {
	const [groups, setGroups] = useState<GroupWithStats[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedGroup, setSelectedGroup] = useState<GroupWithStats | null>(null);
	const [formData, setFormData] = useState<CreateGroupData>({
		name: '',
		emoji: '👥',
		color: '#8B5CF6',
		description: '',
		isFavorite: false
	});

	// Store de grupos
	const groupStore = useGroupStore();

	// Cargar grupos al iniciar
	useEffect(() => {
		loadGroups();
	}, []);

	// Cargar grupos desde la API
	const loadGroups = async () => {
		try {
			setLoading(true);
			const fetchedGroups = await getGroups();
			setGroups(fetchedGroups);

			// Añadir al store
			groupStore.addGroups(fetchedGroups);

			toast.success('Grupos cargados correctamente');
		} catch (error) {
			console.error('Error al cargar grupos:', error);
			toast.error('Error al cargar grupos');
		} finally {
			setLoading(false);
		}
	};

	// Seleccionar un grupo para editar
	const selectGroup = async (id: string) => {
		try {
			setLoading(true);
			const group = await getGroup(id);
			if (group) {
				setSelectedGroup(group);
				setFormData({
					name: group.name,
					emoji: group.emoji,
					color: group.color,
					description: group.description || '',
					isFavorite: group.isFavorite
				});
			}
		} catch (error) {
			console.error('Error al cargar grupo:', error);
			toast.error('Error al cargar grupo');
		} finally {
			setLoading(false);
		}
	};

	// Enviar formulario
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			setLoading(true);

			if (selectedGroup) {
				// Actualizar grupo existente
				const updatedGroup = await updateGroup(selectedGroup.id, formData);

				// Actualizar lista y store
				setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
				groupStore.updateGroup(updatedGroup.id, formData);

				toast.success(`Grupo "${updatedGroup.name}" actualizado`);
			} else {
				// Crear nuevo grupo
				const newGroup = await createGroup(formData);

				// Actualizar lista y store
				setGroups(prev => [...prev, newGroup]);
				groupStore.addGroup(newGroup);

				toast.success(`Grupo "${newGroup.name}" creado`);
			}

			// Resetear formulario
			resetForm();
		} catch (error) {
			console.error('Error al guardar grupo:', error);
			toast.error('Error al guardar grupo');
		} finally {
			setLoading(false);
		}
	};

	// Eliminar grupo
	const handleDelete = async (id: string) => {
		if (!confirm('¿Estás seguro de eliminar este grupo?')) return;

		try {
			setLoading(true);
			await deleteGroup(id);

			// Actualizar lista y store
			setGroups(prev => prev.filter(g => g.id !== id));
			groupStore.deleteGroup(id);

			// Si estamos editando este grupo, resetear
			if (selectedGroup?.id === id) {
				resetForm();
			}

			toast.success('Grupo eliminado');
		} catch (error) {
			console.error('Error al eliminar grupo:', error);
			toast.error('Error al eliminar grupo');
		} finally {
			setLoading(false);
		}
	};

	// Marcar/desmarcar como favorito
	const handleToggleFavorite = async (id: string) => {
		try {
			setLoading(true);
			const updatedGroup = await toggleGroupFavorite(id);

			// Actualizar lista y store
			setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
			groupStore.updateGroup(updatedGroup.id, { isFavorite: updatedGroup.isFavorite });

			// Si estamos editando este grupo, actualizar
			if (selectedGroup?.id === id) {
				setSelectedGroup(updatedGroup);
				setFormData(prev => ({ ...prev, isFavorite: updatedGroup.isFavorite }));
			}

			toast.success(`Grupo ${updatedGroup.isFavorite ? 'marcado' : 'desmarcado'} como favorito`);
		} catch (error) {
			console.error('Error al actualizar favorito:', error);
			toast.error('Error al actualizar favorito');
		} finally {
			setLoading(false);
		}
	};

	// Resetear formulario
	const resetForm = () => {
		setSelectedGroup(null);
		setFormData({
			name: '',
			emoji: '👥',
			color: '#8B5CF6',
			description: '',
			isFavorite: false
		});
	};

	// Manejar cambios en el formulario
	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value, type } = e.target;

		if (type === 'checkbox') {
			const checked = (e.target as HTMLInputElement).checked;
			setFormData(prev => ({ ...prev, [name]: checked }));
		} else {
			setFormData(prev => ({ ...prev, [name]: value }));
		}
	};

	// Renderizar estadísticas de grupo
	const renderGroupStats = (group: GroupWithStats) => {
		// Obtener estadísticas
		const withStats = transformGroupToWithStats(group);

		return (
			<div className="text-xs text-muted-foreground">
				<p>Total: {withStats._count ? (
					Object.values(withStats._count).reduce((a, b) => a + b, 0)
				) : 0} elementos</p>
				<div className="grid grid-cols-2 gap-1 mt-1">
					{withStats._count?.images > 0 && <span>🖼️ {withStats._count.images} imágenes</span>}
					{withStats._count?.videos > 0 && <span>🎥 {withStats._count.videos} videos</span>}
					{withStats._count?.albums > 0 && <span>📁 {withStats._count.albums} álbumes</span>}
					{withStats._count?.collections > 0 && <span>📚 {withStats._count.collections} colecciones</span>}
					{withStats._count?.tags > 0 && <span>🏷️ {withStats._count.tags} etiquetas</span>}
				</div>
			</div>
		);
	};

	return (
		<div className="container mx-auto p-4">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Gestión de Grupos</h1>
				<Button onClick={loadGroups} disabled={loading}>
					{loading ? 'Cargando...' : 'Actualizar'}
				</Button>
			</div>

			<div className="grid md:grid-cols-3 gap-6">
				{/* Formulario */}
				<Card className="md:col-span-1">
					<CardHeader>
						<CardTitle>{selectedGroup ? 'Editar Grupo' : 'Nuevo Grupo'}</CardTitle>
						<CardDescription>
							{selectedGroup
								? `Editando "${selectedGroup.name}"`
								: 'Crea un nuevo grupo para organizar contenido'
							}
						</CardDescription>
					</CardHeader>
					<form onSubmit={handleSubmit}>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Nombre</Label>
								<Input
									id="name"
									name="name"
									value={formData.name}
									onChange={handleChange}
									placeholder="Nombre del grupo"
									required
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="emoji">Emoji</Label>
									<Input
										id="emoji"
										name="emoji"
										value={formData.emoji}
										onChange={handleChange}
										placeholder="👥"
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
											className="w-12 h-9 p-1"
										/>
										<Input
											value={formData.color}
											onChange={handleChange}
											name="color"
											placeholder="#8B5CF6"
										/>
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Descripción</Label>
								<Textarea
									id="description"
									name="description"
									value={formData.description || ''}
									onChange={handleChange}
									placeholder="Descripción del grupo"
									rows={3}
								/>
							</div>

							<div className="flex items-center space-x-2">
								<input
									id="isFavorite"
									name="isFavorite"
									type="checkbox"
									checked={formData.isFavorite}
									onChange={(e) => setFormData(prev => ({ ...prev, isFavorite: e.target.checked }))}
									className="h-4 w-4"
								/>
								<Label htmlFor="isFavorite">Marcar como favorito</Label>
							</div>
						</CardContent>

						<CardFooter className="flex justify-between">
							<Button type="button" variant="outline" onClick={resetForm}>
								{selectedGroup ? 'Cancelar' : 'Limpiar'}
							</Button>
							<Button type="submit" disabled={loading}>
								{loading ? 'Guardando...' : selectedGroup ? 'Actualizar' : 'Crear'}
							</Button>
						</CardFooter>
					</form>
				</Card>

				{/* Lista de grupos */}
				<div className="md:col-span-2">
					<h2 className="text-xl font-semibold mb-4">Grupos ({groups.length})</h2>

					{groups.length === 0 ? (
						<div className="text-center py-8 bg-muted rounded-lg">
							<p className="text-muted-foreground">No hay grupos disponibles</p>
							<Button onClick={() => { }} variant="link" className="mt-2">
								Crear tu primer grupo
							</Button>
						</div>
					) : (
						<div className="grid sm:grid-cols-2 gap-4">
							{groups.map(group => (
								<div
									key={group.id}
									className="animate-fadeIn"
								>
									<Card className={`overflow-hidden ${selectedGroup?.id === group.id ? 'ring-2 ring-primary' : ''}`}>
										<div
											className="h-2"
											style={{ backgroundColor: group.color || '#8B5CF6' }}
										/>
										<CardHeader className="pb-2">
											<div className="flex justify-between items-start">
												<div className="flex items-center gap-2">
													<span className="text-2xl">{group.emoji}</span>
													<CardTitle>{group.name}</CardTitle>
												</div>
												{group.isFavorite && (
													<span className="text-yellow-500">⭐</span>
												)}
											</div>
											{group.description && (
												<CardDescription>{group.description}</CardDescription>
											)}
										</CardHeader>

										<CardContent className="pb-2">
											{renderGroupStats(group)}
										</CardContent>

										<CardFooter className="flex justify-between pt-2">
											<div className="flex gap-2">
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleToggleFavorite(group.id)}
												>
													{group.isFavorite ? '⭐ Quitar favorito' : '☆ Favorito'}
												</Button>
												<Button
													size="sm"
													variant="destructive"
													onClick={() => handleDelete(group.id)}
												>
													Eliminar
												</Button>
											</div>
											<Button
												size="sm"
												onClick={() => selectGroup(group.id)}
											>
												Editar
											</Button>
										</CardFooter>
									</Card>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Vista de depuración */}
			<div className="mt-8 border-t pt-4">
				<details>
					<summary className="font-medium cursor-pointer">Vista de depuración</summary>
					<div className="mt-2 p-4 bg-muted rounded-lg overflow-auto max-h-96">
						<pre className="text-xs">{JSON.stringify(groupStore.getGroups(), null, 2)}</pre>
					</div>
				</details>
			</div>
		</div>
	);
}