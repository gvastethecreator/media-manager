/**
 * @file Componente principal del File Browser refactorizado
 * @module file-browser-new/file-browser
 */

import { createLayout } from 'animejs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useToast } from '@/components/ui/use-toast';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { shouldReduceMotion } from '@/lib/view-transition/utils';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import {
	type ContextMenuAction,
	type ContextMenuPayload,
	FileBrowserEmptyState,
	FileBrowserErrorState,
	FileBrowserLoadingState,
	FileBrowserStatusBar,
	FileBrowserToolbar,
	ItemContextMenu,
	LoadMoreButton,
} from './components';
import { actionToEntityType, useAddToEntity, useFileBrowser } from './hooks';
import { useKeyboardNavigation } from './hooks/use-keyboard';
import type { BrowserItem, FileBrowserProps } from './types';
import { CardsView, GridView, ListView, MasonryView, TableView } from './views';
import './styles/items.css';

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
	const layoutItemLimit = 120;
	const [suppressAppearAnimation, setSuppressAppearAnimation] = useState(false);
	// Ref del contenedor principal
	const containerRef = useRef<HTMLElement>(null);
	const layoutRootRef = useRef<HTMLElement | null>(null);
	const layoutRef = useRef<ReturnType<typeof createLayout> | null>(null);
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
	const virtualization = useViewOptionsStore((s) => s.virtualization);

	// Navegación por teclado
	const { handleNativeKeyDown } = useKeyboardNavigation({
		items: browser.linearItems,
		activeId: browser.activeId,
		viewMode: browser.viewMode,
		onItemClick: browser.handleItemClick,
		onItemDoubleClick: browser.handleItemDoubleClick,
		onActiveChange: browser.setActiveItem,
		containerRef,
		disabled: browser.isLoading || !!browser.error || browser.items.length === 0,
	});

	// Navegación por teclado sin depender de tabIndex/handlers en contenedores no interactivos.
	// Solo se activa cuando el foco está dentro del FileBrowser y no estamos escribiendo en inputs.
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const container = containerRef.current;
			if (!container) return;

			const active = document.activeElement;
			if (!(active instanceof HTMLElement)) return;
			if (!container.contains(active)) return;

			const tag = active.tagName;
			const isTextInput = tag === 'INPUT' || tag === 'TEXTAREA' || active.isContentEditable;
			if (isTextInput) return;

			handleNativeKeyDown(e);
		};

		document.addEventListener('keydown', handler);
		return () => {
			document.removeEventListener('keydown', handler);
		};
	}, [handleNativeKeyDown]);

	const openContextMenuForItem = useCallback(
		(item: BrowserItem, x: number, y: number) => {
			// Si el item no está seleccionado, seleccionarlo
			if (!browser.selectedSet.has(item.id)) {
				browser.handleItemClick(item, { ctrlKey: false, metaKey: false, shiftKey: false });
			}

			setContextMenu({
				isOpen: true,
				position: { x, y },
				targetItem: item,
			});
		},
		[browser]
	);

	// Handler para abrir menú contextual
	const handleContextMenu = useCallback(
		(e: React.MouseEvent, item: BrowserItem) => {
			e.preventDefault();
			e.stopPropagation();
			openContextMenuForItem(item, e.clientX, e.clientY);
		},
		[openContextMenuForItem]
	);

	// Handler para cerrar menú contextual
	const handleCloseContextMenu = useCallback(() => {
		setContextMenu({ isOpen: false, position: null, targetItem: null });
	}, []);

	// Compat (E2E/legacy): click derecho en el contenedor (p.ej. canvas/área vacía)
	// debe abrir el menú contextual sobre un item razonable (activo o primero).
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handler = (e: MouseEvent) => {
			const target = e.target as HTMLElement | null;
			if (target?.closest?.('[data-item-id]')) {
				return;
			}

			const fallbackItem =
				(browser.activeId ? (browser.linearItems.find((it) => it.id === browser.activeId) ?? null) : null) ??
				browser.linearItems.find((it) => !it.isSynthetic) ??
				null;

			if (!fallbackItem) return;

			e.preventDefault();
			e.stopPropagation();
			openContextMenuForItem(fallbackItem, e.clientX, e.clientY);
		};

		container.addEventListener('contextmenu', handler);
		return () => {
			container.removeEventListener('contextmenu', handler);
		};
	}, [browser.activeId, browser.linearItems, openContextMenuForItem]);

	// Handler para acciones del menú contextual
	const handleContextMenuAction = useCallback(
		async (action: ContextMenuAction, payload: ContextMenuPayload) => {
			clientLogger.info(`Context menu action: ${action}`, {
				itemCount: payload.selected.length,
				targetId: payload.targetId,
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
						const paths = payload.selected.map((i) => i.path || i.name).join('\n');
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
							const mediaIds = payload.selected.map((item) => item.id);
							await addToEntity({
								entityType,
								entityId: payload.targetId,
								mediaIds,
							});
						} else if (entityType === 'favorite') {
							// Favoritos no requiere targetId
							const mediaIds = payload.selected.map((item) => item.id);
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
		},
		[browser, addToEntity, toast]
	);

	// Props comunes para vistas (incluyendo context menu)
	const viewProps = useMemo(
		() => ({
			items: browser.items,
			groups: browser.groups,
			onItemClick: browser.handleItemClick,
			onItemDoubleClick: browser.handleItemDoubleClick,
			onItemContextMenu: handleContextMenu,
			onContainerReady: browser.setScrollContainer,
			layoutItemLimit,
			suppressAppearAnimation,
			virtualization,
			scrollContainer: browser.scrollContainerRef.current,
			selectedIds: browser.selectedSet,
			activeId: browser.activeId,
		}),
		[browser, handleContextMenu, suppressAppearAnimation, virtualization]
	);

	const setLayoutRoot = useCallback((el: HTMLElement | null) => {
		if (layoutRootRef.current === el) return;
		layoutRootRef.current = el;

		if (layoutRef.current) {
			layoutRef.current.revert();
			layoutRef.current = null;
		}

		if (!el) return;

		layoutRef.current = createLayout(el, {
			children: ['[data-layout-item="true"]'],
			properties: ['opacity', 'transform'],
			enterFrom: {
				opacity: 0,
				transform: 'translateY(8px) scale(0.98)',
			},
			leaveTo: {
				opacity: 0,
				transform: 'translateY(-8px) scale(0.98)',
			},
		});
	}, []);

	useEffect(() => {
		return () => {
			layoutRef.current?.revert();
			layoutRef.current = null;
		};
	}, []);

	const runLayoutUpdate = useCallback((action: () => void, options?: { duration?: number; ease?: string }) => {
		const layout = layoutRef.current;
		if (!layout || shouldReduceMotion()) {
			action();
			return;
		}

		layout.update(
			() => {
				flushSync(() => {
					action();
				});
			},
			{
				duration: options?.duration ?? 220,
				ease: options?.ease ?? 'out(3)',
				delay: (el, index) => {
					const orderValue = Number((el as HTMLElement).dataset.layoutOrder ?? index);
					return Math.min(orderValue * 4, 200);
				},
			}
		);
	}, []);

	useEffect(() => {
		if (!suppressAppearAnimation) return;
		const timeoutId = window.setTimeout(() => {
			setSuppressAppearAnimation(false);
		}, 0);
		return () => window.clearTimeout(timeoutId);
	}, [suppressAppearAnimation]);

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
						config={
							config.kind === 'masonry' ? config : { kind: 'masonry', renderMode: 'canvas', gap: 8, columnWidth: 200 }
						}
						page={infiniteScroll.enabled ? undefined : browser.pagination.page}
						pageSize={browser.pagination.pageSize}
					/>
				);

			case 'table':
				return (
					<TableView
						{...viewProps}
						config={
							config.kind === 'table'
								? config
								: {
										kind: 'table',
										renderMode: 'canvas',
										gap: 0,
										rowHeight: 32,
										visibleColumns: ['name', 'entityType', 'size', 'createdAt'],
									}
						}
						onSortChange={browser.toggleSortField}
						sortOptions={browser.sortOptions}
					/>
				);

			case 'cards':
				return (
					<CardsView
						{...viewProps}
						config={
							config.kind === 'cards'
								? config
								: { kind: 'cards', renderMode: 'canvas', gap: 12, cardSize: 180, showDetails: true }
						}
						page={infiniteScroll.enabled ? undefined : browser.pagination.page}
						pageSize={browser.pagination.pageSize}
					/>
				);
			default:
				return (
					<GridView
						{...viewProps}
						config={
							config.kind === 'grid'
								? config
								: { kind: 'grid', renderMode: 'canvas', gap: 8, itemSize: 150, columns: 0 }
						}
						itemSize={browser.itemSize}
						page={infiniteScroll.enabled ? undefined : browser.pagination.page}
						pageSize={browser.pagination.pageSize}
					/>
				);
		}
	}, [browser, viewProps, infiniteScroll.enabled]);

	// IDs para toolbar (sin sintéticos)
	const toolbarItemIds = useMemo(
		() => browser.linearItems.filter((it) => !it.isSynthetic).map((it) => it.id),
		[browser.linearItems]
	);

	const blockingState: 'loading' | 'error' | 'empty' | null = useMemo(() => {
		if (browser.showPreloader) return 'loading';
		if (browser.showErrorState) return 'error';
		if (browser.showEmptyState) return 'empty';
		return null;
	}, [browser.showPreloader, browser.showErrorState, browser.showEmptyState]);

	return (
		<section
			aria-label="Explorador de archivos"
			className={cn('flex h-full min-h-50 flex-col overflow-hidden', className)}
			data-ready={browser.shouldRenderContent ? 'true' : 'false'}
			data-testid="file-browser"
			data-view-mode={browser.viewMode}
			ref={containerRef}
			style={{ backgroundColor }}
		>
			{/* Toolbar */}
			<FileBrowserToolbar
				isLoading={browser.isLoading || browser.isLoadingMore}
				itemIds={toolbarItemIds}
				itemSize={browser.itemSize}
				onClearSelection={browser.clearSelection}
				onItemSizeChange={(size) => runLayoutUpdate(() => browser.setItemSize(size), { duration: 250 })}
				onRefresh={() => runLayoutUpdate(() => void browser.refresh(), { duration: 300 })}
				onSearchChange={(query) => runLayoutUpdate(() => browser.setSearchQuery(query), { duration: 200 })}
				onSelectAll={browser.selectAll}
				onSortChange={(field) =>
					runLayoutUpdate(() => browser.toggleSortField(field), { duration: 300, ease: 'inOut(3)' })
				}
				onViewModeChange={(mode) => {
					if (mode === browser.viewMode) return;
					setSuppressAppearAnimation(true);
					runLayoutUpdate(() => browser.setViewMode(mode), { duration: 450, ease: 'inOut(3)' });
				}}
				searchQuery={browser.searchQuery}
				selectedCount={browser.selectedIds.length}
				sortOptions={browser.sortOptions}
				viewMode={browser.viewMode}
			/>

			{/* Área de contenido */}
			<section
				aria-label="Navegación de explorador de archivos"
				className="relative flex min-h-0 flex-1 flex-col"
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
				{!browser.shouldRenderContent && blockingState && (
					<div className="h-full w-full overflow-auto" data-testid="file-browser-scroll-area-viewport">
						{blockingState === 'loading' && (
							<FileBrowserLoadingState className="flex-1" itemSize={browser.itemSize} viewMode={browser.viewMode} />
						)}
						{blockingState === 'error' && (
							<FileBrowserErrorState
								className="flex-1"
								message={browser.error ?? 'No se pudieron cargar los archivos.'}
								onRetry={browser.refresh}
							/>
						)}
						{blockingState === 'empty' && <FileBrowserEmptyState className="flex-1" />}
					</div>
				)}

				{/* Contenido principal */}
				{browser.shouldRenderContent && (
					<div className="flex min-h-0 flex-1 flex-col" ref={setLayoutRoot}>
						{renderView()}
					</div>
				)}
			</section>

			{/* Botón de cargar más (si no es infinite scroll automático) */}
			{!(infiniteScroll.enabled && infiniteScroll.autoLoad) && browser.shouldRenderContent && browser.hasMore && (
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
				onNextPage={() => runLayoutUpdate(() => browser.nextPage(), { duration: 250 })}
				onPrevPage={() => runLayoutUpdate(() => browser.prevPage(), { duration: 250 })}
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
				selectedItems={browser.linearItems.filter((item) => browser.selectedSet.has(item.id))}
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
