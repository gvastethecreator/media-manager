/**
 * @file Componente de Toolbar del File Browser
 * @module file-browser-new/components/toolbar
 */

import { RefreshCw, Grid, List, LayoutGrid, Table2, Columns3, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ToolbarProps, ViewMode } from '../types';

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
    className,
}: FileBrowserToolbarProps) {
    const hasSelection = selectedCount > 0;
    const showSizeSlider = viewMode === 'grid' || viewMode === 'masonry' || viewMode === 'cards';

    return (
        <div
            className={cn(
                'flex items-center justify-between gap-2 border-b px-3 py-2',
                'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
                className
            )}
            data-testid="file-browser-toolbar"
        >
            {/* Lado izquierdo: acciones de selección */}
            <div className="flex items-center gap-2">
                {hasSelection ? (
                    <>
                        <span className="text-sm text-muted-foreground">
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

            {/* Slider de tamaño (solo para vistas de grid) */}
            {showSizeSlider && onItemSizeChange && (
                <div className="flex items-center gap-2 min-w-[120px]">
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

            {/* Búsqueda */}
            <div className="relative flex items-center">
                <Search className="absolute left-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                    className="h-8 w-[180px] pl-8 pr-8 text-sm"
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    placeholder="Buscar..."
                    type="search"
                    value={searchQuery}
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
