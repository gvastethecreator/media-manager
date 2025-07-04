import { Image as ImageIcon, Layers, MessageSquare, Search, Star, UploadCloud, Home, Palette, IdCard } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ViewType } from '@/types/files';
import { Badge } from '@/components/ui/badge';

interface NavMainNavigationProps {
	currentView: string;
	onNavigate: (id: ViewType) => void;
	isCollapsed?: boolean;
}

// Componente memoizado para el botón de navegación individual
const NavButton = memo(function NavButton({
	id,
	icon: Icon,
	label,
	description,
	isActive,
	isCollapsed,
	index,
	onNavigate,
}: NavigationItem & {
	isActive: boolean;
	isCollapsed?: boolean;
	index: number;
	onNavigate: (id: ViewType) => void;
}) {
	// Memoizamos la configuración de animación para evitar recreaciones de objetos
	const initialConfig = useMemo(
		() => ({
			opacity: 0,
			scale: 0.95,
		}),
		[]
	);

	const animateConfig = useMemo(
		() => ({
			opacity: 1,
			scale: 1,
		}),
		[]
	);

	const transitionConfig = useMemo(
		() => ({
			delay: index * 0.05,
			duration: 0.3,
			type: 'spring',
			stiffness: 200,
			damping: 15,
		}),
		[index]
	);

	const highlightTransitionConfig = useMemo(
		() => ({
			type: 'spring',
			bounce: 0.2,
			duration: 0.4,
		}),
		[]
	);

	// Creamos un callback estable para el handler de click
	const handleClick = useCallback(() => {
		onNavigate(id);
	}, [id, onNavigate]);

	// Memoizamos las clases para evitar recreaciones
	const containerClasses = useMemo(() => cn('flex-1', isCollapsed && 'w-full'), [isCollapsed]);

	const buttonClasses = useMemo(
		() =>
			cn(
				'relative h-8 p-1 transition-all duration-200 rounded-sm cursor-pointer border-2 border-primary/10',
				'flex items-center justify-center',
				isCollapsed ? 'w-full' : 'w-full',
				isActive
					? 'bg-secondary/70 text-foreground'
					: 'hover:bg-secondary/30 text-muted-foreground hover:text-foreground'
			),
		[isActive, isCollapsed]
	);

	const dotClasses = useMemo(
		() =>
			cn(
				'absolute w-1 h-1 rounded-full bg-primary',
				isCollapsed
					? '-right-[0.5px] top-1/2 transform -translate-y-1/2'
					: '-bottom-[0.5px] left-1/2 transform -translate-x-1/2'
			),
		[isCollapsed]
	);

	const iconClasses = useMemo(
		() =>
			cn(
				'h-3.5 w-3.5 transition-colors',
				isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
			),
		[isActive]
	);

	return (
		<TooltipProvider delayDuration={isCollapsed ? 200 : 1000}>
			<Tooltip>
				<TooltipTrigger asChild>
					<motion.div
						initial={initialConfig}
						animate={animateConfig}
						transition={transitionConfig}
						className={containerClasses}
					>
						<Button variant="outline" className={buttonClasses} onClick={handleClick}>
							{/* Highlight indicator */}
							{isActive && (
								<motion.div
									layoutId="nav-highlight"
									className="absolute inset-0 rounded-sm bg-primary/5 ring-1 ring-primary/10 z-0"
									transition={highlightTransitionConfig}
								/>
							)}

							{/* Indicator dot */}
							{isActive && (
								<motion.div
									layoutId="nav-dot"
									className={dotClasses}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.05 }}
								/>
							)}

							{/* Content */}
							<motion.div
								className="flex items-center justify-center space-x-1.5 z-10"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<Icon className={iconClasses} />
							</motion.div>
						</Button>
					</motion.div>
				</TooltipTrigger>
				<TooltipContent side={isCollapsed ? 'right' : 'bottom'} className="text-xs p-2">
					<p className="font-medium text-amber-400">{label}</p>
					<p>{description}</p>
					{id === 'all-images' && (
						<p className="text-[10px] text-zinc-400 mt-1.5">
							Acceso rápido con <span className="px-1 py-0.5 bg-zinc-800 rounded text-[9px]">Ctrl+G</span>
						</p>
					)}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
});

