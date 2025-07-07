import { memo, useCallback } from 'react';
import type { NavPanelProps } from '@/components/navigation/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { NavMainNavigation } from './components/nav-main-navigation';
import { NavPanelHeader } from './components/nav-panel-header';
import { useCategoryStats } from './hooks';
import { useNavigationStore } from './navigation.store';
import { ViewType } from '@/components/views/types';

export const NavPanel = memo(function NavPanel({
	isCollapsed = false,
	onToggleCollapse,
}: Omit<NavPanelProps, 'initialData'>) {
	const { currentView, setCurrentView } = useNavigationStore();
	const { stats } = useCategoryStats();

	const handleNavigate = useCallback((id: ViewType) => {
		setCurrentView(id);
	}, [setCurrentView]);

	const handleOpenSettings = useCallback(() => {
		// TODO: Implementar lógica para abrir configuración
		console.log('Abrir configuración');
	}, []);

	const handleOpenDevelopment = useCallback(() => {
		// TODO: Implementar lógica para abrir desarrollo
		console.log('Abrir desarrollo');
	}, []);

	const handleOpenEntityCards = useCallback(() => {
		// TODO: Implementar lógica para abrir entity cards
		console.log('Abrir entity cards');
	}, []);

	return (
		<aside
			className={cn('h-full flex flex-col bg-background border-r border-border', isCollapsed && 'w-16')}
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
