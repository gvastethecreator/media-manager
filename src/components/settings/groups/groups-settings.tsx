'use client';

import { createGroup, deleteGroup, getGroups, updateGroup } from '@/app/actions/groups/group.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { toastService } from '@/services/toast';
import type { GroupWithStats } from '@/types/entities/group';
import { Prisma } from '@prisma/client';
import { FolderIcon, PlusIcon, SearchIcon, StarIcon, Trash } from 'lucide-react';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { CreateGroupForm } from './create-group-form';
import { GroupPreview } from './group-preview';

// Definir enum local para los criterios de ordenación
enum GroupSortCriteria {
	NAME_ASC = 'NAME_ASC',
	CATEGORY_ASC = 'CATEGORY_ASC',
	DATE_CREATED_DESC = 'DATE_CREATED_DESC',
}

const SORT_OPTIONS = [
	{ label: 'Nombre', value: GroupSortCriteria.NAME_ASC },
	{ label: 'Categoría', value: GroupSortCriteria.CATEGORY_ASC },
	{ label: 'Fecha', value: GroupSortCriteria.DATE_CREATED_DESC },
] as const;

type FilterKey = 'searchQuery' | 'onlyFavorites' | 'sortBy';

interface State {
	groups: GroupWithStats[];
	isLoading: boolean;
	error: string | null;
	selectedGroup: GroupWithStats | null;
	isCreateDialogOpen: boolean;
	isEditMode: boolean;
	searchQuery: string;
	selectedCategories: string[];
	onlyFavorites: boolean;
	sortBy: GroupSortCriteria;
}

type Action =
	| { type: 'LOAD_START' }
	| { type: 'LOAD_SUCCESS'; payload: GroupWithStats[] }
	| { type: 'LOAD_ERROR'; payload: string }
	| { type: 'SELECT_GROUP'; payload: GroupWithStats | null }
	| { type: 'SET_CREATE_DIALOG'; payload: boolean }
	| { type: 'SET_EDIT_MODE'; payload: boolean }
	| { type: 'SET_FILTER'; payload: { key: FilterKey; value: string | boolean | GroupSortCriteria } }
	| { type: 'ADD_GROUP'; payload: GroupWithStats }
	| { type: 'UPDATE_GROUP'; payload: GroupWithStats }
	| { type: 'REMOVE_GROUP'; payload: string };

const initialState: State = {
	groups: [],
	isLoading: true,
	error: null,
	selectedGroup: null,
	isCreateDialogOpen: false,
	isEditMode: false,
	searchQuery: '',
	selectedCategories: [],
	onlyFavorites: false,
	sortBy: GroupSortCriteria.NAME_ASC,
};

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case 'LOAD_START':
			return { ...state, isLoading: true, error: null };
		case 'LOAD_SUCCESS':
			return { ...state, isLoading: false, groups: action.payload };
		case 'LOAD_ERROR':
			return { ...state, isLoading: false, error: action.payload };
		case 'SELECT_GROUP':
			return { ...state, selectedGroup: action.payload, isEditMode: false };
		case 'SET_CREATE_DIALOG':
			return { ...state, isCreateDialogOpen: action.payload };
		case 'SET_EDIT_MODE':
			return { ...state, isEditMode: action.payload };
		case 'SET_FILTER':
			return { ...state, [action.payload.key]: action.payload.value };
		case 'ADD_GROUP':
			return { ...state, groups: [...state.groups, action.payload] };
		case 'UPDATE_GROUP':
			return {
				...state,
				groups: state.groups.map((g) => (g.id === action.payload.id ? action.payload : g)),
				selectedGroup: state.selectedGroup?.id === action.payload.id ? action.payload : state.selectedGroup,
			};
		case 'REMOVE_GROUP':
			return {
				...state,
				groups: state.groups.filter((g) => g.id !== action.payload),
				selectedGroup: state.selectedGroup?.id === action.payload ? null : state.selectedGroup,
			};
		default:
			return state;
	}
}

