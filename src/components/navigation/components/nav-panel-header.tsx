// MIGRADO PARA VITE - Arreglado sistema de theming
import { Bug, ChevronLeft, ChevronRight, Eye, Home, IdCard, Moon, Palette, Settings2, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import React, { memo, useCallback, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/ui/theme-provider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUIStore } from '@/store/ui.store';

interface NavPanelHeaderProps {
	totalImages: number;
	onOpenSettings: () => void;
	onOpenDevelopment: () => void;
	onOpenEntityCards: () => void;
	onToggleZenMode?: () => void; // 🧘 Nuevo prop para modo zen
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
}: {
	icon: React.ReactNode;
	onClick: () => void;
	tooltipContent: string;
	tooltipTitle: string;
	tooltipNote?: string;
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
			<TooltipContent className="text-xs">
				<p className="font-medium text-amber-400">{tooltipTitle}</p>
				<p>{tooltipContent}</p>
				{tooltipNote && <p className="text-[10px] text-zinc-400 mt-1.5">{tooltipNote}</p>}
			</TooltipContent>
		</Tooltip>
	);
});

// Componente de avatar memoizado
const MemoizedAvatar = memo(function Avatar({ color, emoji }: { color: string; emoji: string }) {
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

function getThemeIcon(theme: string | undefined) {
	switch (theme) {
		case 'light':
			return <Sun className="h-4 w-4 text-yellow-400" />;
		case 'dark':
			return <Moon className="h-4 w-4 text-blue-400" />;
		case 'cafe':
			return <Palette className="h-4 w-4 text-amber-700" />;
		case 'violeta':
			return <Palette className="h-4 w-4 text-violet-400" />;
		case 'madera':
			return <Palette className="h-4 w-4 text-yellow-800" />;
		case 'nocturno':
			return <Moon className="h-4 w-4 text-sky-400" />;
		case 'verde':
			return <Palette className="h-4 w-4 text-green-400" />;
		case 'atardecer':
			return <Palette className="h-4 w-4 text-orange-400" />;
		case 'corporativo':
			return <Palette className="h-4 w-4 text-blue-600" />;
		case 'carbon':
			return <Palette className="h-4 w-4 text-neutral-500" />;
		case 'teal':
			return <Palette className="h-4 w-4 text-teal-400" />;
		case 'citrico':
			return <Palette className="h-4 w-4 text-lime-400" />;
		default:
			return <Palette className="h-4 w-4 text-primary" />;
	}
}

// Componente principal memoizado
export const NavPanelHeader = memo(function NavPanelHeader({
	totalImages,
	onOpenSettings,
	onOpenDevelopment,
	onOpenEntityCards,
	onToggleZenMode, // 🧘 Nuevo prop para modo zen
	isCollapsed = false,
	onToggleCollapse,
}: NavPanelHeaderProps) {
	// Perfil por defecto - reemplazar con datos reales del contexto de usuario
	const activeProfileData = useMemo(
		() => ({
			name: 'Usuario',
			emoji: '🎨',
			color: '#3b82f6',
		}),
		[]
	);

	const { theme, setTheme, themes } = useTheme();
	const { setView } = useUIStore();

	/**
	 * Callback para el botón Inicio.
	 * @description Navega a la vista principal de carpetas
	 * @returns void
	 */
	const handleHomeClick = useCallback((): void => {
		setView('grid');
	}, [setView]);

	return (
		<motion.div
			initial={{ opacity: 0, y: -10, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.2, ease: 'easeInOut' }}
			className="relative bg-gradient-to-b from-background/90 to-transparent py-2 border-b border-border/20 shadow-sm"
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

						{/* 🧘 Botón de modo zen */}
						{onToggleZenMode && (
							<MemoizedHeaderButton
								icon={<Eye className="h-3.5 w-3.5" />}
								onClick={onToggleZenMode}
								tooltipTitle="Modo Zen"
								tooltipContent="Activa el modo de concentración"
								tooltipNote="Oculta distracciones"
							/>
						)}

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 bg-transparent hover:bg-secondary/40 rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
								>
									{getThemeIcon(theme)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{themes.map((t) => (
									<DropdownMenuItem key={t} onClick={() => setTheme(t as any)}>
										{t.charAt(0).toUpperCase() + t.slice(1)}
										{theme === t && <span className="ml-2 text-xs text-primary">(actual)</span>}
									</DropdownMenuItem>
								))}
								<DropdownMenuItem onClick={() => setTheme('system')}>
									Sistema{theme === 'system' && <span className="ml-2 text-xs text-primary">(actual)</span>}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						<MemoizedHeaderButton
							icon={<Settings2 className="h-3.5 w-3.5" />}
							onClick={onOpenSettings}
							tooltipTitle="Configuración"
							tooltipContent="Personaliza tu experiencia"
						/>
					</div>
				</div>
			) : (
				/* 📋 Nuevo layout en 2 filas cuando no está colapsado */
				<div className="flex flex-col gap-2 px-3">
					{/* 🔸 Primera fila: Avatar, nombre y estadísticas */}
					<div className="flex items-center justify-between">
						{/* Perfil y estadísticas */}
						<div className="flex items-center gap-2">
							<MemoizedAvatar color={activeProfileData.color} emoji={activeProfileData.emoji} />

							<div className="flex flex-col">
								<motion.div
									initial={{ opacity: 0, width: 0 }}
									animate={{ opacity: 1, width: 'auto' }}
									transition={{ delay: 0.1 }}
									className="flex items-center gap-2"
								>
									<span className="text-xs leading-tight text-foreground/80 font-medium">
										{activeProfileData?.name}
									</span>
									<span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-accent/30 rounded-full text-muted-foreground">
										📸 {totalImages.toLocaleString()} imágenes
									</span>
								</motion.div>
							</div>
						</div>

						{/* Botón de colapsar */}
						<MemoizedHeaderButton
							icon={<ChevronLeft className="h-3.5 w-3.5" />}
							onClick={onToggleCollapse || (() => {})}
							tooltipTitle="Colapsar Panel"
							tooltipContent=""
						/>
					</div>

					{/* 🔹 Segunda fila: Botones de acción */}
					<div className="flex items-center justify-center gap-1">
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

						{/* 🧘 Botón de modo zen */}
						{onToggleZenMode && (
							<MemoizedHeaderButton
								icon={<Eye className="h-3.5 w-3.5" />}
								onClick={onToggleZenMode}
								tooltipTitle="Modo Zen"
								tooltipContent="Activa el modo de concentración"
								tooltipNote="Oculta distracciones"
							/>
						)}

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 bg-transparent hover:bg-secondary/40 rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
								>
									{getThemeIcon(theme)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{themes.map((t) => (
									<DropdownMenuItem key={t} onClick={() => setTheme(t as any)}>
										{t.charAt(0).toUpperCase() + t.slice(1)}
										{theme === t && <span className="ml-2 text-xs text-primary">(actual)</span>}
									</DropdownMenuItem>
								))}
								<DropdownMenuItem onClick={() => setTheme('system')}>
									Sistema{theme === 'system' && <span className="ml-2 text-xs text-primary">(actual)</span>}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

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
