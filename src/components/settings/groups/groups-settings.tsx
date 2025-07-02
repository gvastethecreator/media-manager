import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { useCreateGroup, useDeleteGroup, useGroups, useUpdateGroup } from '@/lib/api/groups';
import toastService from '@/services/toast';
import type { GroupCreateInput, GroupUpdateInput, GroupWithStats } from '@/types/entities/group';
import { GroupSortCriteria } from '@/types/entities/group';
import { FolderIcon, PlusIcon, SearchIcon, StarIcon, Trash } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CreateGroupForm } from './create-group-form';
import { GroupPreview } from './group-preview';

const SORT_OPTIONS = [
	{ label: 'Nombre', value: GroupSortCriteria.NAME_ASC },
	{ label: 'Categoría', value: GroupSortCriteria.CATEGORY_ASC },
	{ label: 'Fecha', value: GroupSortCriteria.DATE_CREATED_DESC },
] as const;

export function GroupsSettings() {
	// State local
	const [selectedGroup, setSelectedGroup] = useState<GroupWithStats | null>(null);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [onlyFavorites, setOnlyFavorites] = useState(false);
	const [sortBy, setSortBy] = useState(GroupSortCriteria.NAME_ASC);

	// React Query hooks
	const { data: groupsResponse, isLoading, error } = useGroups({ search: searchQuery });
	const createGroupMutation = useCreateGroup();
	const updateGroupMutation = useUpdateGroup();
	const deleteGroupMutation = useDeleteGroup();

	const groups = groupsResponse?.data || [];

	const filteredGroups = useMemo(
		() =>
			groups.filter((group) => {
				const query = searchQuery.toLowerCase();
				const matchesQuery =
					!query ||
					group.name.toLowerCase().includes(query) ||
					group.description?.toLowerCase().includes(query) === true;

				const matchesCategory =
					selectedCategories.length === 0 || (group.category && selectedCategories.includes(group.category));

				const matchesFavorites = !onlyFavorites || group.isFavorite;

				return matchesQuery && matchesCategory && matchesFavorites;
			}),
		[groups, searchQuery, selectedCategories, onlyFavorites]
	);

	const sortedGroups = useMemo(
		() =>
			[...filteredGroups].sort((a, b) => {
				switch (sortBy) {
					case GroupSortCriteria.NAME_ASC:
						return a.name.localeCompare(b.name);
					case GroupSortCriteria.CATEGORY_ASC:
						return (a.category ?? '').localeCompare(b.category ?? '');
					case GroupSortCriteria.DATE_CREATED_DESC:
						return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
					default:
						return 0;
				}
			}),
		[filteredGroups, sortBy]
	);

	const stats = useMemo(() => {
		const totalElements = groups.reduce((acc, group) => {
			const stats = group.stats;
			if (!stats) return acc;
			return (
				acc +
				stats.imageCount +
				stats.videoCount +
				stats.albumCount +
				stats.collectionCount +
				stats.tagCount +
				stats.characterCount +
				stats.placeCount +
				stats.worldItemCount +
				stats.conceptCount +
				stats.promptCount +
				stats.noteCount +
				stats.wildcardCount +
				stats.propertyCount
			);
		}, 0);

		const emptyGroups = groups.filter((group) => {
			const stats = group.stats;
			if (!stats) return true;
			return (
				stats.imageCount +
					stats.videoCount +
					stats.albumCount +
					stats.collectionCount +
					stats.tagCount +
					stats.characterCount +
					stats.placeCount +
					stats.worldItemCount +
					stats.conceptCount +
					stats.promptCount +
					stats.noteCount +
					stats.wildcardCount +
					stats.propertyCount ===
				0
			);
		}).length;

		return {
			totalGroups: groups.length,
			totalElements,
			emptyGroups,
			favoriteGroups: groups.filter((group) => group.isFavorite).length,
		};
	}, [groups]);

	const handleCreateGroup = async (data: GroupCreateInput) => {
		try {
			await createGroupMutation.mutateAsync(data);
			setIsCreateDialogOpen(false);
			toastService.success('Grupo creado correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al crear el grupo', { description: errorMessage });
		}
	};

	const handleUpdateGroup = async (id: string, data: GroupUpdateInput) => {
		try {
			await updateGroupMutation.mutateAsync({ id, data });
			setSelectedGroup(null);
			setIsEditMode(false);
			toastService.success('Grupo actualizado correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al actualizar el grupo', { description: errorMessage });
		}
	};

	const handleDeleteGroup = async (id: string) => {
		try {
			await deleteGroupMutation.mutateAsync(id);
			if (selectedGroup?.id === id) {
				setSelectedGroup(null);
			}
			toastService.success('Grupo eliminado correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al eliminar el grupo', { description: errorMessage });
		}
	};

	// Mostrar loading state
	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[calc(100vh-8rem)]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
					<p className="mt-2 text-sm text-gray-500">Cargando grupos...</p>
				</div>
			</div>
		);
	}

	// Mostrar error state
	if (error) {
		return (
			<div className="flex items-center justify-center h-[calc(100vh-8rem)]">
				<div className="text-center">
					<p className="text-red-500">Error al cargar los grupos</p>
					<p className="text-sm text-gray-500 mt-1">{error instanceof Error ? error.message : 'Error desconocido'}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-12 gap-3">
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="space-y-1 py-2 px-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-xl font-bold">Grupos</CardTitle>
							<Button size="sm" variant="ghost" onClick={() => setIsCreateDialogOpen(true)}>
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
							<Select value={sortBy} onValueChange={(value: GroupSortCriteria) => setSortBy(value)}>
								<SelectTrigger className="h-8">
									<SelectValue placeholder="Ordenar por..." />
								</SelectTrigger>
								<SelectContent>
									{SORT_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Toggle pressed={onlyFavorites} onPressedChange={(value) => setOnlyFavorites(value)} size="sm">
								<StarIcon className="h-4 w-4" />
							</Toggle>
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full">
							<div className="space-y-1 p-2">
								{sortedGroups.map((group) => (
									<div
										key={group.id}
										className={`relative group/item rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
											selectedGroup?.id === group.id ? 'bg-secondary text-secondary-foreground' : ''
										}`}
									>
										<Button
											variant="ghost"
											className="w-full justify-start h-12 relative"
											onClick={() => setSelectedGroup(group)}
										>
											<div className="flex items-center gap-2">
												<span role="img" aria-label="emoji">
													{group.emoji}
												</span>
												<div className="flex flex-col items-start">
													<span className="font-medium">{group.name}</span>
													<span className="text-xs opacity-50">
														{group.stats ? group.stats.imageCount + group.stats.videoCount : 0} elementos
													</span>
												</div>
											</div>
											{group.isFavorite && <StarIcon className="h-3 w-3 absolute right-8 top-2" />}
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="absolute right-1 top-1 opacity-0 group-hover/item:opacity-100 h-10 w-10"
											onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
												e.stopPropagation();
												handleDeleteGroup(group.id);
											}}
										>
											<Trash className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>
			{/* Panel derecho: Detalles o creación */}
			<div className="col-span-12 md:col-span-7 lg:col-span-8">
				{selectedGroup && !isEditMode ? (
					<GroupPreview
						group={selectedGroup}
						onEdit={() => setIsEditMode(true)}
						onDelete={() => handleDeleteGroup(selectedGroup.id)}
						stats={stats}
					/>
				) : isEditMode && selectedGroup ? (
					<CreateGroupForm
						group={selectedGroup}
						onSubmit={(data) => handleUpdateGroup(selectedGroup.id, data)}
						onCancel={() => setIsEditMode(false)}
					/>
				) : (
					<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
						<div className="text-center">
							<FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
							<h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Selecciona un grupo</h3>
							<p className="mt-1 text-sm text-gray-500">O crea uno nuevo para empezar a organizarte</p>
						</div>
					</Card>
				)}
			</div>

			<Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => setIsCreateDialogOpen(isOpen)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Crear Nuevo Grupo</DialogTitle>
					</DialogHeader>
					<CreateGroupForm onSubmit={handleCreateGroup} onCancel={() => setIsCreateDialogOpen(false)} />
				</DialogContent>
			</Dialog>
		</div>
	);
}
