import { memo, useCallback } from 'react';
import type { NavPanelProps } from '@/components/navigation/types';
import { useSeamlessNavigation } from '@/hooks/use-seamless-navigation';
import { cn } from '@/lib/utils';
import { NavMainNavigation } from './components/nav-main-navigation';
import { NavPanelHeader } from './components/nav-panel-header';

const NavPanelComponent = memo(function NavPanelImpl({
	isCollapsed = false,
	isAnimating = false,
}: Omit<NavPanelProps, 'initialData'>) {
	const { navigateWithTransition } = useSeamlessNavigation();

	const handleOpenDevelopment = useCallback(() => {
		navigateWithTransition('/development');
	}, [navigateWithTransition]);

	const handleOpenEntityCards = useCallback(() => {
		navigateWithTransition('/entity-cards');
	}, [navigateWithTransition]);

	const handleOpenSettings = useCallback(() => {
		navigateWithTransition('/settings');
	}, [navigateWithTransition]);

	return (
		<aside
			aria-label="Main navigation panel"
			className={cn('flex h-full min-w-0 flex-col', isAnimating && 'transition-all duration-300 ease-in-out')}
		>
			<div className="sticky top-0 backdrop-blur-md">
				<NavPanelHeader
					isAnimating={isAnimating}
					isCollapsed={isCollapsed}
					onOpenDevelopment={handleOpenDevelopment}
					onOpenEntityCards={handleOpenEntityCards}
					onOpenSettings={handleOpenSettings}
				/>
			</div>
			<NavMainNavigation isCollapsed={isCollapsed} />
		</aside>
	);
});

export const NavPanel = NavPanelComponent;
