import { FolderIcon, PlusIcon, SearchIcon, StarIcon, Trash } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { PageState } from '@/components/ui/page-state';
import { useCreateGroup, useDeleteGroup, useGroups, useUpdateGroup } from '@/lib/api/groups';
import { toastService } from '@/lib/ui/toast';
import type { CreateGroupInput, GroupWithStats, UpdateGroupInput } from '@/types/entities/group';
import { GroupSortCriteria } from '@/types/entities/group';
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
			const groupStats = group.stats;
			if (!groupStats) {
				return acc;
			}
			return (
				acc +
				groupStats.imageCount +
				groupStats.videoCount +
				groupStats.albumCount +
				groupStats.collectionCount +
				groupStats.tagCount +
				groupStats.characterCount +
				groupStats.placeCount +
				groupStats.worldItemCount +
				groupStats.conceptCount +
				groupStats.promptCount +
				groupStats.noteCount +
				groupStats.wildcardCount +
				groupStats.propertyCount
			);
		}, 0);

		const emptyGroups = groups.filter((group) => {
			const groupStats = group.stats;
			if (!groupStats) {
				return true;
			}
			return (
				groupStats.imageCount +
				groupStats.videoCount +
				groupStats.albumCount +
				groupStats.collectionCount +
				groupStats.tagCount +
				groupStats.characterCount +
				groupStats.placeCount +
				groupStats.worldItemCount +
				groupStats.conceptCount +
				groupStats.promptCount +
				groupStats.noteCount +
				groupStats.wildcardCount +
				groupStats.propertyCount ===
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

	const handleCreateGroup = async (data: CreateGroupInput) => {
		try {
			await createGroupMutation.mutateAsync(data);
			setIsCreateDialogOpen(false);
			toastService.success('Grupo creado correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al crear el grupo', { description: errorMessage });
		}
	};

	const handleUpdateGroup = async (id: string, data: UpdateGroupInput) => {
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
		return <PageState mode="loading" title="Cargando grupos..." />;
	}

	// Mostrar error state
	if (error) {
		return (
			<PageState
				description={error instanceof Error ? error.message : 'Error desconocido'}
				mode="error"
				title="Error al cargar los grupos"
			/>
		);
	}

	return (
		<div className="grid grid-cols-12 gap-3">
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="flex h-[calc(100vh-8rem)] flex-col rounded-dt-md border-none bg-muted/30 shadow-sm">
					<CardHeader className="space-y-1 px-3 py-2">
						<div className="flex items-center justify-between">
							<CardTitle className="text-heading-lg">Grupos</CardTitle>
							<Button onClick={() => setIsCreateDialogOpen(true)} size="sm" variant="ghost">
								<PlusIcon className="h-4 w-4" />
							</Button>
						</div>
						<div className="flex gap-2">
							<div className="flex w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors">
								<SearchIcon className="h-4 w-4 opacity-50" />
								<Input
									className="h-8 border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Buscar grupos..."
									value={searchQuery}
								/>
							</div>
						</div>
						<div className="flex gap-2">
							<Select onValueChange={(value: GroupSortCriteria) => setSortBy(value)} value={sortBy}>
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
							<Toggle onPressedChange={(value) => setOnlyFavorites(value)} pressed={onlyFavorites} size="sm">
								<StarIcon className="h-4 w-4" />
							</Toggle>
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full">
							<div className="space-y-1 p-2">
								{sortedGroups.map((group) => (
									<div
										className={`group/item relative rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${selectedGroup?.id === group.id ? 'bg-secondary text-secondary-foreground' : ''
											}`}
										key={group.id}
									>
										<Button
											className="relative h-12 w-full justify-start"
											onClick={() => setSelectedGroup(group)}
											variant="ghost"
										>
											<div className="flex items-center gap-2">
												<span aria-label="emoji" role="img">
													{group.emoji}
												</span>
												<div className="flex flex-col items-start">
													<span className="font-medium">{group.name}</span>
													<span className="text-xs opacity-50">
														{group.stats ? group.stats.imageCount + group.stats.videoCount : 0} elementos
													</span>
												</div>
											</div>
											{group.isFavorite && <StarIcon className="absolute top-2 right-8 h-3 w-3" />}
										</Button>
										<Button
											className="absolute top-1 right-1 h-10 w-10 opacity-0 group-hover/item:opacity-100"
											onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
												e.stopPropagation();
												handleDeleteGroup(group.id);
											}}
											size="icon"
											variant="ghost"
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
						onDelete={() => handleDeleteGroup(selectedGroup.id)}
						onEdit={() => setIsEditMode(true)}
						stats={stats}
					/>
				) : isEditMode && selectedGroup ? (
					<CreateGroupForm
						group={selectedGroup}
						onCancel={() => setIsEditMode(false)}
						onSubmit={(data) => handleUpdateGroup(selectedGroup.id, data)}
					/>
				) : (
					<Card className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center rounded-dt-md border-none bg-muted/30 shadow-sm">
						<div className="text-center">
							<FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
							<h3 className="mt-2 font-medium text-foreground text-heading-sm">Selecciona un grupo</h3>
							<p className="mt-1 text-caption text-muted-foreground">O crea uno nuevo para empezar a organizarte</p>
						</div>
					</Card>
				)}
			</div>

			<Dialog onOpenChange={(isOpen) => setIsCreateDialogOpen(isOpen)} open={isCreateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Crear Nuevo Grupo</DialogTitle>
					</DialogHeader>
					<CreateGroupForm onCancel={() => setIsCreateDialogOpen(false)} onSubmit={handleCreateGroup} />
				</DialogContent>
			</Dialog>
		</div>
	);
}
