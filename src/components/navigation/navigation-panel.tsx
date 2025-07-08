import { memo, useCallback } from 'react';
import type { NavPanelProps } from '@/components/navigation/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ViewType } from '@/components/views/types';
import { cn } from '@/lib/utils';
import { NavMainNavigation } from './components/nav-main-navigation';
import { NavPanelHeader } from './components/nav-panel-header';
import { useCategoryStats } from './hooks';
import { useNavigationStore } from './navigation.store';

export const NavPanel = memo(function NavPanel({
	isCollapsed = false,
	onToggleCollapse,
}: Omit<NavPanelProps, 'initialData'>) {
	const { currentView, setCurrentView } = useNavigationStore();
	const { stats } = useCategoryStats();

	const handleNavigate = useCallback(
		(id: ViewType) => {
			setCurrentView(id);
		},
		[setCurrentView]
	);

	const handleOpenSettings = useCallback(() => {
		setCurrentView('settings');
	}, [setCurrentView]);

	const handleOpenDevelopment = useCallback(() => {
		setCurrentView('development');
	}, [setCurrentView]);

	const handleOpenEntityCards = useCallback(() => {
		setCurrentView('entity-cards');
	}, [setCurrentView]);

	return (
		<aside
			className={cn(
				'h-full flex flex-col bg-background border-r border-border transition-all duration-300',
				isCollapsed && 'w-16'
			)}
			aria-label="Panel de navegación principal"
		>
			<NavPanelHeader
				isCollapsed={isCollapsed}
				onToggleCollapse={onToggleCollapse}
				totalImages={stats.totalImages || 0}
				onOpenSettings={handleOpenSettings}
				onOpenDevelopment={handleOpenDevelopment}
				onOpenEntityCards={handleOpenEntityCards}
			/>
			<ScrollArea className="flex-1">
				<NavMainNavigation currentView={currentView} onNavigate={handleNavigate} isCollapsed={isCollapsed} />
			</ScrollArea>
		</aside>
	);
});