export const NavMainNavigation = memo(function NavMainNavigation({
	currentView,
	onNavigate,
	isCollapsed = false,
}: NavMainNavigationProps) {
	// Nueva estructura file-centric
	const NAVIGATION_CATEGORIES = [
		{
			id: 'files',
			label: 'Archivos',
			color: '#3B82F6',
			icon: Home,
			children: [
				{ id: 'all-files', label: 'Todos los archivos', icon: Home },
				{ id: 'images', label: 'Imágenes', icon: Home },
				{ id: 'videos', label: 'Videos', icon: Home },
				{ id: 'audio', label: 'Audio', icon: Home },
				{ id: 'docs', label: 'Documentos', icon: Home },
				{ id: 'json', label: 'JSON', icon: Home },
				{ id: 'workflows', label: 'Workflows', icon: Home },
				{ id: 'file3d', label: '3D', icon: Home },
			],
		},
		{
			id: 'library',
			label: 'Librería',
			color: '#A21CAF',
			icon: Palette,
			children: [
				{ id: 'favorites', label: 'Favoritos', icon: Palette },
				{ id: 'albums', label: 'Álbumes', icon: Palette },
				{ id: 'groups', label: 'Grupos', icon: Palette },
				{ id: 'tags', label: 'Etiquetas', icon: Palette },
				{ id: 'collections', label: 'Colecciones', icon: Palette },
				{ id: 'prompts', label: 'Prompts', icon: Palette },
			],
		},
		{
			id: 'worldbuilding',
			label: 'Worldbuilding',
			color: '#059669',
			icon: IdCard,
			children: [
				{ id: 'characters', label: 'Personajes', icon: IdCard },
				{ id: 'places', label: 'Lugares', icon: IdCard },
				{ id: 'world-items', label: 'Objetos del mundo', icon: IdCard },
				{ id: 'concepts', label: 'Conceptos', icon: IdCard },
				{ id: 'wildcards', label: 'Comodines', icon: IdCard },
			],
		},
	];

	const containerClasses = useMemo(() => cn('pb-1 pt-1', isCollapsed ? 'px-1' : 'px-2'), [isCollapsed]);
	const innerContainerClasses = useMemo(() => cn('rounded-md p-0.5 shadow-sm', isCollapsed && 'p-0.5'), [isCollapsed]);
	const flexContainerClasses = useMemo(() => cn('flex flex-col gap-1'), []);

	return (
		<div className={containerClasses}>
			<div className={innerContainerClasses}>
				<div className={flexContainerClasses}>
					{NAVIGATION_CATEGORIES.map((category, catIdx) => (
						<div key={category.id} className="mb-1">
							<div className="flex items-center gap-1 mb-0.5">
								<category.icon className="h-4 w-4" style={{ color: category.color }} />
								<span className="font-semibold text-xs" style={{ color: category.color }}>{category.label}</span>
							</div>
							<div className="flex flex-col gap-0.5">
								{category.children.map((child, idx) => (
									<Button
										key={child.id}
										variant={currentView === child.id ? 'secondary' : 'ghost'}
										className={cn('justify-between w-full text-xs px-2 py-0.5 rounded flex items-center', currentView === child.id && 'font-bold')}
										onClick={() => onNavigate(child.id as ViewType)}
									>
										<span className="flex items-center">
											<child.icon className="h-3 w-3 mr-2" />
											{child.label}
										</span>
										{child.itemCount !== undefined && (
											<span className="ml-2 text-[10px] text-muted-foreground tabular-nums min-w-[18px] text-right">
												{child.itemCount}
											</span>
										)}
										{child.count !== undefined && (
											<span className="ml-2 text-[10px] text-muted-foreground tabular-nums min-w-[18px] text-right">
												{child.count}
											</span>
										)}
									</Button>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
});
