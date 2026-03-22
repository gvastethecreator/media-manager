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
	Folder,
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
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ViewType } from '@/components/views/types';
import { useSeamlessNavigation } from '@/hooks/use-seamless-navigation';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { useHierarchicalNavigation } from '@/lib/utils/folder/hierarchical-navigation';
import { useCategoryStats } from '../hooks/use-category-stats';
import { NavCategoryChildren } from './nav-category-children';

interface NavMainNavigationProps {
	currentView: string;
	isCollapsed?: boolean;
	onNavigate?: (id: ViewType) => void;
}

const NavMainNavigationComponent = memo(function NavMainNavigationImpl({
	currentView,
	onNavigate,
	isCollapsed = false,
}: NavMainNavigationProps) {
	const { stats, getCategoryItemCount, getCategoryItems } = useCategoryStats();
	const { navigateWithTransition } = useSeamlessNavigation();
	const { buildHierarchicalPath } = useHierarchicalNavigation();

	// Nueva estructura file-centric con contadores y colores únicos
	const NAVIGATION_CATEGORIES = useMemo(
		() => [
			{
				id: 'folders',
				label: 'Carpetas',
				color: 'var(--entity-folder)',
				icon: Folder,
				children: [],
				showTreeView: true, // Nueva propiedad para mostrar TreeView directamente
			},
			{
				id: 'files',
				label: 'Archivos',
				color: 'var(--entity-file)',
				icon: Files,
				children: [
					{
						id: 'all-files',
						label: 'Todos los archivos',
						icon: FileStack,
						// Total de archivos = imágenes + videos (otros tipos opcionales se suman si están)
						count:
							(stats.totalImages || 0) +
							(stats.totalVideos || 0) +
							(stats.totalAudio || 0) +
							(stats.totalDocuments || 0) +
							(stats.totalJsonFiles || 0) +
							(stats.totalFile3D || 0) +
							(stats.totalWorkflows || 0),
						color: 'var(--entity-file)',
					},
					{
						id: 'all-images',
						label: 'Imágenes',
						icon: ImageIcon,
						count: stats.totalImages || 0,
						color: 'var(--entity-image)',
					},
					{
						id: 'videos',
						label: 'Videos',
						icon: Video,
						count: stats.totalVideos || 0,
						color: 'var(--entity-video)',
					},
					{
						id: 'audios',
						label: 'Audio',
						icon: Music,
						count: stats.totalAudio || 0,
						color: 'var(--entity-audio)',
					},
					{
						id: 'documents',
						label: 'Documentos',
						icon: FileText,
						count: stats.totalDocuments || 0,
						color: 'var(--entity-document)',
					},
					{
						id: 'json-files',
						label: 'JSON',
						icon: Brackets,
						count: stats.totalJsonFiles || 0,
						color: 'var(--entity-json)',
					},

					{ id: 'file-3ds', label: '3D', icon: Box, count: stats.totalFile3D || 0, color: 'var(--entity-file-3d)' },
				],
			},
			{
				id: 'library',
				label: 'Librería',
				color: 'var(--entity-collection)',
				icon: Layers,
				children: [
					{
						id: 'favorites',
						label: 'Favoritos',
						icon: Star,
						count: stats.totalFavorites || 0,
						color: 'var(--entity-favorite)',
					},
					{
						id: 'albums',
						label: 'Álbumes',
						icon: Album,
						count: stats.totalAlbums || 0,
						hasChildren: true,
						color: 'var(--entity-album)',
					},
					{
						id: 'groups',
						label: 'Grupos',
						icon: Users,
						count: getCategoryItemCount('groups'),
						hasChildren: true,
						color: 'var(--entity-group)',
					},
					{
						id: 'tags',
						label: 'Etiquetas',
						icon: Tag,
						count: stats.totalTags || 0,
						hasChildren: true,
						color: 'var(--entity-tag)',
					},
					{
						id: 'collections',
						label: 'Colecciones',
						icon: Bookmark,
						count: stats.totalCollections || 0,
						hasChildren: true,
						color: 'var(--entity-collection)',
					},
					{
						id: 'prompts',
						label: 'Prompts',
						icon: MessageSquare,
						count: getCategoryItemCount('prompts'),
						hasChildren: true,
						color: 'var(--entity-prompt)',
					},
				],
			},
			{
				id: 'worldbuilding',
				label: 'Worldbuilding',
				color: 'var(--entity-world-item)',
				icon: Globe,
				children: [
					{
						id: 'characters',
						label: 'Personajes',
						icon: User,
						count: stats.totalCharacters || 0,
						hasChildren: true,
						color: 'var(--entity-character)',
					},
					{
						id: 'places',
						label: 'Lugares',
						icon: MapPin,
						count: stats.totalPlaces || 0,
						hasChildren: true,
						color: 'var(--entity-place)',
					},
					{
						id: 'world-items',
						label: 'Objetos del mundo',
						icon: Box,
						count: stats.totalWorldItems || 0,
						hasChildren: true,
						color: 'var(--entity-world-item)',
					},
					{
						id: 'concepts',
						label: 'Conceptos',
						icon: Lightbulb,
						count: getCategoryItemCount('concepts'),
						hasChildren: true,
						color: 'var(--entity-concept)',
					},
					{
						id: 'wildcards',
						label: 'Comodines',
						icon: Asterisk,
						count: getCategoryItemCount('wildcards'),
						hasChildren: true,
						color: 'var(--entity-wildcard)',
					},
				],
			},
			{
				id: 'management',
				label: 'Gestión',
				color: 'var(--entity-note)',
				icon: Asterisk,
				children: [
					{
						id: 'notes',
						label: 'Notas',
						icon: FileText,
						count: getCategoryItemCount('notes'),
						hasChildren: true,
						color: 'var(--entity-note)',
					},
					{
						id: 'properties',
						label: 'Propiedades',
						icon: Asterisk,
						count: getCategoryItemCount('properties'),
						hasChildren: true,
						color: 'var(--entity-property)',
					},
				],
			},
		],
		[stats, getCategoryItemCount]
	);

	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

	// Inicializar categorías expandidas cuando NAVIGATION_CATEGORIES esté disponible
	useEffect(() => {
		setExpandedCategories(new Set(NAVIGATION_CATEGORIES.map((c) => c.id)));
	}, [NAVIGATION_CATEGORIES]);

	// Toggle función para expandir/contraer categorías
	const toggleCategory = useCallback((categoryId: string) => {
		setExpandedCategories((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(categoryId)) {
				newSet.delete(categoryId);
			} else {
				newSet.add(categoryId);
			}
			return newSet;
		});
	}, []);

	const containerClasses = useMemo(() => cn('overflow-auto pt-1 pb-1', isCollapsed ? 'px-1' : 'px-2'), [isCollapsed]);
	const innerContainerClasses = useMemo(() => cn('rounded-md p-0.5 shadow-sm', isCollapsed && 'p-0.5'), [isCollapsed]);
	const flexContainerClasses = useMemo(() => cn('flex flex-col gap-1'), []);

	const handleChildClick = useCallback(
		(childId: string) => {
			// Navegar al item hijo específico
			clientLogger.debug('Navegando a item hijo:', childId);

			// Para carpetas, navegar a la vista específica de la carpeta
			if (childId?.match(/^folder_/)) {
				// Extraer el ID real de la carpeta (remover prefijo si existe)
				const folderId = childId.replace('folder_', '');

				// Usar navegación jerárquica
				const hierarchicalPath = buildHierarchicalPath(folderId);

				// Navegar usando path jerárquico
				if (hierarchicalPath) {
					navigateWithTransition(`/folders/${hierarchicalPath}`);
				} else {
					// Fallback para carpeta raíz o error
					navigateWithTransition('/folders');
				}
			} else {
				// Para otras entidades, navegar a su vista específica
				// Por ejemplo: notas, propiedades, etc.
				navigateWithTransition(`/${childId}`);
			}
		},
		[navigateWithTransition, buildHierarchicalPath]
	);

	const handleNavigate = useCallback(
		(id: ViewType) => {
			if (onNavigate) {
				onNavigate(id);
			} else {
				navigateWithTransition(id === '' ? '/' : `/${id}`);
			}
		},
		[onNavigate, navigateWithTransition]
	);

	return (
		<ScrollArea className={containerClasses}>
			<div className={innerContainerClasses}>
				<div className={flexContainerClasses}>
					{NAVIGATION_CATEGORIES.map((category, _catIdx) => (
						<div className="mb-1" key={category.id}>
							<button
								aria-expanded={expandedCategories.has(category.id)}
								className={cn(
									'mb-0.5 flex items-center gap-1 transition-all duration-300',
									isCollapsed ? 'justify-center px-1 py-1' : ''
								)}
								onClick={() => {
									// Para carpetas, navegar a la vista principal además de expandir/contraer
									if (category.id === 'folders') {
										handleNavigate('folders' as ViewType);
									}
									toggleCategory(category.id);
								}}
								type="button"
							>
								<Tooltip>
									<TooltipTrigger asChild>
										<category.icon
											className={cn('h-4 w-4', isCollapsed ? 'h-3 w-3' : '')}
											style={{ color: category.color }}
										/>
									</TooltipTrigger>
									{isCollapsed && (
										<TooltipContent className="text-xs" side="right">
											<p className="font-medium" style={{ color: category.color }}>
												{category.label}
											</p>
										</TooltipContent>
									)}
								</Tooltip>
								{!isCollapsed && (
									<>
										<span className="flex-1 truncate font-semibold text-xs" style={{ color: category.color }}>
											{category.label}
										</span>
										{((category.children && category.children.length > 0) || category.showTreeView) &&
											(expandedCategories.has(category.id) ? (
												<ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
											) : (
												<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
											))}
									</>
								)}
							</button>
							{!isCollapsed && expandedCategories.has(category.id) && (
								<>
									{/* TreeView directo para carpetas */}
									{category.showTreeView && (
										<div className="mt-1 min-w-0 overflow-hidden">
											<NavCategoryChildren
												categoryId={category.id}
												currentView={currentView}
												isCollapsed={isCollapsed}
												items={[]}
												onItemClick={handleChildClick}
												selectedChildId={null}
											/>
										</div>
									)}
									{/* Categorías normales */}
									{!category.showTreeView && (
										<div className="flex min-w-0 flex-col gap-0.5 overflow-hidden">
											{(category.children || []).map((child, _idx) => (
												<div className="flex min-w-0 flex-col" key={child.id}>
													<div
														className={cn(
															'flex w-full min-w-0 items-center justify-between rounded px-2 py-1 text-xs transition-all duration-300',
															'transition-colors hover:bg-secondary/50',
															currentView === child.id && 'bg-secondary font-bold',
															isCollapsed ? 'justify-center px-1' : ''
														)}
													>
														<div
															className={cn('flex min-w-0 flex-1 items-center', isCollapsed ? 'justify-center' : '')}
														>
															<button
																className="flex w-full min-w-0 items-center"
																onClick={() => handleNavigate(child.id as ViewType)}
																type="button"
															>
																<child.icon className="h-3 w-3 shrink-0" style={{ color: child.color }} />
																{!isCollapsed && <span className="ml-2 truncate">{child.label}</span>}
															</button>
														</div>
														{!isCollapsed && (
															<div className="flex shrink-0 items-center gap-1">
																{child.count !== undefined && (
																	<span
																		className="min-w-[18px] text-right text-[10px] text-muted-foreground tabular-nums"
																		data-testid={`nav-count-${child.id}`}
																	>
																		{child.count}
																	</span>
																)}
																{child.hasChildren && (
																	<button
																		aria-expanded={expandedCategories.has(child.id)}
																		aria-label={`Toggle ${child.label} children`}
																		className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border/30 bg-background/50 p-0.5 hover:bg-secondary/70"
																		onClick={(e) => {
																			e.stopPropagation();
																			toggleCategory(child.id);
																		}}
																		type="button"
																	>
																		{expandedCategories.has(child.id) ? (
																			<ChevronDown className="h-3 w-3" />
																		) : (
																			<ChevronRight className="h-3 w-3" />
																		)}
																	</button>
																)}
															</div>
														)}
													</div>
													{child.hasChildren && expandedCategories.has(child.id) && (
														<div className="mt-1 ml-4 border-border/50 border-l pl-2">
															<NavCategoryChildren
																categoryId={child.id}
																currentView={currentView}
																isCollapsed={isCollapsed}
																items={getCategoryItems(child.id as any)}
																onItemClick={handleChildClick}
																selectedChildId={null}
															/>
														</div>
													)}
												</div>
											))}
										</div>
									)}
								</>
							)}
						</div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
});

export const NavMainNavigation = NavMainNavigationComponent;
