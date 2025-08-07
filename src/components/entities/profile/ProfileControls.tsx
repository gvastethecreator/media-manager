import React from 'react';
/**
 * @file Componente de controles de perfiles
 * @module components/entities/profile/ProfileControls
 */

import { Grid2x2, Grid3x3, Layers, LayoutGrid, List, Search, SortAsc, SortDesc } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfileStore } from '@/store/entities/profile';

export interface ProfileControlsProps {
	className?: string;
}

/**
 * Componente que muestra los controles para filtrar y ordenar perfiles
 */
export function ProfileControls({ className }: ProfileControlsProps) {
	// Obtener el estado del store
	const {
		viewConfig,
		searchTerm,
		currentSortOption,
		groupBy,
		setViewMode,
		setGridColumns,
		setSearchTerm,
		setSortOption,
		setGroupBy,
	} = useProfileStore();

	// Handlers
	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSearchTerm(e.target.value);
		},
		[setSearchTerm]
	);

	const handleSortChange = useCallback(
		(value: string) => {
			setSortOption(value);
		},
		[setSortOption]
	);

	const handleGroupByChange = useCallback(
		(value: 'none' | 'theme' | 'language' | 'status') => {
			setGroupBy(value);
		},
		[setGroupBy]
	);

	return (
		<div className={`flex flex-col gap-4 sm:flex-row sm:items-center ${className}`}>
			{/* Búsqueda */}
			<div className="relative flex-1">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
				<Input className="pl-9" onChange={handleSearchChange} placeholder="Buscar perfiles..." value={searchTerm} />
			</div>

			<div className="flex items-center gap-2">
				{/* Modo de vista */}
				<div className="flex items-center rounded-lg border p-1">
					<Button
						className={viewConfig.mode === 'grid' ? 'bg-muted' : ''}
						onClick={() => setViewMode('grid')}
						size="icon"
						title="Vista en grid"
						variant="ghost"
					>
						<LayoutGrid className="h-4 w-4" />
					</Button>
					<Button
						className={viewConfig.mode === 'list' ? 'bg-muted' : ''}
						onClick={() => setViewMode('list')}
						size="icon"
						title="Vista en lista"
						variant="ghost"
					>
						<List className="h-4 w-4" />
					</Button>
				</div>

				{/* Columnas del grid */}
				{viewConfig.mode === 'grid' && (
					<div className="flex items-center rounded-lg border p-1">
						<Button
							className={viewConfig.gridColumns === 2 ? 'bg-muted' : ''}
							onClick={() => setGridColumns(2)}
							size="icon"
							title="2 columnas"
							variant="ghost"
						>
							<Grid2x2 className="h-4 w-4" />
						</Button>
						<Button
							className={viewConfig.gridColumns === 3 ? 'bg-muted' : ''}
							onClick={() => setGridColumns(3)}
							size="icon"
							title="3 columnas"
							variant="ghost"
						>
							<Grid3x3 className="h-4 w-4" />
						</Button>
						<Button
							className={viewConfig.gridColumns === 4 ? 'bg-muted' : ''}
							onClick={() => setGridColumns(4)}
							size="icon"
							title="4 columnas"
							variant="ghost"
						>
							<Layers className="h-4 w-4" />
						</Button>
					</div>
				)}

				{/* Ordenamiento */}
				<Select onValueChange={handleSortChange} value={currentSortOption}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Ordenar por..." />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="name_asc">
							<div className="flex items-center gap-2">
								<SortAsc className="h-4 w-4" />
								<span>Nombre A-Z</span>
							</div>
						</SelectItem>
						<SelectItem value="name_desc">
							<div className="flex items-center gap-2">
								<SortDesc className="h-4 w-4" />
								<span>Nombre Z-A</span>
							</div>
						</SelectItem>
						<SelectItem value="createdAt_desc">
							<div className="flex items-center gap-2">
								<SortDesc className="h-4 w-4" />
								<span>Más recientes</span>
							</div>
						</SelectItem>
						<SelectItem value="createdAt_asc">
							<div className="flex items-center gap-2">
								<SortAsc className="h-4 w-4" />
								<span>Más antiguos</span>
							</div>
						</SelectItem>
					</SelectContent>
				</Select>

				{/* Agrupar por */}
				<Select onValueChange={handleGroupByChange as (value: string) => void} value={groupBy}>
					<SelectTrigger className="w-[150px]">
						<SelectValue placeholder="Agrupar por..." />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">Sin agrupar</SelectItem>
						<SelectItem value="theme">Tema</SelectItem>
						<SelectItem value="language">Idioma</SelectItem>
						<SelectItem value="status">Estado</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
