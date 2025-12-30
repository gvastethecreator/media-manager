/**
 * @file Componente de Toolbar del File Browser
 * @module file-browser-new/components/toolbar
 */

import { RefreshCw, Grid, List, LayoutGrid, Table2, Columns3, Search, X, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toggle } from '@/components/ui/toggle';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ToolbarProps, ViewMode, SortOption } from '../types';

const VIEW_ICONS: Record<ViewMode, React.ComponentType<{ className?: string }>> = {
    grid: Grid,
    list: List,
    masonry: LayoutGrid,
    table: Table2,
    cards: Columns3,
};

const VIEW_LABELS: Record<ViewMode, string> = {
    grid: 'Cuadrícula',
    list: 'Lista',
    masonry: 'Masonry',
    table: 'Tabla',
    cards: 'Tarjetas',
};

export interface FileBrowserToolbarProps extends ToolbarProps {
    /** Modo de vista actual */
    viewMode: ViewMode;
    /** Handler para cambiar vista */
    onViewModeChange?: (mode: ViewMode) => void;
    /** Items seleccionados */
    selectedCount?: number;
    /** Handler para seleccionar todos */
    onSelectAll?: () => void;
    /** Handler para limpiar selección */
    onClearSelection?: () => void;
    /** Tamaño actual de item */
    itemSize?: number;
    /** Handler para cambiar tamaño de item */
    onItemSizeChange?: (size: number) => void;
    /** Query de búsqueda */
    searchQuery?: string;
    /** Handler para cambiar búsqueda */
    onSearchChange?: (query: string) => void;
    /** Opciones de ordenamiento */
    sortOptions?: SortOption[];
    /** Handler para cambiar ordenamiento */
    onSortChange?: (field: string) => void;
}

export function FileBrowserToolbar({
    itemIds,
    isLoading = false,
    onRefresh,
    viewMode,
    onViewModeChange,
    selectedCount = 0,
    onSelectAll,
    onClearSelection,
    itemSize = 150,
    onItemSizeChange,
    searchQuery = '',
    onSearchChange,
    sortOptions = [],
    onSortChange,
    className,
}: FileBrowserToolbarProps) {
    const hasSelection = selectedCount > 0;
    const showSizeSlider = viewMode === 'grid' || viewMode === 'masonry' || viewMode === 'cards';
    const activeSort = sortOptions.find(s => s.direction !== false);

    const AVAILABLE_SORT_OPTIONS = [
        { field: 'name', label: 'Nombre' },
        { field: 'size', label: 'Tamaño' },
        { field: 'createdAt', label: 'Fecha' },
        { field: 'updatedAt', label: 'Modificado' },
    ];

    return (
        <div
            className={cn(
                'flex items-center justify-between gap-2 border-b px-3 py-2',
                'bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60',
                className
            )}
            data-testid="file-browser-toolbar"
        >
            {/* Lado izquierdo: acciones de selección */}
            <div className="flex items-center gap-2">
                {hasSelection ? (
                    <>
                        <span className="text-muted-foreground text-sm">
                            {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
                        </span>
                        <Button
                            onClick={onClearSelection}
                            size="sm"
                            variant="ghost"
                        >
                            Limpiar
                        </Button>
                    </>
                ) : (
                    <Button
                        disabled={itemIds.length === 0}
                        onClick={onSelectAll}
                        size="sm"
                        variant="ghost"
                    >
                        Seleccionar todos ({itemIds.length})
                    </Button>
                )}
            </div>

            {/* Centro: modos de vista */}
            <div className="flex items-center gap-2">
                {/* Dropdown (compatibilidad con tests E2E legacy) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            data-testid="view-mode-dropdown-trigger"
                            size="sm"
                            variant="ghost"
                        >
                            <span className="text-xs">Vista</span>
                            <ChevronDown className="ml-1 h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="center"
                        forceMount
                        sideOffset={0}
                        className="transition-none data-[state=closed]:animate-none data-[state=open]:animate-none"
                    >
                        {(Object.keys(VIEW_ICONS) as ViewMode[]).map((mode) => {
                            const Icon = VIEW_ICONS[mode];
                            return (
                                <DropdownMenuItem
                                    data-testid={`view-mode-${mode}-btn`}
                                    key={mode}
                                    onSelect={(e) => {
                                        // Compat E2E: el re-render inmediato puede desmontar el item
                                        // durante el click de Playwright. Diferimos el cambio de vista
                                        // para que el handler termine y Radix cierre el menú normalmente.
                                        window.setTimeout(() => onViewModeChange?.(mode), 0);
                                    }}
                                >
                                    <Icon className="mr-2 h-4 w-4" />
                                    {VIEW_LABELS[mode]}
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Toggles (UX rápida) */}
                <div className="flex items-center gap-1">
                    {(Object.keys(VIEW_ICONS) as ViewMode[]).map((mode) => {
                        const Icon = VIEW_ICONS[mode];
                        return (
                            <Toggle
                                aria-label={VIEW_LABELS[mode]}
                                key={mode}
                                onClick={() => onViewModeChange?.(mode)}
                                pressed={viewMode === mode}
                                size="sm"
                                title={VIEW_LABELS[mode]}
                            >
                                <Icon className="h-4 w-4" />
                            </Toggle>
                        );
                    })}
                </div>
            </div>

            {/* Slider de tamaño (solo para vistas de grid) */}
            {showSizeSlider && onItemSizeChange && (
                <div className="flex min-w-30 items-center gap-2">
                    <Slider
                        className="w-full"
                        max={300}
                        min={80}
                        onValueChange={(v) => onItemSizeChange(v[0])}
                        step={10}
                        value={[itemSize]}
                    />
                </div>
            )}

            {/* Ordenamiento */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1 px-2">
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="hidden text-xs sm:inline-block">
                            {activeSort ? activeSort.label : 'Ordenar'}
                        </span>
                        {activeSort && (
                            activeSort.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {AVAILABLE_SORT_OPTIONS.map((option) => {
                        const activeState = sortOptions.find(s => s.field === option.field);
                        return (
                            <DropdownMenuItem key={option.field} onClick={() => onSortChange?.(option.field)}>
                                <span className={cn("flex-1", activeState && "font-bold")}>
                                    {option.label}
                                </span>
                                {activeState?.direction === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
                                {activeState?.direction === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Búsqueda */}
            <div className="relative flex w-45 items-center">
                <Search className="absolute left-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                    className="h-8 text-sm"
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    placeholder="Buscar..."
                    type="search"
                    value={searchQuery}
                    style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
                />
                {searchQuery && (
                    <Button
                        className="absolute right-1 h-6 w-6 p-0"
                        onClick={() => onSearchChange?.('')}
                        size="icon"
                        variant="ghost"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            {/* Lado derecho: refresh */}
            <div className="flex items-center gap-2">
                <Button
                    disabled={isLoading}
                    onClick={onRefresh}
                    size="sm"
                    variant="ghost"
                >
                    <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                    <span className="sr-only">Refrescar</span>
                </Button>
            </div>
        </div>
    );
}
