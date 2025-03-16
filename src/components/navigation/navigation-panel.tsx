'use client';

import type { NavPanelProps } from '@/components/navigation/types';
import { ScrollArea } from '@/components/ui/scroll-area';
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
export function NavPanel({ initialData }: NavPanelProps) {
	// Hooks para manejar la lógica del panel
	const { isCategoryCollapsed, handleCollapseToggle } = useCategoryCollapse();
	const { currentView, handleCategoryClick, getItemClickHandler, getSelectedChildId } = useCategoryHandlers();
	const { getCategoryItemCount, getImagesForCategory, getCategoryItems, stats } = useCategoryStats(initialData);
	const { handleOpenSettings, handleOpenDevelopment, handleMainNavigate } = useMainNavigation();

	return (
		<div className="flex flex-col h-full bg-background">
			<NavPanelHeader
				totalImages={stats.totalImages}
				onOpenSettings={handleOpenSettings}
				onOpenDevelopment={handleOpenDevelopment}
			/>

			<ScrollArea className="flex-1 h-full">
				<div className="p-1 pr-3 space-y-0">
					{/* Navegación Principal */}
					<NavMainNavigation currentView={currentView} onNavigate={handleMainNavigate} />

					{/* Categorías con Listas */}
					<div className="mt-0 space-y-0.5">
						{NAVIGATION_CATEGORIES.map(({ id, icon, label, color }) => (
							<div key={id}>
								<NavCategoryItem
									id={id}
									label={label}
									color={color}
									icon={icon}
									isCollapsed={isCategoryCollapsed(id)}
									isCurrent={currentView === id}
									itemCount={getCategoryItemCount(id)}
									imageCount={getImagesForCategory(id)}
									onClick={() => handleCategoryClick(id)}
									onToggleCollapse={(e) => handleCollapseToggle(id, e)}
								/>

								<NavCategoryChildren
									categoryId={id}
									isCollapsed={isCategoryCollapsed(id)}
									selectedChildId={getSelectedChildId(id)}
									currentView={currentView}
									items={getCategoryItems(id)}
									onItemClick={getItemClickHandler(id)}
								/>
							</div>
						))}
					</div>
				</div>
			</ScrollArea>
		</div>
	);
}
