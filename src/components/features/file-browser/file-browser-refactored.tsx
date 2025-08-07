/**
 * @file FileBrowser V2 - Componente refactorizado y modularizado
 * @module components/features/file-browser/file-browser-v2
 * @description FileBrowser refactorizado que usa stores específicos por entidad,
 * tipos optimizados WithStats, virtualización con TanStack Virtual y soporte multi-entidad.
 * Ahora modularizado para mejor mantenibilidad.
 */

import { FileTextIcon } from 'lucide-react';
import React, { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OptimizedEntityCard } from '@/components/cards/entity-card';
import { EmptyState } from '@/components/core/data-display';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { useCustomContextMenu } from '@/hooks/use-custom-context-menu';
import { useFileSync } from '@/hooks/use-file-sync';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { EntityStatsType } from '@/types/migration';
// Imports de módulos refactorizados
import { AUTO_SYNC_DISABLED_FOLDERS, DEFAULT_PROPS, FALLBACK_WIDTH } from './config/file-browser.config';
import { CustomContextMenu } from './context-menu/custom-context-menu';
import { useAccessibility } from './hooks/use-accessibility';
import { useFileBrowserData } from './hooks/use-file-browser-data';
import { useFileBrowserSelection } from './hooks/use-file-browser-selection';
import { usePerformance } from './hooks/use-performance';
import { KeyboardNavigation } from './navigation/keyboard-navigation';
import { ProgressOverlay } from './progress/progress-overlay';
import { DragSelectionProvider } from './selection/drag-selection-provider';
import { StatusBar } from './toolbar/status-bar';
import type { FileBrowserProps } from './types/file-browser.types';
import { convertToFileItem } from './utils/file-browser-helpers';
import { CardsView } from './views/cards-view';
import { GridView } from './views/grid-view';
import { ListView } from './views/list-view';
import { MasonryView } from './views/masonry-view';

