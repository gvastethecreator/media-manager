import {
	Album,
	Asterisk,
	Bookmark,
	Box,
	Brackets,
	ChevronDown,
	ChevronRight,
	FileStack,
	Files,
	FileText,
	Globe,
	Image as ImageIcon,
	Layers,
	Lightbulb,
	MapPin,
	MessageSquare,
	Music,
	Star,
	Tag,
	User,
	Users,
	Video,
	Workflow,
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ViewType } from '@/components/views/types';
import { useCategoryStats } from '../hooks/use-category-stats';
import { NavCategoryChildren } from './nav-category-children';

interface NavMainNavigationProps {
	currentView: string;
	onNavigate: (id: ViewType) => void;
	isCollapsed?: boolean;
}

export const NavMainNavigation = memo(function NavMainNavigation({
	currentView,
	onNavigate,
	isCollapsed = false,
}: NavMainNavigationProps) {
	const { stats, getCategoryItemCount, getCategoryItems } = useCategoryStats();
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

	// Toggle función para expandir/contraer categorías
	const toggleCategory = useCallback((categoryId: string) => {
		setExpandedCategories(prev => {
			const newSet = new Set(prev);
			if (newSet.has(categoryId)) {
				newSet.delete(categoryId);
			} else {
				newSet.add(categoryId);
			}
			return newSet;
		});
	}, []);

	// Nueva estructura file-centric con contadores
	const NAVIGATION_CATEGORIES = [
		{
			id: 'files',
			label: 'Archivos',
			color: '#3B82F6',
			icon: Files,
			children: [
				{ id: 'files', label: 'Todos los archivos', icon: FileStack, count: stats.totalImages || 0 },
				{ id: 'all-images', label: 'Imágenes', icon: ImageIcon, count: stats.totalImages || 0 },
				{ id: 'videos', label: 'Videos', icon: Video, count: getCategoryItemCount('videos') },
				{ id: 'audios', label: 'Audio', icon: Music, count: getCategoryItemCount('audios') },
				{ id: 'documents', label: 'Documentos', icon: FileText, count: getCategoryItemCount('documents') },
				{ id: 'json-files', label: 'JSON', icon: Brackets, count: getCategoryItemCount('jsonFiles') },
				{ id: 'workflows', label: 'Workflows', icon: Workflow, count: getCategoryItemCount('workflows') },
				{ id: 'file-3ds', label: '3D', icon: Box, count: getCategoryItemCount('file3ds') },
			],
		},
		{
			id: 'library',
			label: 'Librería',
			color: '#A21CAF',
			icon: Layers,
			children: [
				{ id: 'favorites', label: 'Favoritos', icon: Star, count: stats.totalFavorites || 0 },
				{ id: 'albums', label: 'Álbumes', icon: Album, count: stats.totalAlbums || 0 },
				{ id: 'groups', label: 'Grupos', icon: Users, count: getCategoryItemCount('groups') },
				{ id: 'tags', label: 'Etiquetas', icon: Tag, count: stats.totalTags || 0, hasChildren: true },
				{ id: 'collections', label: 'Colecciones', icon: Bookmark, count: stats.totalCollections || 0, hasChildren: true },
				{ id: 'prompts', label: 'Prompts', icon: MessageSquare, count: getCategoryItemCount('prompts'), hasChildren: true },
			],
		},
		{
			id: 'worldbuilding',
			label: 'Worldbuilding',
			color: '#059669',
			icon: Globe,
			children: [
				{ id: 'characters', label: 'Personajes', icon: User, count: stats.totalCharacters || 0, hasChildren: true },
				{ id: 'places', label: 'Lugares', icon: MapPin, count: stats.totalPlaces || 0, hasChildren: true },
				{ id: 'world-items', label: 'Objetos del mundo', icon: Box, count: stats.totalWorldItems || 0, hasChildren: true },
				{ id: 'concepts', label: 'Conceptos', icon: Lightbulb, count: getCategoryItemCount('concepts'), hasChildren: true },
				{ id: 'wildcards', label: 'Comodines', icon: Asterisk, count: getCategoryItemCount('wildcards'), hasChildren: true },
			],
		},
	];

	const containerClasses = useMemo(() => cn('pb-1 pt-1', isCollapsed ? 'px-1' : 'px-2'), [isCollapsed]);
	const innerContainerClasses = useMemo(() => cn('rounded-md p-0.5 shadow-sm', isCollapsed && 'p-0.5'), [isCollapsed]);
	const flexContainerClasses = useMemo(() => cn('flex flex-col gap-1'), []);

	const handleChildClick = useCallback((childId: string) => {
		// Implementar lógica para navegar a item hijo
		console.log('Navegando a item hijo:', childId);
	}, []);

	return (
		<div className={containerClasses}>
			<div className={innerContainerClasses}>
				<div className={flexContainerClasses}>
					{NAVIGATION_CATEGORIES.map((category, _catIdx) => (
						<div key={category.id} className="mb-1">
							<div className="flex items-center gap-1 mb-0.5">
								<category.icon className="h-4 w-4" style={{ color: category.color }} />
								<span className="font-semibold text-xs" style={{ color: category.color }}>
									{category.label}
								</span>
							</div>
							<div className="flex flex-col gap-0.5">
								{category.children.map((child, _idx) => (
									<div key={child.id} className="flex flex-col">
										<div
											className={cn(
												'justify-between w-full text-xs px-2 py-0.5 rounded flex items-center',
												'hover:bg-secondary/50 transition-colors',
												currentView === child.id && 'bg-secondary font-bold'
											)}
										>
											<div
												className="flex items-center flex-1 cursor-pointer"
												onClick={() => onNavigate(child.id as ViewType)}
											>
												<child.icon className="h-3 w-3 mr-2" />
												{child.label}
											</div>
											<div className="flex items-center gap-1">
												{child.count !== undefined && (
													<span className="text-[10px] text-muted-foreground tabular-nums min-w-[18px] text-right">
														{child.count}
													</span>
												)}
												{child.hasChildren && (
													<button
														className="h-4 w-4 p-0 hover:bg-secondary/50 rounded flex items-center justify-center"
														onClick={(e) => {
															e.stopPropagation();
															toggleCategory(child.id);
														}}
													>
														{expandedCategories.has(child.id) ? (
															<ChevronDown className="h-3 w-3" />
														) : (
															<ChevronRight className="h-3 w-3" />
														)}
													</button>
												)}
											</div>
										</div>
										{child.hasChildren && expandedCategories.has(child.id) && (
											<div className="ml-4 mt-1 border-l border-border/50 pl-2">
												<NavCategoryChildren
													categoryId={child.id}
													isCollapsed={isCollapsed}
													selectedChildId={null}
													currentView={currentView}
													items={getCategoryItems(child.id as any)}
													onItemClick={handleChildClick}
												/>
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
});
