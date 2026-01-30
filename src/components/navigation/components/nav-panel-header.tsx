// MIGRADO PARA VITE - Arreglado sistema de theming
import { BookOpen, Bug, Eye, Home, IdCard, Moon, Palette, Settings2, Sun } from 'lucide-react';
import React, { memo, useCallback, useMemo } from 'react';
import { motion } from '@/components/ui/animejs-shim';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/ui/theme-provider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';

interface NavPanelHeaderProps {
	isCollapsed?: boolean;
	onOpenSettings: () => void;
	onOpenDevelopment: () => void;
	onOpenEntityCards: () => void;
	onToggleZenMode?: () => void; // 🧘 Nuevo prop para modo zen
	isAnimating?: boolean;
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
					aria-label={tooltipTitle}
					className="h-7 w-7 cursor-pointer rounded-md bg-transparent text-muted-foreground transition-all hover:bg-secondary/40 hover:text-foreground"
					onClick={onClick}
					size="icon"
					variant="ghost"
				>
					{icon}
				</Button>
			</TooltipTrigger>
			<TooltipContent className="text-xs">
				<p className="font-medium text-foreground">{tooltipTitle}</p>
				<p>{tooltipContent}</p>
				{tooltipNote && <p className="mt-1.5 text-[10px] text-muted-foreground">{tooltipNote}</p>}
			</TooltipContent>
		</Tooltip>
	);
});

// Componente de avatar memoizado
const MemoizedAvatar = memo(function Avatar({ color, emoji }: { color: string; emoji: string }) {
	return (
		<motion.div className="group relative" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
			<div
				className="flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded-full shadow-sm transition-all duration-200 group-hover:brightness-110"
				style={{
					backgroundColor: color,
					boxShadow: '0 0 0 1px oklch(0 0 0 / 5%), 0 1px 3px 0 var(--dt-shadow-color)',
				}}
			>
				<span className="font-large text-sm">{emoji}</span>
			</div>
		</motion.div>
	);
});

function getThemeIcon(theme: string | undefined) {
	switch (theme) {
		case 'light':
			return <Sun className="h-4 w-4 text-primary" />;
		case 'dark':
			return <Moon className="h-4 w-4 text-primary" />;
		case 'nocturno':
		case 'carbon':
			return <Moon className="h-4 w-4 text-primary" />;
		case 'cafe':
		case 'madera':
			return <Palette className="h-4 w-4 text-amber-600" />;
		case 'violeta':
			return <Palette className="h-4 w-4 text-purple-500" />;
		case 'verde':
			return <Palette className="h-4 w-4 text-green-500" />;
		case 'atardecer':
			return <Palette className="h-4 w-4 text-orange-500" />;
		case 'corporativo':
			return <Palette className="h-4 w-4 text-blue-500" />;
		case 'teal':
			return <Palette className="h-4 w-4 text-teal-500" />;
		case 'citrico':
			return <Palette className="h-4 w-4 text-lime-500" />;
		case 'aurora':
			return <Palette className="h-4 w-4 text-cyan-400" />;
		case 'neon':
			return <Palette className="h-4 w-4 text-pink-500" />;
		default:
			return <Palette className="h-4 w-4 text-primary" />;
	}
}

