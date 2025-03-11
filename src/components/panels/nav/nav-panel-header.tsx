'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProfileContext } from '@/lib/contexts';
import { Bug, ImageIcon, Moon, Settings2, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from 'next-themes';

interface NavPanelHeaderProps {
	totalImages: number;
	onOpenSettings: () => void;
	onOpenDevelopment: () => void;
}

export function NavPanelHeader({ totalImages, onOpenSettings, onOpenDevelopment }: NavPanelHeaderProps) {
	const { settings } = useProfileContext();
	const { profiles = [], activeProfile } = settings;
	const activeProfileData = profiles.find((p) => p.id === activeProfile) ||
		profiles[0] || {
			name: 'Default',
			emoji: '👤',
			color: '#3b82f6',
		};

	const { theme, setTheme } = useTheme();

	const handleThemeToggle = () => {
		setTheme(theme === 'light' ? 'dark' : 'light');
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.1, ease: 'easeOut' }}
			className="relative bg-gradient-to-b from-background/90 to-transparent py-1 border-b border-border/20 shadow-sm"
		>
			<div className="flex items-center justify-between px-3">
				{/* Perfil y estadísticas */}
				<div className="flex items-center gap-2">
					<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative group">
						<div
							className="h-9 w-9 rounded-md flex items-center justify-center shadow-sm transition-all duration-200 overflow-hidden group-hover:brightness-110 cursor-pointer "
							style={{
								backgroundColor: activeProfileData?.color,
								boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 1px 3px 0 rgba(0,0,0,0.1)',
							}}
						>
							<span className="text-sm font-large">{activeProfileData?.emoji}</span>
						</div>
					</motion.div>

					<div className="flex flex-col">
						<motion.span
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.1 }}
							className="text-xs leading-tight text-foreground/60 tracking-tight"
						>
							{activeProfileData?.name}
						</motion.span>
						<motion.div
							initial={{ opacity: 0, width: 0 }}
							animate={{ opacity: 1, width: 'auto' }}
							transition={{ delay: 0.2 }}
							className="flex items-center"
						>
							<span className="inline-flex items-center gap-1 text-[10px] mt-1 text-muted-foreground">
								<ImageIcon className="h-2.5 w-2.5" />
								{totalImages.toLocaleString()}
							</span>
						</motion.div>
					</div>
				</div>

				{/* Controles y acciones */}
				<div className="flex items-center gap-1">
					<TooltipProvider delayDuration={300}>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 bg-transparent hover:bg-secondary/40 rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
									onClick={onOpenDevelopment}
								>
									<Bug className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom" className="text-xs">
								<p className="font-medium text-amber-400">Modo Desarrollador</p>
								<p>Accede a herramientas de desarrollo y depuración</p>
								<p className="text-[10px] text-zinc-400 mt-1.5">Solo para administradores</p>
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 bg-transparent hover:bg-secondary/40 rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
									onClick={handleThemeToggle}
								>
									<motion.div
										initial={false}
										animate={{ rotate: theme === 'light' ? 0 : 180 }}
										transition={{
											duration: 0.3,
											type: 'spring',
											stiffness: 200,
										}}
									>
										{theme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
									</motion.div>
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom" className="text-xs">
								<p className="font-medium text-amber-400">Cambiar Tema</p>
								<p>Modo {theme === 'light' ? 'oscuro' : 'claro'}</p>
								<p className="text-[10px] text-zinc-400 mt-1.5">
									Acceso rápido con <span className="px-1 py-0.5 bg-zinc-800 rounded text-[9px]">Ctrl+T</span>
								</p>
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 bg-transparent hover:bg-secondary/40 rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
									onClick={onOpenSettings}
								>
									<Settings2 className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom" className="text-xs">
								<p className="font-medium text-amber-400">Configuración</p>
								<p>Personaliza tu experiencia</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>
		</motion.div>
	);
}
