'use client';

import { createGroup, deleteGroup, getGroups, updateGroup } from '@/app/actions/groups/group.actions';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import toastService from '@/services/toast.service';
import type { GroupWithStats } from '@/types/entities/group/types';
import { GroupSortCriteria } from '@/types/entities/group/types';
import { FolderIcon, PlusIcon, SearchIcon, StarIcon, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CreateGroupForm } from './create-group-form';
import { GroupPreview } from './group-preview';

const SORT_OPTIONS = [
	{ label: 'Nombre', value: GroupSortCriteria.NAME_ASC },
	{ label: 'Categoría', value: GroupSortCriteria.CREATED_ASC },
	{ label: 'Fecha', value: GroupSortCriteria.CREATED_DESC },
] as const;

export function GroupsSettings() {
	const [groups, setGroups] = useState<GroupWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedGroup, setSelectedGroup] = useState<GroupWithStats | null>(null);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);

	// Filtros y ordenamiento
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [onlyFavorites, setOnlyFavorites] = useState(false);
	const [sortBy, setSortBy] = useState<GroupSortCriteria>(GroupSortCriteria.NAME_ASC);

	useEffect(() => {
		loadGroups();
	}, []);

	const loadGroups = async () => {
		try {
			setIsLoading(true);
			const data = await getGroups();
			setGroups(data as GroupWithStats[]);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			setError(errorMessage);
			toastService.error('Error al cargar los grupos', {
				description: errorMessage,
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Filtrar grupos basados en los criterios seleccionados
	const filteredGroups = groups.filter(group => {
		let matches = true;
		if (searchQuery) {
			const normalizedQuery = searchQuery.toLowerCase();
			matches = matches && (
				group.name.toLowerCase().includes(normalizedQuery) ||
				group.description?.toLowerCase().includes(normalizedQuery) ||
				false
			);
		}
		if (selectedCategories.length > 0) {
			matches = matches && (group.category ? selectedCategories.includes(group.category) : false);
		}
		if (onlyFavorites) {
			matches = matches && group.isFavorite;
		}
		return matches;
	});

	// Ordenar grupos
	const sortedGroups = [...filteredGroups].sort((a, b) => {
		switch (sortBy) {
			case GroupSortCriteria.NAME_ASC:
				return a.name.localeCompare(b.name);
			case GroupSortCriteria.CREATED_ASC:
				return (a.category || '').localeCompare(b.category || '');
			case GroupSortCriteria.CREATED_DESC:
				return b.createdAt.getTime() - a.createdAt.getTime();
			default:
				return 0;
		}
	});

	// Estadísticas
	const stats = {
		totalGroups: groups.length,
		totalElements: groups.reduce((acc, group) => {
			return acc + Object.values(group._count).reduce((a, b) => a + b, 0);
		}, 0),
		totalRelationTypes: groups.reduce((acc, group) => {
			return acc + Object.values(group._count).filter(count => count > 0).length;
		}, 0),
		emptyGroups: groups.filter(group =>
			Object.values(group._count).reduce((a, b) => a + b, 0) === 0
		).length,
		favoriteGroups: groups.filter(group => group.isFavorite).length,
	};

	// Manejadores
	const handleCreateGroup = async (data: Partial<Group>) => {
		try {
			const newGroup = await createGroup(data);
			setGroups(prev => [...prev, newGroup as GroupWithStats]);
			setIsCreateDialogOpen(false);
			toastService.success('Grupo creado correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al crear el grupo', {
				description: errorMessage,
			});
		}
	};

	const handleUpdateGroup = async (id: string, data: Partial<Group>) => {
		try {
			const updatedGroup = await updateGroup(id, data);
			setGroups(prev => prev.map(g => g.id === id ? { ...g, ...updatedGroup } : g));
			setSelectedGroup(null);
			setIsEditMode(false);
			toastService.success('Grupo actualizado correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al actualizar el grupo', {
				description: errorMessage,
			});
		}
	};

	const handleDeleteGroup = async (id: string) => {
		try {
			await deleteGroup(id);
			setGroups(prev => prev.filter(g => g.id !== id));
			setSelectedGroup(null);
			toastService.success('Grupo eliminado correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al eliminar el grupo', {
				description: errorMessage,
			});
		}
	};

	return (
		<div className="grid grid-cols-12 gap-3">
			{/* Panel izquierdo: Lista de grupos */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="space-y-1 py-2 px-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-xl font-bold">Grupos</CardTitle>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setIsCreateDialogOpen(true)}
							>
								<PlusIcon className="h-4 w-4" />
							</Button>
						</div>
						<div className="flex gap-2">
							<div className="flex items-center gap-2 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors">
								<SearchIcon className="h-4 w-4 opacity-50" />
								<Input
									placeholder="Buscar grupos..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-8 p-0 border-0 bg-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
								/>
							</div>
						</div>
						<div className="flex gap-2">
							<Select
								value={sortBy}
								onValueChange={(value: GroupSortCriteria) => setSortBy(value)}
							>
								<SelectTrigger className="h-8">
									<SelectValue placeholder="Ordenar por..." />
								</SelectTrigger>
								<SelectContent>
									{SORT_OPTIONS.map(option => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Toggle
								pressed={onlyFavorites}
								onPressedChange={setOnlyFavorites}
								size="sm"
							>
								<StarIcon className="h-4 w-4" />
							</Toggle>
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full">
							<div className="space-y-1 p-2">
								{sortedGroups.map((group) => (
									<Button
										key={group.id}
										variant={selectedGroup?.id === group.id ? 'secondary' : 'ghost'}
										className="w-full justify-start h-12 relative group"
										onClick={() => setSelectedGroup(group)}
									>
										<div className="flex items-center gap-2">
											<span role="img" aria-label="emoji">
												{group.emoji}
											</span>
											<div className="flex flex-col items-start">
												<span className="font-medium">{group.name}</span>
												<span className="text-xs opacity-50">
													{Object.values(group._count).reduce((a, b) => a + b, 0)} elementos
												</span>
											</div>
										</div>
										{group.isFavorite && (
											<StarIcon className="h-3 w-3 absolute right-2 top-2" />
										)}
										<Button
											variant="ghost"
											size="icon"
											className="absolute right-1 opacity-0 group-hover:opacity-100"
											onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
												e.stopPropagation();
												handleDeleteGroup(group.id);
											}}
										>
											<Trash className="h-4 w-4" />
										</Button>
									</Button>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			{/* Panel derecho: Formulario y Preview */}
			<div className="col-span-12 md:col-span-7 lg:col-span-8">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					{selectedGroup ? (
						isEditMode ? (
							<CreateGroupForm
								group={selectedGroup}
								onSubmit={(data) => handleUpdateGroup(selectedGroup.id, data)}
								onCancel={() => setIsEditMode(false)}
							/>
						) : (
							<GroupPreview
								group={selectedGroup as GroupWithStats}
								onEdit={() => setIsEditMode(true)}
							/>
						)
					) : (
						<div className="flex flex-col items-center justify-center h-full">
							<FolderIcon className="h-12 w-12 opacity-20" />
							<p className="text-sm opacity-50 mt-2">
								Selecciona un grupo para ver sus detalles
							</p>
						</div>
					)}
				</Card>
			</div>

			{/* Dialog para crear nuevo grupo */}
			<Dialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
			>
				<CreateGroupForm
					onSubmit={handleCreateGroup}
					onCancel={() => setIsCreateDialogOpen(false)}
				/>
			</Dialog>
		</div>
	);
}