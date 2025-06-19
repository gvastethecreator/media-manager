'use client';

import { Image as ImageIcon, Layers, MessageSquare, Search, Star, UploadCloud } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ViewType } from '@/types/files';

interface NavMainNavigationProps {
	currentView: string;
	onNavigate: (id: ViewType) => void;
	isCollapsed?: boolean;
}

interface NavigationItem {
	id: ViewType;
	label: string;
	icon: typeof ImageIcon;
	description?: string;
}

const navigationItems: NavigationItem[] = [
	{
		id: 'all-images' as ViewType,
		label: 'Galería',
		icon: ImageIcon,
		description: 'Todas las imágenes en tu biblioteca',
	},
	{
		id: 'uploaded-images' as ViewType,
		label: 'Subidas',
		icon: UploadCloud,
		description: 'Imágenes subidas recientemente',
	},
	{
		id: 'favorites' as ViewType,
		label: 'Favoritos',
		icon: Star,
		description: 'Imágenes favoritas',
	},
	{
		id: 'canvas' as ViewType,
		label: 'Canvas',
		icon: Layers,
		description: 'Espacio de trabajo visual (próximamente)',
	},
	{
		id: 'chat' as ViewType,
		label: 'Chat',
		icon: MessageSquare,
		description: 'Conversaciones inteligentes (próximamente)',
	},
	{
		id: 'search' as ViewType,
		label: 'Buscar',
		icon: Search,
		description: 'Buscar en tu biblioteca',
	},
];

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
	// Evitar recreación del contenedor
	const containerClasses = useMemo(() => cn('pb-2 pt-1', isCollapsed ? 'px-1' : 'px-2'), [isCollapsed]);

	const innerContainerClasses = useMemo(() => cn('rounded-md p-1 shadow-sm', isCollapsed && 'p-0.5'), [isCollapsed]);

	const flexContainerClasses = useMemo(
		() => cn('flex', isCollapsed ? 'flex-col gap-2' : 'justify-between gap-1'),
		[isCollapsed]
	);

	// Configuración de animación memoizada
	const initialConfig = useMemo(
		() => ({
			opacity: 0,
		}),
		[]
	);

	const animateConfig = useMemo(
		() => ({
			opacity: 1,
		}),
		[]
	);

	const transitionConfig = useMemo(
		() => ({
			duration: 0.3,
		}),
		[]
	);

	return (
		<motion.div
			initial={initialConfig}
			animate={animateConfig}
			transition={transitionConfig}
			className={containerClasses}
		>
			<div className={innerContainerClasses}>
				<div className={flexContainerClasses}>
					{navigationItems.map((item, index) => {
						const uniqueKey = `${item.id}-${item.label.toLowerCase()}`;
						return (
							<NavButton
								key={uniqueKey}
								{...item}
								isActive={currentView === item.id}
								isCollapsed={isCollapsed}
								index={index}
								onNavigate={onNavigate}
							/>
						);
					})}
				</div>
			</div>
		</motion.div>
	);
});
