import React from 'react';
/**
 * @component EntityList
 * @description Un componente avanzado para visualizar listas de entidades con funcionalidades de
 * búsqueda, filtrado, ordenación, cambio de vista, selección múltiple y paginación.
 * Puede ser utilizado para mostrar cualquier tipo de entidad que implemente la interfaz EntityItem.
 *
 * @author Tu equipo de desarrollo
 * @version 1.0.0
 * @example
 * ```tsx
 * <EntityList
 *   items={properties}
 *   title="Propiedades"
 *   description="Lista de propiedades del sistema"
 *   onItemClick={(id) => handlePropertyClick(id)}
 *   categoryFilters={['Armas', 'Objetos', 'Habilidades']}
 * />
 * ```
 */

import { ChevronLeft, ChevronRight, LayoutGrid, List as ListIcon, Rows, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EntityCard, type EntityCardProps } from '@/components/cards/entity-card';
import type { BaseCardProps } from '@/components/cards/types/card-layout.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from '@/components/ui/motion-shim';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/entities';
import { Badge } from './badge';

export type EntityItem = Omit<BaseCardProps, 'onClick' | 'href'> & {
	id: string;
	onClick?: (id: string) => void;
	href?: string;
	searchableText?: string;
	tags?: string[];
	createdAt?: Date;
	updatedAt?: Date;
	category?: string;
	sortValue?: string | number;
	title: string;
	description?: string;
	subtitle?: string;
};

export interface EntityListProps {
	/**
	 * Lista de entidades para mostrar
	 */
	items: EntityItem[];

	/**
	 * Título de la lista
	 */
	title?: string;

	/**
	 * Descripción de la lista
	 */
	description?: string;

	/**
	 * Elemento a mostrar cuando no hay ítems
	 */
	emptyState?: React.ReactNode;

	/**
	 * Tipo de vista (grid, list, compact)
	 */
	viewType?: 'grid' | 'list' | 'compact';

	/**
	 * Permitir cambiar el tipo de vista
	 */
	allowViewChange?: boolean;

	/**
	 * Mostrar la barra de búsqueda
	 */
	showSearch?: boolean;

	/**
	 * Mostrar los filtros
	 */
	showFilters?: boolean;

	/**
	 * Permitir seleccionar ítems (múltiples)
	 */
	allowSelection?: boolean;

	/**
	 * Función llamada cuando se seleccionan ítems
	 */
	onSelectionChange?: (selectedIds: string[]) => void;

	/**
	 * Texto del input de búsqueda
	 */
	searchPlaceholder?: string;

	/**
	 * Mostrar paginación
	 */
	pagination?: boolean;

	/**
	 * Número de ítems por página
	 */
	itemsPerPage?: number;

	/**
	 * Tipos de ordenación disponibles
	 */
	sortOptions?: Array<{
		label: string;
		value: string;
		sortFn?: (a: EntityItem, b: EntityItem) => number;
	}>;

	/**
	 * Filtros disponibles por categoría
	 */
	categoryFilters?: string[];

	/**
	 * Filtros disponibles por etiquetas
	 */
	tagFilters?: string[];

	/**
	 * Clases adicionales para el contenedor
	 */
	className?: string;

	/**
	 * Función llamada al hacer clic en item (reemplaza onClick del item)
	 */
	onItemClick?: (id: string) => void;

	/**
	 * Función llamada al hacer doble clic en item
	 */
	onItemDoubleClick?: (id: string) => void;

	/**
	 * Modo TCG para las tarjetas
	 */
	tcgMode?: boolean;
}

/**
 * Componente para mostrar una lista de entidades con funcionalidades de búsqueda,
 * filtrado, ordenación y cambio de vista.
 */
