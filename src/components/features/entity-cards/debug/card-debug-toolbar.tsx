'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
	Bug,
	Circle,
	Component,
	Dices,
	Film,
	Laptop,
	Layers,
	Palette,
	PictureInPicture,
	Snowflake,
	Sparkles,
	XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Tipo para el estado de configuración de depuración
export interface CardDebugState {
	enabled: boolean;
	systems: {
		layers: boolean;
		design: boolean;
		animation: boolean;
		holographic: boolean;
		pixelate: boolean;
		glow: boolean;
		scanlines: boolean;
		border: boolean;
		grain: boolean;
		backsideEnabled: boolean;
	};
	performance: {
		monitorFPS: boolean;
		showRenderCount: boolean;
	};
}

// Estado predeterminado para depuración
const defaultDebugState: CardDebugState = {
	enabled: false,
	systems: {
		layers: true,
		design: true,
		animation: true,
		holographic: true,
		pixelate: true,
		glow: true,
		scanlines: true,
		border: true,
		grain: true,
		backsideEnabled: true,
	},
	performance: {
		monitorFPS: false,
		showRenderCount: false,
	},
};

// Clave para persistir la configuración en localStorage
const STORAGE_KEY = 'entity-card-debug-config';

interface CardDebugToolbarProps {
	onStateChange?: (state: CardDebugState) => void;
	className?: string;
}

/**
 * Barra de herramientas flotante para depuración de EntityCards
 * Permite habilitar/deshabilitar componentes individuales para facilitar pruebas
 */
