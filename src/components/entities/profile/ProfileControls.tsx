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
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input placeholder="Buscar perfiles..." value={searchTerm} onChange={handleSearchChange} className="pl-9" />
			</div>

			<div className="flex items-center gap-2">
				{/* Modo de vista */}
				<div className="flex items-center rounded-lg border p-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setViewMode('grid')}
						className={viewConfig.mode === 'grid' ? 'bg-muted' : ''}
						title="Vista en grid"
					>
						<LayoutGrid className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setViewMode('list')}
						className={viewConfig.mode === 'list' ? 'bg-muted' : ''}
						title="Vista en lista"
					>
						<List className="h-4 w-4" />
					</Button>
				</div>

				{/* Columnas del grid */}
				{viewConfig.mode === 'grid' && (
					<div className="flex items-center rounded-lg border p-1">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setGridColumns(2)}
							className={viewConfig.gridColumns === 2 ? 'bg-muted' : ''}
							title="2 columnas"
						>
							<Grid2x2 className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setGridColumns(3)}
							className={viewConfig.gridColumns === 3 ? 'bg-muted' : ''}
							title="3 columnas"
						>
							<Grid3x3 className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setGridColumns(4)}
							className={viewConfig.gridColumns === 4 ? 'bg-muted' : ''}
							title="4 columnas"
						>
							<Layers className="h-4 w-4" />
						</Button>
					</div>
				)}

				{/* Ordenamiento */}
				<Select value={currentSortOption} onValueChange={handleSortChange}>
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
				<Select value={groupBy} onValueChange={handleGroupByChange as (value: string) => void}>
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
