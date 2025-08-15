/**
 * @file FileBrowser V2 - Componente refactorizado y modularizado
 * @module components/features/file-browser/file-browser-v2
 * @description FileBrowser refactorizado que usa stores específicos por entidad,
 * tipos optimizados WithStats, virtualización con TanStack Virtual y soporte multi-entidad.
 * Ahora modularizado para mejor mantenibilidad.
 */

import { FileTextIcon } from 'lucide-react';
import React, { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { useCustomContextMenu } from '@/hooks/use-custom-context-menu';
import { useFileSync } from '@/hooks/use-file-sync';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
// Import CSS for user-select fixes
import { useInterfaceSettingsStore } from '@/store/entities/settings/store';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { EntityStatsType } from '@/types/migration';
// Imports de módulos refactorizados
import { AUTO_SYNC_DISABLED_FOLDERS, DEFAULT_PROPS, FALLBACK_WIDTH } from './config/file-browser.config';
import { CustomContextMenu } from './context-menu/custom-context-menu';
import { useAccessibility } from './hooks/use-accessibility';
import { useFileBrowserData } from './hooks/use-file-browser-data';
import { useFileBrowserSelection } from './hooks/use-file-browser-selection';
import { usePerformance } from './hooks/use-performance';
import { useProgressiveLoading } from './hooks/use-progressive-loading';
import { KeyboardNavigation } from './navigation/keyboard-navigation';
import { ProgressOverlay } from './progress/progress-overlay';
import { DragSelectionProvider } from './selection/drag-selection-provider';
import './selection/selection-styles.css';
import './styles/user-select.css';
import { StatusBar } from './toolbar/status-bar';
import type { FileBrowserProps } from './types/file-browser.types';
import { CardsView } from './views/cards-view';
import { GridView } from './views/grid-view';
import { ListView } from './views/list-view';
import { MasonryView } from './views/masonry-view';

const logger = clientLogger.withContext('FileBrowser');

export const FileBrowser = memo<FileBrowserProps>(function FileBrowserInner(props) {
	const {
		entityType = DEFAULT_PROPS.entityType,
		entityTypes = DEFAULT_PROPS.entityTypes,
		mode = DEFAULT_PROPS.mode,
		items: manualItems = [],
		filterId,
		filterType,
		selectedIds = DEFAULT_PROPS.selectedIds,
		onItemSelect,
		onItemClick,
		onItemDoubleClick,
		className,
		layout = DEFAULT_PROPS.layout,
		preset,
		variant = DEFAULT_PROPS.variant,
		size = DEFAULT_PROPS.size,
	} = props;
	// Estados globales del store
	const viewMode = useViewOptionsStore((state) => state.viewMode);
	const itemSize = useViewOptionsStore((state) => state.itemSize);
	const sortOptions = useViewOptionsStore((state) => state.sortOptions);
	const addSortOption = useViewOptionsStore((state) => state.addSortOption);

	// Preferencias de interfaz (se leerán una vez y se derivan banderas usadas en vistas)
	const interfacePrefs = useInterfaceSettingsStore((s) => s.preferences);

	// Derivar config consolidado para pasar a vistas sin acoplarlas al store global directamente
	const derivedInterfaceConfig = useMemo(() => {
		const fb = interfacePrefs.fileBrowser;
		return {
			global: {
				animations:
					interfacePrefs.animations &&
					interfacePrefs.thumbnailsAnimations &&
					!interfacePrefs.thumbnailsUltraPerformance,
				respectAspect: interfacePrefs.thumbnailsRespectAspectRatio,
				ultra: interfacePrefs.thumbnailsUltraPerformance,
				borderRadius: interfacePrefs.thumbnailsBorderRadius,
				viewTransitions: fb.general.enableViewTransitions,
			},
			performance: {
				virtualization: fb.performance.enableVirtualization,
				overscan: fb.performance.overscanCount,
				thumbnailQuality: fb.performance.thumbnailQuality,
			},
			progressive: {
				enabled: fb.general.enableProgressiveLoading,
				itemsPerBatch: fb.general.itemsPerBatch,
			},
			views: fb.views,
		};
	}, [interfacePrefs]);

	// Panel de detalles
	const { setVisible: setDetailsPanelVisible, setSelectedItems: setDetailsPanelItems } = useDetailsPanel();

	// Referencias y estados locales
	const containerRef = useRef<HTMLElement>(null);
	const measurementInProgressRef = useRef(false);

	// Hook de datos (carga, filtrado, ordenamiento)
	const { items, isLoading, error } = useFileBrowserData({
		entityType: entityType as EntityStatsType | 'mixed',
		entityTypes: Array.isArray(entityTypes) ? entityTypes.slice() : [],
		mode,
		manualItems,
		filterId,
		filterType,
	});

	// Hook de progressive loading
	const { displayedItems, canLoadMore, loadMore, isLoadingMore } = useProgressiveLoading({
		items,
		interfaceConfig: derivedInterfaceConfig,
	});

	// Hook de selección (eventos, shortcuts, acciones)
	const {
		effectiveSelectedIds,
		handleItemClick,
		handleItemClickById,
		handleItemDoubleClick,
		handleItemDoubleClickById,
		handleContextMenuAction,
		clearSelection,
	} = useFileBrowserSelection({
		items: displayedItems,
		selectedIds: Array.isArray(selectedIds) ? selectedIds.slice() : [],
		onItemClick,
		onItemDoubleClick,
	});

	// Estado para el menú contextual
	const {
		isOpen: contextMenuOpen,
		position: contextMenuPosition,
		handleContextMenu,
		closeMenu: closeContextMenu,
	} = useCustomContextMenu();

	// Integración de accesibilidad
	const accessibility = useAccessibility({
		containerRef: containerRef as React.RefObject<HTMLElement>,
		onAnnouncement: (message: string) => {
			logger.debug('Accessibility announcement', { message });
		},
	});

	// Hook de sincronización de archivos - Solo activar si hay filterId de carpeta
	const shouldAutoSync = Boolean(filterId && filterType === 'folder' && !AUTO_SYNC_DISABLED_FOLDERS.includes(filterId));
	const { isSyncing, syncNow } = useFileSync(filterId && filterType === 'folder' ? filterId : undefined, {
		autoSync: shouldAutoSync,
	});

	// Hook de rendimiento con datos vacíos en producción para evitar overhead
	const performance = usePerformance({
		data: process.env.NODE_ENV === 'development' ? items : [],
		searchTerm: '',
	});

	// Measurement y container width
	const [containerWidth, setContainerWidth] = useState<number>(FALLBACK_WIDTH);

	const measureContainer = useCallback(
		(element: HTMLElement) => {
			if (!element) {
				return;
			}
			if (measurementInProgressRef.current) {
				return;
			}
			measurementInProgressRef.current = true;
			// Preferir getBoundingClientRect para incluir padding y evitar 0 en ciertos layouts
			const rect = element.getBoundingClientRect();
			// Intentar detectar viewport real de ScrollArea si existe (Radix agrega un wrapper)
			const viewport = element.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
			const target = viewport ?? element;
			const targetRect = target.getBoundingClientRect();
			const scrollbarCompensation = target.offsetWidth - target.clientWidth; // quitar scrollbar horizontal si aparece
			const width = Math.max(0, targetRect.width - scrollbarCompensation) || rect.width || FALLBACK_WIDTH;
			// Reducimos threshold de cambio a 2px para reaccionar a panel lateral
			if (width > 0 && Math.abs(width - containerWidth) > 2) {
				setContainerWidth(width);
			}
			measurementInProgressRef.current = false;
		},
		[containerWidth]
	);

	const containerCallbackRef = useCallback(
		(element: HTMLElement | null) => {
			if (!element || containerRef.current === element) {
				return;
			}
			containerRef.current = element;
			measureContainer(element);
			const resizeObserver = new ResizeObserver(() => {
				if (containerRef.current) {
					measureContainer(containerRef.current);
				}
			});
			resizeObserver.observe(element);
			return () => resizeObserver.disconnect();
		},
		[measureContainer]
	);

	// Handlers para el menú contextual
	const handleContainerClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			closeContextMenu();
			// Si el click fue en el espacio vacío (no sobre un item), limpiar selección
			const target = e.target as HTMLElement | null;
			const current = e.currentTarget as HTMLElement | null;
			const clickedOnEmpty = !target || !target.closest('[data-item-id]') || target === current;
			if (clickedOnEmpty) {
				clearSelection();
			}
		},
		[closeContextMenu, clearSelection]
	);

	const handleCustomContextMenuAction = useCallback(
		(action: string, _data?: any) => {
			closeContextMenu();
			setTimeout(() => {
				if (derivedInterfaceConfig.global.viewTransitions) {
					startTransition(() => {
						handleContextMenuAction(action);
					});
				} else {
					handleContextMenuAction(action);
				}
			}, 0);
		},
		[handleContextMenuAction, closeContextMenu, derivedInterfaceConfig.global.viewTransitions]
	);

	// Actualizar panel de detalles cuando cambia la selección
	useEffect(() => {
		const hasSelection = effectiveSelectedIds.length > 0;
		if (hasSelection) {
			const idSet = new Set(effectiveSelectedIds);
			const selectedItems = items.filter((it) => idSet.has(it.id));
			setDetailsPanelItems(selectedItems);
			setDetailsPanelVisible(true);
		} else {
			setDetailsPanelItems([]);
		}
	}, [effectiveSelectedIds, items, setDetailsPanelItems, setDetailsPanelVisible]);

	// Props comunes para las vistas (restaurado antes de memo content)
	const commonViewProps = useMemo(
		() => ({
			items: displayedItems,
			itemSize,
			selectedIds: effectiveSelectedIds,
			containerWidth,
			onItemClick: handleItemClick,
			onItemDoubleClick: handleItemDoubleClick,
			interfaceConfig: derivedInterfaceConfig,
			onItemContextMenu: () => {
				/* noop */
			},
			onContextAction: () => {
				/* noop */
			},
		}),
		[
			displayedItems,
			itemSize,
			effectiveSelectedIds,
			containerWidth,
			handleItemClick,
			handleItemDoubleClick,
			derivedInterfaceConfig,
		]
	);

	// Helper functions para componentes internos (restaurados)
	const getItemElement = useCallback((itemId: string): HTMLElement | null => {
		return document.querySelector(`[data-item-id="${itemId}"]`);
	}, []);

	const getViewType = useCallback(() => {
		if (viewMode === 'list') {
			return 'list';
		}
		if (viewMode === 'grid') {
			return 'grid';
		}
		return 'cards';
	}, [viewMode]);

	const handlePreviewItem = useCallback(() => {
		/* noop */
	}, []);

	// Sort activo (última opción como primaria)
	const activeSort = useMemo(() => {
		if (!sortOptions || sortOptions.length === 0) {
			return { field: undefined as string | undefined, direction: 'asc' as const };
		}
		return sortOptions.at(-1) ?? { field: undefined, direction: 'asc' as const };
	}, [sortOptions]);

	// Handler para ordenar desde el header de ListView
	const handleListSort = useCallback(
		(columnKey: string, direction: 'asc' | 'desc') => {
			addSortOption({ field: columnKey, direction });
		},
		[addSortOption]
	);

	// Helpers de renderizado para reducir complejidad cognitiva
	const renderLoading = useCallback(() => (
		<div className="flex h-full w-full items-center justify-center">
			<Spinner />
		</div>
	), []);

	const renderError = useCallback(() => {
		let errMsg = 'Error desconocido';
		if (typeof error === 'string') {
			errMsg = error;
		} else if (error instanceof Error) {
			errMsg = error.message;
		}
		return (
			<div aria-live="assertive" className="flex h-full w-full items-center justify-center" role="alert">
				<p className="text-destructive">Error: {errMsg}</p>
			</div>
		);
	}, [error]);

	const renderEmpty = useCallback(
		() => (
			<EmptyState description="No hay elementos para mostrar." icon={FileTextIcon} title="Sin elementos" />
		),
		[]
	);

	const renderView = useCallback(() => {
		if (viewMode === 'list') {
			return (
				<ListView
					{...commonViewProps}
					onSort={handleListSort}
					sortBy={activeSort.field}
					sortDirection={(activeSort.direction as 'asc' | 'desc') ?? 'asc'}
				/>
			);
		}
		if (viewMode === 'grid' || viewMode === 'simple-grid') {
			return <GridView {...commonViewProps} />;
		}
		if (viewMode === 'masonry') {
			return <MasonryView {...commonViewProps} />;
		}
		return <CardsView {...commonViewProps} />;
	}, [viewMode, commonViewProps, handleListSort, activeSort.field, activeSort.direction]);

	const renderContent = useCallback(() => {
		if (isLoading && items.length === 0) {
			return renderLoading();
		}
		if (error) {
			return renderError();
		}
		if (items.length === 0) {
			return renderEmpty();
		}
		return renderView();
	}, [isLoading, items.length, error, renderLoading, renderError, renderEmpty, renderView]);

	return (
		<div className="flex h-full w-full min-w-0 flex-col overflow-hidden" data-testid="file-browser">
			<main
				aria-describedby="file-browser-description"
				className={cn(
					'flex h-full w-full flex-col overflow-hidden bg-background',
					{
						'accessibility-high-contrast': accessibility.config.highContrast,
						'accessibility-large-fonts': accessibility.config.largeFonts,
						'accessibility-reduced-motion': accessibility.config.reduceMotion,
					},
					className
				)}
				data-testid="file-browser-container"
				onClick={handleContainerClick}
			>
				{/* Wrapper interactivo para eventos */}
				<section className="relative flex min-h-0 min-w-0 flex-1 flex-col">
					<div className="sr-only" id="file-browser-description">
						Explorador de archivos con {items.length} elementos. Usa las flechas para navegar, Enter para abrir, Espacio
						para seleccionar.
					</div>

					<ScrollArea
						aria-atomic="false"
						aria-live="polite"
						className="h-full w-full min-w-0"
						data-testid="file-browser-scroll-area"
					>
						<DragSelectionProvider
							config={{
								enabled: false,
								threshold: 5,
								autoScroll: {
									enabled: true,
									speed: 50,
									threshold: 50,
									maxSpeed: 200,
								},
								modifiers: {
									add: 'ctrl',
									subtract: 'alt',
									toggle: 'shift',
								},
								selectableClass: 'entity-card',
								selectedClass: 'entity-card--selected',
								selectingClass: 'entity-card--selecting',
								containerClass: 'file-browser-container',
							}}
							containerRef={containerRef as React.RefObject<HTMLElement>}
							disabled={true}
							getItemElement={getItemElement}
							items={[] as any}
							onSelectionCancel={() => {
								// Drag selection cancelled
							}}
							onSelectionEnd={(_state, newSelectedIds) => {
								if (newSelectedIds.length > 0) {
									// setSelectedIds(newSelectedIds);
								}
							}}
							onSelectionStart={(_state) => {
								// Drag selection started
							}}
							onSelectionUpdate={(_state, _selectedIds) => {
								// Drag selection updated
							}}
							overlayConfig={{
								showCount: true,
								showCoordinates: false,
								theme: 'auto',
								animation: {
									enabled: true,
									duration: 150,
									easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
								},
							}}
						>
							{/* Contenedor interactivo para eventos (div para evitar botones anidados) */}
							<section
								aria-label="Explorador de archivos"
								className="file-browser-container relative m-0 h-full w-full min-w-0 flex-1 cursor-default border-0 bg-transparent p-0 outline-none"
								onClick={handleContainerClick}
								onContextMenuCapture={handleContextMenu}
								onKeyDown={(e) => {
									if (accessibility.isKeyboardNavigation) {
										switch (e.key) {
											case 'ArrowUp':
											case 'ArrowDown':
											case 'ArrowLeft':
											case 'ArrowRight':
												e.preventDefault();
												if (effectiveSelectedIds.length > 0) {
													accessibility.focusElement(`[data-item-id="${effectiveSelectedIds[0]}"]`);
												}
												break;
											case 'Home':
												e.preventDefault();
												accessibility.focusFirst();
												break;
											case 'End':
												e.preventDefault();
												accessibility.focusLast();
												break;
											default:
												break;
										}
									}
								}}
								ref={containerCallbackRef as any}
							>
								<span className="sr-only">Explorador de archivos</span>
								{/* Navegación por teclado */}
								<KeyboardNavigation
									containerRef={containerRef as React.RefObject<HTMLElement>}
									getItemElement={getItemElement}
									items={displayedItems}
									onOpenItem={onItemDoubleClick}
									onPreviewItem={handlePreviewItem}
									viewType={getViewType()}
								/>

								{containerWidth > 0 ? renderContent() : <Spinner />}

								{/* Botón Cargar Más */}
								{canLoadMore && (
									<div className="flex justify-center p-4">
										<button
											className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
											disabled={isLoadingMore}
											onClick={loadMore}
											type="button"
										>
											{isLoadingMore ? 'Cargando...' : 'Cargar más'}
										</button>
									</div>
								)}

								{/* Menú contextual personalizado */}
								<CustomContextMenu
									isOpen={contextMenuOpen}
									onAction={handleCustomContextMenuAction}
									onClose={closeContextMenu}
									position={contextMenuPosition}
									selectedItems={items.filter((item) => effectiveSelectedIds.includes(item.id))}
								/>
							</section>
						</DragSelectionProvider>
					</ScrollArea>
				</section>

				<StatusBar
					entityType={entityType === 'mixed' ? EntityStatsType.IMAGE : (entityType as EntityStatsType)}
					selectedCount={effectiveSelectedIds.length}
					totalItems={items.length}
				/>

				{/* Progress Overlay */}
				<ProgressOverlay />

				{/* Región para anuncios de lectores de pantalla */}
				<div aria-atomic="true" aria-live="assertive" className="sr-only" id="screen-reader-announcements" />

				{/* Información de rendimiento (solo en desarrollo) */}
				{process.env.NODE_ENV === 'development' && performance.isMonitoring && (
					<div className="fixed right-4 bottom-4 rounded bg-black/80 p-2 font-mono text-white text-xs">
						<div>FPS: {performance.metrics?.averageFPS ?? 'N/A'}</div>
						<div>Memory: {performance.metrics?.memoryUsage ?? 'N/A'}MB</div>
						<div>Entities: {items.length}</div>
					</div>
				)}
			</main>
		</div>
	);
});

