'use client';

import { EmptyState } from '@/components/core/data-display';
import { type ImageItem } from '@/components/features/file-viewer/file-viewer';
import { Spinner } from '@/components/ui/spinner';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { AnyEntity } from '@/types/entities';
import { FileItem } from '@/types/files';
import { FileTextIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFilteredData } from './hooks/use-filtered-data';
import './styles/scrollbar.css';
import { StatusBar } from './toolbar/status-bar';
import { fileItemsToAnyEntities, fileItemsToImageItems } from './utils/file-converters';
import { CardsView } from './views/cards-view';
import { ListView } from './views/list-view';
import { MasonryView } from './views/masonry-view';
import { SimpleGridView } from './views/simple-grid-view';

const logger = clientLogger.withContext('FileBrowser');

interface FileBrowserProps {
	items: FileItem[];
	onItemSelect?: (item: FileItem) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	className?: string;
	isLoading?: boolean;
	isReindexing?: boolean;
	reindexProgress?: number;
	loadMoreItems?: () => void;
}

const _FALLBACK_WIDTH = 1200;

export const FileBrowser = memo<FileBrowserProps>(function FileBrowser({
	items,
	onItemSelect,
	onItemDoubleClick,
	className,
	isLoading = false,
	isReindexing = false,
	reindexProgress = 0,
	loadMoreItems,
}) {
	const [_containerWidth, setContainerWidth] = useState<number>(0);
	const [_isViewerOpen, setIsViewerOpen] = useState(false);
	const [_viewerImages, setViewerImages] = useState<ImageItem[]>([]);
	const [_viewerInitialIndex, setViewerInitialIndex] = useState(0);
	const lastSelectedItemIndexRef = useRef<number | null>(null);
	const [contextMenuFile, setContextMenuFile] = useState<FileItem | null>(null);
	const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

	const viewMode = useViewOptionsStore((state) => state.viewMode);
	const itemSize = useViewOptionsStore((state) => state.itemSize);
	const { searchQuery, sortOptions, filterOptions } = useViewOptionsStore();

	const containerRef = useRef<HTMLDivElement>(null);
	const measurementAttemptsRef = useRef(0);

	const { selectedIds, setSelectedIds, clearSelection } = useSelectionStore();
	const { setVisible: setDetailsPanelVisible, setSelectedItems: setDetailsPanelItems } = useDetailsPanel();

	const filteredData = useFilteredData(items, { searchQuery, sortOptions, filterOptions });
	const imageItems = useMemo(() => fileItemsToImageItems(filteredData), [filteredData]);
	const entityItems = useMemo(() => fileItemsToAnyEntities(filteredData), [filteredData]);

	const handleContextMenu = useCallback(
		(item: AnyEntity | FileItem, e?: React.MouseEvent) => {
			const originalFileItem = filteredData.find((f) => f.id === item.id);
			if (!originalFileItem) return;

			if (e) {
				e.preventDefault();
				e.stopPropagation();
				setContextMenuPosition({ x: e.clientX, y: e.clientY });
			}
			setContextMenuFile(originalFileItem);
		},
		[filteredData]
	);

	const _measureContainer = useCallback((element: HTMLDivElement) => {
		const attempt = ++measurementAttemptsRef.current;
		logger.debug(`[FileBrowser] Intento medición ${attempt}`);

		const measure = () => {
			const width = element.offsetWidth;
			if (width > 0) {
				logger.info(`[FileBrowser] ✅ Medición exitosa: ${width}px`);
				setContainerWidth(width);
				return true;
			}
			return false;
		};
		if (measure()) return;
		requestAnimationFrame(() => {
			if (measure()) return;
			setTimeout(() => {
				if (measure()) return;
				logger.warn(`[FileBrowser] ⚠️ Falló medición, usando fallback: ${_FALLBACK_WIDTH}px`);
				setContainerWidth(_FALLBACK_WIDTH);
			}, 100);
		});
	}, []);

	const containerCallbackRef = useCallback(
		(element: HTMLButtonElement | null) => {
			if (element && containerRef.current !== element) {
				containerRef.current = element as HTMLDivElement;
				_measureContainer(element as HTMLDivElement);
			}
		},
		[_measureContainer]
	);

	const handleItemClick = useCallback(
		(item: AnyEntity | FileItem, e: React.MouseEvent) => {
			const originalFileItem = filteredData.find((f) => f.id === item.id);
			if (!originalFileItem) return;

			const itemIndex = filteredData.indexOf(originalFileItem);
			const isShiftClick = e.shiftKey;
			const isCtrlClick = e.ctrlKey || e.metaKey;

			if (isShiftClick && lastSelectedItemIndexRef.current !== null) {
				const start = Math.min(lastSelectedItemIndexRef.current, itemIndex);
				const end = Math.max(lastSelectedItemIndexRef.current, itemIndex);
				const rangeIds = filteredData.slice(start, end + 1).map((i) => i.id);
				setSelectedIds(rangeIds);
			} else if (isCtrlClick) {
				const newSelection = new Set(selectedIds);
				if (newSelection.has(originalFileItem.id)) {
					newSelection.delete(originalFileItem.id);
				} else {
					newSelection.add(originalFileItem.id);
				}
				setSelectedIds(Array.from(newSelection));
			} else {
				setSelectedIds([originalFileItem.id]);
			}

			lastSelectedItemIndexRef.current = itemIndex;
			onItemSelect?.(originalFileItem);
		},
		[selectedIds, setSelectedIds, onItemSelect, filteredData]
	);

	const handleListItemClick = useCallback(
		(item: FileItem, e: React.MouseEvent) => {
			handleItemClick(item, e);
		},
		[handleItemClick]
	);

	const handleItemDoubleClick = useCallback(
		(item: AnyEntity | FileItem) => {
			const originalFileItem = filteredData.find((f) => f.id === item.id);
			if (!originalFileItem) return;

			const itemIndex = imageItems.findIndex((i) => i.id === item.id);
			if (itemIndex !== -1) {
				setViewerImages(imageItems);
				setViewerInitialIndex(itemIndex);
				setIsViewerOpen(true);
			}
			onItemDoubleClick?.(originalFileItem);
		},
		[imageItems, onItemDoubleClick, filteredData]
	);

	useEffect(() => {
		if (selectedIds.length > 0) {
			const selectedItems = items.filter((item) => selectedIds.includes(item.id));
			setDetailsPanelItems(selectedItems);
			setDetailsPanelVisible(true);
		} else {
			setDetailsPanelVisible(false);
		}
	}, [selectedIds, items, setDetailsPanelItems, setDetailsPanelVisible]);

	const renderContent = () => {
		if (isLoading) {
			return (
				<div className="flex h-full w-full items-center justify-center">
					<Spinner />
				</div>
			);
		}

		if (filteredData.length === 0) {
			return (
				<EmptyState
					icon={<FileTextIcon />}
					title={searchQuery ? 'Sin resultados' : 'Carpeta vacía'}
					description={searchQuery ? 'Intenta con otra búsqueda.' : 'Esta carpeta no contiene archivos.'}
				/>
			);
		}

		const commonViewProps = {
			itemSize,
			selectedIds,
			containerWidth: _containerWidth,
			onItemDoubleClick: handleItemDoubleClick,
			onContextMenu: handleContextMenu,
		};

		switch (viewMode) {
			case 'list':
				return (
					<ListView
						{...commonViewProps}
						items={filteredData}
						onItemClick={handleListItemClick}
					/>
				);
			case 'grid':
				return <CardsView {...commonViewProps} items={entityItems} onItemClick={handleItemClick} />;
			case 'simple-grid':
				return <SimpleGridView {...commonViewProps} items={entityItems} onItemClick={handleItemClick} />;
			case 'masonry':
				return (
					<MasonryView
						{...commonViewProps}
						items={entityItems}
						onItemClick={handleItemClick}
						imageItems={imageItems}
					/>
				);
			default:
				return <CardsView {...commonViewProps} items={entityItems} onItemClick={handleItemClick} />;
		}
	};

	return (
		<div className={cn('flex h-full w-full flex-col bg-background', className)}>
			<button
				ref={containerCallbackRef}
				type="button"
				className="relative h-full w-full flex-grow overflow-y-auto bg-transparent cursor-default p-0 text-left border-0 focus:outline-none"
				onClick={(e) => {
					if (e.target === e.currentTarget) {
						clearSelection();
					}
				}}
			>
				<AnimatePresence>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="h-full w-full"
					>
						{_containerWidth > 0 ? renderContent() : <Spinner />}
					</motion.div>
				</AnimatePresence>
			</button>
			<StatusBar items={filteredData} />
		</div>
	);
});
