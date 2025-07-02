import type { NavPanelProps } from '@/components/navigation/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type ViewType } from '@/components/views/types';
import { cn } from '@/lib/utils';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { NavCategoryWithChildren } from './components/nav-category-with-children';
import { NavMainNavigation } from './components/nav-main-navigation';
import { NavPanelHeader } from './components/nav-panel-header';
import { NAVIGATION_CATEGORIES } from './constants/categories';
import { useCategoryCollapse, useCategoryHandlers, useCategoryStats, useMainNavigation } from './hooks';

export const NavPanel = memo(function NavPanel({ initialData, isCollapsed = false, onToggleCollapse }: NavPanelProps) {
	const { isCategoryCollapsed, handleCollapseToggle, expandCategory } = useCategoryCollapse();
	const {
		currentView,
		handleCategoryClick,
		handleFolderClick,
		handleCollectionClick,
		handleTagClick,
		handleAlbumClick,
		handleCharacterClick,
		handlePlaceClick,
		handleWorldItemClick,
		handleConceptClick,
		handlePromptClick,
		handleNoteClick,
		handleGroupClick,
		handlePropertyClick,
		handleWildcardClick,
	} = useCategoryHandlers();
	const { getCategoryItemCount, getImagesForCategory, getCategoryItems, stats } = useCategoryStats(initialData);
	const { handleOpenSettings, handleOpenDevelopment, handleOpenEntityCards, handleMainNavigate } = useMainNavigation();
	const [categoryViewModes, setCategoryViewModes] = useState<Record<string, 'list' | 'grid'>>({});

	// Implementaciones temporales para las funciones faltantes
	const getSelectedChildId = useCallback((_id: ViewType): string | null => {
		// Implementación temporal - retorna null para todas las categorías
		return null;
	}, []);

	const getItemClickHandler = useCallback(
		(categoryId: ViewType) => {
			return (childId: string) => {
				// Mapear cada categoría a su handler específico
				switch (categoryId) {
					case 'folders':
						handleFolderClick(childId);
						break;
					case 'collections':
						handleCollectionClick(childId);
						break;
					case 'tags':
						handleTagClick(childId);
						break;
					case 'albums':
						handleAlbumClick(childId);
						break;
					case 'characters':
						handleCharacterClick(childId);
						break;
					case 'places':
						handlePlaceClick(childId);
						break;
					case 'world-items':
						handleWorldItemClick(childId);
						break;
					case 'concepts':
						handleConceptClick(childId);
						break;
					case 'prompts':
						handlePromptClick(childId);
						break;
					case 'notes':
						handleNoteClick(childId);
						break;
					case 'groups':
						handleGroupClick(childId);
						break;
					case 'properties':
						handlePropertyClick(childId);
						break;
					case 'wildcards':
						handleWildcardClick(childId);
						break;
					default:
						// Log silencioso en desarrollo - no mostrar en producción
						if (process.env.NODE_ENV === 'development') {
							// eslint-disable-next-line no-console
							console.warn(`No se encontró handler para la categoría: ${categoryId}`);
						}
				}
			};
		},
		[
			handleFolderClick,
			handleCollectionClick,
			handleTagClick,
			handleAlbumClick,
			handleCharacterClick,
			handlePlaceClick,
			handleWorldItemClick,
			handleConceptClick,
			handlePromptClick,
			handleNoteClick,
			handleGroupClick,
			handlePropertyClick,
			handleWildcardClick,
		]
	);

	useEffect(() => {
		if (!currentView) return;

		const parentCategory = NAVIGATION_CATEGORIES.find((cat) =>
			getCategoryItems(cat.id).some((item) => item.id === currentView)
		);

		if (parentCategory) {
			expandCategory(parentCategory.id);
		} else if (NAVIGATION_CATEGORIES.some((cat) => cat.id === currentView)) {
			expandCategory(currentView as ViewType);
		}
	}, [currentView, getCategoryItems, expandCategory]);

	const handleCategoryToggleViewMode = useCallback((categoryId: string, mode: 'list' | 'grid') => {
		setCategoryViewModes((prev) => ({ ...prev, [categoryId]: mode }));
	}, []);

	const getCategoryClickHandler = useCallback(
		(id: ViewType) => () => {
			handleCategoryClick(id);
			expandCategory(id);
		},
		[handleCategoryClick, expandCategory]
	);

	const getCollapseToggleHandler = useCallback(
		(id: ViewType) => (e: React.MouseEvent) => handleCollapseToggle(id, e),
		[handleCollapseToggle]
	);

	const categoriesContent = useMemo(
		() =>
			NAVIGATION_CATEGORIES.map(({ id, icon, label, color }) => {
				const viewMode = categoryViewModes[id] || 'list';
				return (
					<NavCategoryWithChildren
						key={id}
						id={id}
						label={label}
						color={color}
						icon={icon}
						isCollapsed={isCategoryCollapsed(id)}
						isCurrent={currentView === id}
						itemCount={getCategoryItemCount(id)}
						imageCount={getImagesForCategory(id)}
						isNavCollapsed={isCollapsed}
						viewMode={viewMode}
						getCategoryItems={getCategoryItems}
						onToggleCollapse={getCollapseToggleHandler(id)}
						onCategoryClick={getCategoryClickHandler(id)}
						onToggleViewMode={(mode) => handleCategoryToggleViewMode(id, mode)}
						getSelectedChildId={getSelectedChildId}
						getItemClickHandler={getItemClickHandler}
						currentView={currentView}
					/>
				);
			}),
		[
			categoryViewModes,
			currentView,
			getCategoryItemCount,
			getImagesForCategory,
			isCollapsed,
			isCategoryCollapsed,
			getCategoryItems,
			getCollapseToggleHandler,
			getCategoryClickHandler,
			handleCategoryToggleViewMode,
			getSelectedChildId,
			getItemClickHandler,
		]
	);

	const headerProps = useMemo(
		() => ({
			totalImages: stats.totalImages,
			onOpenSettings: handleOpenSettings,
			onOpenDevelopment: handleOpenDevelopment,
			onOpenEntityCards: handleOpenEntityCards,
			isCollapsed,
			onToggleCollapse,
		}),
		[stats.totalImages, handleOpenSettings, handleOpenDevelopment, handleOpenEntityCards, isCollapsed, onToggleCollapse]
	);

	const mainNavProps = useMemo(
		() => ({
			onNavigate: handleMainNavigate,
			isCollapsed,
			currentView: currentView || '',
		}),
		[handleMainNavigate, isCollapsed, currentView]
	);

	return (
		<aside
			className={cn(
				'flex flex-col h-full w-full bg-card border-r transition-all duration-300 ease-in-out',
				isCollapsed && 'min-w-[35px] max-w-[35px]'
			)}
		>
			<NavPanelHeader {...headerProps} />
			<NavMainNavigation {...mainNavProps} />
			<ScrollArea className="flex-1">
				<div className="py-2 px-2 space-y-1">{categoriesContent}</div>
			</ScrollArea>
		</aside>
	);
});
