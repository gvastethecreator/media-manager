/**
 * @file Componente principal del File Browser refactorizado
 * @module file-browser-new/file-browser
 */

// TODO: Evaluar una estrategia de layout animation nativa con GSAP si vuelve a ser necesaria.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useMove } from '@/hooks/use-move';
import { toMediaAssetType } from '@/lib/api/authorized-roots';
import { useRetryFileMutationRecovery, useStartupFileMutationRecovery } from '@/lib/api/file-mutation-recovery';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { DeleteDialog } from './components/delete-dialog';
import { FileBrowserEmptyState } from './components/empty-state';
import { FileBrowserErrorState } from './components/error-state';
import { type ContextMenuAction, type ContextMenuPayload, ItemContextMenu } from './components/item-context-menu';
import { LoadMoreButton } from './components/load-more-button';
import { FileBrowserLoadingState } from './components/loading-state';
import { MoveDialog } from './components/move-dialog';
import { RenameDialog } from './components/rename-dialog';
import { FileBrowserStatusBar } from './components/status-bar';
import { FileBrowserToolbar } from './components/toolbar';
import { actionToEntityType, useAddToEntity } from './hooks/use-add-to-entity';
import { useDelete } from './hooks/use-delete';
import { useFileBrowser } from './hooks/use-file-browser';
import { useKeyboardNavigation } from './hooks/use-keyboard';
import { useRename } from './hooks/use-rename';
import type { BrowserItem } from './types/item.types';
import type { FileBrowserProps } from './types/props.types';
import { CardsView } from './views/cards';
import { GridView } from './views/grid';
import { ListView } from './views/list';
import { MasonryView } from './views/masonry';
import { TableView } from './views/table';
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
	// TODO: Si reaparece esta necesidad, implementar layout transitions con GSAP o FLIP.
	// const layoutRef = useRef<ReturnType<typeof createLayout> | null>(null);
	const layoutRef = useRef<{ destroy: () => void } | null>(null);
	const { toast } = useToast();
	const [isRecoveryDialogOpen, setIsRecoveryDialogOpen] = useState(false);

	const { renameItem, renameBatch, isLoading: isRenaming } = useRename();
	const { deleteItems, isLoading: isDeleting } = useDelete();
	const { moveFiles, isLoading: isMoving } = useMove();
	const { data: startupRecovery, isError: startupRecoveryUnavailable } = useStartupFileMutationRecovery();
	const retryRecovery = useRetryFileMutationRecovery();

	const handleRecoveryRetry = useCallback(async () => {
		try {
			const recovery = await retryRecovery.mutateAsync();
			if (recovery.manual > 0) {
				toast({
					description: `${recovery.manual} operación${recovery.manual === 1 ? '' : 'es'} aún requiere revisión.`,
					title: 'La revisión no pudo completar todas las operaciones',
					variant: 'destructive',
				});
				return;
			}
			setIsRecoveryDialogOpen(false);
			toast({
				description:
					recovery.completed > 0
						? `${recovery.completed} operación${recovery.completed === 1 ? '' : 'es'} reconciliada${recovery.completed === 1 ? '' : 's'}.`
						: 'No quedaron operaciones pendientes.',
				title: 'Revisión de recuperación terminada',
			});
		} catch (error) {
			clientLogger.error('File mutation recovery retry failed:', error);
			toast({
				description: 'No se pudo volver a revisar la recuperación. El estado se mantiene para una nueva revisión.',
				title: 'No se pudo revisar la recuperación',
				variant: 'destructive',
			});
		}
	}, [retryRecovery, toast]);

	// Estado del menú contextual
	const [contextMenu, setContextMenu] = useState<ContextMenuState>({
		isOpen: false,
		position: null,
		targetItem: null,
	});

	// Estado para modales de acciones
	const [renameModal, setRenameModal] = useState<{ isOpen: boolean; items: BrowserItem[] }>({
		isOpen: false,
		items: [],
	});
	const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; items: BrowserItem[] }>({
		isOpen: false,
		items: [],
	});
	const [moveModal, setMoveModal] = useState<{ isOpen: boolean; items: BrowserItem[] }>({ isOpen: false, items: [] });

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
	const paginationMode = useViewOptionsStore((s) => s.pagination.mode);
	const virtualization = useViewOptionsStore((s) => s.virtualization);
	const effectiveInfiniteScroll =
		paginationMode === 'infinite'
			? infiniteScroll
			: {
					...infiniteScroll,
					enabled: false,
					autoLoad: false,
				};

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
				(browser.activeId ? browser.linearItems.find((it) => it.id === browser.activeId) : undefined) ??
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
					// No exponer rutas locales: copiar únicamente nombres visibles.
					if (payload.selected.length > 0) {
						await navigator.clipboard.writeText(payload.selected.map((item) => item.name).join('\n'));
						toast({
							title: '📋 Copiado',
							description: `${payload.selected.length} nombre${payload.selected.length > 1 ? 's' : ''} copiado${payload.selected.length > 1 ? 's' : ''} al portapapeles`,
						});
					}
					break;
				case 'rename':
					if (payload.selected.length > 0) {
						setRenameModal({ isOpen: true, items: payload.selected });
					}
					break;
				case 'download':
					// Descargar originales mediante referencias opacas de asset.
					for (const item of payload.selected) {
						const assetType = toMediaAssetType(item.entityType);
						if (!assetType) continue;
						const response = await fetch('/api/download', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ asset: { assetId: item.id, assetType } }),
						});
						if (!response.ok) throw new Error(`No se pudo descargar ${item.name}`);
						const url = URL.createObjectURL(await response.blob());
						try {
							const link = document.createElement('a');
							link.href = url;
							link.download = item.name;
							link.click();
						} finally {
							URL.revokeObjectURL(url);
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
					if (payload.selected.length > 0) {
						setDeleteModal({ isOpen: true, items: payload.selected });
					}
					break;
				case 'move':
					if (payload.selected.length > 0) {
						setMoveModal({ isOpen: true, items: payload.selected });
					}
					break;
				default:
					// Acciones de "Agregar a..."
					if (action.startsWith('add-to-')) {
						const entityType = actionToEntityType(action);
						if (entityType && payload.targetId) {
							await addToEntity({
								entityType,
								entityId: payload.targetId,
								items: payload.selected.map((item) => ({ id: item.id, entityType: item.entityType })),
							});
						} else if (entityType === 'favorite') {
							// Favoritos no requiere targetId
							await addToEntity({
								entityType: 'favorite',
								entityId: 'favorites', // placeholder, el hook crea favoritos individuales
								items: payload.selected.map((item) => ({ id: item.id, entityType: item.entityType })),
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
			layoutRef.current.destroy();
			layoutRef.current = null;
		}

		if (!el) return;

		// TODO: Resolver con GSAP/FLIP si se necesita layout animation avanzada.
		// Se necesita implementar una alternativa para animaciones de layout
		// layoutRef.current = createLayout(el, { ... });
	}, []);

	useEffect(() => {
		return () => {
			layoutRef.current?.destroy();
			layoutRef.current = null;
		};
	}, []);

	const runLayoutUpdate = useCallback((action: () => void, options?: { duration?: number; ease?: string }) => {
		// TODO: Resolver con GSAP/FLIP si se necesita layout animation avanzada.
		// Se necesita implementar alternativa para animaciones de layout
		action();
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
						page={effectiveInfiniteScroll.enabled ? undefined : browser.pagination.page}
						pageSize={browser.pagination.pageSize}
					/>
				);

			case 'masonry':
				return (
					<MasonryView
						{...viewProps}
						config={
							config.kind === 'masonry'
								? config
								: {
										kind: 'masonry',
										renderMode: 'canvas',
										gap: 8,
										columnWidth: 200,
										padding: 16,
										tcgHoverReveal: true,
										tcgHolo: true,
										tcgShadows: true,
										tcgRounded: true,
										tcgTilt: true,
									}
						}
						page={effectiveInfiniteScroll.enabled ? undefined : browser.pagination.page}
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
						page={effectiveInfiniteScroll.enabled ? undefined : browser.pagination.page}
						pageSize={browser.pagination.pageSize}
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
						page={effectiveInfiniteScroll.enabled ? undefined : browser.pagination.page}
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
						page={effectiveInfiniteScroll.enabled ? undefined : browser.pagination.page}
						pageSize={browser.pagination.pageSize}
					/>
				);
		}
	}, [browser, viewProps, effectiveInfiniteScroll.enabled]);

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
				onRefresh={() =>
					runLayoutUpdate(
						() => {
							browser.refresh();
						},
						{ duration: 300 }
					)
				}
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
			{!(effectiveInfiniteScroll.enabled && effectiveInfiniteScroll.autoLoad) &&
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
				onNextPage={() => runLayoutUpdate(() => browser.nextPage(), { duration: 250 })}
				onPrevPage={() => runLayoutUpdate(() => browser.prevPage(), { duration: 250 })}
				onReviewRecovery={() => setIsRecoveryDialogOpen(true)}
				pagination={browser.pagination}
				recoveryRepairing={retryRecovery.isPending}
				selectedCount={browser.selectedIds.length}
				shownItems={browser.shownCount}
				startupRecovery={startupRecovery}
				startupRecoveryUnavailable={startupRecoveryUnavailable}
				totalItems={browser.realItemCount}
			/>

			<Dialog onOpenChange={setIsRecoveryDialogOpen} open={isRecoveryDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Revisión de recuperación</DialogTitle>
						<DialogDescription>
							La revisión vuelve a comprobar las operaciones incompletas. Sólo elimina una copia temporal cuando su
							identidad y su ubicación autorizada siguen coincidiendo con el registro de recuperación.
						</DialogDescription>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						Si no puede confirmar una operación, la mantiene marcada para revisión. No muestra rutas locales ni IDs de
						assets.
					</p>
					<DialogFooter className="flex-row">
						<Button disabled={retryRecovery.isPending} onClick={() => setIsRecoveryDialogOpen(false)} variant="outline">
							Cancelar
						</Button>
						<Button disabled={retryRecovery.isPending} onClick={() => void handleRecoveryRetry()} variant="destructive">
							{retryRecovery.isPending ? 'Revisando...' : 'Reintentar reparación'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Context Menu */}
			<ItemContextMenu
				isOpen={contextMenu.isOpen}
				onAction={handleContextMenuAction}
				onClose={handleCloseContextMenu}
				position={contextMenu.position}
				selectedItems={browser.linearItems.filter((item) => browser.selectedSet.has(item.id))}
			/>

			{/* Modal de renombrar */}
			<RenameDialog
				isLoading={isRenaming}
				isOpen={renameModal.isOpen}
				items={renameModal.items}
				onCancel={() => setRenameModal({ isOpen: false, items: [] })}
				onConfirm={(newNames) => {
					void (async () => {
						if (newNames.length === 1) {
							const item = renameModal.items.find((candidate) => candidate.id === newNames[0].id);
							if (!item) throw new Error('No se encontró el asset a renombrar');
							await renameItem(item, newNames[0].newName);
						} else {
							const renames = newNames.map((rename) => {
								const item = renameModal.items.find((candidate) => candidate.id === rename.id);
								if (!item) throw new Error('No se encontró un asset a renombrar');
								return { item, newName: rename.newName };
							});
							await renameBatch(renames);
						}
						setRenameModal({ isOpen: false, items: [] });
					})().catch((error) => {
						clientLogger.error('File browser rename failed:', error);
					});
				}}
			/>

			{/* Modal de eliminar */}
			<DeleteDialog
				isLoading={isDeleting}
				isOpen={deleteModal.isOpen}
				items={deleteModal.items}
				onCancel={() => setDeleteModal({ isOpen: false, items: [] })}
				onConfirm={() => {
					void deleteItems(deleteModal.items)
						.then(() => {
							setDeleteModal({ isOpen: false, items: [] });
						})
						.catch((error) => {
							clientLogger.error('File browser delete failed:', error);
						});
				}}
			/>

			{/* Modal de mover */}
			<MoveDialog
				isLoading={isMoving}
				isOpen={moveModal.isOpen}
				items={moveModal.items}
				onCancel={() => setMoveModal({ isOpen: false, items: [] })}
				onConfirm={(targetFolderId) => {
					void (async () => {
						const assets = moveModal.items.map((item) => {
							const assetType = toMediaAssetType(item.entityType);
							if (!assetType) throw new Error(`No se puede mover el tipo ${item.entityType}`);
							return { assetId: item.id, assetType };
						});
						await moveFiles({ assets, targetFolderId });
						setMoveModal({ isOpen: false, items: [] });
					})().catch((error) => {
						clientLogger.error('File browser move failed:', error);
					});
				}}
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
