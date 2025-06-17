'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { Grid2X2, LayoutGrid, List, Table } from 'lucide-react';
import { useCallback } from 'react';

/**
 * Selector de tipo de vista para el navegador de archivos
 * Permite cambiar entre las diferentes vistas disponibles: grid, list, masonry, cards
 */
export function ViewTypeSelector() {
	const { viewMode, setViewMode } = useViewOptionsStore();

	const handleViewModeChange = useCallback((mode: string) => {
		setViewMode(mode as any);
	}, [setViewMode]);

	// Determinar qué icono mostrar según el modo actual
	const getCurrentIcon = useCallback(() => {
		switch (viewMode) {
			case 'grid':
				return <Grid2X2 className="h-4 w-4" />;
			case 'list':
				return <List className="h-4 w-4" />;
			case 'masonry':
				return <LayoutGrid className="h-4 w-4" />;
			case 'cards':
				return <Table className="h-4 w-4" />;
			default:
				return <Grid2X2 className="h-4 w-4" />;
		}
	}, [viewMode]);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-8 w-8">
					{getCurrentIcon()}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuItem onClick={() => handleViewModeChange('grid')}>
					<Grid2X2 className="mr-2 h-4 w-4" />
					<span>Cuadrícula</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleViewModeChange('list')}>
					<List className="mr-2 h-4 w-4" />
					<span>Lista</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleViewModeChange('masonry')}>
					<LayoutGrid className="mr-2 h-4 w-4" />
					<span>Mosaico</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleViewModeChange('cards')}>
					<Table className="mr-2 h-4 w-4" />
					<span>Tarjetas</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}