// Import CSS for user-select fixes
import './styles/user-select.css';
import './selection/selection-styles.css';

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

	// Panel de detalles
	const { setVisible: setDetailsPanelVisible, setSelectedItems: setDetailsPanelItems } = useDetailsPanel();

	// Referencias y estados locales
	const containerRef = useRef<HTMLElement>(null);
	const measurementInProgressRef = useRef(false);

	// Hook de datos (carga, filtrado, ordenamiento)
	const { items, isLoading, error } = useFileBrowserData({
		entityType: entityType as EntityStatsType | 'mixed',
		entityTypes: [...entityTypes],
		mode,
		manualItems,
		filterId,
		filterType,
	});

	// Hook de selección (eventos, shortcuts, acciones)
	const {
		effectiveSelectedIds,
		handleItemClick,
		handleItemClickById,
		handleItemDoubleClick,
		handleItemDoubleClickById,
		handleContextMenuAction,
	} = useFileBrowserSelection({
		items,
		selectedIds: [...selectedIds],
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
		onAnnouncement: (message: string) => console.log('Accessibility announcement:', message),
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
			if (measurementInProgressRef.current) {
				return;
			}
			measurementInProgressRef.current = true;

			const width = element?.clientWidth || element?.offsetWidth || FALLBACK_WIDTH;
			if (width > 0 && Math.abs(width - containerWidth) > 10) {
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

			// ResizeObserver simple sin debounce costoso
			const resizeObserver = new ResizeObserver((entries) => {
				const entry = entries[0];
				if (entry) {
					const width = entry.contentRect.width;
					if (width > 0 && Math.abs(width - containerWidth) > 10) {
						setContainerWidth(width);
					}
				}
			});

			resizeObserver.observe(element);
			return () => resizeObserver.disconnect();
		},
		[measureContainer, containerWidth]
	);

	// Handlers para el menú contextual
	const handleContainerClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			closeContextMenu();
		},
		[closeContextMenu]
	);

	const handleCustomContextMenuAction = useCallback(
		(action: string, _data?: any) => {
			closeContextMenu();
			setTimeout(() => {
				startTransition(() => {
					handleContextMenuAction(action);
				});
			}, 0);
		},
		[handleContextMenuAction, closeContextMenu]
	);

	// Actualizar panel de detalles cuando cambia la selección
	useEffect(() => {
		if (effectiveSelectedIds.length > 0) {
			const selectedItems = items.filter((item) => effectiveSelectedIds.includes(item.id));
			setDetailsPanelItems(selectedItems);
			setDetailsPanelVisible(true);
		} else {
			setDetailsPanelVisible(false);
		}
	}, [effectiveSelectedIds, items, setDetailsPanelItems, setDetailsPanelVisible]);

	// Función para renderizar item usando EntityCard
	const renderItem = useCallback(
		(item: any, _index: number) => {
			const clickHandler = (e: React.MouseEvent) => handleItemClickById(item.id, e);
			return (
				<OptimizedEntityCard
					className="h-full w-full"
					entity={item}
					key={item.id}
					layout={layout}
					onClick={clickHandler}
					onDoubleClick={() => handleItemDoubleClickById(item.id)}
					preset={preset}
					size={size}
					variant={variant}
				/>
			);
		},
		[handleItemClickById, handleItemDoubleClickById, layout, preset, variant, size]
	);

	// Props comunes para las vistas
	const commonViewProps = useMemo(
		() => ({
			items,
			itemSize,
			selectedIds: effectiveSelectedIds,
			containerWidth,
			onItemClick: handleItemClick,
			onItemDoubleClick: handleItemDoubleClick,
			onItemContextMenu: () => {}, // Implementar si es necesario
			onContextAction: () => {}, // Implementar si es necesario
		}),
		[items, itemSize, effectiveSelectedIds, containerWidth, handleItemClick, handleItemDoubleClick]
	);

	// Helper functions para componentes internos
	const getItemElement = useCallback((itemId: string): HTMLElement | null => {
		return document.querySelector(`[data-item-id="${itemId}"]`);
	}, []);

	const getViewType = useCallback(() => {
		if (viewMode === 'list') return 'list';
		if (viewMode === 'grid') return 'grid';
		return 'cards';
	}, [viewMode]);

	const handlePreviewItem = useCallback((item: any) => {
		// Implementar previsualización si es necesario
	}, []);

	// fileItems para drag selection
	const fileItems = useMemo(() => {
		return items.map(convertToFileItem);
	}, [items]);

	// Renderizar contenido según el estado
	const renderContent = () => {
		if (isLoading && items.length === 0) {
			return (
				<div className="flex h-full w-full items-center justify-center">
					<Spinner />
				</div>
			);
		}

		if (error) {
			return (
				<div className="flex h-full w-full items-center justify-center">
					<p className="text-destructive">Error: {error}</p>
				</div>
			);
		}

		if (items.length === 0) {
			return <EmptyState description="No hay elementos para mostrar." icon={FileTextIcon} title="Sin elementos" />;
		}

		switch (viewMode) {
			case 'list':
				return <ListView {...commonViewProps} />;
			case 'grid':
			case 'simple-grid':
				return <GridView {...commonViewProps} />;
			case 'cards':
				return <CardsView {...commonViewProps} />;
			case 'masonry':
				return <MasonryView {...commonViewProps} />;
			default:
				return <CardsView {...commonViewProps} />;
		}
	};

	return (
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
		>
			{/* Wrapper interactivo para eventos */}
			<section className="relative h-full w-full">
				<div className="sr-only" id="file-browser-description">
					Explorador de archivos con {items.length} elementos. Usa las flechas para navegar, Enter para abrir, Espacio
					para seleccionar.
				</div>

				<ScrollArea aria-atomic="false" aria-live="polite" className="relative min-h-0 flex-1">
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
						items={fileItems as any}
						onSelectionCancel={() => {}}
						onSelectionEnd={(_state, newSelectedIds) => {
							if (newSelectedIds.length > 0) {
								// setSelectedIds(newSelectedIds);
							}
						}}
						onSelectionStart={(_state) => {}}
						onSelectionUpdate={(_state, _selectedIds) => {}}
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
						{/* Invisible button wrapper para eventos */}
						<button
							aria-label="Explorador de archivos"
							className="file-browser-container relative m-0 h-full w-full cursor-default border-0 bg-transparent p-0 outline-none"
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
							type="button"
						>
							{/* Navegación por teclado */}
							<KeyboardNavigation
								containerRef={containerRef as React.RefObject<HTMLElement>}
								getItemElement={getItemElement}
								items={items}
								onOpenItem={onItemDoubleClick}
								onPreviewItem={handlePreviewItem}
								viewType={getViewType()}
							/>

							{containerWidth > 0 ? renderContent() : <Spinner />}

							{/* Menú contextual personalizado */}
							<CustomContextMenu
								isOpen={contextMenuOpen}
								onAction={handleCustomContextMenuAction}
								onClose={closeContextMenu}
								position={contextMenuPosition}
								selectedItems={items.filter((item) => effectiveSelectedIds.includes(item.id))}
							/>
						</button>
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