export function CardDebugToolbar({ onStateChange, className }: CardDebugToolbarProps) {
	// Estado de la barra de depuración
	const [debugState, setDebugState] = useState<CardDebugState>(defaultDebugState);
	const [isMinimized, setIsMinimized] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [fps, setFps] = useState(0);
	const [renderCount, setRenderCount] = useState(0);

	// Efecto para cargar la configuración almacenada al inicio
	useEffect(() => {
		try {
			const savedConfig = localStorage.getItem(STORAGE_KEY);
			if (savedConfig) {
				const parsedConfig = JSON.parse(savedConfig) as CardDebugState;
				setDebugState(parsedConfig);
			}
		} catch (error) {
			console.warn('Error al cargar configuración de depuración:', error);
		}
	}, []);

	// Efecto para guardar cambios en la configuración
	useEffect(() => {
		if (debugState.enabled) {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(debugState));
				onStateChange?.(debugState);
			} catch (error) {
				console.warn('Error al guardar configuración de depuración:', error);
			}
		}
	}, [debugState, onStateChange]);

	// Efecto para medir FPS si está habilitado
	useEffect(() => {
		if (!debugState.performance.monitorFPS) return;

		let frameCount = 0;
		let lastTime = performance.now();

		const countFrame = () => {
			frameCount++;
			const now = performance.now();

			if (now - lastTime >= 1000) {
				setFps(Math.round((frameCount * 1000) / (now - lastTime)));
				frameCount = 0;
				lastTime = now;
			}

			frameID = requestAnimationFrame(countFrame);
		};

		let frameID = requestAnimationFrame(countFrame);

		return () => cancelAnimationFrame(frameID);
	}, [debugState.performance.monitorFPS]);

	// Efecto para contar renders cuando está habilitado
	useEffect(() => {
		if (debugState.performance.showRenderCount) {
			setRenderCount((prev) => prev + 1);
		}
	}, [debugState.performance.showRenderCount]);

	// Función para cambiar estado de un sistema
	const toggleSystem = (system: keyof CardDebugState['systems']) => {
		setDebugState((prev) => ({
			...prev,
			systems: {
				...prev.systems,
				[system]: !prev.systems[system],
			},
		}));
	};

	// Función para cambiar estado de monitoreo de rendimiento
	const togglePerformance = (metric: keyof CardDebugState['performance']) => {
		setDebugState((prev) => ({
			...prev,
			performance: {
				...prev.performance,
				[metric]: !prev.performance[metric],
			},
		}));
	};

	// Función para restablecer la configuración
	const resetConfig = () => {
		setDebugState(defaultDebugState);
		localStorage.removeItem(STORAGE_KEY);
	};

	// Si no está habilitado, mostrar solo un botón flotante
	if (!debugState.enabled) {
		return (
			<TooltipProvider delayDuration={300}>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className={cn(
								'fixed bottom-4 right-4 z-50 opacity-60 hover:opacity-100 bg-background/80 backdrop-blur-sm',
								className
							)}
							onClick={() => setDebugState((prev) => ({ ...prev, enabled: true }))}
						>
							<Bug className="h-5 w-5 text-primary" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="left">
						<p>Activar depuración de tarjetas</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return (
		<Card
			className={cn(
				'fixed z-50 transition-all duration-300',
				isMinimized
					? 'bottom-4 right-4 w-auto h-auto p-2'
					: isCollapsed
						? 'bottom-4 right-4 w-auto p-3'
						: 'bottom-4 right-4 w-72 shadow-xl border-primary/30',
				className
			)}
		>
			{isMinimized ? (
				// Modo minimizado - solo un icono
				<Button size="icon" variant="ghost" className="p-1" onClick={() => setIsMinimized(false)}>
					<Bug className="h-5 w-5 text-primary" />
				</Button>
			) : (
				<>
					{/* Cabecera */}
					<div className="flex items-center justify-between p-2 bg-muted/50 rounded-t-lg">
						<div className="flex items-center gap-2">
							<Bug className="h-4 w-4 text-primary" />
							<span className="text-sm font-medium">Debug EntityCards</span>

							{debugState.performance.monitorFPS && (
								<Badge variant="outline" className="text-xs py-0 px-2 h-5">
									{fps} FPS
								</Badge>
							)}

							{debugState.performance.showRenderCount && (
								<Badge variant="outline" className="text-xs py-0 px-2 h-5">
									{renderCount} renders
								</Badge>
							)}
						</div>

						<div className="flex items-center gap-1">
							{!isCollapsed && (
								<Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsCollapsed(true)}>
									<PictureInPicture className="h-3 w-3" />
								</Button>
							)}

							{isCollapsed && (
								<Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsCollapsed(false)}>
									<Component className="h-3 w-3" />
								</Button>
							)}

							<Button
								size="icon"
								variant="ghost"
								className="h-6 w-6 text-destructive"
								onClick={() => setDebugState((prev) => ({ ...prev, enabled: false }))}
							>
								<XCircle className="h-3 w-3" />
							</Button>
						</div>
					</div>

					{/* Contenido principal - solo visible si no está colapsado */}
					{!isCollapsed && (
						<div className="p-3 space-y-3">
							{/* Sistemas */}
							<div className="space-y-2">
								<div className="text-xs font-medium text-muted-foreground">Sistemas</div>
								<div className="grid grid-cols-3 gap-2">
									<Toggle
										size="sm"
										pressed={debugState.systems.layers}
										onPressedChange={() => toggleSystem('layers')}
										className="flex-col h-16 gap-1 data-[state=on]:bg-primary/20"
									>
										<Layers className="h-4 w-4" />
										<span className="text-xs">Capas</span>
									</Toggle>

									<Toggle
										size="sm"
										pressed={debugState.systems.design}
										onPressedChange={() => toggleSystem('design')}
										className="flex-col h-16 gap-1 data-[state=on]:bg-primary/20"
									>
										<Palette className="h-4 w-4" />
										<span className="text-xs">Diseño</span>
									</Toggle>

									<Toggle
										size="sm"
										pressed={debugState.systems.animation}
										onPressedChange={() => toggleSystem('animation')}
										className="flex-col h-16 gap-1 data-[state=on]:bg-primary/20"
									>
										<Film className="h-4 w-4" />
										<span className="text-xs">Animación</span>
									</Toggle>
								</div>

								<div className="text-xs font-medium text-muted-foreground mt-3">Efectos</div>
								<div className="grid grid-cols-3 gap-2">
									<Toggle
										size="sm"
										pressed={debugState.systems.holographic}
										onPressedChange={() => toggleSystem('holographic')}
										className="flex-col h-16 gap-1 data-[state=on]:bg-primary/20"
									>
										<Sparkles className="h-4 w-4" />
										<span className="text-xs">Holo</span>
									</Toggle>

									<Toggle
										size="sm"
										pressed={debugState.systems.pixelate}
										onPressedChange={() => toggleSystem('pixelate')}
										className="flex-col h-16 gap-1 data-[state=on]:bg-primary/20"
									>
										<Dices className="h-4 w-4" />
										<span className="text-xs">Pixelado</span>
									</Toggle>

									<Toggle
										size="sm"
										pressed={debugState.systems.border}
										onPressedChange={() => toggleSystem('border')}
										className="flex-col h-16 gap-1 data-[state=on]:bg-primary/20"
									>
										<Circle className="h-4 w-4" />
										<span className="text-xs">Borde</span>
									</Toggle>

									<Toggle
										size="sm"
										pressed={debugState.systems.glow}
										onPressedChange={() => toggleSystem('glow')}
										className="flex-col h-16 gap-1 data-[state=on]:bg-primary/20"
									>
										<Snowflake className="h-4 w-4" />
										<span className="text-xs">Brillo</span>
									</Toggle>

									<Toggle
										size="sm"
										pressed={debugState.systems.scanlines}
										onPressedChange={() => toggleSystem('scanlines')}
										className="flex-col h-16 gap-1 data-[state=on]:bg-primary/20"
									>
										<Laptop className="h-4 w-4" />
										<span className="text-xs">Scanlines</span>
									</Toggle>

									<Toggle
										size="sm"
										pressed={debugState.systems.grain}
										onPressedChange={() => toggleSystem('grain')}
										className="flex-col h-16 gap-1 data-[state=on]:bg-primary/20"
									>
										<span className="text-xs">⦙</span>
										<span className="text-xs">Grano</span>
									</Toggle>
								</div>
							</div>

							{/* Métricas de rendimiento */}
							<div className="space-y-2 pt-2 border-t border-border/50">
								<div className="text-xs font-medium text-muted-foreground">Rendimiento</div>
								<div className="flex gap-2">
									<Toggle
										size="sm"
										pressed={debugState.performance.monitorFPS}
										onPressedChange={() => togglePerformance('monitorFPS')}
										className="flex-row h-8 gap-2 text-xs data-[state=on]:bg-primary/20"
									>
										<Film className="h-3 w-3" />
										<span>Monitor FPS</span>
									</Toggle>

									<Toggle
										size="sm"
										pressed={debugState.performance.showRenderCount}
										onPressedChange={() => togglePerformance('showRenderCount')}
										className="flex-row h-8 gap-2 text-xs data-[state=on]:bg-primary/20"
									>
										<Component className="h-3 w-3" />
										<span>Contador Renders</span>
									</Toggle>
								</div>
							</div>

							{/* Acciones */}
							<div className="pt-2 flex justify-between border-t border-border/50">
								<Popover>
									<PopoverTrigger asChild>
										<Button variant="outline" size="sm" className="text-xs h-8">
											Opciones
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-48 p-2">
										<div className="grid gap-2">
											<Button variant="destructive" size="sm" className="text-xs h-8 w-full" onClick={resetConfig}>
												Restablecer
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="text-xs h-8 w-full"
												onClick={() => setIsMinimized(true)}
											>
												Minimizar
											</Button>
										</div>
									</PopoverContent>
								</Popover>

								<Button
									variant="default"
									size="sm"
									className="text-xs h-8"
									onClick={() => {
										// Aplicar cambios actuales
										onStateChange?.(debugState);
									}}
								>
									Aplicar cambios
								</Button>
							</div>
						</div>
					)}
				</>
			)}
		</Card>
	);
}

