import { memo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import type { NavPanelProps } from '@/components/navigation/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ViewType } from '@/components/views/types';
import { useSeamlessNavigation } from '@/hooks/use-seamless-navigation';
import { cn } from '@/lib/utils';
import { NavMainNavigation } from './components/nav-main-navigation';
import { NavPanelHeader } from './components/nav-panel-header';
import { useCategoryStats } from './hooks';

export const NavPanel = memo(function NavPanel({
	isCollapsed = false,
	onToggleCollapse,
	isAnimating = false,
}: Omit<NavPanelProps, 'initialData'>) {
	const { navigateWithTransition } = useSeamlessNavigation();
	const location = useLocation();
	const { stats } = useCategoryStats();

	// Obtener la vista actual desde la URL
	const currentView = location.pathname.slice(1) || '';

	const handleNavigate = useCallback(
		(id: ViewType) => {
			// Para la ruta raíz (dashboard), navegar a '/'
			const path = id === '' ? '/' : `/${id}`;
			navigateWithTransition(path);
		},
		[navigateWithTransition]
	);

	const handleOpenSettings = useCallback(() => {
		navigateWithTransition('/settings');
	}, [navigateWithTransition]);

	const handleOpenDevelopment = useCallback(() => {
		navigateWithTransition('/development');
	}, [navigateWithTransition]);

	const handleOpenEntityCards = useCallback(() => {
		navigateWithTransition('/entity-cards');
	}, [navigateWithTransition]);

	return (
		<aside
			className={cn(
				'h-full flex flex-col bg-background border-r border-border overflow-hidden',
				isAnimating && 'transition-all duration-300 ease-in-out'
			)}
			aria-label="Panel de navegación principal"
		>
			<NavPanelHeader
				isCollapsed={isCollapsed}
				onOpenSettings={handleOpenSettings}
				onOpenDevelopment={handleOpenDevelopment}
				onOpenEntityCards={handleOpenEntityCards}
				isAnimating={isAnimating}
			/>
			<ScrollArea className="flex-1">
				<NavMainNavigation currentView={currentView} isCollapsed={isCollapsed} />
			</ScrollArea>
		</aside>
	);
});
