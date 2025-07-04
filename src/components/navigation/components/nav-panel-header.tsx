// MIGRADO PARA VITE - Arreglado sistema de theming
import {
    Bug,
    ChevronLeft,
    ChevronRight, Eye,
    Home,
    IdCard, Moon,
    Palette,
    Settings2,
    Sun
} from 'lucide-react';
import { motion } from 'motion/react';
import React, { memo, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useThemeSync } from '@/lib/contexts/settings-context';
import { useUIStore } from '@/store/ui.store';

// MOCK DATA para reemplazar useProfileContext
const mockProfileData = {
	settings: {
		avatar: {
			color: '#3B82F6',
			emoji: '🎨',
		},
		profiles: [
			{
				id: '1',
				name: 'Default',
				emoji: '🎨',
				color: '#3B82F6',
			},
		],
		activeProfile: '1',
	},
};

// Constante con los temas disponibles (solo los básicos para empezar)
const THEMES = ['light', 'dark', 'system'] as const;

type ThemeType = (typeof THEMES)[number];

// Función para obtener el siguiente tema
function getNextTheme(currentTheme: string | undefined): ThemeType {
	if (!currentTheme || !THEMES.includes(currentTheme as ThemeType)) {
		return 'light';
	}

	const currentIndex = THEMES.indexOf(currentTheme as ThemeType);
	const nextIndex = (currentIndex + 1) % THEMES.length;
	return THEMES[nextIndex];
}

// Función para obtener el icono del tema
function getThemeIcon(theme: string | undefined) {
	switch (theme) {
		case 'light':
			return <Sun className="h-3.5 w-3.5" />;
		case 'dark':
			return <Moon className="h-3.5 w-3.5" />;
		case 'system':
			return <Palette className="h-3.5 w-3.5" />;
		default:
			return <Sun className="h-3.5 w-3.5" />;
	}
}

// Función para obtener el nombre del tema en español
function getThemeName(theme: string | undefined): string {
	switch (theme) {
		case 'light':
			return 'Claro';
		case 'dark':
			return 'Oscuro';
		case 'system':
			return 'Sistema';
		default:
			return 'Claro';
	}
}

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
			<TooltipTrigger>
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
	const { settings } = mockProfileData;
	const { profiles = [], activeProfile } = settings;

	const activeProfileData = useMemo(() => {
		return (
			profiles.find((p) => p.id === activeProfile) ||
			profiles[0] || {
				name: 'Default',
				emoji: '👤',
				color: '#3b82f6',
			}
		);
	}, [profiles, activeProfile]);

	const { theme, setTheme } = useThemeSync();
	const { setView } = useUIStore();

	const handleThemeToggle = () => {
		const nextTheme = getNextTheme(theme);
		console.log(`Cambiando tema de ${theme} a ${nextTheme}`);

		// Actualizar el estado del tema
		setTheme(nextTheme);
	};

	const handleHomeClick = useCallback(() => {
		setView('grid');
	}, [setView]);

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.1, ease: 'easeOut' }}
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

						<MemoizedHeaderButton
							icon={getThemeIcon(theme)}
							onClick={handleThemeToggle}
							tooltipTitle="Tema"
							tooltipContent={`Actual: ${getThemeName(theme)}`}
						/>

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

						<MemoizedHeaderButton
							icon={getThemeIcon(theme)}
							onClick={handleThemeToggle}
							tooltipTitle="Tema"
							tooltipContent={`Actual: ${getThemeName(theme)}`}
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
