import type { NavPanelProps } from '@/components/navigation/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type ViewType } from '@/components/views/types';
import { cn } from '@/lib/utils';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { NavCategoryWithChildren } from './components/nav-category-with-children';
import { NavMainNavigation } from './components/nav-main-navigation';
import { NavPanelHeader } from './components/nav-panel-header';
import { NAVIGATION_CATEGORIES } from './constants/categories';
import { useCategoryCollapse } from './hooks/use-category-collapse';
import { useNavigationStore } from './navigation.store';

/**
 * Versión simplificada del NavPanel que no usa hooks problemáticos
 * Útil para migración sin dependencias complejas de stores
 */
export const NavPanelSimple = memo(function NavPanelSimple({
	initialData,
	isCollapsed = false,
	onToggleCollapse
}: NavPanelProps) {
	const { isCategoryCollapsed, handleCollapseToggle, expandCategory } = useCategoryCollapse();
	const { currentView, setCurrentView } = useNavigationStore();
	const [categoryViewModes, setCategoryViewModes] = useState<Record<string, 'list' | 'grid'>>({});

	// Handlers simplificados sin dependencias de stores complejos
	const handleCategoryClick = useCallback((id: ViewType) => {
		console.log('Category clicked:', id);
		setCurrentView(id);
	}, [setCurrentView]);

	const handleItemClick = useCallback((categoryId: ViewType, itemId: string) => {
		console.log('Item clicked:', categoryId, itemId);
		// Navegación simple sin stores complejos
		setCurrentView(`${categoryId.slice(0, -1)}-content` as ViewType);
	}, [setCurrentView]);

	// Función para obtener items de una categoría
	const getCategoryItems = useCallback((categoryId: ViewType) => {
		const categoryData = initialData?.[categoryId as keyof typeof initialData];
		if (Array.isArray(categoryData)) {
			return categoryData.map(item => ({
				id: item.id,
				name: item.name || item.title || 'Sin nombre',
				_count: item._count || { images: 0 }
			}));
		}
		return [];
	}, [initialData]);

	// Función para obtener conteo de items
	const getCategoryItemCount = useCallback((categoryId: ViewType) => {
		const items = getCategoryItems(categoryId);
		return items.length;
	}, [getCategoryItems]);

	// Función para obtener conteo de imágenes
	const getImagesForCategory = useCallback((categoryId: ViewType) => {
		const items = getCategoryItems(categoryId);
		return items.reduce((total, item) => total + (item._count?.images || 0), 0);
	}, [getCategoryItems]);

	// Función para obtener ID seleccionado (simplificado)
	const getSelectedChildId = useCallback((_id: ViewType): string | null => {
		return null; // Simplificado - sin selección
	}, []);

	// Función para obtener handler de click
	const getItemClickHandler = useCallback((categoryId: ViewType) => {
		return (childId: string) => handleItemClick(categoryId, childId);
	}, [handleItemClick]);

	// Handlers de navegación principal simplificados
	const handleOpenSettings = useCallback(() => {
		console.log('Opening settings...');
		setCurrentView('settings');
	}, [setCurrentView]);

	const handleOpenDevelopment = useCallback(() => {
		console.log('Opening development...');
		setCurrentView('development');
	}, [setCurrentView]);

	const handleOpenEntityCards = useCallback(() => {
		console.log('Opening entity cards...');
		setCurrentView('entity-cards');
	}, [setCurrentView]);

	const handleMainNavigate = useCallback((view: ViewType) => {
		console.log('Main navigate to:', view);
		setCurrentView(view);
	}, [setCurrentView]);

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
			totalImages: initialData?.stats?.totalImages || 0,
			onOpenSettings: handleOpenSettings,
			onOpenDevelopment: handleOpenDevelopment,
			onOpenEntityCards: handleOpenEntityCards,
			isCollapsed,
			onToggleCollapse,
		}),
		[initialData?.stats?.totalImages, handleOpenSettings, handleOpenDevelopment, handleOpenEntityCards, isCollapsed, onToggleCollapse]
	);

	const mainNavProps = useMemo(
		() => ({
			onNavigate: handleMainNavigate,
			isCollapsed,
		}),
		[handleMainNavigate, isCollapsed]
	);

	return (
		<div className={cn('flex h-full flex-col bg-sidebar', isCollapsed && 'w-16')}>
			<NavPanelHeader {...headerProps} />
			<ScrollArea className="flex-1">
				<div className="p-2 space-y-1">
					<NavMainNavigation {...mainNavProps} />
					{categoriesContent}
				</div>
			</ScrollArea>
		</div>
	);
});