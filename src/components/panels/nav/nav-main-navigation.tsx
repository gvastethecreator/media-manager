'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';
import type { ViewType } from '@/types/file-item';
import { BookImage, Image as ImageIcon, Search, Star, UploadCloud } from 'lucide-react';
import { motion } from 'motion/react';

interface NavMainNavigationProps {
	currentView: string;
	onNavigate: (id: ViewType) => void;
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
		description: 'Tus imágenes favoritas',
	},
	{
		id: 'search' as ViewType,
		label: 'Buscar',
		icon: Search,
		description: 'Buscar en tu biblioteca',
	},
];

export function NavMainNavigation({ currentView, onNavigate }: NavMainNavigationProps) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
			className="px-2 pb-2 pt-1"
		>
			<div className="bg-background/50 backdrop-blur-sm rounded-md p-1 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
				<div className="flex justify-between gap-1">
					{navigationItems.map(({ id, icon: Icon, label, description }, index) => {
						const isActive = currentView === id;

						return (
							<TooltipProvider key={id} delayDuration={300}>
								<Tooltip>
									<TooltipTrigger asChild>
										<motion.div
											initial={{ opacity: 0, scale: 0.95 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{
												delay: index * 0.05,
												duration: 0.3,
												type: 'spring',
												stiffness: 200,
												damping: 15,
											}}
											className="flex-1"
										>
											<Button
												variant="ghost"
												className={cn(
													'relative w-full h-6 px-0 transition-all duration-200 rounded-sm',
													'flex items-center justify-center',
													isActive
														? 'bg-secondary/70 text-foreground'
														: 'hover:bg-secondary/30 text-muted-foreground hover:text-foreground'
												)}
												onClick={() => onNavigate(id)}
											>
												{/* Highlight indicator */}
												{isActive && (
													<motion.div
														layoutId="nav-highlight"
														className="absolute inset-0 rounded-sm bg-primary/5 ring-1 ring-primary/10 z-0"
														transition={{
															type: 'spring',
															bounce: 0.2,
															duration: 0.4,
														}}
													/>
												)}

												{/* Indicator dot */}
												{isActive && (
													<motion.div
														layoutId="nav-dot"
														className="absolute -bottom-[0.5px] left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														transition={{ delay: 0.1 }}
													/>
												)}

												{/* Content */}
												<motion.div
													className="flex items-center justify-center space-x-1.5 z-10"
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
												>
													<Icon
														className={cn(
															'h-3.5 w-3.5 transition-colors',
															isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
														)}
													/>
													<span className="text-xs font-medium truncate">{label}</span>
												</motion.div>
											</Button>
										</motion.div>
									</TooltipTrigger>
									<TooltipContent side="bottom" className="text-xs p-2">
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
					})}
				</div>
			</div>
		</motion.div>
	);
}
