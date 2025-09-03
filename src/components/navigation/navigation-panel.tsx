import { memo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import type { NavPanelProps } from '@/components/navigation/types';
import { ViewType } from '@/components/views/types';
import { useSeamlessNavigation } from '@/hooks/use-seamless-navigation';
import { cn } from '@/lib/utils';
import { NavMainNavigation } from './components/nav-main-navigation';
import { NavPanelHeader } from './components/nav-panel-header';
import { useCategoryStats } from './hooks';

const NavPanelComponent = memo(function NavPanelImpl({
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
			aria-label="Panel de navegación principal"
			className={cn('flex h-full flex-col', isAnimating && 'transition-all duration-300 ease-in-out')}
		>
			{' '}
			<div className="sticky top-0 backdrop-blur-md">
				<NavPanelHeader
					isAnimating={isAnimating}
					isCollapsed={isCollapsed}
					onOpenDevelopment={handleOpenDevelopment}
					onOpenEntityCards={handleOpenEntityCards}
					onOpenSettings={handleOpenSettings}
				/>
			</div>
			<NavMainNavigation currentView={currentView} isCollapsed={isCollapsed} />
		</aside>
	);
});

export const NavPanel = NavPanelComponent;
