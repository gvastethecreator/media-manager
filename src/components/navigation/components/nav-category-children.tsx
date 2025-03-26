'use client';

import type { ViewMode } from '@/components/navigation/types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ViewType } from '@/types/file-item';
import { CornerDownRight, Lightbulb, MessageSquare, StickyNote } from 'lucide-react';
import { forwardRef, memo, useCallback, useImperativeHandle, useState } from 'react';

export type CategoryChild = {
	id: string;
	name: string;
	title?: string; // Para notas que usan title en lugar de name
	emoji?: string;
	color?: string;
	path?: string;
	description?: string;
	_count?: { images: number };
};

export interface CategoryChildrenRef {
	toggleViewMode: () => void;
	getViewMode: () => ViewMode;
}

interface NavCategoryChildrenProps {
	categoryId: ViewType;
	isCollapsed: boolean;
	selectedChildId: string | null;
	currentView: string;
	items: CategoryChild[];
	onItemClick: (id: string) => void;
	onToggleViewMode?: (mode: ViewMode) => void;
}

// Componente memoizado para renderizar un ítem con tooltip
const ItemWithTooltip = memo(function ItemWithTooltip({
	item,
	isSelected,
	onClick,
	viewMode,
	renderInside,
	tooltipContent,
	buttonClassName,
	listIcon,
}: {
	item: CategoryChild;
	isSelected: boolean;
	onClick: () => void;
	viewMode: ViewMode;
	renderInside: React.ReactNode;
	tooltipContent: React.ReactNode;
	buttonClassName?: string;
	listIcon?: boolean;
}) {
	// Optimización para mostrar tooltip solo cuando sea necesario (hover)
	const [showTooltip, setShowTooltip] = useState(false);

	const handleMouseEnter = useCallback(() => {
		setShowTooltip(true);
	}, []);

	const handleMouseLeave = useCallback(() => {
		setShowTooltip(false);
	}, []);

	return (
		<div
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className="relative"
		>
			<Button
				variant="ghost"
				size="sm"
				className={cn(
					'group relative font-normal transition-all cursor-pointer overflow-hidden',
					viewMode === 'grid'
						? 'h-6 px-2 py-0 text-xs rounded-md m-0.5 max-w-fit'
						: 'w-full justify-start rounded-none text-xs h-7 px-1 py-0 hover:bg-gray-100/10',
					isSelected && 'bg-gray-100/5 font-medium text-foreground',
					viewMode === 'list' && 'nav-item-button',
					buttonClassName
				)}
				onClick={onClick}
			>
				<div className={cn(
					'flex items-center',
					viewMode === 'grid' ? 'gap-1' : 'w-full min-w-0'
				)}>
					{viewMode === 'list' && listIcon && <CornerDownRight className="h-2 w-2 text-muted mr-1 shrink-0" />}
					{renderInside}
				</div>
			</Button>

			{/* Renderizar tooltip solo cuando se hace hover */}
			{showTooltip && (
				<TooltipProvider delayDuration={200}>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="absolute inset-0 pointer-events-none" />
						</TooltipTrigger>
						<TooltipContent side="right" className="text-xs tooltip-with-info">
							{tooltipContent}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	);
});

// Componente memoizado para renderizar la lista de ítems
const CategoryItems = memo(function CategoryItems({
	items,
	categoryId,
	viewMode,
	currentView,
	selectedChildId,
	onItemClick,
}: {
	items: CategoryChild[];
	categoryId: ViewType;
	viewMode: ViewMode;
	currentView: string;
	selectedChildId: string | null;
	onItemClick: (id: string) => void;
}) {
	// Memorizar los handlers para cada ítem para evitar recreaciones
	const getItemClickHandler = useCallback((itemId: string) => {
		return () => onItemClick(itemId);
	}, [onItemClick]);

	if (items.length === 0) {
		return <div className="px-0 py-1 text-[10px] text-muted-foreground italic">No hay elementos</div>;
	}

	// Renderizar elementos especiales para etiquetas
	if (categoryId === 'tags') {
		return (
			<div className={cn(
				'ml-1 mb-1 max-w-full',
				viewMode === 'grid' ? 'flex flex-wrap gap-1' : 'flex flex-col space-y-1'
			)}>
				{items.map((tag) => (
					<Button
						key={tag.id}
						variant="ghost"
						className={cn(
							'transition-all duration-150 text-foreground font-medium nav-tag cursor-pointer relative',
							currentView === 'tag-content' && selectedChildId === tag.name && 'ring-1 ring-primary/30',
							'hover:brightness-110 flex items-center gap-1',
							viewMode === 'grid'
								? 'h-5 px-2 text-[10px] rounded-none max-w-fit'
								: 'h-6 px-2 text-xs justify-start rounded-sm w-full'
						)}
						style={{ backgroundColor: tag.color || '#888' }}
						onClick={() => onItemClick(tag.name)}
						title={`${tag._count?.images || 0} imágenes${tag.description ? ` - ${tag.description}` : ''}`}
					>
						<span className="truncate">{tag.name}</span>
						{tag._count && tag._count.images > 0 && (
							<span className={cn(
								'px-1 py-0 bg-black/30 rounded-sm whitespace-nowrap',
								viewMode === 'grid' ? 'ml-1 text-[8px]' : 'ml-auto text-[9px]'
							)}>
								{tag._count.images}
							</span>
						)}
					</Button>
				))}
			</div>
		);
	}

	// Renderizar elementos para notas
	if (categoryId === 'notes') {
		return (
			<div className={cn(
				'transition-all duration-200',
				viewMode === 'grid' ? 'flex flex-wrap gap-1 px-1' : 'space-y-0.5'
			)}>
				{items.map((note) => {
					const isSelected = selectedChildId === note.id && currentView === 'note-content';
					const displayName = note.title || note.name;

					return (
						<ItemWithTooltip
							key={note.id}
							item={note}
							isSelected={isSelected}
							viewMode={viewMode}
							onClick={getItemClickHandler(note.id)}
							listIcon={true}
							renderInside={
								<>
									{viewMode === 'list' && <CornerDownRight className="h-2 w-2 text-muted mr-1 shrink-0" />}
									<StickyNote className="h-3 w-3 text-purple-400 mr-1 shrink-0" />
									<span className="truncate">{displayName}</span>
								</>
							}
							tooltipContent={
								<>
									<p>{displayName}</p>
									{note.description && <p>{note.description}</p>}
								</>
							}
						/>
					);
				})}
			</div>
		);
	}

	// Renderizar elementos para conceptos
	if (categoryId === 'concepts') {
		return (
			<div className={cn(
				'transition-all duration-200',
				viewMode === 'grid' ? 'flex flex-wrap gap-1 px-1' : 'space-y-0.5'
			)}>
				{items.map((concept) => {
					const isSelected = selectedChildId === concept.id && currentView === 'concept-content';

					return (
						<ItemWithTooltip
							key={concept.id}
							item={concept}
							isSelected={isSelected}
							viewMode={viewMode}
							onClick={getItemClickHandler(concept.id)}
							listIcon={true}
							renderInside={
								<>
									<Lightbulb className="h-3 w-3 text-blue-400 mr-1 shrink-0" />
									<span className="truncate">{concept.name}</span>
								</>
							}
							tooltipContent={
								<>
									<p>{concept.name}</p>
									{concept.description && <p>{concept.description}</p>}
								</>
							}
						/>
					);
				})}
			</div>
		);
	}

	// Renderizar elementos para prompts
	if (categoryId === 'prompts') {
		return (
			<div className={cn(
				'transition-all duration-200',
				viewMode === 'grid' ? 'flex flex-wrap gap-1 px-1' : 'space-y-0.5'
			)}>
				{items.map((prompt) => {
					const isSelected = selectedChildId === prompt.id && currentView === 'prompt-content';

					return (
						<ItemWithTooltip
							key={prompt.id}
							item={prompt}
							isSelected={isSelected}
							viewMode={viewMode}
							onClick={getItemClickHandler(prompt.id)}
							listIcon={true}
							renderInside={
								<>
									<MessageSquare className="h-3 w-3 text-green-400 mr-1 shrink-0" />
									<span className="truncate">{prompt.name}</span>
								</>
							}
							tooltipContent={
								<>
									<p>{prompt.name}</p>
									{prompt.description && <p>{prompt.description}</p>}
								</>
							}
						/>
					);
				})}
			</div>
		);
	}

	// Renderizar elementos normales para otras categorías
	return (
		<div className={cn(
			'transition-all duration-200',
			viewMode === 'grid' ? 'flex flex-wrap gap-1 px-1' : 'space-y-0.5'
		)}>
			{items.map((item) => {
				const isSelected = selectedChildId === item.id && currentView === `${categoryId.replace(/s$/, '')}-content`;
				const imageCount = item._count?.images || 0;

				return (
					<ItemWithTooltip
						key={item.id}
						item={item}
						isSelected={isSelected}
						viewMode={viewMode}
						onClick={getItemClickHandler(item.id)}
						listIcon={true}
						renderInside={
							<>
								{item.emoji && <span className="text-xs shrink-0 mr-1">{item.emoji}</span>}
								<span className="truncate">{item.name}</span>
								<div
									className={cn(
										'shrink-0 inline-flex items-center space-x-0.5 px-1 rounded-sm text-muted-foreground text-[9px] bg-secondary/30 nav-count-badge',
										imageCount > 0 ? 'opacity-100' : 'opacity-60',
										viewMode === 'grid' ? 'ml-1' : 'ml-auto'
									)}
								>
									<span>{imageCount}</span>
								</div>
							</>
						}
						tooltipContent={
							<>
								{item.path && <p className="text-muted-foreground text-[10px]">{item.path}</p>}
								{item.description && <p>{item.description}</p>}
								<p>{imageCount} imágenes</p>
							</>
						}
					/>
				);
			})}
		</div>
	);
});

// Componente principal
export const NavCategoryChildren = memo(forwardRef<CategoryChildrenRef, NavCategoryChildrenProps>(({
	categoryId,
	isCollapsed,
	selectedChildId,
	currentView,
	items,
	onItemClick,
	onToggleViewMode
}, ref) => {
	// Estado local para el modo de vista
	const [viewMode, setViewMode] = useState<ViewMode>('list');

	// Exponer métodos al componente padre
	useImperativeHandle(ref, () => ({
		toggleViewMode: () => {
			const newMode = viewMode === 'list' ? 'grid' : 'list';
			setViewMode(newMode);
			onToggleViewMode?.(newMode);
		},
		getViewMode: () => viewMode
	}), [viewMode, onToggleViewMode]);

	// Si está colapsado, no mostrar nada
	if (isCollapsed) {
		return null;
	}

	return (
		<>
			<div className="flex items-center justify-between mb-1 px-1">
				<span className="text-[10px] text-muted-foreground">
					{items.length} elemento{items.length !== 1 ? 's' : ''}{' '}
					{categoryId === 'tags' && 'etiqueta'}{categoryId === 'tags' && items.length !== 1 && 's'}
					{categoryId === 'notes' && 'nota'}{categoryId === 'notes' && items.length !== 1 && 's'}
					{categoryId === 'concepts' && 'concepto'}{categoryId === 'concepts' && items.length !== 1 && 's'}
					{categoryId === 'prompts' && 'prompt'}{categoryId === 'prompts' && items.length !== 1 && 's'}
				</span>
			</div>

			{/* Renderizado condicional de los ítems */}
			<CategoryItems
				items={items}
				categoryId={categoryId}
				viewMode={viewMode}
				currentView={currentView}
				selectedChildId={selectedChildId}
				onItemClick={onItemClick}
			/>
		</>
	);
}));
