/**
 * @file Componente de filtros para vistas de contenido
 * @module components/ui/content-filters
 * @description Barra de filtros reutilizable con búsqueda y toggles
 */

import { Search, Filter, Grid3x3, List, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuCheckboxItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface FilterOption {
	label: string;
	value: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}

export interface FilterGroup {
	label: string;
	options: FilterOption[];
}

export interface ContentFiltersProps {
	/** Valor de búsqueda */
	searchValue: string;
	/** Callback cuando cambia la búsqueda */
	onSearchChange: (value: string) => void;
	/** Placeholder para el input de búsqueda */
	searchPlaceholder?: string;
	/** Modo de vista actual */
	viewMode?: 'grid' | 'list';
	/** Callback cuando cambia el modo de vista */
	onViewModeChange?: (mode: 'grid' | 'list') => void;
	/** Grupos de filtros */
	filterGroups?: FilterGroup[];
	/** Mostrar contador de resultados */
	showResultCount?: boolean;
	/** Total de resultados */
	resultCount?: number;
	/** Etiqueta para los resultados */
	resultLabel?: string;
	/** Clase CSS adicional */
	className?: string;
}

export function ContentFilters({
	searchValue,
	onSearchChange,
	searchPlaceholder = 'Buscar...',
	viewMode = 'grid',
	onViewModeChange,
	filterGroups = [],
	showResultCount = false,
	resultCount = 0,
	resultLabel = 'resultado',
	className,
}: ContentFiltersProps) {
	const hasFilters = filterGroups.length > 0;

	return (
		<div className={cn('space-y-4', className)}>
			{/* Barra de búsqueda y controles */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
					<Input
						placeholder={searchPlaceholder}
						value={searchValue}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pl-10"
					/>
				</div>

				{/* Filtros avanzados */}
				{hasFilters && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="icon">
								<SlidersHorizontal className="w-4 h-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							{filterGroups.map((group, groupIdx) => (
								<div key={groupIdx}>
									{groupIdx > 0 && <DropdownMenuSeparator />}
									<DropdownMenuLabel>{group.label}</DropdownMenuLabel>
									{group.options.map((option) => (
										<DropdownMenuCheckboxItem
											key={option.value}
											checked={option.checked}
											onCheckedChange={option.onChange}
										>
											{option.label}
										</DropdownMenuCheckboxItem>
									))}
								</div>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				)}

				{/* Toggle de vista */}
				{onViewModeChange && (
					<div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md">
						<Button
							variant="ghost"
							size="icon"
							className={cn(viewMode === 'grid' && 'bg-gray-100 dark:bg-gray-700')}
							onClick={() => onViewModeChange('grid')}
						>
							<Grid3x3 className="w-4 h-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className={cn(viewMode === 'list' && 'bg-gray-100 dark:bg-gray-700')}
							onClick={() => onViewModeChange('list')}
						>
							<List className="w-4 h-4" />
						</Button>
					</div>
				)}
			</div>

			{/* Contador de resultados */}
			{showResultCount && (
				<div className="text-sm text-gray-600 dark:text-gray-400">
					{resultCount} {resultLabel}
					{resultCount !== 1 && 's'} encontrado
					{resultCount !== 1 && 's'}
				</div>
			)}
		</div>
	);
}
