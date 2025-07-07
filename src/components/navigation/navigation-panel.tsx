import { Home, IdCard, Palette } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import type { NavPanelProps } from '@/components/navigation/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { NavMainNavigation } from './components/nav-main-navigation';
import { NavPanelHeader } from './components/nav-panel-header';
import { useCategoryStats } from './hooks';

// Nueva estructura de categorías file-centric
const NAVIGATION_CATEGORIES = [
	{
		id: 'files',
		label: 'Archivos',
		color: '#3B82F6',
		icon: Home,
		children: [
			{ id: 'all-files', label: 'Todos los archivos' },
			{ id: 'images', label: 'Imágenes' },
			{ id: 'videos', label: 'Videos' },
			{ id: 'audio', label: 'Audio' },
			{ id: 'docs', label: 'Documentos' },
			{ id: 'json', label: 'JSON' },
			{ id: 'workflows', label: 'Workflows' },
			{ id: 'file3d', label: '3D' },
		],
	},
	{
		id: 'library',
		label: 'Librería',
		color: '#A21CAF',
		icon: Palette,
		children: [
			{ id: 'favorites', label: 'Favoritos' },
			{ id: 'albums', label: 'Álbumes' },
			{ id: 'groups', label: 'Grupos' },
			{ id: 'tags', label: 'Etiquetas' },
			{ id: 'collections', label: 'Colecciones' },
			{ id: 'prompts', label: 'Prompts' },
		],
	},
	{
		id: 'worldbuilding',
		label: 'Worldbuilding',
		color: '#059669',
		icon: IdCard,
		children: [
			{ id: 'characters', label: 'Personajes' },
			{ id: 'places', label: 'Lugares' },
			{ id: 'world-items', label: 'Objetos del mundo' },
			{ id: 'concepts', label: 'Conceptos' },
			{ id: 'wildcards', label: 'Comodines' },
		],
	},
];

export const NavPanel = memo(function NavPanel({
	isCollapsed = false,
	onToggleCollapse,
}: Omit<NavPanelProps, 'initialData'>) {
	const [currentView, setCurrentView] = useState('all-files');
	const { stats } = useCategoryStats();

	const handleNavigate = useCallback((id: string) => {
		setCurrentView(id);
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
			/>
			<ScrollArea className="flex-1">
				<NavMainNavigation currentView={currentView} onNavigate={handleNavigate} isCollapsed={isCollapsed} />
			</ScrollArea>
		</aside>
	);
});