export function EntityList({
	items = [],
	title = 'Entidades',
	description,
	emptyState,
	viewType: initialViewType = 'grid',
	allowViewChange = true,
	showSearch = true,
	showFilters = true,
	allowSelection = false,
	onSelectionChange,
	searchPlaceholder = 'Buscar...',
	pagination = true,
	itemsPerPage = 9,
	sortOptions = [
		{ label: 'Nombre', value: 'name' },
		{ label: 'Más recientes', value: 'recent' },
		{ label: 'Más antiguos', value: 'oldest' },
	],
	categoryFilters = [],
	tagFilters = [],
	className,
	onItemClick,
	onItemDoubleClick,
	tcgMode = false,
}: EntityListProps) {
	// Estados para la UI
	const [viewType, setViewType] = useState<'grid' | 'list' | 'compact'>(initialViewType);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
	const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
	const [selectedSort, setSelectedSort] = useState(sortOptions[0]?.value || 'name');
	const [showFiltersPanel, setShowFiltersPanel] = useState(false);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [currentPage, setCurrentPage] = useState(1);

	// Filtrar y ordenar los items
	const filteredItems = useMemo(() => {
		let result = [...items];

		// Aplicar búsqueda por texto
		if (searchTerm) {
			const searchLower = searchTerm.toLowerCase();
			result = result.filter(
				(item) =>
					item.title.toLowerCase().includes(searchLower) ||
					item.description?.toLowerCase().includes(searchLower) ||
					item.searchableText?.toLowerCase().includes(searchLower) ||
					item.subtitle?.toLowerCase().includes(searchLower)
			);
		}

		// Aplicar filtro por categoría
		if (selectedCategoryFilter !== 'all') {
			result = result.filter((item) => item.category === selectedCategoryFilter);
		}

		// Aplicar filtro por etiqueta
		if (selectedTagFilter !== 'all') {
			result = result.filter((item) => item.tags?.includes(selectedTagFilter));
		}

		// Aplicar ordenación
		const currentSortOption = sortOptions.find((opt) => opt.value === selectedSort);
		if (currentSortOption?.sortFn) {
			result.sort(currentSortOption.sortFn);
		} else {
			switch (selectedSort) {
				case 'name':
					result.sort((a, b) => a.title.localeCompare(b.title));
					break;
				case 'recent':
					result.sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
					break;
				case 'oldest':
					result.sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
					break;
				default:
					// Ordenar por el campo sortValue si existe
					result.sort((a, b) => {
						if (a.sortValue !== undefined && b.sortValue !== undefined) {
							return a.sortValue < b.sortValue ? -1 : 1;
						}
						return 0;
					});
			}
		}

		return result;
	}, [items, searchTerm, selectedCategoryFilter, selectedTagFilter, selectedSort, sortOptions]);

	// Calcular paginación
	const totalPages = pagination ? Math.ceil(filteredItems.length / itemsPerPage) : 1;

	// Items para la página actual
	const paginatedItems = useMemo(() => {
		if (!pagination) {
			return filteredItems;
		}

		const startIndex = (currentPage - 1) * itemsPerPage;
		return filteredItems.slice(startIndex, startIndex + itemsPerPage);
	}, [filteredItems, currentPage, itemsPerPage, pagination]);

	// Manejar cambio de página
	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages) {
			setCurrentPage(newPage);
		}
	};

	// Manejar selección de items
	const toggleItemSelection = (id: string) => {
		if (allowSelection) {
			setSelectedIds((prev) => {
				const newSelection = prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id];

				// Notificar cambio si hay callback
				if (onSelectionChange) {
					onSelectionChange(newSelection);
				}

				return newSelection;
			});
		}
	};

	// Limpiar selección
	const clearSelection = () => {
		setSelectedIds([]);
		if (onSelectionChange) {
			onSelectionChange([]);
		}
	};

	// Manejar clic en item
	const handleItemClick = (id: string) => {
		if (allowSelection) {
			toggleItemSelection(id);
		} else if (onItemClick) {
			onItemClick(id);
		}
	};

	// Renderizar el grid de items
	const renderGrid = () => {
		if (paginatedItems.length === 0) {
			return (
				emptyState || (
					<div className="flex w-full flex-col items-center justify-center py-12 text-center">
						<div className="mb-4 rounded-full bg-muted p-3">
							<Search className="h-6 w-6 text-muted-foreground" />
						</div>
						<h3 className="font-medium text-lg">No se encontraron elementos</h3>
						<p className="mt-1 text-muted-foreground text-sm">Intenta ajustar tus filtros o búsqueda</p>
					</div>
				)
			);
		}

		return (
			<div
				className={cn(
					'grid gap-4',
					viewType === 'grid' && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
					viewType === 'list' && 'grid-cols-1',
					viewType === 'compact' && 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
				)}
			>
				{paginatedItems.map((item) => {
					const isSelected = selectedIds.includes(item.id);

					// Props comunes para el EntityCard
					const cardProps: EntityCardProps = {
						entity: item as AnyEntityWithStats,
						onClick: () => handleItemClick(item.id),
						className: cn(isSelected && allowSelection && 'ring-2 ring-primary', item.className),
						compact: viewType === 'compact',
						tcgMode,
						isSelected,
						onDoubleClick: onItemDoubleClick ? () => onItemDoubleClick(item.id) : undefined,
					};

					// Si el item tiene href y no estamos en modo selección, manejarlo en el onClick
					if (item.href && !allowSelection) {
						cardProps.onClick = () => {
							if (item.href) {
								window.open(item.href, '_blank');
							}
						};
					}

					return (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="relative"
							exit={{ opacity: 0, scale: 0.9 }}
							initial={{ opacity: 0, y: 10 }}
							key={item.id}
						>
							<EntityCard {...cardProps} />

							{/* Indicador de selección */}
							{isSelected && allowSelection && (
								<div className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
									<span className="text-xs">✓</span>
								</div>
							)}
						</motion.div>
					);
				})}
			</div>
		);
	};

	// Estructura del componente
	return (
		<div className={cn('w-full space-y-4', className)}>
			{/* Encabezado con título y acciones */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-bold text-2xl">{title}</h2>
					{description && <p className="text-muted-foreground">{description}</p>}
				</div>

				{/* Opciones de visualización */}
				{allowViewChange && (
					<div className="flex items-center">
						<div className="flex rounded-md border bg-background p-1">
							<Button
								className="h-8 px-2"
								onClick={() => setViewType('grid')}
								size="sm"
								variant={viewType === 'grid' ? 'default' : 'ghost'}
							>
								<LayoutGrid className="h-4 w-4" />
							</Button>
							<Button
								className="h-8 px-2"
								onClick={() => setViewType('list')}
								size="sm"
								variant={viewType === 'list' ? 'default' : 'ghost'}
							>
								<ListIcon className="h-4 w-4" />
							</Button>
							<Button
								className="h-8 px-2"
								onClick={() => setViewType('compact')}
								size="sm"
								variant={viewType === 'compact' ? 'default' : 'ghost'}
							>
								<Rows className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Barra de búsqueda y filtros */}
			<div className="flex flex-col gap-4 sm:flex-row">
				{showSearch && (
					<div className="relative flex-1">
						<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							className="pl-8"
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder={searchPlaceholder}
							type="search"
							value={searchTerm}
						/>
					</div>
				)}

				{showFilters && (
					<div className="flex items-center gap-2">
						{/* Selector de ordenación */}
						<Select onValueChange={setSelectedSort} value={selectedSort}>
							<SelectTrigger className="w-[140px]">
								<SelectValue placeholder="Ordenar por" />
							</SelectTrigger>
							<SelectContent>
								{sortOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Botón para mostrar filtros adicionales */}
						<Button
							aria-label="Mostrar filtros"
							onClick={() => setShowFiltersPanel(!showFiltersPanel)}
							size="icon"
							variant={showFiltersPanel ? 'default' : 'outline'}
						>
							<SlidersHorizontal className="h-4 w-4" />
						</Button>
					</div>
				)}
			</div>

			{/* Panel de filtros expandible */}
			{showFiltersPanel && showFilters && (
				<div className="grid grid-cols-1 gap-4 rounded-md bg-muted/40 p-4 sm:grid-cols-2">
					{/* Filtros de categoría */}
					{categoryFilters.length > 0 && (
						<div>
							<h4 className="mb-2 font-medium text-sm">Categorías</h4>
							<div className="flex flex-wrap gap-2">
								<Badge
									className="cursor-pointer"
									onClick={() => setSelectedCategoryFilter('all')}
									variant={selectedCategoryFilter === 'all' ? 'default' : 'outline'}
								>
									Todas
								</Badge>
								{categoryFilters.map((category) => (
									<Badge
										className="cursor-pointer"
										key={category}
										onClick={() => setSelectedCategoryFilter(category)}
										variant={selectedCategoryFilter === category ? 'default' : 'outline'}
									>
										{category}
									</Badge>
								))}
							</div>
						</div>
					)}

					{/* Filtros de etiquetas */}
					{tagFilters.length > 0 && (
						<div>
							<h4 className="mb-2 font-medium text-sm">Etiquetas</h4>
							<div className="flex flex-wrap gap-2">
								<Badge
									className="cursor-pointer"
									onClick={() => setSelectedTagFilter('all')}
									variant={selectedTagFilter === 'all' ? 'default' : 'outline'}
								>
									Todas
								</Badge>
								{tagFilters.map((tag) => (
									<Badge
										className="cursor-pointer"
										key={tag}
										onClick={() => setSelectedTagFilter(tag)}
										variant={selectedTagFilter === tag ? 'default' : 'outline'}
									>
										{tag}
									</Badge>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Barra de información y selección */}
			{(allowSelection || filteredItems.length > 0) && (
				<div className="flex items-center justify-between text-muted-foreground text-sm">
					<div>{filteredItems.length} elementos encontrados</div>

					{allowSelection && selectedIds.length > 0 && (
						<div className="flex items-center gap-2">
							<span>{selectedIds.length} seleccionados</span>
							<Button onClick={clearSelection} size="sm" variant="ghost">
								Limpiar
							</Button>
						</div>
					)}
				</div>
			)}

			{/* Contenido principal: Grid de tarjetas */}
			{renderGrid()}

			{/* Paginación */}
			{pagination && totalPages > 1 && (
				<div className="mt-6 flex items-center justify-center gap-2">
					<Button
						aria-label="Página anterior"
						disabled={currentPage === 1}
						onClick={() => handlePageChange(currentPage - 1)}
						size="icon"
						variant="outline"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>

					<div className="flex items-center">
						{Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
							let pageNum: number;

							// Lógica para mostrar las páginas relevantes cuando hay muchas
							if (totalPages <= 5) {
								pageNum = idx + 1;
							} else if (currentPage <= 3) {
								pageNum = idx + 1;
							} else if (currentPage >= totalPages - 2) {
								pageNum = totalPages - 4 + idx;
							} else {
								pageNum = currentPage - 2 + idx;
							}

							return (
								<Button
									className="mx-1 h-8 w-8 p-0"
									key={`page-${pageNum}`}
									onClick={() => handlePageChange(pageNum)}
									size="sm"
									variant={currentPage === pageNum ? 'default' : 'outline'}
								>
									{pageNum}
								</Button>
							);
						})}
					</div>

					<Button
						aria-label="Página siguiente"
						disabled={currentPage === totalPages}
						onClick={() => handlePageChange(currentPage + 1)}
						size="icon"
						variant="outline"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			)}
		</div>
	);
}
