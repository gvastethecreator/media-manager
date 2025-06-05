'use client';

import {
	createWildcard,
	deleteWildcard,
	getRootWildcards,
	getWildcards,
	updateWildcard,
} from '@/app/actions/wildcards/wildcard.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import toastService from '@/services/toast.service';
import type { Wildcard } from '@prisma/client';
import { ChevronRight, FolderIcon, PlusIcon, SearchIcon, StarIcon, Trash, WandIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { WildcardPreview } from './wildcard-preview';

// Importar el tipo de formulario que hemos definido
type CreateWildcardFormValues = {
	name: string;
	emoji: string;
	color: string;
	description?: string;
	shortcut?: string;
	category: string;
	children: string[];
	parentId?: string | null;
	featuredImage?: string;
	isFavorite: boolean;
};

// Importación dinámica para evitar problemas con SSR
const CreateWildcardForm = dynamic(() => import('./create-wildcard-form').then((mod) => mod.CreateWildcardForm), {
	ssr: false,
});

interface WildcardWithRelations extends Omit<Wildcard, 'children'> {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string | null;
	children: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	parentId: string | null;
	parent?: Wildcard | null;
	childWildcards?: WildcardWithRelations[];
	_count?: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		properties: number;
		childWildcards: number;
	};
}

export function WildcardsSettings() {
	const [wildcards, setWildcards] = useState<WildcardWithRelations[]>([]);
	const [rootWildcards, setRootWildcards] = useState<Wildcard[]>([]);
	const [expandedWildcards, setExpandedWildcards] = useState<Record<string, boolean>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedWildcard, setSelectedWildcard] = useState<WildcardWithRelations | null>(null);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [currentParentId, setCurrentParentId] = useState<string | null>(null);
	const [breadcrumbs, setBreadcrumbs] = useState<Wildcard[]>([]);

	// Filtros y ordenamiento
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [onlyFavorites, setOnlyFavorites] = useState(false);
	const [showOnlyRoots, setShowOnlyRoots] = useState(true);
	const [sortBy, setSortBy] = useState<'name' | 'category' | 'createdAt'>('name');

	// Cargar comodines
	const loadWildcards = useCallback(async () => {
		try {
			setIsLoading(true);
			const [allWildcards, rootWildcardsList] = await Promise.all([getWildcards(), getRootWildcards()]);

			// Convertir y extender los wildcards con las propiedades necesarias
			const extendedWildcards = allWildcards.map((wildcard) => ({
				...wildcard,
				_count: {
					...wildcard._count,
					albums: 0,
					collections: 0,
					tags: 0,
					characters: 0,
					places: 0,
					worldItems: 0,
					concepts: 0,
					prompts: 0,
					notes: 0,
					properties: 0,
				},
			})) as WildcardWithRelations[];

			setWildcards(extendedWildcards);
			setRootWildcards(rootWildcardsList);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			setError(errorMessage);
			toastService.error('Error al cargar los comodines', {
				description: errorMessage,
			});
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadWildcards();
	}, [loadWildcards]);

	// Actualizar breadcrumbs cuando cambia el comodín seleccionado
	useEffect(() => {
		if (selectedWildcard?.parent) {
			// Construir breadcrumbs ascendiendo en la jerarquía
			const buildBreadcrumbs = async () => {
				const breadcrumbPath: Wildcard[] = [];
				let currentWildcard = selectedWildcard;

				while (currentWildcard.parent) {
					breadcrumbPath.unshift(currentWildcard.parent);
					const parentWildcard = wildcards.find((w) => w.id === currentWildcard.parent?.id);
					if (!parentWildcard) break;
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
	const navigateUp = () => {
		if (breadcrumbs.length > 0) {
			const parentIndex = breadcrumbs.length - 2;
			const parentId = parentIndex >= 0 ? breadcrumbs[parentIndex].id : null;
			changeParent(parentId);
		} else {
			changeParent(null);
		}
	};

	// Filtrar comodines basados en los criterios seleccionados
	const filteredWildcards = wildcards.filter((wildcard) => {
		let matches = true;

		// Filtrado por jerarquía si showOnlyRoots está activado
		if (showOnlyRoots) {
			matches =
				matches && (currentParentId === null ? wildcard.parentId === null : wildcard.parentId === currentParentId);
		}

		// Filtrado por búsqueda
		if (searchQuery) {
			const normalizedQuery = searchQuery.toLowerCase();
			matches =
				matches &&
				(wildcard.name.toLowerCase().includes(normalizedQuery) ||
					wildcard.description?.toLowerCase().includes(normalizedQuery) ||
					false);
		}

		// Filtrado por categoría
		if (selectedCategories.length > 0) {
			matches = matches && (wildcard.category ? selectedCategories.includes(wildcard.category) : false);
		}

		// Filtrado por favoritos
		if (onlyFavorites) {
			matches = matches && wildcard.isFavorite;
		}

		return matches;
	});

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
	const stats = {
		totalWildcards: wildcards.length,
		rootWildcards: wildcards.filter((w) => !w.parentId).length,
		totalChildren: wildcards.filter((w) => w.parentId).length,
		totalValues: wildcards.reduce((acc, w) => {
			try {
				const children = w.children !== 'empty_array' ? JSON.parse(w.children).length : 0;
				return acc + children;
			} catch (e) {
				return acc;
			}
		}, 0),
		favoriteWildcards: wildcards.filter((w) => w.isFavorite).length,
	};

	// Manejadores
	const handleCreateWildcard = async (data: CreateWildcardFormValues) => {
		try {
			// Si estamos dentro de un grupo, establecer parentId
			if (currentParentId && !data.parentId) {
				data.parentId = currentParentId;
			}

			// Formateamos children como string JSON para la API
			const formattedData = {
				...data,
				children: JSON.stringify(data.children),
			};

			const newWildcard = await createWildcard(formattedData);
			await loadWildcards(); // Recargar para actualizar jerarquías
			setIsCreateDialogOpen(false);
			toastService.success('Comodín creado correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al crear el comodín', {
				description: errorMessage,
			});
		}
	};

	const handleUpdateWildcard = async (id: string, data: CreateWildcardFormValues) => {
		try {
			// Formateamos children como string JSON para la API
			const formattedData = {
				...data,
				children: JSON.stringify(data.children),
			};

			await updateWildcard(id, formattedData);
			await loadWildcards(); // Recargar para actualizar jerarquías
			setSelectedWildcard(null);
			setIsEditMode(false);
			toastService.success('Comodín actualizado correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al actualizar el comodín', {
				description: errorMessage,
			});
		}
	};

	const handleDeleteWildcard = async (id: string) => {
		try {
			await deleteWildcard(id);
			await loadWildcards(); // Recargar para actualizar jerarquías
			setSelectedWildcard(null);
			toastService.success('Comodín eliminado correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			toastService.error('Error al eliminar el comodín', {
				description: errorMessage,
			});
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
			const isExpanded = expandedWildcards[wildcard.id] || false;

			return (
				<div key={wildcard.id} className="flex flex-col">
					<Button
						variant={selectedWildcard?.id === wildcard.id ? 'secondary' : 'ghost'}
						className="w-full justify-start h-12 relative group"
						onClick={() => setSelectedWildcard(wildcard)}
					>
						<div className="flex items-center gap-2 flex-1">
							{hasChildren && (
								<Button
									variant="ghost"
									size="icon"
									className="h-5 w-5 p-0"
									onClick={(event: React.MouseEvent<HTMLButtonElement>) => handleExpandClick(event, wildcard.id)}
								>
									<ChevronRight className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')} />
								</Button>
							)}
							<span role="img" aria-label="emoji">
								{wildcard.emoji}
							</span>
							<div className="flex flex-col items-start">
								<span className="font-medium">{wildcard.name}</span>
								{hasChildren && (
									<span className="text-xs opacity-50">{wildcard._count?.childWildcards} subcomodines</span>
								)}
							</div>
						</div>
						{wildcard.isFavorite && <StarIcon className="h-3 w-3 absolute right-8 top-2" />}
						<Button
							variant="ghost"
							size="icon"
							className="absolute right-1 opacity-0 group-hover:opacity-100"
							onClick={(event: React.MouseEvent<HTMLButtonElement>) => handleDeleteClick(event, wildcard.id)}
						>
							<Trash className="h-4 w-4" />
						</Button>
					</Button>

					{/* Mostrar hijos si está expandido */}
					{isExpanded && wildcard.childWildcards && wildcard.childWildcards.length > 0 && (
						<div className="pl-6 mt-1 border-l-2 border-dotted border-muted ml-2">
							{renderWildcardItems(wildcard.childWildcards as WildcardWithRelations[])}
						</div>
					)}
				</div>
			);
		});
	};

	// Ruta de navegación (breadcrumbs)
	const renderBreadcrumbs = () => {
		if (currentParentId === null) return null;

		// Encontrar el comodín actual
		const currentWildcard = wildcards.find((w) => w.id === currentParentId);
		if (!currentWildcard) return null;

		return (
			<div className="flex items-center gap-1 mb-2 text-sm text-muted-foreground">
				<Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => changeParent(null)}>
					Raíz
				</Button>
				{breadcrumbs.map((crumb, index) => (
					<div key={crumb.id} className="flex items-center">
						<ChevronRight className="h-3 w-3 mx-1" />
						<Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => changeParent(crumb.id)}>
							{crumb.name}
						</Button>
					</div>
				))}
				{currentWildcard && (
					<>
						<ChevronRight className="h-3 w-3 mx-1" />
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
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					<CardHeader className="space-y-1 py-2 px-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-xl font-bold">Comodines</CardTitle>
							<Button size="sm" variant="ghost" onClick={() => setIsCreateDialogOpen(true)}>
								<PlusIcon className="h-4 w-4" />
							</Button>
						</div>

						{renderBreadcrumbs()}

						<div className="flex gap-2">
							<div className="relative w-full">
								<SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Buscar comodines..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-8 pl-8"
								/>
							</div>
						</div>
						<div className="flex gap-2">
							<Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
								<SelectTrigger className="h-8">
									<SelectValue placeholder="Ordenar por..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="name">Nombre</SelectItem>
									<SelectItem value="category">Categoría</SelectItem>
									<SelectItem value="createdAt">Fecha</SelectItem>
								</SelectContent>
							</Select>
							<Toggle pressed={onlyFavorites} onPressedChange={setOnlyFavorites} size="sm">
								<StarIcon className="h-4 w-4" />
							</Toggle>
							<Toggle
								pressed={showOnlyRoots}
								onPressedChange={setShowOnlyRoots}
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
										<WandIcon className="h-10 w-10 mb-2 opacity-30" />
										<p className="text-sm">No hay comodines disponibles</p>
										{(searchQuery || onlyFavorites || selectedCategories.length > 0) && (
											<p className="text-xs mt-1">Intenta ajustar los filtros</p>
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
				<Card className="rounded-sm bg-muted/30 border-none h-[calc(100vh-8rem)] flex flex-col">
					{selectedWildcard ? (
						isEditMode ? (
							<CreateWildcardForm
								wildcard={selectedWildcard}
								parentWildcards={wildcards.filter((w) => w.id !== selectedWildcard.id)}
								onSubmit={(data) => handleUpdateWildcard(selectedWildcard.id, data)}
								onCancel={() => setIsEditMode(false)}
							/>
						) : (
							<WildcardPreview
								wildcard={selectedWildcard}
								onEdit={() => setIsEditMode(true)}
								onDelete={() => handleDeleteWildcard(selectedWildcard.id)}
							/>
						)
					) : (
						<div className="flex flex-col items-center justify-center h-full">
							<WandIcon className="h-12 w-12 opacity-20" />
							<p className="text-sm opacity-50 mt-2">Selecciona un comodín para ver sus detalles</p>
						</div>
					)}
				</Card>
			</div>

			{/* Dialog para crear nuevo comodín */}
			<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
				<DialogContent>
					<CreateWildcardForm
						parentWildcards={wildcards}
						onSubmit={handleCreateWildcard}
						onCancel={() => setIsCreateDialogOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
