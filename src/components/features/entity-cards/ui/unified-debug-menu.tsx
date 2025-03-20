'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
	BookOpenCheck,
	Code,
	Cpu,
	Droplet,
	Eye,
	EyeOff,
	Gauge,
	Image,
	Layers,
	Layers3,
	Lightbulb,
	Maximize2,
	Minimize2,
	Move,
	Palette,
	Sliders,
	Sparkles,
	X
} from 'lucide-react';
import { motion, useDragControls } from 'motion/react';
import { useState } from 'react';
import { useCardDisplay } from '../context/card-display-context';
import { useCardControl } from '../debug/card-control-context';
import { useCardDebug } from '../debug/card-debug-mock';

export function UnifiedDebugMenu() {
	const { displayMode, setDisplayMode, isMenuVisible, toggleMenu, displayModeInfo } = useCardDisplay();
	const { state: controlState, setState: setControlState } = useCardControl();
	const { activeDebugTools, toggleDebugTool } = useCardDebug();

	const [isCollapsed, setIsCollapsed] = useState(false);
	const [activeTab, setActiveTab] = useState('modes');
	const dragControls = useDragControls();

	// Controlar el colapso del menú
	const toggleCollapse = () => {
		setIsCollapsed(prev => !prev);
	};

	// Si el menú no es visible, no renderizar nada
	if (!isMenuVisible) return null;

	function startDrag(event: React.PointerEvent<HTMLDivElement>) {
		dragControls.start(event);
	}

	// Función para activar todas las características
	const enableAllFeatures = () => {
		// Mostrar advertencia de rendimiento si estamos en desarrollo
		if (process.env.NODE_ENV === 'development') {
			console.warn('⚠️⚠️⚠️ ADVERTENCIA: Estás activando todos los efectos visuales');
			console.warn('⚠️ Esto puede causar problemas de rendimiento significativos');
			console.warn('💡 Consejo: Considera activar solo los efectos que necesitas');

			// Comprobar si estamos en modo simple, que es incompatible con efectos
			if (displayMode === 'simple') {
				console.error('❌ En modo simple los efectos no se mostrarán - cambia a modo complex o skeleton');
			}
		}

		setControlState({
			enable3DEffect: true,
			enableHolographicEffect: true,
			enableGlowEffect: true,
			enableScanlines: true,
			enableAnimatedBorder: true,
			enableGrainEffect: true,
			showImages: true
		});

		// Si estamos en modo simple, sugerir cambiar al modo complex
		if (displayMode === 'simple' && typeof window !== 'undefined') {
			const shouldChangeMode = window.confirm(
				'Has activado todos los efectos, pero el modo actual (simple) no los mostrará.\n\n' +
				'¿Quieres cambiar al modo complex para ver los efectos?\n' +
				'(Esto puede afectar al rendimiento)'
			);

			if (shouldChangeMode) {
				setDisplayMode('complex');
			}
		}
	};

	// Función para desactivar todas las características (mantener imágenes)
	const disableAllFeatures = () => {
		// Log informativo
		if (process.env.NODE_ENV === 'development') {
			console.info('✅ Desactivando todos los efectos visuales para mejor rendimiento');
		}

		setControlState({
			enable3DEffect: false,
			enableHolographicEffect: false,
			enableGlowEffect: false,
			enableScanlines: false,
			enableAnimatedBorder: false,
			enableGrainEffect: false,
			showImages: true // Mantener imágenes visibles
		});
	};

	return (
		<motion.div
			drag
			dragControls={dragControls}
			dragMomentum={false}
			dragElastic={0}
			dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 20 }}
			transition={{ duration: 0.3 }}
			className={cn(
				'fixed bottom-4 right-4 z-50 bg-card shadow-xl rounded-lg border border-border',
				isCollapsed ? 'w-12' : 'max-w-80 w-full sm:w-80'
			)}
		>
			{/* Cabecera del menú con área arrastrable */}
			<div
				onPointerDown={startDrag}
				className="flex items-center justify-between p-2 border-b border-border bg-muted/20 rounded-t-lg cursor-move"
			>
				<div className="flex items-center">
					<Move className="h-3.5 w-3.5 text-muted-foreground mr-2" />
					{!isCollapsed && (
						<h3 className="text-xs font-medium">Control de Tarjetas</h3>
					)}
				</div>
				<div className="flex space-x-1 ml-auto">
					<Button
						variant="ghost"
						size="icon"
						className="h-5 w-5"
						onClick={toggleCollapse}
					>
						{isCollapsed ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-5 w-5"
						onClick={toggleMenu}
					>
						<X className="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>

			{/* Contenido del menú */}
			{!isCollapsed && (
				<div className="p-3 max-h-[calc(100vh-120px)] overflow-y-auto">
					<Tabs
						defaultValue="modes"
						value={activeTab}
						onValueChange={setActiveTab}
						className="w-full"
					>
						<TabsList className="grid grid-cols-3 mb-3 h-7">
							<TabsTrigger value="modes" className="text-xs">Modos</TabsTrigger>
							<TabsTrigger value="features" className="text-xs">Características</TabsTrigger>
							<TabsTrigger value="debug" className="text-xs">Debug</TabsTrigger>
						</TabsList>

						{/* Pestaña de Modos */}
						<TabsContent value="modes" className="space-y-2">
							<div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
								<span>Selecciona cómo mostrar las tarjetas:</span>
								<span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
									Actual: {displayMode}
								</span>
							</div>

							<div className="grid grid-cols-2 gap-2">
								{/* Modos como botones con colores según DISPLAY_MODE_INFO */}
								{Object.entries(displayModeInfo).map(([mode, info]) => (
									<Button
										key={mode}
										variant={displayMode === mode ? 'default' : 'outline'}
										size="sm"
										className={cn(
											"justify-start h-8 text-xs",
											displayMode === mode && `bg-${info.color}-500 hover:bg-${info.color}-600`
										)}
										onClick={() => setDisplayMode(mode as CardDisplayMode)}
									>
										{mode === 'simple' && <Minimize2 className="h-3 w-3 mr-1.5" />}
										{mode === 'complex' && <Layers className="h-3 w-3 mr-1.5" />}
										{mode === 'skeleton' && <Layers3 className="h-3 w-3 mr-1.5" />}
										{mode === 'json' && <Code className="h-3 w-3 mr-1.5" />}
										{info.name}
									</Button>
								))}
							</div>

							{/* Información del modo seleccionado */}
							<div className="text-xs text-muted-foreground mt-2 border-t pt-2">
								<p className="font-medium mb-1">Información del modo:</p>
								<div className="space-y-1">
									<p className="line-clamp-2">
										{displayModeInfo[displayMode].description}
									</p>
									<p>
										<span className="font-medium">Componentes:</span>{' '}
										<span className="text-[10px]">
											{displayModeInfo[displayMode].components.join(', ')}
										</span>
									</p>
									<p>
										<span className="font-medium">Rendimiento:</span>{' '}
										<span className={cn(
											"text-[10px]",
											displayMode === 'simple' && "text-green-500",
											displayMode === 'complex' && "text-red-500",
											displayMode === 'skeleton' && "text-amber-500",
											displayMode === 'json' && "text-blue-500",
										)}>
											{displayModeInfo[displayMode].performance}
										</span>
									</p>
									<p>
										<span className="font-medium">Nivel de riesgo:</span>{' '}
										<span className={cn(
											"text-[10px]",
											displayMode === 'complex' && "text-red-500 font-medium",
										)}>
											{displayModeInfo[displayMode].riskLevel}
										</span>
									</p>
									{displayMode === 'complex' && (
										<p className="text-[10px] text-yellow-500 mt-1 border-t border-yellow-500/20 pt-1">
											⚠️ El modo complejo puede causar problemas en dispositivos de gama baja o cuando hay muchas tarjetas.
										</p>
									)}
								</div>
							</div>
						</TabsContent>

						{/* Pestaña de Características */}
						<TabsContent value="features" className="space-y-2">
							<div className="text-xs text-muted-foreground mb-2">
								Activar/desactivar características:
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Sparkles className="h-3 w-3 text-muted-foreground" />
										<Label htmlFor="3d-effect" className="text-xs">Efecto 3D</Label>
									</div>
									<Switch
										id="3d-effect"
										checked={controlState.enable3DEffect}
										onCheckedChange={(checked) => setControlState({ ...controlState, enable3DEffect: checked })}
										size="sm"
									/>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Palette className="h-3 w-3 text-muted-foreground" />
										<Label htmlFor="holographic" className="text-xs">Efecto holográfico</Label>
									</div>
									<Switch
										id="holographic"
										checked={controlState.enableHolographicEffect}
										onCheckedChange={(checked) => setControlState({ ...controlState, enableHolographicEffect: checked })}
										size="sm"
									/>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Lightbulb className="h-3 w-3 text-muted-foreground" />
										<Label htmlFor="glow-effect" className="text-xs">Efecto de brillo</Label>
									</div>
									<Switch
										id="glow-effect"
										checked={controlState.enableGlowEffect}
										onCheckedChange={(checked) => setControlState({ ...controlState, enableGlowEffect: checked })}
										size="sm"
									/>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Droplet className="h-3 w-3 text-muted-foreground" />
										<Label htmlFor="scanlines" className="text-xs">Scanlines</Label>
									</div>
									<Switch
										id="scanlines"
										checked={controlState.enableScanlines}
										onCheckedChange={(checked) => setControlState({ ...controlState, enableScanlines: checked })}
										size="sm"
									/>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Gauge className="h-3 w-3 text-muted-foreground" />
										<Label htmlFor="animated-border" className="text-xs">Borde animado</Label>
									</div>
									<Switch
										id="animated-border"
										checked={controlState.enableAnimatedBorder}
										onCheckedChange={(checked) => setControlState({ ...controlState, enableAnimatedBorder: checked })}
										size="sm"
									/>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Image className="h-3 w-3 text-muted-foreground" />
										<Label htmlFor="show-images" className="text-xs">Mostrar imágenes</Label>
									</div>
									<Switch
										id="show-images"
										checked={controlState.showImages}
										onCheckedChange={(checked) => setControlState({ ...controlState, showImages: checked })}
										size="sm"
									/>
								</div>
							</div>

							<div className="pt-2 mt-2 border-t">
								<div className="flex justify-between">
									<Button
										variant="outline"
										size="sm"
										className="h-7 text-xs"
										onClick={enableAllFeatures}
									>
										<Eye className="h-3 w-3 mr-1.5" />
										Activar todo
									</Button>

									<Button
										variant="outline"
										size="sm"
										className="h-7 text-xs"
										onClick={disableAllFeatures}
									>
										<EyeOff className="h-3 w-3 mr-1.5" />
										Desactivar todo
									</Button>
								</div>
							</div>
						</TabsContent>

						{/* Pestaña de Debug */}
						<TabsContent value="debug" className="space-y-2">
							<div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
								<span>Herramientas de depuración:</span>
								<span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
									{activeDebugTools.length} activas
								</span>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Cpu className="h-3 w-3 text-muted-foreground" />
										<Label htmlFor="show-renders" className="text-xs">Mostrar renderizados</Label>
									</div>
									<Switch
										id="show-renders"
										checked={activeDebugTools.includes('showRenders')}
										onCheckedChange={() => toggleDebugTool('showRenders')}
										size="sm"
									/>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Sliders className="h-3 w-3 text-muted-foreground" />
										<Label htmlFor="show-props" className="text-xs">Mostrar props</Label>
									</div>
									<Switch
										id="show-props"
										checked={activeDebugTools.includes('showProps')}
										onCheckedChange={() => toggleDebugTool('showProps')}
										size="sm"
									/>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<BookOpenCheck className="h-3 w-3 text-muted-foreground" />
										<Label htmlFor="log-events" className="text-xs">Registrar eventos</Label>
									</div>
									<Switch
										id="log-events"
										checked={activeDebugTools.includes('logEvents')}
										onCheckedChange={() => toggleDebugTool('logEvents')}
										size="sm"
									/>
								</div>

								{/* Información sobre rendimiento según el modo actual */}
								<div className="border-t pt-2 mt-2">
									<p className="text-xs font-medium text-muted-foreground mb-1">Rendimiento del modo actual:</p>
									<div className="p-2 bg-black/10 rounded-sm text-[10px] space-y-1">
										<p>
											<span className="font-medium">Modo:</span>{' '}
											<span className={cn(
												displayMode === 'simple' && "text-blue-500",
												displayMode === 'complex' && "text-purple-500",
												displayMode === 'skeleton' && "text-amber-500",
												displayMode === 'json' && "text-teal-500",
											)}>
												{displayModeInfo[displayMode].name}
											</span>
										</p>
										<p>
											<span className="font-medium">Rendimiento estimado:</span>{' '}
											{displayModeInfo[displayMode].performance}
										</p>
										<p>
											<span className="font-medium">Componentes cargados:</span>{' '}
											{displayModeInfo[displayMode].components.length}
										</p>
										{displayMode === 'complex' && (
											<p className="text-red-400">
												⚠️ El modo complejo puede mostrar errores si hay características incompatibles activadas
											</p>
										)}
									</div>
								</div>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			)}
		</motion.div>
	);
}