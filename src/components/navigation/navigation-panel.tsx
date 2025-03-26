'use client';

import type { NavPanelProps } from '@/components/navigation/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { NavCategoryChildren, type CategoryChildrenRef } from './components/nav-category-children';
import { NavCategoryItem } from './components/nav-category-item';
import { NavMainNavigation } from './components/nav-main-navigation';
import { NavPanelHeader } from './components/nav-panel-header';
import { NAVIGATION_CATEGORIES } from './constants/categories';
import { useCategoryCollapse, useCategoryHandlers, useCategoryStats, useMainNavigation } from './hooks';

// Memoizamos el componente hijo para evitar re-renderizados
const MemoizedNavCategoryChildren = memo(NavCategoryChildren);

// Componente memoizado para renderizar una categoría y sus hijos
const CategoryWithChildren = memo(function CategoryWithChildren({
	id,
	label,
	color,
	icon,
	isCollapsed,
	isCurrent,
	itemCount,
	imageCount,
	isNavCollapsed,
	viewMode,
	getCategoryItems,
	onToggleCollapse,
	onCategoryClick,
	onToggleViewMode,
	getSelectedChildId,
	getItemClickHandler,
	currentView,
	childrenRefs,
}: {
	id: string;
	label: string;
	color: string;
	icon: any;
	isCollapsed: boolean;
	isCurrent: boolean;
	itemCount: number;
	imageCount: number;
	isNavCollapsed: boolean;
	viewMode: 'list' | 'grid';
	getCategoryItems: (id: string) => any[];
	onToggleCollapse: (e: React.MouseEvent) => void;
	onCategoryClick: () => void;
	onToggleViewMode: (mode: 'list' | 'grid') => void;
	getSelectedChildId: (id: string) => string | null;
	getItemClickHandler: (id: string) => (childId: string) => void;
	currentView: string;
	childrenRefs: React.MutableRefObject<Record<string, CategoryChildrenRef | null>>;
}) {
	// Memoizamos los handlers para evitar re-renders innecesarios
	const handleViewModeToggle = useCallback((mode: 'list' | 'grid') => {
		onToggleViewMode(mode);
	}, [onToggleViewMode]);

	return (
		<div key={id}>
			<NavCategoryItem
				id={id}
				label={label}
				color={color}
				icon={icon}
				isCollapsed={isNavCollapsed || isCollapsed}
				isCurrent={isCurrent}
				itemCount={itemCount}
				imageCount={imageCount}
				onClick={onCategoryClick}
				onToggleCollapse={onToggleCollapse}
				showLabel={!isNavCollapsed}
				onToggleViewMode={handleViewModeToggle}
				viewMode={viewMode}
			/>

			<MemoizedNavCategoryChildren
				key={`${id}-children`}
				ref={(instance) => { childrenRefs.current[id] = instance; }}
				categoryId={id}
				isCollapsed={isNavCollapsed || isCollapsed}
				selectedChildId={getSelectedChildId(id)}
				currentView={currentView}
				items={getCategoryItems(id)}
				onItemClick={getItemClickHandler(id)}
				onToggleViewMode={(mode) => {
					handleViewModeToggle(mode);
				}}
			/>
		</div>
	);
});

/**
 * Panel de navegación principal de la aplicación
 * Muestra categorías, subcategorías y elementos de navegación
 *
 * @component
 * @param {NavPanelProps} props - Propiedades del componente
 * @returns {JSX.Element} Componente de panel de navegación
 */
export const NavPanel = memo(function NavPanel({ initialData, isCollapsed = false, onToggleCollapse }: NavPanelProps) {
	// Hooks para manejar la lógica del panel
	const { isCategoryCollapsed, handleCollapseToggle } = useCategoryCollapse();
	const { currentView, handleCategoryClick, getItemClickHandler, getSelectedChildId } = useCategoryHandlers();
	const { getCategoryItemCount, getImagesForCategory, getCategoryItems, stats } = useCategoryStats(initialData);
	const { handleOpenSettings, handleOpenDevelopment, handleOpenEntityCards, handleMainNavigate } = useMainNavigation();

	// Mantener la referencia del modo de vista por categoría
	const [categoryViewModes, setCategoryViewModes] = useState<Record<string, 'list' | 'grid'>>({});

	// Guardar referencias a los componentes hijos
	const childrenRefs = useRef<Record<string, CategoryChildrenRef | null>>({});

	// Memoizar la función para cambiar el modo de vista
	const handleCategoryToggleViewMode = useCallback((categoryId: string, mode: 'list' | 'grid') => {
		setCategoryViewModes(prev => ({ ...prev, [categoryId]: mode }));
	}, []);

	// Memoizar los handlers para cada categoría
	const getCategoryClickHandler = useCallback((id: string) => {
		return () => handleCategoryClick(id);
	}, [handleCategoryClick]);

	const getCollapseToggleHandler = useCallback((id: string) => {
		return (e: React.MouseEvent) => handleCollapseToggle(id, e);
	}, [handleCollapseToggle]);

	// Memoizar las categorías para evitar re-renderizados
	const categoriesContent = useMemo(() => {
		return NAVIGATION_CATEGORIES.map(({ id, icon, label, color }) => {
			const viewMode = categoryViewModes[id] || 'list';

			return (
				<CategoryWithChildren
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
					childrenRefs={childrenRefs}
				/>
			);
		});
	}, [categoryViewModes, currentView, getCategoryItemCount, getCategoryItems, getImagesForCategory, getItemClickHandler, getSelectedChildId, handleCategoryToggleViewMode, isCollapsed, isCategoryCollapsed, getCollapseToggleHandler, getCategoryClickHandler]);

	// Memoizar las props del header para evitar re-renderizados
	const headerProps = useMemo(() => ({
		totalImages: stats.totalImages,
		onOpenSettings: handleOpenSettings,
		onOpenDevelopment: handleOpenDevelopment,
		onOpenEntityCards: handleOpenEntityCards,
		isCollapsed,
		onToggleCollapse
	}), [stats.totalImages, handleOpenSettings, handleOpenDevelopment, handleOpenEntityCards, isCollapsed, onToggleCollapse]);

	// Memoizar las props de la navegación principal
	const mainNavProps = useMemo(() => ({
		onNavigate: handleMainNavigate,
		isCollapsed
	}), [handleMainNavigate, isCollapsed]);

	return (
		<div
			className={cn(
				'flex h-full flex-col overflow-hidden bg-gradient-to-b from-background/50 to-background transition-all',
				isCollapsed ? 'nav-panel-collapsed' : ''
			)}
		>
			<NavPanelHeader {...headerProps} />

			<ScrollArea className="h-[calc(100vh-2.5rem)] min-h-0 flex-1 scrollbar pb-20">
				<div className="flex flex-col p-1.5">
					<NavMainNavigation {...mainNavProps} />

					<div className="mt-2 flex flex-col gap-px">
						{categoriesContent}
					</div>
				</div>
			</ScrollArea>
		</div>
	);
});