// Contexto para acceder a la configuración de depuración desde cualquier componente
export const useCardDebug = () => {
	const [debugState, setDebugState] = useState<CardDebugState | null>(null);

	useEffect(() => {
		// Cargar configuración al montar
		try {
			const savedConfig = localStorage.getItem(STORAGE_KEY);
			if (savedConfig) {
				const parsedConfig = JSON.parse(savedConfig) as CardDebugState;
				setDebugState(parsedConfig);
			} else {
				setDebugState(defaultDebugState);
			}
		} catch (error) {
			console.warn('Error al cargar configuración de depuración:', error);
			setDebugState(defaultDebugState);
		}

		// Escuchar cambios en local storage
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === STORAGE_KEY && e.newValue) {
				try {
					const updatedConfig = JSON.parse(e.newValue) as CardDebugState;
					setDebugState(updatedConfig);
				} catch (error) {
					console.warn('Error al procesar cambios en configuración:', error);
				}
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, []);

	return {
		debugState: debugState || defaultDebugState,
		isDebugEnabled: debugState?.enabled || false,
		shouldRenderLayer: (layerName: keyof CardDebugState['systems']) => {
			if (!debugState?.enabled) return true;
			return debugState.systems[layerName];
		},
	};
};

// Exportar el contexto y el hook para usar en los componentes
export default CardDebugToolbar;