/**
 * 📝 Documentación de capacidades multi-entidad:
 *
 * Nuevas capacidades implementadas:
 * 1. ✅ **Modo Mixed**: Combina múltiples tipos de entidades en una sola vista
 * 2. ✅ **Modo Manual**: Acepta items específicos sin cargar desde stores
 * 3. ✅ **EntityCard Integration**: Usa el sistema de cards para renderizar diferentes tipos
 * 4. ✅ **Filtrado Inteligente**: Mantiene filtros por carpeta/colección en modo mixto
 * 5. ✅ **Ordenación Unificada**: Ordena items combinados por fecha de modificación
 * 6. ✅ **Estados Agregados**: Combina estados de carga y error de múltiples stores
 * 7. ✅ **Virtualización Optimizada**: Mantiene rendimiento con múltiples tipos
 * 8. ✅ **Arquitectura Modular**: Refactorizado en módulos separados para mejor mantenibilidad
 *
 * Módulos creados:
 * - `utils/file-browser-helpers.ts`: Funciones utilitarias
 * - `types/file-browser.types.ts`: Definiciones de tipos
 * - `config/file-browser.config.ts`: Configuraciones y constantes
 * - `hooks/use-file-browser-data.ts`: Lógica de datos
 * - `hooks/use-file-browser-selection.ts`: Lógica de selección
 *
 * Ejemplos de uso:
 *
 * // Modo específico (comportamiento original)
 * <FileBrowser entityType="image" />
 *
 * // Modo mixto con múltiples entidades
 * <FileBrowser
 *   entityType="mixed"
 *   entityTypes={['image', 'video', 'audio']}
 * />
 *
 * // Modo manual con items específicos
 * <FileBrowser
 *   entityType="mixed"
 *   mode="manual"
 *   items={customEntityList}
 * />
 */