export function GroupsSettings() {
	const [state, dispatch] = useReducer(reducer, initialState);

	const loadGroups = useCallback(async () => {
		dispatch({ type: 'LOAD_START' });
		try {
			const data = await getGroups();
			if (!data) {
				throw new Error('Respuesta de servidor inválida');
			}
			dispatch({ type: 'LOAD_SUCCESS', payload: data });
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			dispatch({ type: 'LOAD_ERROR', payload: errorMessage });
			toastService.error('Error al cargar los grupos', { description: errorMessage });
		}
	}, []);

	useEffect(() => {
		loadGroups();
	}, [loadGroups]);

	const filteredGroups = useMemo(
		() =>
			state.groups.filter((group) => {
				const query = state.searchQuery.toLowerCase();
				const matchesQuery =
					!query ||
					group.name.toLowerCase().includes(query) ||
					group.description?.toLowerCase().includes(query) === true;

				const matchesCategory =
					state.selectedCategories.length === 0 ||
					(group.category && state.selectedCategories.includes(group.category));

				const matchesFavorites = !state.onlyFavorites || group.isFavorite;

				return matchesQuery && matchesCategory && matchesFavorites;
			}),
		[state.groups, state.searchQuery, state.selectedCategories, state.onlyFavorites]
	);

	const sortedGroups = useMemo(
		() =>
			[...filteredGroups].sort((a, b) => {
				switch (state.sortBy) {
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
		[filteredGroups, state.sortBy]
	);

	const stats = useMemo(() => {
		const totalElements = state.groups.reduce((acc, group) => acc + (group.stats?.totalItems ?? 0), 0);

		const emptyGroups = state.groups.filter((group) => (group.stats?.totalItems ?? 0) === 0).length;

		return {
			totalGroups: state.groups.length,
			totalElements,
			emptyGroups,
			favoriteGroups: state.groups.filter((group) => group.isFavorite).length,
		};
	}, [state.groups]);

	const handleCreateGroup = async (data: Prisma.GroupCreateInput) => {
		try {
			const newGroup = await createGroup(data);
			if (!newGroup) {
				throw new Error('Error al crear grupo: respuesta vacía');
			}
			dispatch({ type: 'ADD_GROUP', payload: newGroup });
			dispatch({ type: 'SET_CREATE_DIALOG', payload: false });
			toastService.success('Grupo creado correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al crear el grupo', { description: errorMessage });
		}
	};

	const handleUpdateGroup = async (id: string, data: Prisma.GroupUpdateInput) => {
		try {
			const updatedGroup = await updateGroup(id, data);
			if (!updatedGroup) {
				throw new Error('Error al actualizar grupo: respuesta vacía');
			}
			dispatch({ type: 'UPDATE_GROUP', payload: updatedGroup });
			dispatch({ type: 'SELECT_GROUP', payload: null });
			dispatch({ type: 'SET_EDIT_MODE', payload: false });
			toastService.success('Grupo actualizado correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al actualizar el grupo', { description: errorMessage });
		}
	};

	const handleDeleteGroup = async (id: string) => {
		try {
			await deleteGroup(id);
			dispatch({ type: 'REMOVE_GROUP', payload: id });
			toastService.success('Grupo eliminado correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al eliminar el grupo', { description: errorMessage });
		}
	};

	const setFilter = (key: FilterKey, value: string | boolean | GroupSortCriteria) => {
		dispatch({ type: 'SET_FILTER', payload: { key, value } });
	};

	return (
		<div className="grid grid-cols-12 gap-3">
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="space-y-1 py-2 px-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-xl font-bold">Grupos</CardTitle>
							<Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'SET_CREATE_DIALOG', payload: true })}>
								<PlusIcon className="h-4 w-4" />
							</Button>
						</div>
						<div className="flex gap-2">
							<div className="flex items-center gap-2 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors">
								<SearchIcon className="h-4 w-4 opacity-50" />
								<Input
									placeholder="Buscar grupos..."
									value={state.searchQuery}
									onChange={(e) => setFilter('searchQuery', e.target.value)}
									className="h-8 p-0 border-0 bg-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
								/>
							</div>
						</div>
						<div className="flex gap-2">
							<Select value={state.sortBy} onValueChange={(value: GroupSortCriteria) => setFilter('sortBy', value)}>
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
							<Toggle
								pressed={state.onlyFavorites}
								onPressedChange={(value) => setFilter('onlyFavorites', value)}
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
										variant={state.selectedGroup?.id === group.id ? 'secondary' : 'ghost'}
										className="w-full justify-start h-12 relative group/button"
										onClick={() => dispatch({ type: 'SELECT_GROUP', payload: group })}
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
										{group.isFavorite && <StarIcon className="h-3 w-3 absolute right-2 top-2" />}
										<Button
											variant="ghost"
											size="icon"
											className="absolute right-1 opacity-0 group-hover/button:opacity-100"
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
			{/* Panel derecho: Detalles o creación */}
			<div className="col-span-12 md:col-span-7 lg:col-span-8">
				{state.selectedGroup && !state.isEditMode ? (
					<GroupPreview
						group={state.selectedGroup}
						onEdit={() => dispatch({ type: 'SET_EDIT_MODE', payload: true })}
						onDelete={() => handleDeleteGroup(state.selectedGroup.id)}
						stats={stats}
					/>
				) : state.isEditMode && state.selectedGroup ? (
					<CreateGroupForm
						group={state.selectedGroup}
						onSubmit={(data) => handleUpdateGroup(state.selectedGroup.id, data)}
						onCancel={() => dispatch({ type: 'SET_EDIT_MODE', payload: false })}
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

			<Dialog
				open={state.isCreateDialogOpen}
				onOpenChange={(isOpen) => dispatch({ type: 'SET_CREATE_DIALOG', payload: isOpen })}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Crear Nuevo Grupo</DialogTitle>
					</DialogHeader>
					<CreateGroupForm
						onSubmit={handleCreateGroup}
						onCancel={() => dispatch({ type: 'SET_CREATE_DIALOG', payload: false })}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
