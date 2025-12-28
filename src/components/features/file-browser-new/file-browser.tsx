/**
 * @file Componente principal del File Browser refactorizado
 * @module file-browser-new/file-browser
 */

import { useRef, useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type {
    FileBrowserProps,
    BrowserItem,
    ViewMode,
    ViewConfig,
    ClickModifiers,
} from './types';
import { useFileBrowser, useAddToEntity, actionToEntityType } from './hooks';
import { useKeyboardNavigation } from './hooks/use-keyboard';
import {
    FileBrowserToolbar,
    FileBrowserStatusBar,
    FileBrowserEmptyState,
    FileBrowserLoadingState,
    FileBrowserErrorState,
    LoadMoreButton,
    ItemContextMenu,
    type ContextMenuAction,
    type ContextMenuPayload,
} from './components';
import {
    GridView,
    ListView,
    MasonryView,
    TableView,
    CardsView,
} from './views';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { clientLogger } from '@/lib/logger/client-logger';
import { useToast } from '@/components/ui/use-toast';

// Estado del menú contextual
interface ContextMenuState {
    isOpen: boolean;
    position: { x: number; y: number } | null;
    targetItem: BrowserItem | null;
}

/**
 * Componente principal del File Browser
 * Versión refactorizada con arquitectura modular
 */
export function FileBrowser({
    folderId,
    items: directItems,
    onItemClick,
    onItemDoubleClick,
    className,
}: FileBrowserProps) {
    // Ref del contenedor principal
    const containerRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Estado del menú contextual
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        isOpen: false,
        position: null,
        targetItem: null,
    });

    // Hook principal
    const browser = useFileBrowser({
        folderId,
        items: directItems,
        onItemClick,
        onItemDoubleClick,
    });

    // Hook para agregar a entidades
    const { addToEntity } = useAddToEntity();

    // Opciones de vista
    const backgroundColor = useViewOptionsStore((s) => s.backgroundColor);
    const infiniteScroll = useViewOptionsStore((s) => s.infiniteScroll);

    // Navegación por teclado
    const { handleKeyDown } = useKeyboardNavigation({
        items: browser.linearItems,
        activeId: browser.activeId,
        viewMode: browser.viewMode,
        onItemClick: browser.handleItemClick,
        onItemDoubleClick: browser.handleItemDoubleClick,
        onActiveChange: browser.setActiveItem,
        containerRef,
        disabled: browser.isLoading || !!browser.error || browser.items.length === 0,
    });

    // Handler para abrir menú contextual
    const handleContextMenu = useCallback((e: React.MouseEvent, item: BrowserItem) => {
        e.preventDefault();
        e.stopPropagation();

        // Si el item no está seleccionado, seleccionarlo
        if (!browser.selectedSet.has(item.id)) {
            browser.handleItemClick(item, { ctrlKey: false, metaKey: false, shiftKey: false });
        }

        setContextMenu({
            isOpen: true,
            position: { x: e.clientX, y: e.clientY },
            targetItem: item,
        });
    }, [browser]);

    // Handler para cerrar menú contextual
    const handleCloseContextMenu = useCallback(() => {
        setContextMenu({ isOpen: false, position: null, targetItem: null });
    }, []);

    // Handler para acciones del menú contextual
    const handleContextMenuAction = useCallback(async (action: ContextMenuAction, payload: ContextMenuPayload) => {
        clientLogger.info(`Context menu action: ${action}`, {
            itemCount: payload.selected.length,
            targetId: payload.targetId
        });

        switch (action) {
            case 'open':
                // Abrir el primer item seleccionado
                if (payload.selected.length > 0) {
                    browser.handleItemDoubleClick(payload.selected[0]);
                }
                break;
            case 'preview':
                // Abrir vista previa (file viewer)
                if (payload.selected.length > 0) {
                    browser.handleItemDoubleClick(payload.selected[0]);
                }
                break;
            case 'copy':
                // Copiar path al clipboard
                if (payload.selected.length > 0) {
                    const paths = payload.selected.map(i => i.path || i.name).join('\n');
                    await navigator.clipboard.writeText(paths);
                    toast({
                        title: '📋 Copiado',
                        description: `${payload.selected.length} ruta${payload.selected.length > 1 ? 's' : ''} copiada${payload.selected.length > 1 ? 's' : ''} al portapapeles`,
                    });
                }
                break;
            case 'rename':
                // TODO: Implementar modal de renombrar
                if (payload.selected.length === 1) {
                    toast({
                        title: '✏️ Renombrar',
                        description: 'Función próximamente disponible',
                    });
                }
                break;
            case 'download':
                // Descargar archivo(s) usando thumbnailUrl o construyendo URL desde path
                for (const item of payload.selected) {
                    const downloadUrl = item.thumbnailUrl || (item.path ? `/api/files/${encodeURIComponent(item.path)}` : null);
                    if (downloadUrl) {
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.download = item.name;
                        link.click();
                    }
                }
                if (payload.selected.length > 0) {
                    toast({
                        title: '⬇️ Descargando',
                        description: `${payload.selected.length} archivo${payload.selected.length > 1 ? 's' : ''}`,
                    });
                }
                break;
            case 'delete':
                // TODO: Implementar confirmación y eliminación
                toast({
                    variant: 'destructive',
                    title: '🗑️ Eliminar',
                    description: 'Función próximamente disponible (requiere confirmación)',
                });
                break;
            default:
                // Acciones de "Agregar a..."
                if (action.startsWith('add-to-')) {
                    const entityType = actionToEntityType(action);
                    if (entityType && payload.targetId) {
                        const mediaIds = payload.selected.map(item => item.id);
                        await addToEntity({
                            entityType,
                            entityId: payload.targetId,
                            mediaIds,
                        });
                    } else if (entityType === 'favorite') {
                        // Favoritos no requiere targetId
                        const mediaIds = payload.selected.map(item => item.id);
                        await addToEntity({
                            entityType: 'favorite',
                            entityId: 'favorites', // placeholder, el hook crea favoritos individuales
                            mediaIds,
                        });
                    } else {
                        clientLogger.warn(`Missing targetId for action: ${action}`);
                    }
                }
                break;
        }
    }, [browser, addToEntity, toast]);

    // Props comunes para vistas (incluyendo context menu)
    const viewProps = useMemo(
        () => ({
            items: browser.items,
            groups: browser.groups,
            onItemClick: browser.handleItemClick,
            onItemDoubleClick: browser.handleItemDoubleClick,
            onItemContextMenu: handleContextMenu,
            onContainerReady: browser.setScrollContainer,
            scrollContainer: browser.scrollContainerRef.current,
            selectedIds: browser.selectedSet,
            activeId: browser.activeId,
        }),
        [browser, handleContextMenu]
    );

    // Renderizar vista según modo
    const renderView = useCallback(() => {
        const config = browser.viewConfig;

        switch (browser.viewMode) {
            case 'list':
                return (
                    <ListView
                        {...viewProps}
                        config={config.kind === 'list' ? config : { kind: 'list', renderMode: 'canvas', gap: 0, rowHeight: 36 }}
                    />
                );

            case 'masonry':
                return (
                    <MasonryView
                        {...viewProps}
                        config={config.kind === 'masonry' ? config : { kind: 'masonry', renderMode: 'canvas', gap: 8, columnWidth: 200 }}
                        page={browser.pagination.page}
                        pageSize={browser.pagination.pageSize}
                    />
                );

            case 'table':
                return (
                    <TableView
                        {...viewProps}
                        config={config.kind === 'table' ? config : { kind: 'table', renderMode: 'canvas', gap: 0, rowHeight: 32, visibleColumns: ['name', 'entityType', 'size', 'createdAt'] }}
                        onSortChange={browser.toggleSortField}
                        sortOptions={browser.sortOptions}
                    />
                );

            case 'cards':
                return (
                    <CardsView
                        {...viewProps}
                        config={config.kind === 'cards' ? config : { kind: 'cards', renderMode: 'canvas', gap: 12, cardSize: 180, showDetails: true }}
                        page={browser.pagination.page}
                        pageSize={browser.pagination.pageSize}
                    />
                );

            case 'grid':
            default:
                return (
                    <GridView
                        {...viewProps}
                        config={config.kind === 'grid' ? config : { kind: 'grid', renderMode: 'canvas', gap: 8, itemSize: 150, columns: 0 }}
                        itemSize={browser.itemSize}
                        page={browser.pagination.page}
                        pageSize={browser.pagination.pageSize}
                    />
                );
        }
    }, [browser, viewProps]);

    // IDs para toolbar (sin sintéticos)
    const toolbarItemIds = useMemo(
        () => browser.linearItems.filter((it) => !it.isSynthetic).map((it) => it.id),
        [browser.linearItems]
    );

    return (
        <section
            aria-label="Explorador de archivos"
            className={cn('flex h-full min-h-[200px] flex-col overflow-hidden', className)}
            data-ready={browser.shouldRenderContent ? 'true' : 'false'}
            data-testid="file-browser"
            data-view-mode={browser.viewMode}
            onKeyDown={handleKeyDown}
            ref={containerRef}
            style={{ backgroundColor }}
            tabIndex={-1}
        >
            {/* Toolbar */}
            <FileBrowserToolbar
                isLoading={browser.isLoading || browser.isLoadingMore}
                itemIds={toolbarItemIds}
                itemSize={browser.itemSize}
                onClearSelection={browser.clearSelection}
                onItemSizeChange={browser.setItemSize}
                onRefresh={browser.refresh}
                onSearchChange={browser.setSearchQuery}
                onSelectAll={browser.selectAll}
                onViewModeChange={browser.setViewMode}
                searchQuery={browser.searchQuery}
                selectedCount={browser.selectedIds.length}
                viewMode={browser.viewMode}
            />

            {/* Área de contenido */}
            <div
                className="relative flex flex-1 min-h-0 flex-col"
                data-testid="file-browser-container"
            >
                {/* Banner de error (si hay error pero también contenido) */}
                {browser.error && browser.items.length > 0 && (
                    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-2">
                        <div className="rounded-md bg-destructive/80 px-2 py-1 text-destructive-foreground text-xs">
                            Error cargando datos
                        </div>
                    </div>
                )}

                {/* Estados de bloqueo */}
                {browser.showPreloader && (
                    <FileBrowserLoadingState
                        className="flex-1"
                        itemSize={browser.itemSize}
                        viewMode={browser.viewMode}
                    />
                )}

                {browser.showErrorState && (
                    <FileBrowserErrorState
                        className="flex-1"
                        message={browser.error ?? 'No se pudieron cargar los archivos.'}
                        onRetry={browser.refresh}
                    />
                )}

                {browser.showEmptyState && (
                    <FileBrowserEmptyState className="flex-1" />
                )}

                {/* Contenido principal */}
                {browser.shouldRenderContent && (
                    <div className="flex flex-1 min-h-0 flex-col">
                        {renderView()}
                    </div>
                )}
            </div>

            {/* Botón de cargar más (si no es infinite scroll automático) */}
            {!(infiniteScroll.enabled && infiniteScroll.autoLoad) &&
                browser.shouldRenderContent &&
                browser.hasMore && (
                    <LoadMoreButton
                        hasMore={browser.hasMore}
                        isLoading={browser.isLoadingMore}
                        loadedCount={browser.realItemCount}
                        onLoadMore={browser.loadMore}
                        totalCount={browser.pagination.totalItems}
                    />
                )}

            {/* Status Bar */}
            <FileBrowserStatusBar
                isLoading={browser.isLoading || browser.isLoadingMore}
                onNextPage={browser.nextPage}
                onPrevPage={browser.prevPage}
                pagination={browser.pagination}
                selectedCount={browser.selectedIds.length}
                shownItems={browser.shownCount}
                totalItems={browser.realItemCount}
            />

            {/* Context Menu */}
            <ItemContextMenu
                isOpen={contextMenu.isOpen}
                onAction={handleContextMenuAction}
                onClose={handleCloseContextMenu}
                position={contextMenu.position}
                selectedItems={browser.linearItems.filter(item => browser.selectedSet.has(item.id))}
            />
        </section>
    );
}

/**
 * FileBrowser por carpeta (compat con API anterior)
 */
export function FileBrowserByFolder(props: Omit<FileBrowserProps, 'items'> & { filterId?: string | null }) {
    return <FileBrowser {...props} folderId={props.filterId ?? props.folderId} />;
}