// Componente principal memoizado
const NavPanelHeaderComponent = memo(function NavPanelHeaderImpl({
	isCollapsed = false,
	onOpenSettings,
	onOpenDevelopment,
	onOpenEntityCards,
	onToggleZenMode, // 🧘 Nuevo prop para modo zen
	isAnimating = false,
}: NavPanelHeaderProps) {
	// Perfil por defecto - reemplazar con datos reales del contexto de usuario
	const activeProfileData = useMemo(
		() => ({
			name: 'Usuario',
			emoji: '🎨',
			color: 'var(--entity-profile)',
		}),
		[]
	);

	const { theme, setTheme, themes } = useTheme();
	const { setView } = useUIStore();

	/**
	 * Callback para el botón Inicio.
	 * @description Navega a la vista del dashboard
	 * @returns void
	 */
	const handleHomeClick = useCallback((): void => {
		window.location.href = '/';
	}, []);

	return (
		<div className="min-w-0 overflow-hidden border-border/20 border-b bg-gradient-to-b from-background/90 to-transparent py-2 shadow-sm">
			{/* 📋 Layout responsivo */}
			<div
				className={cn(
					'flex w-full min-w-0 gap-2 px-2 transition-all duration-300',
					isCollapsed ? 'flex-col items-center py-1' : 'flex-col'
				)}
			>
				{/* Avatar */}
				<div
					className={cn(
						'flex w-full min-w-0 items-center justify-between p-1',
						isCollapsed ? 'mb-1 justify-center' : 'w-full justify-between'
					)}
				>
					<div className={cn('flex min-w-0 items-center gap-2', isCollapsed && 'justify-center')}>
						<MemoizedAvatar color={activeProfileData.color} emoji={activeProfileData.emoji} />

						{!isCollapsed && (
							<div className="flex min-w-0 overflow-hidden">
								<div className="flex min-w-0 items-center gap-2">
									<span className="truncate font-medium text-foreground/80 text-sm leading-tight">
										{activeProfileData?.name}
									</span>
								</div>
							</div>
						)}
					</div>
					{/* Botones de acción */}
					{!isCollapsed && (
						<div className="ml-auto flex shrink-0 items-center gap-1">
							<MemoizedHeaderButton
								icon={<Home className="h-3.5 w-3.5" />}
								onClick={handleHomeClick}
								tooltipContent="Volver al dashboard"
								tooltipTitle="Inicio"
							/>

							<MemoizedHeaderButton
								icon={<IdCard className="h-3.5 w-3.5" />}
								onClick={onOpenEntityCards}
								tooltipContent="Visualizador y herramientas para tarjetas de entidades"
								tooltipTitle="Entity Cards"
							/>

							<MemoizedHeaderButton
								icon={<Bug className="h-3.5 w-3.5" />}
								onClick={onOpenDevelopment}
								tooltipContent="Accede a herramientas de desarrollo y depuración"
								tooltipNote="Solo para administradores"
								tooltipTitle="Modo Desarrollador"
							/>

							<MemoizedHeaderButton
								icon={<BookOpen className="h-3.5 w-3.5" />}
								onClick={() => window.open('/docs', '_blank')}
								tooltipContent="Abre la documentación de la aplicación"
								tooltipTitle="Documentación"
							/>

							{/* 🧘 Botón de modo zen */}
							{onToggleZenMode && (
								<MemoizedHeaderButton
									icon={<Eye className="h-3.5 w-3.5" />}
									onClick={onToggleZenMode}
									tooltipContent="Activa el modo de concentración"
									tooltipNote="Oculta distracciones"
									tooltipTitle="Modo Zen"
								/>
							)}

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										aria-label="Cambiar tema"
										className="h-7 w-7 cursor-pointer rounded-md bg-transparent text-muted-foreground transition-all hover:bg-secondary/40 hover:text-foreground"
										size="icon"
										variant="ghost"
									>
										{getThemeIcon(theme)}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{themes.map((t) => (
										<DropdownMenuItem key={t} onClick={() => setTheme(t as any)}>
											{t.charAt(0).toUpperCase() + t.slice(1)}
											{theme === t && <span className="ml-2 text-primary text-xs">(actual)</span>}
										</DropdownMenuItem>
									))}
									<DropdownMenuItem onClick={() => setTheme('system')}>
										Sistema{theme === 'system' && <span className="ml-2 text-primary text-xs">(actual)</span>}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							<MemoizedHeaderButton
								icon={<Settings2 className="h-3.5 w-3.5" />}
								onClick={onOpenSettings}
								tooltipContent="Personaliza tu experiencia"
								tooltipTitle="Configuración"
							/>
						</div>
					)}
				</div>

				{/* Solo avatar cuando está colapsado */}
				{isCollapsed && (
					<div className="mt-1 flex flex-col items-center gap-0.5">
						<MemoizedHeaderButton
							icon={<Settings2 className="h-2.5 w-2.5" />}
							onClick={onOpenSettings}
							tooltipContent="Personaliza tu experiencia"
							tooltipTitle="Configuración"
						/>
					</div>
				)}
			</div>
		</div>
	);
});

export const NavPanelHeader = NavPanelHeaderComponent;
