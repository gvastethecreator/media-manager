'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ViewType } from '@/types/file-item';
import { CornerDownRight, Lightbulb, MessageSquare, StickyNote } from 'lucide-react';
import { useMemo } from 'react';

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

interface NavCategoryChildrenProps {
	categoryId: ViewType;
	isCollapsed: boolean;
	selectedChildId: string | null;
	currentView: string;
	items: CategoryChild[];
	onItemClick: (id: string) => void;
}

export function NavCategoryChildren({
	categoryId,
	isCollapsed,
	selectedChildId,
	currentView,
	items,
	onItemClick,
}: NavCategoryChildrenProps) {
	// Si no hay elementos o está colapsado, no renderizar nada
	if (items.length === 0) {
		return <div className="px-0 py-1 text-[10px] text-muted-foreground italic">No hay elementos</div>;
	}

	// Si está colapsado, no mostrar nada
	if (isCollapsed) {
		return null;
	}

	// Usar useMemo para optimizar el renderizado de componentes
	const renderContent = useMemo(() => {
		// Renderizar elementos especiales para etiquetas
		if (categoryId === 'tags') {
			return (
				<div className="flex w-full flex-wrap gap-1 ml-1 mt-1 mb-1 max-w-full">
					{items.length === 0 ? (
						<div className="px-0 py-1 text-[10px] text-muted-foreground italic">No hay etiquetas</div>
					) : (
						items.map((tag) => (
							<TooltipProvider key={tag.id} delayDuration={200}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											className={cn(
												'h-5 px-2 text-[10px] transition-all duration-150 rounded-none text-foreground font-medium nav-tag cursor-pointer',
												currentView === 'tag-content' && selectedChildId === tag.name && 'ring-1 ring-primary/30',
												'hover:brightness-110 flex items-center gap-1 max-w-full'
											)}
											style={{ backgroundColor: tag.color || '#888' }}
											onClick={() => onItemClick(tag.name)}
										>
											<span className="truncate">{tag.name}</span>
											{tag._count && tag._count.images > 0 && (
												<span className="ml-1 px-1 py-0 bg-black/30 rounded-sm text-[8px] whitespace-nowrap">
													{tag._count.images}
												</span>
											)}
										</Button>
									</TooltipTrigger>
									<TooltipContent side="right" className="text-xs tooltip-with-info">
										<p>{tag._count?.images || 0} imágenes con esta etiqueta</p>
										{tag.description && <p className="text-[10px] text-muted-foreground">{tag.description}</p>}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						))
					)}
				</div>
			);
		}

		// Renderizar elementos para notas
		if (categoryId === 'notes') {
			return (
				<div className="overflow-hidden transition-all duration-200 space-y-0.5">
					{items.map((note) => {
						const isSelected = selectedChildId === note.id && currentView === 'note-content';
						// Usar title si está disponible, de lo contrario usar name
						const displayName = note.title || note.name;

						return (
							<TooltipProvider key={note.id} delayDuration={100}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className={cn(
												'group relative w-full justify-start rounded-none text-xs font-normal transition-all cursor-pointer',
												'h-7 px-1 py-0 hover:bg-gray-100/10',
												isSelected && 'bg-gray-100/5 font-medium text-foreground',
												'nav-item-button overflow-hidden'
											)}
											onClick={() => onItemClick(note.id)}
										>
											<div className="flex items-center w-full min-w-0">
												<CornerDownRight className="h-2 w-2 text-muted mr-1 shrink-0" />
												<StickyNote className="h-3 w-3 text-purple-400 mr-1 shrink-0" />
												<span className="truncate">{displayName}</span>
											</div>
										</Button>
									</TooltipTrigger>
									<TooltipContent side="right" className="text-xs tooltip-with-info">
										<p>{displayName}</p>
										{note.description && <p>{note.description}</p>}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						);
					})}
				</div>
			);
		}

		// Renderizar elementos para conceptos
		if (categoryId === 'concepts') {
			return (
				<div className="overflow-hidden transition-all duration-200 space-y-0.5">
					{items.map((concept) => {
						const isSelected = selectedChildId === concept.id && currentView === 'concept-content';

						return (
							<TooltipProvider key={concept.id} delayDuration={100}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className={cn(
												'group relative w-full justify-start rounded-none text-xs font-normal transition-all cursor-pointer',
												'h-7 px-1 py-0 hover:bg-gray-100/10',
												isSelected && 'bg-gray-100/5 font-medium text-foreground',
												'nav-item-button overflow-hidden'
											)}
											onClick={() => onItemClick(concept.id)}
										>
											<div className="flex items-center w-full min-w-0">
												<CornerDownRight className="h-2 w-2 text-muted mr-1 shrink-0" />
												<Lightbulb className="h-3 w-3 text-blue-400 mr-1 shrink-0" />
												<span className="truncate">{concept.name}</span>
											</div>
										</Button>
									</TooltipTrigger>
									<TooltipContent side="right" className="text-xs tooltip-with-info">
										<p>{concept.name}</p>
										{concept.description && <p>{concept.description}</p>}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						);
					})}
				</div>
			);
		}

		// Renderizar elementos para prompts
		if (categoryId === 'prompts') {
			return (
				<div className="overflow-hidden transition-all duration-200 space-y-0.5">
					{items.map((prompt) => {
						const isSelected = selectedChildId === prompt.id && currentView === 'prompt-content';

						return (
							<TooltipProvider key={prompt.id} delayDuration={100}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className={cn(
												'group relative w-full justify-start rounded-none text-xs font-normal transition-all cursor-pointer',
												'h-7 px-1 py-0 hover:bg-gray-100/10',
												isSelected && 'bg-gray-100/5 font-medium text-foreground',
												'nav-item-button overflow-hidden'
											)}
											onClick={() => onItemClick(prompt.id)}
										>
											<div className="flex items-center w-full min-w-0">
												<CornerDownRight className="h-2 w-2 text-muted mr-1 shrink-0" />
												<MessageSquare className="h-3 w-3 text-green-400 mr-1 shrink-0" />
												<span className="truncate">{prompt.name}</span>
											</div>
										</Button>
									</TooltipTrigger>
									<TooltipContent side="right" className="text-xs tooltip-with-info">
										<p>{prompt.name}</p>
										{prompt.description && <p>{prompt.description}</p>}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						);
					})}
				</div>
			);
		}

		// Renderizar elementos normales para otras categorías
		return (
			<div className="overflow-hidden transition-all duration-200 space-y-0.5">
				{items.map((item) => {
					const isSelected = selectedChildId === item.id && currentView === `${categoryId.replace(/s$/, '')}-content`;
					const imageCount = item._count?.images || 0;

					return (
						<TooltipProvider key={item.id} delayDuration={100}>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className={cn(
											'group relative w-full justify-start rounded-none text-xs font-normal transition-all cursor-pointer',
											'h-7 px-1 py-0 hover:bg-gray-100/10',
											isSelected && 'bg-gray-100/5 font-medium text-foreground',
											'nav-item-button overflow-hidden'
										)}
										onClick={() => onItemClick(item.id)}
									>
										{/* Contenedor principal con flexbox */}
										<div className="flex items-center w-full min-w-0">
											<CornerDownRight className="h-2 w-2 text-muted mr-1 shrink-0" />
											{item.emoji && <span className="text-xs shrink-0 mr-1">{item.emoji}</span>}

											{/* Nombre con truncamiento */}
											<span className="truncate">{item.name}</span>

											{/* Contador de imágenes - siempre visible */}
											<div
												className={cn(
													'ml-1 shrink-0 inline-flex items-center space-x-0.5 px-1 rounded-sm text-muted-foreground text-[9px] bg-secondary/30 nav-count-badge',
													imageCount > 0 ? 'opacity-100' : 'opacity-60'
												)}
											>
												<span>{imageCount}</span>
											</div>
										</div>
									</Button>
								</TooltipTrigger>
								<TooltipContent side="right" className="text-xs tooltip-with-info">
									{item.path && <p className="text-muted-foreground text-[10px]">{item.path}</p>}
									{item.description && <p>{item.description}</p>}
									<p>{imageCount} imágenes</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					);
				})}
			</div>
		);
	}, [categoryId, currentView, items, onItemClick, selectedChildId]);

	return renderContent;
}
