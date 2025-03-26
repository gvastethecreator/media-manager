'use client';

import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useProfileContext } from '@/lib/contexts';
import { Bug, ChevronLeft, ChevronRight, Home, IdCard, Moon, Settings2, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from 'next-themes';
import { memo, useCallback, useMemo } from 'react';

interface NavPanelHeaderProps {
	totalImages: number;
	onOpenSettings: () => void;
	onOpenDevelopment: () => void;
	onOpenEntityCards: () => void;
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
}

// Componente de botón memoizado para evitar re-renderizados
const MemoizedHeaderButton = memo(function HeaderButton({
	icon,
	onClick,
	tooltipContent,
	tooltipTitle,
	tooltipNote,
	tooltipSide = 'bottom',
}: {
	icon: React.ReactNode;
	onClick: () => void;
	tooltipContent: string;
	tooltipTitle: string;
	tooltipNote?: string;
	tooltipSide?: 'bottom' | 'right' | 'left' | 'top';
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 bg-transparent hover:bg-secondary/40 rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
					onClick={onClick}
				>
					{icon}
				</Button>
			</TooltipTrigger>
			<TooltipContent side={tooltipSide} className="text-xs">
				<p className="font-medium text-amber-400">{tooltipTitle}</p>
				<p>{tooltipContent}</p>
				{tooltipNote && <p className="text-[10px] text-zinc-400 mt-1.5">{tooltipNote}</p>}
			</TooltipContent>
		</Tooltip>
	);
});

// Componente de avatar memoizado
const MemoizedAvatar = memo(function Avatar({
	color,
	emoji,
}: {
	color: string;
	emoji: string;
}) {
	return (
		<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative group">
			<div
				className="h-6 w-6 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 overflow-hidden group-hover:brightness-110 cursor-pointer"
				style={{
					backgroundColor: color,
					boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 1px 3px 0 rgba(0,0,0,0.1)',
				}}
			>
				<span className="text-sm font-large">{emoji}</span>
			</div>
		</motion.div>
	);
});

// Componente principal memoizado
export const NavPanelHeader = memo(function NavPanelHeader({
	totalImages,
	onOpenSettings,
	onOpenDevelopment,
	onOpenEntityCards,
	isCollapsed = false,
	onToggleCollapse,
}: NavPanelHeaderProps) {
	const { settings } = useProfileContext();
	const { profiles = [], activeProfile } = settings;

	const activeProfileData = useMemo(() => {
		return profiles.find((p) => p.id === activeProfile) ||
		profiles[0] || {
			name: 'Default',
			emoji: '👤',
			color: '#3b82f6',
		};
	}, [profiles, activeProfile]);

	const { theme, setTheme } = useTheme();
	const { setCurrentView } = useNavigationStore();

	const handleThemeToggle = useCallback(() => {
		setTheme(theme === 'light' ? 'dark' : 'light');
	}, [theme, setTheme]);

	const handleHomeClick = useCallback(() => {
		setCurrentView('folders');
	}, [setCurrentView]);

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.1, ease: 'easeOut' }}
			className="relative bg-gradient-to-b from-background/90 to-transparent py-1 border-b border-border/20 shadow-sm"
		>
			{/* Si está colapsado, mostramos en formato vertical con avatar arriba */}
			{isCollapsed ? (
				<div className="flex flex-col items-center gap-3 pt-1 pb-2">
					{/* Avatar */}
					<MemoizedAvatar color={activeProfileData.color} emoji={activeProfileData.emoji} />

					{/* Controles en vertical */}
					<div className="flex flex-col gap-2">
						<MemoizedHeaderButton
							icon={<ChevronRight className="h-3.5 w-3.5" />}
							onClick={onToggleCollapse || (() => {})}
							tooltipTitle="Expandir Panel"
							tooltipContent=""
							tooltipSide="right"
						/>

						<MemoizedHeaderButton
							icon={<Home className="h-3.5 w-3.5" />}
							onClick={handleHomeClick}
							tooltipTitle="Inicio"
							tooltipContent="Volver a la vista de carpetas"
							tooltipSide="right"
						/>

						<MemoizedHeaderButton
							icon={<IdCard className="h-3.5 w-3.5" />}
							onClick={onOpenEntityCards}
							tooltipTitle="Entity Cards"
							tooltipContent="Visualizador y herramientas para tarjetas de entidades"
							tooltipSide="right"
						/>

						<MemoizedHeaderButton
							icon={<Bug className="h-3.5 w-3.5" />}
							onClick={onOpenDevelopment}
							tooltipTitle="Modo Desarrollador"
							tooltipContent="Accede a herramientas de desarrollo y depuración"
							tooltipNote="Solo para administradores"
							tooltipSide="right"
						/>

						<MemoizedHeaderButton
							icon={theme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
							onClick={handleThemeToggle}
							tooltipTitle="Cambiar Tema"
							tooltipContent={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
							tooltipSide="right"
						/>

						<MemoizedHeaderButton
							icon={<Settings2 className="h-3.5 w-3.5" />}
							onClick={onOpenSettings}
							tooltipTitle="Configuración"
							tooltipContent="Personaliza tu experiencia"
							tooltipSide="right"
						/>
					</div>
				</div>
			) : (
				/* Mantener layout horizontal cuando no está colapsado */
				<div className="flex items-center justify-between px-3">
					{/* Perfil y estadísticas */}
					<div className="flex items-center gap-2">
						<MemoizedAvatar color={activeProfileData.color} emoji={activeProfileData.emoji} />

						<div className="flex flex-col">
							<motion.div
								initial={{ opacity: 0, width: 0 }}
								animate={{ opacity: 1, width: 'auto' }}
								transition={{ delay: 0.1 }}
								className="flex items-center"
							>
								<span className="text-xs leading-tight text-foreground/60">{activeProfileData?.name}</span>
								<span className="inline-flex items-center gap-1 text-[10px] ml-2 text-muted-foreground">
									{totalImages.toLocaleString()} imagenes
								</span>
							</motion.div>
						</div>
					</div>

					{/* Controles y acciones */}
					<div className="flex items-center gap-1">
						<MemoizedHeaderButton
							icon={<ChevronLeft className="h-3.5 w-3.5" />}
							onClick={onToggleCollapse || (() => {})}
							tooltipTitle="Colapsar Panel"
							tooltipContent=""
						/>

						<MemoizedHeaderButton
							icon={<Home className="h-3.5 w-3.5" />}
							onClick={handleHomeClick}
							tooltipTitle="Inicio"
							tooltipContent="Volver a la vista de carpetas"
						/>

						<MemoizedHeaderButton
							icon={<IdCard className="h-3.5 w-3.5" />}
							onClick={onOpenEntityCards}
							tooltipTitle="Entity Cards"
							tooltipContent="Visualizador y herramientas para tarjetas de entidades"
						/>

						<MemoizedHeaderButton
							icon={<Bug className="h-3.5 w-3.5" />}
							onClick={onOpenDevelopment}
							tooltipTitle="Modo Desarrollador"
							tooltipContent="Accede a herramientas de desarrollo y depuración"
							tooltipNote="Solo para administradores"
						/>

						<MemoizedHeaderButton
							icon={theme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
							onClick={handleThemeToggle}
							tooltipTitle="Cambiar Tema"
							tooltipContent={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
						/>

						<MemoizedHeaderButton
							icon={<Settings2 className="h-3.5 w-3.5" />}
							onClick={onOpenSettings}
							tooltipTitle="Configuración"
							tooltipContent="Personaliza tu experiencia"
						/>
					</div>
				</div>
			)}
		</motion.div>
	);
});
