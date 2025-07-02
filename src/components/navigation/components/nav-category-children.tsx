import type { ViewMode } from '@/components/navigation/types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ViewType } from '@/components/views/types';
import { cn } from '@/lib/utils';
import { CornerDownRight, Lightbulb, MessageSquare, StickyNote } from 'lucide-react';
import type React from 'react';
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';

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
const ItemWithTooltip = memo(
	function ItemWithTooltip({
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

		// Memoizamos las clases para evitar recálculos constantes
		const buttonClasses = useMemo(
			() =>
				cn(
					'group relative font-normal transition-all cursor-pointer overflow-hidden',
					viewMode === 'grid'
						? 'h-6 px-2 py-0 text-xs rounded-md m-0.5 max-w-fit'
						: 'w-full justify-start rounded-none text-xs h-7 px-1 py-0 hover:bg-gray-100/10',
					isSelected && 'bg-gray-100/5 font-medium text-foreground',
					viewMode === 'list' && 'nav-item-button',
					buttonClassName
				),
			[viewMode, isSelected, buttonClassName]
		);

		const containerClasses = useMemo(
			() => cn('flex items-center', viewMode === 'grid' ? 'gap-1' : 'w-full min-w-0'),
			[viewMode]
		);

		// Eliminar las referencias a estados/props dentro del useEffect
		useEffect(() => {
			// Limpieza del tooltip al desmontar
			return () => {
				setShowTooltip(false);
			};
		}, []);

		return (
			<div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="relative">
				<Button variant="ghost" size="sm" className={buttonClasses} onClick={onClick}>
					<div className={containerClasses}>
						{viewMode === 'list' && listIcon && <CornerDownRight className="h-2 w-2 text-muted mr-1 shrink-0" />}
						{renderInside}
					</div>
				</Button>

				{/* Renderizar tooltip solo cuando se hace hover - usando portales para evitar manipulaciones DOM complejas */}
				{showTooltip && (
					<TooltipProvider delayDuration={200}>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="absolute inset-0 pointer-events-none" />
							</TooltipTrigger>
							<TooltipContent side="right" className="text-xs tooltip-with-info" sideOffset={5}>
								{tooltipContent}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</div>
		);
	},
	(prevProps, nextProps) => {
		// Comparación personalizada para evitar re-renders innecesarios
		if (prevProps.isSelected !== nextProps.isSelected) return false;
		if (prevProps.viewMode !== nextProps.viewMode) return false;
		if (prevProps.onClick !== nextProps.onClick) return false;

		// Para item, solo comparamos los campos relevantes que afectan el renderizado
		if (prevProps.item.id !== nextProps.item.id) return false;
		if (prevProps.item.name !== nextProps.item.name) return false;
		if (prevProps.item.emoji !== nextProps.item.emoji) return false;
		if (prevProps.item._count?.images !== nextProps.item._count?.images) return false;

		// Si llegamos aquí, consideramos que no necesitamos re-renderizar
		return true;
	}
);

// Componente memoizado para renderizar la lista de ítems
const CategoryItems = memo(
	function CategoryItems({
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
		// Creamos una función de click estable por categoría
		const stableOnItemClick = useCallback(onItemClick, []);

		// Memoizamos los handlers para cada ítem para evitar recreaciones
		const _getItemClickHandler = useCallback(
			(itemId: string) => {
				return () => stableOnItemClick(itemId);
			},
			[stableOnItemClick]
		);

		// Memoizamos la validación de selección
		const isItemSelected = useCallback(
			(itemId: string, categoryType: string) => {
				return selectedChildId === itemId && currentView === `${categoryType}-content`;
			},
			[selectedChildId, currentView]
		);

		// Memoizamos las clases CSS para los contenedores
		const containerClassName = useMemo(
			() => cn('transition-all duration-200', viewMode === 'grid' ? 'flex flex-wrap gap-1 px-1' : 'space-y-0.5'),
			[viewMode]
		);

		const tagsContainerClassName = useMemo(
			() => cn('ml-1 mb-1 max-w-full', viewMode === 'grid' ? 'flex flex-wrap gap-1' : 'flex flex-col space-y-1'),
			[viewMode]
		);

		// Creamos un mapa para los handlers de click para tags
		const tagClickHandlers = useMemo(() => {
			if (categoryId !== 'tags') return {};

			const handlers: Record<string, () => void> = {};
			for (const tag of items) {
				handlers[tag.name] = () => stableOnItemClick(tag.name);
			}
			return handlers;
		}, [items, categoryId, stableOnItemClick]);

		// Creamos un mapa para los handlers de click para otros items
		const itemClickHandlers = useMemo(() => {
			if (categoryId === 'tags') return {};

			const handlers: Record<string, () => void> = {};
			for (const item of items) {
				handlers[item.id] = () => stableOnItemClick(item.id);
			}
			return handlers;
		}, [items, categoryId, stableOnItemClick]);

		// Memoizamos directamente los items renderizados sin useCallback adicional
		const renderedItems = useMemo(() => {
			// Renderizar elementos especiales para etiquetas
			if (categoryId === 'tags') {
				return (
					<div className={tagsContainerClassName}>
						{items.map((tag) => {
							// Usar el handler precomputado
							const handleClick = tagClickHandlers[tag.name];

							const isSelected = currentView === 'tag-content' && selectedChildId === tag.name;

							const tagClassName = cn(
								'transition-all duration-150 text-foreground font-medium nav-tag cursor-pointer relative',
								isSelected && 'ring-1 ring-primary/30',
								'hover:brightness-110 flex items-center gap-1',
								viewMode === 'grid'
									? 'h-5 px-2 text-[10px] rounded-none max-w-fit'
									: 'h-6 px-2 text-xs justify-start rounded-sm w-full'
							);

							const countClassName = cn(
								'px-1 py-0 bg-black/30 rounded-sm whitespace-nowrap',
								viewMode === 'grid' ? 'ml-1 text-[8px]' : 'ml-auto text-[9px]'
							);

							return (
								<Button
									key={tag.id}
									variant="ghost"
									className={tagClassName}
									style={{ backgroundColor: tag.color || '#888' }}
									onClick={handleClick}
									title={`${tag._count?.images || 0} imágenes${tag.description ? ` - ${tag.description}` : ''}`}
								>
									<span className="truncate">{tag.name}</span>
									{tag._count && tag._count.images > 0 && <span className={countClassName}>{tag._count.images}</span>}
								</Button>
							);
						})}
					</div>
				);
			}

			// Para el resto de las categorías usamos un enfoque similar
			// Memoizar los elementos renderizados para cada tipo
			return items.map((item) => {
				// Usar el handler precomputado
				const handleClick = itemClickHandlers[item.id];

				let isSelected = false;
				let icon = null;

				// Configurar según el tipo
				if (categoryId === 'notes') {
					isSelected = isItemSelected(item.id, 'note');
					icon = <StickyNote className="h-3 w-3 text-purple-400 mr-1 shrink-0" />;
				} else if (categoryId === 'concepts') {
					isSelected = isItemSelected(item.id, 'concept');
					icon = <Lightbulb className="h-3 w-3 text-blue-400 mr-1 shrink-0" />;
				} else if (categoryId === 'prompts') {
					isSelected = isItemSelected(item.id, 'prompt');
					icon = <MessageSquare className="h-3 w-3 text-green-400 mr-1 shrink-0" />;
				} else {
					isSelected = isItemSelected(item.id, categoryId.replace(/s$/, ''));
					icon = null;
				}

				// Configurar contenido personalizado
				const displayName = 'title' in item && item.title ? item.title : item.name;
				const imageCount = item._count?.images || 0;

				// Crear renderInside estable
				const renderInside = (
					<>
						{icon}
						{item.emoji && <span className="text-xs shrink-0 mr-1">{item.emoji}</span>}
						<span className="truncate">{displayName}</span>
						{categoryId !== 'notes' && categoryId !== 'concepts' && categoryId !== 'prompts' && (
							<div
								className={cn(
									'shrink-0 inline-flex items-center space-x-0.5 px-1 rounded-sm text-muted-foreground text-[9px] bg-secondary/30 nav-count-badge',
									imageCount > 0 ? 'opacity-100' : 'opacity-60',
									viewMode === 'grid' ? 'ml-1' : 'ml-auto'
								)}
							>
								<span>{imageCount}</span>
							</div>
						)}
					</>
				);

				// Crear tooltipContent estable
				const tooltipContent = (
					<>
						<p>{displayName}</p>
						{item.path && <p className="text-muted-foreground text-[10px]">{item.path}</p>}
						{item.description && <p>{item.description}</p>}
						{imageCount > 0 && <p>{imageCount} imágenes</p>}
					</>
				);

				return (
					<ItemWithTooltip
						key={item.id}
						item={item}
						isSelected={isSelected}
						viewMode={viewMode}
						onClick={handleClick}
						listIcon={true}
						renderInside={renderInside}
						tooltipContent={tooltipContent}
					/>
				);
			});
		}, [
			categoryId,
			items,
			viewMode,
			currentView,
			selectedChildId,
			tagsContainerClassName,
			tagClickHandlers,
			itemClickHandlers,
			isItemSelected,
		]);

		if (items.length === 0) {
			return <div className="px-0 py-1 text-[10px] text-muted-foreground italic">No hay elementos</div>;
		}

		return <div className={containerClassName}>{renderedItems}</div>;
	},
	(prevProps, nextProps) => {
		// Comparación profunda personalizada para evitar re-renders innecesarios
		if (prevProps.viewMode !== nextProps.viewMode) return false;
		if (prevProps.currentView !== nextProps.currentView) return false;
		if (prevProps.selectedChildId !== nextProps.selectedChildId) return false;
		if (prevProps.categoryId !== nextProps.categoryId) return false;

		// Comparación rápida de arrays por longitud y luego elementos
		if (prevProps.items.length !== nextProps.items.length) return false;

		// Si tienen la misma longitud, verificamos si los IDs siguen siendo los mismos
		const prevIds = prevProps.items.map((item) => item.id).join(',');
		const nextIds = nextProps.items.map((item) => item.id).join(',');
		if (prevIds !== nextIds) return false;

		// Verificamos si la función de callback cambió
		if (prevProps.onItemClick !== nextProps.onItemClick) return false;

		// Si llegamos aquí, consideramos que no necesitamos re-renderizar
		return true;
	}
);

// Componente principal
export const NavCategoryChildren = memo(
	forwardRef<CategoryChildrenRef, NavCategoryChildrenProps>(
		({ categoryId, isCollapsed, selectedChildId, currentView, items, onItemClick, onToggleViewMode }, ref) => {
			// Estado local para el modo de vista
			const [viewMode, setViewMode] = useState<ViewMode>('list');

			// Exponer métodos al componente padre
			useImperativeHandle(
				ref,
				() => ({
					toggleViewMode: () => {
						const newMode = viewMode === 'list' ? 'grid' : 'list';
						setViewMode(newMode);
						onToggleViewMode?.(newMode);
					},
					getViewMode: () => viewMode,
				}),
				[viewMode, onToggleViewMode]
			);

			// Si está colapsado, no mostrar nada
			if (isCollapsed) {
				return null;
			}

			return (
				<>
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
		}
	)
);
