import { ChevronRight, FolderIcon, PlusIcon, SearchIcon, StarIcon, Trash, WandIcon } from 'lucide-react';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import {
	useCreateWildcard,
	useDeleteWildcard,
	useRootWildcards,
	useUpdateWildcard,
	useWildcards,
} from '@/lib/api/wildcards';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import type { WildcardCreateInput, WildcardUpdateInput, WildcardWithStats } from '@/types/entities/wildcard';
import { WildcardPreview } from './wildcard-preview';

// Importar el tipo de formulario que hemos definido
type CreateWildcardFormValues = {
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	children: string;
	parentId?: string | null;
	featuredImage?: string | null;
	isFavorite: boolean;
	sortBy?: string;
	viewMode?: string;
};

// Carga perezosa del formulario
const CreateWildcardForm = lazy(() =>
	import('./create-wildcard-form').then((mod) => ({ default: mod.CreateWildcardForm }))
);

interface WildcardWithRelations extends WildcardWithStats {
	parent?: WildcardWithStats | null;
	childWildcards?: WildcardWithRelations[];
	_count: WildcardWithStats['_count'] & {
		childWildcards: number;
	};
}

export function WildcardsSettings() {
	// React Query hooks
	const { data: allWildcards, isLoading: isLoadingWildcards, error: wildcardsError } = useWildcards();
	const { data: rootWildcards = [], isLoading: isLoadingRoots, error: rootsError } = useRootWildcards();
	const createWildcardMutation = useCreateWildcard();
	const updateWildcardMutation = useUpdateWildcard();
	const deleteWildcardMutation = useDeleteWildcard();

	// Estado local
	const [expandedWildcards, setExpandedWildcards] = useState<Record<string, boolean>>({});
	const [selectedWildcard, setSelectedWildcard] = useState<WildcardWithRelations | null>(null);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [currentParentId, setCurrentParentId] = useState<string | null>(null);
	const [breadcrumbs, setBreadcrumbs] = useState<WildcardWithStats[]>([]);

	// Filtros y ordenamiento
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategories, _setSelectedCategories] = useState<string[]>([]);
	const [onlyFavorites, setOnlyFavorites] = useState(false);
	const [showOnlyRoots, setShowOnlyRoots] = useState(true);
	const [sortBy, setSortBy] = useState<'name' | 'category' | 'createdAt'>('name');

	// Manejo de errores
	const isLoading = isLoadingWildcards || isLoadingRoots;
	const loadError = wildcardsError || rootsError;

	useEffect(() => {
		if (loadError) {
			const errorMessage = loadError instanceof Error ? loadError.message : 'Error desconocido';
			toastService.error('Error al cargar los comodines', {
				description: errorMessage,
			});
		}
	}, [loadError]);

	// Convertir los wildcards con las propiedades necesarias
	const wildcards = (allWildcards?.data || []) as WildcardWithRelations[];

	// Actualizar breadcrumbs cuando cambia el comodín seleccionado
	useEffect(() => {
		if (selectedWildcard?.parent) {
			// Construir breadcrumbs ascendiendo en la jerarquía
			const buildBreadcrumbs = () => {
				const breadcrumbPath: WildcardWithStats[] = [];
				let currentWildcard = selectedWildcard;

				while (currentWildcard.parent) {
					breadcrumbPath.unshift(currentWildcard.parent);
					const parentWildcard = wildcards.find((w) => w.id === currentWildcard.parent?.id);
					if (!parentWildcard) {
						break;
					}
					currentWildcard = parentWildcard;
				}

				setBreadcrumbs(breadcrumbPath);
			};

			buildBreadcrumbs();
		} else {
			setBreadcrumbs([]);
		}
	}, [selectedWildcard, wildcards]);

	// Función para expandir/colapsar un comodín
	const toggleExpand = (id: string) => {
		setExpandedWildcards((prev) => ({
			...prev,
			[id]: !prev[id],
		}));
	};

	// Función para cambiar el comodín padre actual (para filtrado)
	const changeParent = (parentId: string | null) => {
		setCurrentParentId(parentId);
		setSelectedWildcard(null);
	};

	// Función para navegar hacia arriba en la jerarquía
	const _navigateUp = () => {
		if (breadcrumbs.length > 0) {
			const parentIndex = breadcrumbs.length - 2;
			const parentId = parentIndex >= 0 ? breadcrumbs[parentIndex].id : null;
			changeParent(parentId);
		} else {
			changeParent(null);
		}
	};

	// Predicados de filtrado para reducir complejidad
	const normalizedQuery = searchQuery.trim().toLowerCase();
	const matchesHierarchy = (w: WildcardWithRelations) =>
		!showOnlyRoots || (currentParentId === null ? w.parentId === null : w.parentId === currentParentId);
	const matchesSearch = (w: WildcardWithRelations) => {
		if (!normalizedQuery) {
			return true;
		}
		const inName = w.name.toLowerCase().includes(normalizedQuery);
		const inDesc = w.description ? w.description.toLowerCase().includes(normalizedQuery) : false;
		return inName || inDesc;
	};
	const matchesCategory = (w: WildcardWithRelations) =>
		selectedCategories.length === 0 || (w.category ? selectedCategories.includes(w.category) : false);
	const matchesFavorite = (w: WildcardWithRelations) => {
		if (onlyFavorites) {
			return Boolean(w.isFavorite);
		}
		return true;
	};

	// Filtrar comodines basados en los criterios seleccionados
	const filteredWildcards = wildcards.filter(
		(w) => matchesHierarchy(w) && matchesSearch(w) && matchesCategory(w) && matchesFavorite(w)
	);

	// Ordenar comodines
	const sortedWildcards = [...filteredWildcards].sort((a, b) => {
		switch (sortBy) {
			case 'name':
				return a.name.localeCompare(b.name);
			case 'category':
				return (a.category || '').localeCompare(b.category || '');
			case 'createdAt':
				return b.createdAt.getTime() - a.createdAt.getTime();
			default:
				return 0;
		}
	});

	// Estadísticas
	const _stats = {
		totalWildcards: wildcards.length,
		rootWildcards: wildcards.filter((w) => !w.parentId).length,
		totalChildren: wildcards.filter((w) => w.parentId).length,
		totalValues: wildcards.reduce((acc, w) => {
			try {
				const children = w.children !== 'empty_array' && w.children ? JSON.parse(w.children).length : 0;
				return acc + children;
			} catch (_e) {
				return acc;
			}
		}, 0),
		favoriteWildcards: wildcards.filter((w) => w.isFavorite).length,
	};

	// Manejadores
	const handleCreateWildcard = async (data: CreateWildcardFormValues) => {
		try {
			// Convertir el formato del formulario al formato de la API
			const formattedData: WildcardCreateInput = {
				name: data.name,
				emoji: data.emoji,
				color: data.color,
				description: data.description,
				shortcut: data.shortcut,
				category: data.category,
				children: data.children, // Ya es string desde el formulario
				parentId: data.parentId,
				featuredImage: data.featuredImage,
				isFavorite: data.isFavorite,
			};

			await createWildcardMutation.mutateAsync(formattedData);
			setIsCreateDialogOpen(false);
			toastService.success('Comodín creado correctamente');
		} catch (err) {
			toastService.error('Error al crear el comodín');
		}
	};

	const handleUpdateWildcard = async (id: string, data: CreateWildcardFormValues) => {
		try {
			const formattedData: WildcardUpdateInput = {
				name: data.name,
				emoji: data.emoji,
				color: data.color,
				description: data.description,
				shortcut: data.shortcut,
				category: data.category,
				children: data.children, // Ya es string desde el formulario
				parentId: data.parentId,
				featuredImage: data.featuredImage,
				isFavorite: data.isFavorite,
			};

			await updateWildcardMutation.mutateAsync({ id, data: formattedData });
			setSelectedWildcard(null);
			setIsEditMode(false);
			toastService.success('Comodín actualizado correctamente');
		} catch (err) {
			toastService.error('Error al actualizar el comodín');
		}
	};

	const handleDeleteWildcard = async (id: string) => {
		try {
			await deleteWildcardMutation.mutateAsync(id);
			setSelectedWildcard(null);
			toastService.success('Comodín eliminado correctamente');
		} catch (err) {
			toastService.error('Error al eliminar el comodín');
		}
	};

	// Función para manejar clics en el botón de expansión
	const handleExpandClick = (event: React.MouseEvent<HTMLButtonElement>, wildcardId: string) => {
		event.stopPropagation();
		toggleExpand(wildcardId);
	};

	// Función para manejar clics en el botón de eliminar
	const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>, wildcardId: string) => {
		event.stopPropagation();
		handleDeleteWildcard(wildcardId);
	};

	// Renderizar elementos del árbol
	const renderWildcardItems = (wildcardsList: WildcardWithRelations[]) => {
		return wildcardsList.map((wildcard) => {
			const hasChildren = (wildcard._count?.childWildcards || 0) > 0;
			const isExpanded = expandedWildcards[wildcard.id];

			return (
				<div className="flex flex-col" key={wildcard.id}>
					<Button
						className="group relative h-12 w-full justify-start"
						onClick={() => setSelectedWildcard(wildcard)}
						variant={selectedWildcard?.id === wildcard.id ? 'secondary' : 'ghost'}
					>
						<div className="flex flex-1 items-center gap-2">
							{hasChildren && (
								<Button
									className="h-5 w-5 p-0"
									onClick={(event: React.MouseEvent<HTMLButtonElement>) => handleExpandClick(event, wildcard.id)}
									size="icon"
									variant="ghost"
								>
									<ChevronRight className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')} />
								</Button>
							)}
							<span aria-label="emoji" role="img">
								{wildcard.emoji}
							</span>
							<div className="flex flex-col items-start">
								<span className="font-medium">{wildcard.name}</span>
								{hasChildren && (
									<span className="text-xs opacity-50">{wildcard._count?.childWildcards} subcomodines</span>
								)}
							</div>
						</div>
						{wildcard.isFavorite && <StarIcon className="absolute top-2 right-8 h-3 w-3" />}
						<Button
							className="absolute right-1 opacity-0 group-hover:opacity-100"
							onClick={(event: React.MouseEvent<HTMLButtonElement>) => handleDeleteClick(event, wildcard.id)}
							size="icon"
							variant="ghost"
						>
							<Trash className="h-4 w-4" />
						</Button>
					</Button>

					{/* Mostrar hijos si está expandido */}
					{isExpanded && wildcard.childWildcards && wildcard.childWildcards.length > 0 && (
						<div className="mt-1 ml-2 border-muted border-l-2 border-dotted pl-6">
							{renderWildcardItems(wildcard.childWildcards as WildcardWithRelations[])}
						</div>
					)}
				</div>
			);
		});
	};

	// Ruta de navegación (breadcrumbs)
	const renderBreadcrumbs = () => {
		if (currentParentId === null) {
			return null;
		}

		// Encontrar el comodín actual
		const currentWildcard = wildcards.find((w) => w.id === currentParentId);
		if (!currentWildcard) {
			return null;
		}

		return (
			<div className="mb-2 flex items-center gap-1 text-muted-foreground text-sm">
				<Button className="h-6 px-2" onClick={() => changeParent(null)} size="sm" variant="ghost">
					Raíz
				</Button>
				{breadcrumbs.map((crumb, _index) => (
					<div className="flex items-center" key={crumb.id}>
						<ChevronRight className="mx-1 h-3 w-3" />
						<Button className="h-6 px-2" onClick={() => changeParent(crumb.id)} size="sm" variant="ghost">
							{crumb.name}
						</Button>
					</div>
				))}
				{currentWildcard && (
					<>
						<ChevronRight className="mx-1 h-3 w-3" />
						<span className="font-medium">{currentWildcard.name}</span>
					</>
				)}
			</div>
		);
	};

	return (
		<div className="grid grid-cols-12 gap-3">
			{/* Panel izquierdo: Lista jerárquica de comodines */}
			<div className="col-span-12 md:col-span-5 lg:col-span-4">
				<Card className="flex h-[calc(100vh-8rem)] flex-col rounded-dt-md border-none bg-muted/30 shadow-sm">
					<CardHeader className="space-y-1 px-3 py-2">
						<div className="flex items-center justify-between">
							<CardTitle className="text-heading-lg">Comodines</CardTitle>
							<Button onClick={() => setIsCreateDialogOpen(true)} size="sm" variant="ghost">
								<PlusIcon className="h-4 w-4" />
							</Button>
						</div>

						{renderBreadcrumbs()}

						<div className="flex gap-2">
							<div className="relative w-full">
								<SearchIcon className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
								<Input
									className="h-8 pl-8"
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Buscar comodines..."
									value={searchQuery}
								/>
							</div>
						</div>
						<div className="flex gap-2">
							<Select onValueChange={(value) => setSortBy(value as typeof sortBy)} value={sortBy}>
								<SelectTrigger className="h-8">
									<SelectValue placeholder="Ordenar por..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="name">Nombre</SelectItem>
									<SelectItem value="category">Categoría</SelectItem>
									<SelectItem value="createdAt">Fecha</SelectItem>
								</SelectContent>
							</Select>
							<Toggle onPressedChange={setOnlyFavorites} pressed={onlyFavorites} size="sm">
								<StarIcon className="h-4 w-4" />
							</Toggle>
							<Toggle
								onPressedChange={setShowOnlyRoots}
								pressed={showOnlyRoots}
								size="sm"
								title="Mostrar sólo nivel actual"
							>
								<FolderIcon className="h-4 w-4" />
							</Toggle>
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full">
							<div className="space-y-1 p-2">
								{sortedWildcards.length > 0 ? (
									renderWildcardItems(sortedWildcards)
								) : (
									<div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
										<WandIcon className="mb-2 h-10 w-10 opacity-30" />
										<p className="text-sm">No hay comodines disponibles</p>
										{(searchQuery || onlyFavorites || selectedCategories.length > 0) && (
											<p className="mt-1 text-xs">Intenta ajustar los filtros</p>
										)}
									</div>
								)}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			{/* Panel derecho: Formulario y Preview */}
			<div className="col-span-12 md:col-span-7 lg:col-span-8">
				<Card className="flex h-[calc(100vh-8rem)] flex-col rounded-dt-md border-none bg-muted/30 shadow-sm">
					{selectedWildcard ? (
						isEditMode ? (
							<Dialog onOpenChange={setIsEditMode} open={isEditMode}>
								<DialogContent className="max-w-3xl overflow-hidden p-0">
									<Suspense fallback={<div className="p-8">Cargando formulario…</div>}>
										<CreateWildcardForm
											onCancel={() => setIsEditMode(false)}
											onSubmit={(data) => handleUpdateWildcard(selectedWildcard.id, data)}
											parentWildcards={wildcards}
											wildcard={selectedWildcard}
										/>
									</Suspense>
								</DialogContent>
							</Dialog>
						) : (
							<WildcardPreview
								onDelete={() => handleDeleteWildcard(selectedWildcard.id)}
								onEdit={() => setIsEditMode(true)}
								wildcard={selectedWildcard}
							/>
						)
					) : (
						<div className="flex h-full flex-col items-center justify-center">
							<WandIcon className="h-12 w-12 opacity-20" />
							<p className="mt-2 text-sm opacity-50">Selecciona un comodín para ver sus detalles</p>
						</div>
					)}
				</Card>
			</div>

			{/* Dialog para crear nuevo comodín */}
			<Dialog onOpenChange={setIsCreateDialogOpen} open={isCreateDialogOpen}>
				<DialogContent className="max-w-3xl overflow-hidden p-0">
					<Suspense fallback={<div className="p-8">Cargando formulario…</div>}>
						<CreateWildcardForm
							onCancel={() => setIsCreateDialogOpen(false)}
							onSubmit={handleCreateWildcard}
							parentWildcards={wildcards}
							wildcard={undefined}
						/>
					</Suspense>
				</DialogContent>
			</Dialog>
		</div>
	);
}
