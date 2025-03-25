'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import {
	Bug,
	Circle,
	Component,
	Cpu,
	Dices,
	Film,
	Layers,
	Lightbulb,
	Palette,
	PictureInPicture,
	Sparkles,
	X
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Tipo para el estado de configuración del panel de control
export interface CardControlState {
	enabled: boolean;
	systems: {
		layerSystem: boolean;
		designSystem: boolean;
		animationSystem: boolean;
	};
	effects: {
		holographic: boolean;
		glow: boolean;
		border: boolean;
		grain: boolean;
		scanlines: boolean;
		pixelate: boolean;
	};
	features: {
		backside: boolean;
		explode: boolean;
		debug: boolean;
	};
	performance: {
		renderQuality: 'low' | 'medium' | 'high';
		disableAnimations: boolean;
	};
}

// Estado predeterminado para el panel
const defaultControlState: CardControlState = {
	enabled: false,
	systems: {
		layerSystem: true,
		designSystem: true,
		animationSystem: true,
	},
	effects: {
		holographic: true,
		glow: true,
		border: true,
		grain: true,
		scanlines: true,
		pixelate: true,
	},
	features: {
		backside: true,
		explode: false,
		debug: false,
	},
	performance: {
		renderQuality: 'medium',
		disableAnimations: false,
	}
};

// Clave para persistir la configuración en localStorage
const STORAGE_KEY = 'entity-card-control-config';

interface CardControlPanelProps {
	onStateChange?: (state: CardControlState) => void;
	className?: string;
	title?: string;
}

/**
 * Panel de control flotante para EntityCards
 * Permite activar/desactivar componentes individuales y ajustar configuraciones
 */
