'use client'

/**
 * @file Componente de ejemplo mejorado para gestión de grupos
 * @module examples/GroupsExampleEnhanced
 */

import { createGroup, deleteGroup, getGroup, getGroups, toggleGroupFavorite, updateGroup } from '@/app/actions/groups/group.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useGroupStore } from '@/store/entities/group';
import { transformGroupToWithStats } from '@/transformers/group';
import { type CreateGroupData, type GroupWithStats } from '@/types/entities/group/types';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

/**
 * 👥 Componente de ejemplo mejorado para la gestión de grupos
 * Incluye estadísticas, visualización en lista y tabla, filtros, etc.
 */
export function GroupsExampleEnhanced() {
	const [groups, setGroups] = useState<GroupWithStats[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedGroup, setSelectedGroup] = useState<GroupWithStats | null>(null);
	const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
	const [filterFavorites, setFilterFavorites] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
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

	// Grupos filtrados
	const filteredGroups = useMemo(() => {
		let result = [...groups];

		// Filtrar por favoritos si está activado
		if (filterFavorites) {
			result = result.filter(group => group.isFavorite);
		}

		// Filtrar por búsqueda
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(group =>
				group.name.toLowerCase().includes(query) ||
				group.description?.toLowerCase().includes(query)
			);
		}

		return result;
	}, [groups, filterFavorites, searchQuery]);

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
		const totalCount = withStats._count
			? Object.values(withStats._count).reduce((a, b) => a + b, 0)
			: 0;

		return (
			<div className="text-xs text-muted-foreground">
				<p className="font-medium">Total: {totalCount} elementos</p>
				<div className="grid grid-cols-2 gap-1 mt-1">
					{withStats._count?.images > 0 && <span>🖼️ {withStats._count.images} imágenes</span>}
					{withStats._count?.videos > 0 && <span>🎥 {withStats._count.videos} videos</span>}
					{withStats._count?.albums > 0 && <span>📁 {withStats._count.albums} álbumes</span>}
					{withStats._count?.collections > 0 && <span>📚 {withStats._count.collections} colecciones</span>}
					{withStats._count?.tags > 0 && <span>🏷️ {withStats._count.tags} etiquetas</span>}
					{withStats._count?.characters > 0 && <span>👤 {withStats._count.characters} personajes</span>}
					{withStats._count?.places > 0 && <span>📍 {withStats._count.places} lugares</span>}
					{withStats._count?.worldItems > 0 && <span>🌍 {withStats._count.worldItems} objetos</span>}
					{withStats._count?.concepts > 0 && <span>💡 {withStats._count.concepts} conceptos</span>}
					{withStats._count?.prompts > 0 && <span>✨ {withStats._count.prompts} prompts</span>}
					{withStats._count?.notes > 0 && <span>📝 {withStats._count.notes} notas</span>}
					{withStats._count?.wildcards > 0 && <span>🃏 {withStats._count.wildcards} wildcards</span>}
					{withStats._count?.properties > 0 && <span>🔧 {withStats._count.properties} propiedades</span>}
				</div>
			</div>
		);
	};

	// Renderizar un grupo en vista de grid
	const renderGridView = (group: GroupWithStats) => (
		<Card className={`overflow-hidden h-full ${selectedGroup?.id === group.id ? 'ring-2 ring-primary' : ''}`}>
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
	);

	// Renderizar un grupo en vista de lista
	const renderListView = (group: GroupWithStats) => (
		<Card className={`overflow-hidden ${selectedGroup?.id === group.id ? 'ring-2 ring-primary' : ''}`}>
			<div className="flex items-center p-4">
				<div className="flex-shrink-0 mr-4">
					<div
						className="w-10 h-10 rounded-md flex items-center justify-center text-xl"
						style={{ backgroundColor: group.color || '#8B5CF6' }}
					>
						{group.emoji}
					</div>
				</div>
				<div className="flex-grow">
					<div className="flex items-center">
						<h3 className="text-base font-medium">{group.name}</h3>
						{group.isFavorite && <span className="ml-2 text-yellow-500">⭐</span>}
					</div>
					{group.description && (
						<p className="text-sm text-muted-foreground line-clamp-1">{group.description}</p>
					)}
				</div>
				<div className="flex gap-2 ml-4">
					<Button
						size="sm"
						variant="outline"
						onClick={() => handleToggleFavorite(group.id)}
					>
						{group.isFavorite ? '⭐' : '☆'}
					</Button>
					<Button
						size="sm"
						onClick={() => selectGroup(group.id)}
					>
						Editar
					</Button>
					<Button
						size="sm"
						variant="destructive"
						onClick={() => handleDelete(group.id)}
					>
						Eliminar
					</Button>
				</div>
			</div>
		</Card>
	);

	// Renderizar grupos en vista de tabla
	const renderTableView = () => (
		<div className="overflow-x-auto">
			<table className="w-full border-collapse">
				<thead>
					<tr className="bg-muted">
						<th className="px-4 py-2 text-left">Nombre</th>
						<th className="px-4 py-2 text-left">Descripción</th>
						<th className="px-4 py-2 text-center">Elementos</th>
						<th className="px-4 py-2 text-center">Favorito</th>
						<th className="px-4 py-2 text-center">Acciones</th>
					</tr>
				</thead>
				<tbody>
					{filteredGroups.map(group => {
						const totalItems = group._count
							? Object.values(group._count).reduce((a, b) => a + b, 0)
							: 0;

						return (
							<tr
								key={group.id}
								className={`border-b hover:bg-muted/50 ${selectedGroup?.id === group.id ? 'bg-primary/10' : ''}`}
							>
								<td className="px-4 py-2">
									<div className="flex items-center">
										<span className="mr-2">{group.emoji}</span>
										<span
											className="w-3 h-3 rounded-full mr-2"
											style={{ backgroundColor: group.color || '#8B5CF6' }}
										/>
										{group.name}
									</div>
								</td>
								<td className="px-4 py-2 text-sm">
									{group.description || <span className="text-muted-foreground italic">Sin descripción</span>}
								</td>
								<td className="px-4 py-2 text-center">
									<Badge variant="outline">{totalItems}</Badge>
								</td>
								<td className="px-4 py-2 text-center">
									{group.isFavorite ? '⭐' : '-'}
								</td>
								<td className="px-4 py-2 text-center">
									<div className="flex justify-center gap-2">
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleToggleFavorite(group.id)}
										>
											{group.isFavorite ? 'Quitar ⭐' : 'Favorito'}
										</Button>
										<Button
											size="sm"
											variant="default"
											onClick={() => selectGroup(group.id)}
										>
											Editar
										</Button>
										<Button
											size="sm"
											variant="destructive"
											onClick={() => handleDelete(group.id)}
										>
											Eliminar
										</Button>
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);

	return (
		<div className="container mx-auto p-4">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
				<h1 className="text-2xl font-bold">Gestión de Grupos</h1>
				<div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
					<div className="flex-1 md:w-64">
						<Input
							placeholder="Buscar grupos..."
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className="w-full"
						/>
					</div>
					<div className="flex gap-2">
						<Select
							value={viewMode}
							onValueChange={(value) => setViewMode(value as any)}
						>
							<SelectTrigger className="w-32">
								<SelectValue placeholder="Vista" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="grid">Cuadrícula</SelectItem>
								<SelectItem value="list">Lista</SelectItem>
								<SelectItem value="table">Tabla</SelectItem>
							</SelectContent>
						</Select>

						<div className="flex items-center gap-2 ml-2">
							<Checkbox
								id="filterFavorites"
								checked={filterFavorites}
								onCheckedChange={(checked) => setFilterFavorites(!!checked)}
							/>
							<Label htmlFor="filterFavorites" className="cursor-pointer">
								Solo favoritos
							</Label>
						</div>

						<Button onClick={loadGroups} disabled={loading}>
							{loading ? 'Cargando...' : 'Actualizar'}
						</Button>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
								<Checkbox
									id="isFavorite"
									checked={formData.isFavorite}
									onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFavorite: !!checked }))}
								/>
								<Label htmlFor="isFavorite" className="cursor-pointer">
									Marcar como favorito
								</Label>
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
				<div className="md:col-span-3">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">
							Grupos ({filteredGroups.length})
							{filterFavorites && <span className="ml-2 text-sm text-muted-foreground">(filtrados)</span>}
						</h2>
					</div>

					{filteredGroups.length === 0 ? (
						<div className="text-center py-8 bg-muted rounded-lg">
							<p className="text-muted-foreground">No hay grupos disponibles</p>
							<Button onClick={resetForm} variant="link" className="mt-2">
								Crear tu primer grupo
							</Button>
						</div>
					) : (
						<>
							{viewMode === 'grid' && (
								<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
									{filteredGroups.map(group => (
										<div key={group.id} className="animate-fadeIn">
											{renderGridView(group)}
										</div>
									))}
								</div>
							)}

							{viewMode === 'list' && (
								<div className="flex flex-col gap-3">
									{filteredGroups.map(group => (
										<div key={group.id} className="animate-fadeIn">
											{renderListView(group)}
										</div>
									))}
								</div>
							)}

							{viewMode === 'table' && renderTableView()}
						</>
					)}
				</div>
			</div>

			{/* Vista de depuración */}
			<div className="mt-8 border-t pt-4">
				<details>
					<summary className="font-medium cursor-pointer">Vista de depuración</summary>
					<div className="mt-2 p-4 bg-muted rounded-lg overflow-auto max-h-96">
						<Tabs defaultValue="store">
							<TabsList>
								<TabsTrigger value="store">Store</TabsTrigger>
								<TabsTrigger value="state">Estado Local</TabsTrigger>
								<TabsTrigger value="filtered">Grupos Filtrados</TabsTrigger>
							</TabsList>
							<TabsContent value="store" className="p-2">
								<pre className="text-xs">{JSON.stringify(groupStore.getGroups(), null, 2)}</pre>
							</TabsContent>
							<TabsContent value="state" className="p-2">
								<pre className="text-xs">{JSON.stringify({ groups, selectedGroup, formData, viewMode, filterFavorites, searchQuery }, null, 2)}</pre>
							</TabsContent>
							<TabsContent value="filtered" className="p-2">
								<pre className="text-xs">{JSON.stringify(filteredGroups, null, 2)}</pre>
							</TabsContent>
						</Tabs>
					</div>
				</details>
			</div>
		</div>
	);
}