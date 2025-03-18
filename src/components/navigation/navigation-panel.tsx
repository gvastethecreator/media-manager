'use client';

import type { NavPanelProps } from '@/components/navigation/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { NavCategoryChildren } from './components/nav-category-children';
import { NavCategoryItem } from './components/nav-category-item';
import { NavMainNavigation } from './components/nav-main-navigation';
import { NavPanelHeader } from './components/nav-panel-header';
import { NAVIGATION_CATEGORIES } from './constants/categories';
import { useCategoryCollapse, useCategoryHandlers, useCategoryStats, useMainNavigation } from './hooks';

/**
 * Panel de navegación principal de la aplicación
 * Muestra categorías, subcategorías y elementos de navegación
 *
 * @component
 * @param {NavPanelProps} props - Propiedades del componente
 * @returns {JSX.Element} Componente de panel de navegación
 */
export function NavPanel({ initialData, isCollapsed = false }: NavPanelProps) {
	// Hooks para manejar la lógica del panel
	const { isCategoryCollapsed, handleCollapseToggle } = useCategoryCollapse();
	const { currentView, handleCategoryClick, getItemClickHandler, getSelectedChildId } = useCategoryHandlers();
	const { getCategoryItemCount, getImagesForCategory, getCategoryItems, stats } = useCategoryStats(initialData);
	const { handleOpenSettings, handleOpenDevelopment, handleMainNavigate } = useMainNavigation();

	return (
		<div
			className={cn(
				'flex flex-col h-full bg-background transition-all duration-300',
				isCollapsed && 'nav-panel-collapsed'
			)}
		>
			<NavPanelHeader
				totalImages={stats.totalImages}
				onOpenSettings={handleOpenSettings}
				onOpenDevelopment={handleOpenDevelopment}
				isCollapsed={isCollapsed}
			/>

			<ScrollArea className="flex-1 h-full">
				<div className={cn('p-1 pr-3 space-y-0', isCollapsed && 'px-1')}>
					{/* Navegación Principal */}
					<NavMainNavigation currentView={currentView} onNavigate={handleMainNavigate} isCollapsed={isCollapsed} />

					{/* Categorías con Listas */}
					<div className="mt-0 space-y-0.5">
						{NAVIGATION_CATEGORIES.map(({ id, icon, label, color }) => (
							<div key={id}>
								<NavCategoryItem
									id={id}
									label={label}
									color={color}
									icon={icon}
									isCollapsed={isCollapsed || isCategoryCollapsed(id)}
									isCurrent={currentView === id}
									itemCount={getCategoryItemCount(id)}
									imageCount={getImagesForCategory(id)}
									onClick={() => handleCategoryClick(id)}
									onToggleCollapse={(e) => handleCollapseToggle(id, e)}
									showLabel={!isCollapsed}
								/>

								{!isCollapsed && (
									<NavCategoryChildren
										categoryId={id}
										isCollapsed={isCategoryCollapsed(id)}
										selectedChildId={getSelectedChildId(id)}
										currentView={currentView}
										items={getCategoryItems(id)}
										onItemClick={getItemClickHandler(id)}
									/>
								)}
							</div>
						))}
					</div>
				</div>
			</ScrollArea>
		</div>
	);
}