export function CardControlPanel({
	onStateChange,
	className,
	title = "Control de Componentes"
}: CardControlPanelProps) {
	// Estado del panel de control
	const [controlState, setControlState] = useState<CardControlState>(defaultControlState);
	const [isMinimized, setIsMinimized] = useState(false);
	const [activeTab, setActiveTab] = useState('systems');

	// Efecto para cargar la configuración almacenada al inicio
	useEffect(() => {
		try {
			const savedConfig = localStorage.getItem(STORAGE_KEY);
			if (savedConfig) {
				const parsedConfig = JSON.parse(savedConfig) as CardControlState;
				setControlState(parsedConfig);
			}
		} catch (error) {
			console.warn('Error al cargar configuración de control:', error);
		}
	}, []);

	// Efecto para guardar cambios en la configuración
	useEffect(() => {
		if (controlState.enabled) {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(controlState));
				onStateChange?.(controlState);
			} catch (error) {
				console.warn('Error al guardar configuración de control:', error);
			}
		}
	}, [controlState, onStateChange]);

	// Función para cambiar estado de un sistema
	const toggleSystem = (system: keyof CardControlState['systems']) => {
		setControlState(prev => ({
			...prev,
			systems: {
				...prev.systems,
				[system]: !prev.systems[system]
			}
		}));
	};

	// Función para cambiar estado de un efecto
	const toggleEffect = (effect: keyof CardControlState['effects']) => {
		setControlState(prev => ({
			...prev,
			effects: {
				...prev.effects,
				[effect]: !prev.effects[effect]
			}
		}));
	};

	// Función para cambiar estado de una característica
	const toggleFeature = (feature: keyof CardControlState['features']) => {
		setControlState(prev => ({
			...prev,
			features: {
				...prev.features,
				[feature]: !prev.features[feature]
			}
		}));
	};

	// Función para cambiar calidad de renderizado
	const setRenderQuality = (quality: 'low' | 'medium' | 'high') => {
		setControlState(prev => ({
			...prev,
			performance: {
				...prev.performance,
				renderQuality: quality
			}
		}));
	};

	// Función para activar/desactivar animaciones
	const toggleAnimations = () => {
		setControlState(prev => ({
			...prev,
			performance: {
				...prev.performance,
				disableAnimations: !prev.performance.disableAnimations
			}
		}));
	};

	// Función para restablecer la configuración
	const resetConfig = () => {
		setControlState(defaultControlState);
		localStorage.removeItem(STORAGE_KEY);
	};

	// Si no está habilitado, mostrar solo un botón flotante
	if (!controlState.enabled) {
		return (
			<TooltipProvider delayDuration={300}>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className={cn("fixed bottom-20 right-4 z-50 opacity-60 hover:opacity-100 bg-background/80 backdrop-blur-sm shadow-md", className)}
							onClick={() => setControlState(prev => ({ ...prev, enabled: true }))}
						>
							<Component className="h-5 w-5 text-primary" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="left">
						<p>Activar panel de control de componentes</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return (
		<Card className={cn(
			"fixed z-[1000] transition-all duration-300 backdrop-blur-sm shadow-xl",
			isMinimized
				? "bottom-20 right-4 w-auto h-auto p-2"
				: "bottom-20 right-4 w-72 max-h-[80vh] overflow-y-auto",
			className
		)}>
			{isMinimized ? (
				// Modo minimizado - solo un icono
				<Button
					size="icon"
					variant="ghost"
					className="p-1"
					onClick={() => setIsMinimized(false)}
				>
					<Component className="h-5 w-5 text-primary" />
				</Button>
			) : (
				<>
					{/* Cabecera */}
					<div className="flex items-center justify-between p-2 bg-muted/50 rounded-t-lg sticky top-0 z-10">
						<div className="flex items-center gap-2">
							<Component className="h-4 w-4 text-primary" />
							<span className="text-sm font-medium">{title}</span>
						</div>

						<div className="flex items-center gap-1">
							<Button
								size="icon"
								variant="ghost"
								className="h-6 w-6"
								onClick={() => setIsMinimized(true)}
							>
								<PictureInPicture className="h-3 w-3" />
							</Button>

							<Button
								size="icon"
								variant="ghost"
								className="h-6 w-6 text-destructive"
								onClick={() => setControlState(prev => ({ ...prev, enabled: false }))}
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					</div>

					{/* Contenido principal */}
					<div className="p-3 space-y-3">
						<Tabs
							defaultValue="systems"
							value={activeTab}
							onValueChange={setActiveTab}
							className="w-full"
						>
							<TabsList className="grid grid-cols-3 mb-2">
								<TabsTrigger value="systems" className="text-xs">Sistemas</TabsTrigger>
								<TabsTrigger value="effects" className="text-xs">Efectos</TabsTrigger>
								<TabsTrigger value="performance" className="text-xs">Rendimiento</TabsTrigger>
							</TabsList>

							{/* Sistemas */}
							<TabsContent value="systems" className="space-y-3">
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Layers className="h-4 w-4 text-primary" />
											<label htmlFor="toggleLayerSystem" className="text-sm">Sistema de Capas</label>
										</div>
										<Switch
											id="toggleLayerSystem"
											checked={controlState.systems.layerSystem}
											onCheckedChange={() => toggleSystem('layerSystem')}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Palette className="h-4 w-4 text-primary" />
											<label htmlFor="toggleDesignSystem" className="text-sm">Sistema de Diseño</label>
										</div>
										<Switch
											id="toggleDesignSystem"
											checked={controlState.systems.designSystem}
											onCheckedChange={() => toggleSystem('designSystem')}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Film className="h-4 w-4 text-primary" />
											<label htmlFor="toggleAnimationSystem" className="text-sm">Sistema de Animación</label>
										</div>
										<Switch
											id="toggleAnimationSystem"
											checked={controlState.systems.animationSystem}
											onCheckedChange={() => toggleSystem('animationSystem')}
										/>
									</div>

									<div className="border-t my-2 pt-2 border-border/30" />

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Circle className="h-4 w-4 text-primary" />
											<label htmlFor="toggleBackside" className="text-sm">Backside</label>
										</div>
										<Switch
											id="toggleBackside"
											checked={controlState.features.backside}
											onCheckedChange={() => toggleFeature('backside')}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Layers className="h-4 w-4 text-primary" />
											<label htmlFor="toggleExplodedView" className="text-sm">Modo Exploded View</label>
										</div>
										<Switch
											id="toggleExplodedView"
											checked={controlState.features.explode}
											onCheckedChange={() => toggleFeature('explode')}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Bug className="h-4 w-4 text-warning" />
											<label htmlFor="toggleDebugMode" className="text-sm">Modo Debug</label>
										</div>
										<Switch
											id="toggleDebugMode"
											checked={controlState.features.debug}
											onCheckedChange={() => toggleFeature('debug')}
										/>
									</div>
								</div>
							</TabsContent>

							{/* Efectos */}
							<TabsContent value="effects" className="space-y-3">
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Sparkles className="h-4 w-4 text-primary" />
											<label htmlFor="toggleHolographicEffect" className="text-sm">Efecto Holográfico</label>
										</div>
										<Switch
											id="toggleHolographicEffect"
											checked={controlState.effects.holographic}
											onCheckedChange={() => toggleEffect('holographic')}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Lightbulb className="h-4 w-4 text-primary" />
											<label htmlFor="toggleGlowEffect" className="text-sm">Efecto Glow</label>
										</div>
										<Switch
											id="toggleGlowEffect"
											checked={controlState.effects.glow}
											onCheckedChange={() => toggleEffect('glow')}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Circle className="h-4 w-4 text-primary" />
											<label htmlFor="toggleAnimatedBorders" className="text-sm">Bordes Animados</label>
										</div>
										<Switch
											id="toggleAnimatedBorders"
											checked={controlState.effects.border}
											onCheckedChange={() => toggleEffect('border')}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Dices className="h-4 w-4 text-primary" />
											<label htmlFor="pixelate-switch" className="text-sm">Efecto Pixelado</label>
										</div>
										<Switch
											id="pixelate-switch"
											checked={controlState.effects.pixelate}
											onCheckedChange={() => toggleEffect('pixelate')}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className="text-xs">⦙</span>
											<label htmlFor="grain-switch" className="text-sm">Efecto Grano</label>
										</div>
										<Switch
											id="grain-switch"
											checked={controlState.effects.grain}
											onCheckedChange={() => toggleEffect('grain')}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Film className="h-4 w-4 text-primary" />
											<label htmlFor="scanlines-switch" className="text-sm">Scanlines</label>
										</div>
										<Switch
											id="scanlines-switch"
											checked={controlState.effects.scanlines}
											onCheckedChange={() => toggleEffect('scanlines')}
										/>
									</div>
								</div>
							</TabsContent>

							{/* Rendimiento */}
							<TabsContent value="performance" className="space-y-3">
								<div className="space-y-4">
									<div className="space-y-2">
										<label htmlFor="render-quality-select" className="text-sm flex items-center gap-2">
											<Cpu className="h-4 w-4 text-primary" />
											Calidad de Renderizado
										</label>
										<Select
											id="render-quality-select"
											value={controlState.performance.renderQuality}
											onValueChange={(val) => setRenderQuality(val as any)}
										>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar calidad" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="low">Baja</SelectItem>
												<SelectItem value="medium">Media</SelectItem>
												<SelectItem value="high">Alta</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Film className="h-4 w-4 text-primary" />
											<label htmlFor="disable-animations-switch" className="text-sm">Deshabilitar Animaciones</label>
										</div>
										<Switch
											id="disable-animations-switch"
											checked={controlState.performance.disableAnimations}
											onCheckedChange={toggleAnimations}
										/>
									</div>
								</div>

								<div className="pt-4 border-t border-border/30">
									<Button
										variant="outline"
										size="sm"
										className="w-full"
										onClick={resetConfig}
									>
										Restablecer a valores predeterminados
									</Button>
								</div>
							</TabsContent>
						</Tabs>

						{/* Indicador de estado */}
						<div className="flex items-center justify-between border-t pt-2 border-border/30">
							<Badge variant="outline" className="text-xs">
								{Object.values(controlState.systems).filter(Boolean).length}/{Object.keys(controlState.systems).length} Sistemas
							</Badge>
							<Badge variant="outline" className="text-xs">
								{Object.values(controlState.effects).filter(Boolean).length}/{Object.keys(controlState.effects).length} Efectos
							</Badge>
						</div>

						{/* Botón de aplicar */}
						<Button
							variant="default"
							size="sm"
							className="w-full"
							onClick={() => {
								// Aplicar cambios actuales
								onStateChange?.(controlState);
							}}
						>
							Aplicar cambios
						</Button>
					</div>
				</>
			)}
		</Card>
	);
}

// Hook para acceder al estado del panel de control
export const useCardControl = () => {
	const [controlState, setControlState] = useState<CardControlState>(defaultControlState);

	useEffect(() => {
		// Cargar configuración al montar
		try {
			const savedConfig = localStorage.getItem(STORAGE_KEY);
			if (savedConfig) {
				const parsedConfig = JSON.parse(savedConfig) as CardControlState;
				setControlState(parsedConfig);
			}
		} catch (error) {
			console.warn('Error al cargar configuración de control:', error);
		}

		// Escuchar cambios en local storage
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === STORAGE_KEY && e.newValue) {
				try {
					const updatedConfig = JSON.parse(e.newValue) as CardControlState;
					setControlState(updatedConfig);
				} catch (error) {
					console.warn('Error al procesar cambios en configuración:', error);
				}
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, []);

	return {
		controlState,
		isEnabled: controlState.enabled,
		isSystemEnabled: (system: keyof CardControlState['systems']) => {
			return controlState.enabled ? controlState.systems[system] : true;
		},
		isEffectEnabled: (effect: keyof CardControlState['effects']) => {
			return controlState.enabled ? controlState.effects[effect] : true;
		},
		isFeatureEnabled: (feature: keyof CardControlState['features']) => {
			return controlState.enabled ? controlState.features[feature] : true;
		},
		performanceSettings: controlState.performance
	};
};

export default CardControlPanel;