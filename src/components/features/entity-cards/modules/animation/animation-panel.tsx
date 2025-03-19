'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Clock, MousePointer, PlayCircle, Zap } from 'lucide-react';
import { useState } from 'react';
import type { AnimationPanelProps, AnimationSystem, AnimationSystemPreset } from './types';

// Presets de animación
const animationPresets: AnimationSystemPreset[] = [
	{
		id: 'default',
		name: 'Estándar',
		description: 'Animaciones suaves y sutiles',
		animationSystem: {
			enabled: true,
			hoverEffect: true,
			clickEffect: true,
			reducedMotion: false,
			transitionDuration: 300,
			timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
			hoverScale: 1.02,
			hoverRotate: true,
			hoverLift: true,
			liftHeight: 10,
			maxRotation: 15,
			activeScale: 0.98,
			activeBrightness: 0.95,
			entranceAnimation: 'fade-in',
			exitAnimation: 'fade-out',
			entranceDelay: 0,
			loopAnimations: false,
		},
	},
	{
		id: 'minimal',
		name: 'Minimalista',
		description: 'Animaciones muy sutiles',
		animationSystem: {
			enabled: true,
			hoverEffect: true,
			clickEffect: true,
			reducedMotion: false,
			transitionDuration: 200,
			timingFunction: 'ease-out',
			hoverScale: 1.01,
			hoverRotate: false,
			hoverLift: true,
			liftHeight: 5,
			maxRotation: 0,
			activeScale: 0.99,
			activeBrightness: 0.97,
			entranceAnimation: 'fade-in',
			exitAnimation: 'none',
			entranceDelay: 0,
			loopAnimations: false,
		},
	},
	{
		id: 'energetic',
		name: 'Enérgico',
		description: 'Animaciones vívidas y dinámicas',
		animationSystem: {
			enabled: true,
			hoverEffect: true,
			clickEffect: true,
			reducedMotion: false,
			transitionDuration: 400,
			timingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
			hoverScale: 1.05,
			hoverRotate: true,
			hoverLift: true,
			liftHeight: 15,
			maxRotation: 20,
			activeScale: 0.95,
			activeBrightness: 0.9,
			entranceAnimation: 'bounce-in',
			exitAnimation: 'bounce-out',
			entranceDelay: 100,
			loopAnimations: false,
		},
	},
	{
		id: 'none',
		name: 'Sin animaciones',
		description: 'Deshabilita todas las animaciones',
		animationSystem: {
			enabled: false,
			hoverEffect: false,
			clickEffect: false,
			reducedMotion: true,
			transitionDuration: 0,
			timingFunction: 'linear',
			hoverScale: 1,
			hoverRotate: false,
			hoverLift: false,
			liftHeight: 0,
			maxRotation: 0,
			activeScale: 1,
			activeBrightness: 1,
			entranceAnimation: 'none',
			exitAnimation: 'none',
			entranceDelay: 0,
			loopAnimations: false,
		},
	},
];

// Opciones para animaciones de entrada/salida
const animationOptions = [
	{ value: 'none', label: 'Ninguna' },
	{ value: 'fade-in', label: 'Desvanecer' },
	{ value: 'slide-up', label: 'Deslizar hacia arriba' },
	{ value: 'slide-down', label: 'Deslizar hacia abajo' },
	{ value: 'slide-left', label: 'Deslizar hacia la izquierda' },
	{ value: 'slide-right', label: 'Deslizar hacia la derecha' },
	{ value: 'zoom-in', label: 'Acercar' },
	{ value: 'zoom-out', label: 'Alejar' },
	{ value: 'bounce-in', label: 'Rebotar' },
	{ value: 'flip', label: 'Voltear' },
	{ value: 'rotate', label: 'Rotar' },
];

// Opciones para timing functions
const timingOptions = [
	{ value: 'linear', label: 'Lineal' },
	{ value: 'ease', label: 'Suave (ease)' },
	{ value: 'ease-in', label: 'Aceleración' },
	{ value: 'ease-out', label: 'Desaceleración' },
	{ value: 'ease-in-out', label: 'Aceleración y desaceleración' },
	{ value: 'cubic-bezier(0.4, 0, 0.2, 1)', label: 'Material (recomendado)' },
	{ value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', label: 'Elástico' },
	{ value: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)', label: 'Rebote' },
];

export function AnimationPanel({ animationSystem, onChange, disabled = false, className }: AnimationPanelProps) {
	const [activeTab, setActiveTab] = useState('general');

	// Función para seleccionar un preset completo
	const selectPreset = (presetId: string) => {
		const preset = animationPresets.find((p) => p.id === presetId);
		if (preset) {
			onChange(preset.animationSystem);
		}
	};

	// Función para actualizar un campo específico
	const updateField = <K extends keyof AnimationSystem>(field: K, value: AnimationSystem[K]) => {
		onChange({ ...animationSystem, [field]: value });
	};

	// Función para obtener un preset basado en la configuración actual
	const getCurrentPreset = () => {
		// Intentamos encontrar un preset que coincida exactamente
		const exactMatch = animationPresets.find(
			(p) => JSON.stringify(p.animationSystem) === JSON.stringify(animationSystem)
		);

		if (exactMatch) {
			return exactMatch.id;
		}

		// Si no hay coincidencia exacta, verificamos si está habilitado
		if (!animationSystem.enabled) {
			return 'none';
		}

		// Por defecto, devolvemos 'default' o un ID personalizado
		return 'custom';
	};

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium flex items-center">
					<PlayCircle className="h-4 w-4 mr-2 text-muted-foreground" />
					Configuración de Animación
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
					<TabsList className="grid grid-cols-3 mb-4">
						<TabsTrigger value="general">
							<Zap className="h-4 w-4 mr-2" />
							General
						</TabsTrigger>
						<TabsTrigger value="hover">
							<MousePointer className="h-4 w-4 mr-2" />
							Interacción
						</TabsTrigger>
						<TabsTrigger value="timing">
							<Clock className="h-4 w-4 mr-2" />
							Transiciones
						</TabsTrigger>
					</TabsList>

					<TabsContent value="general" className="space-y-4">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Preset de Animación</Label>
								<Select value={getCurrentPreset()} onValueChange={(value) => selectPreset(value)} disabled={disabled}>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar preset" />
									</SelectTrigger>
									<SelectContent>
										{animationPresets.map((preset) => (
											<SelectItem key={preset.id} value={preset.id}>
												{preset.name}
											</SelectItem>
										))}
										<SelectItem value="custom">Personalizado</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground mt-1">Selecciona un estilo predefinido de animaciones</p>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<Label htmlFor="animation-enabled">Animaciones Habilitadas</Label>
									<p className="text-xs text-muted-foreground mt-1">Activa o desactiva todas las animaciones</p>
								</div>
								<Switch
									id="animation-enabled"
									checked={animationSystem.enabled}
									onCheckedChange={(checked) => updateField('enabled', checked)}
									disabled={disabled}
								/>
							</div>

							{animationSystem.enabled && (
								<>
									<div className="flex items-center justify-between">
										<div>
											<Label htmlFor="reduced-motion">Movimiento Reducido</Label>
											<p className="text-xs text-muted-foreground mt-1">
												Activa para usuarios con sensibilidad al movimiento
											</p>
										</div>
										<Switch
											id="reduced-motion"
											checked={animationSystem.reducedMotion}
											onCheckedChange={(checked) => updateField('reducedMotion', checked)}
											disabled={disabled}
										/>
									</div>

									<div className="space-y-2">
										<Label>Animación de Entrada</Label>
										<Select
											value={animationSystem.entranceAnimation || 'fade-in'}
											onValueChange={(value) => updateField('entranceAnimation', value)}
											disabled={disabled || animationSystem.reducedMotion}
										>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar animación" />
											</SelectTrigger>
											<SelectContent>
												{animationOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label>Animación de Salida</Label>
										<Select
											value={animationSystem.exitAnimation || 'fade-out'}
											onValueChange={(value) => updateField('exitAnimation', value)}
											disabled={disabled || animationSystem.reducedMotion}
										>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar animación" />
											</SelectTrigger>
											<SelectContent>
												{animationOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<div className="flex justify-between">
											<Label>Retraso de Entrada (ms)</Label>
											<span className="text-xs">{animationSystem.entranceDelay || 0}ms</span>
										</div>
										<Slider
											value={[animationSystem.entranceDelay || 0]}
											min={0}
											max={1000}
											step={50}
											onValueChange={([value]) => updateField('entranceDelay', value)}
											disabled={disabled || animationSystem.reducedMotion}
										/>
										<p className="text-xs text-muted-foreground mt-1">Tiempo de espera antes de iniciar la animación</p>
									</div>

									<div className="flex items-center justify-between">
										<div>
											<Label htmlFor="loop-animations">Animar en Bucle</Label>
											<p className="text-xs text-muted-foreground mt-1">Repetir animaciones continuamente</p>
										</div>
										<Switch
											id="loop-animations"
											checked={animationSystem.loopAnimations}
											onCheckedChange={(checked) => updateField('loopAnimations', checked)}
											disabled={disabled || animationSystem.reducedMotion}
										/>
									</div>
								</>
							)}
						</div>
					</TabsContent>

					<TabsContent value="hover" className="space-y-4">
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<Label htmlFor="hover-effect">Efectos al Pasar el Ratón</Label>
									<p className="text-xs text-muted-foreground mt-1">
										Activa animaciones cuando el cursor pasa sobre la tarjeta
									</p>
								</div>
								<Switch
									id="hover-effect"
									checked={animationSystem.hoverEffect}
									onCheckedChange={(checked) => updateField('hoverEffect', checked)}
									disabled={disabled || !animationSystem.enabled}
								/>
							</div>

							{animationSystem.enabled && animationSystem.hoverEffect && (
								<>
									<div className="space-y-2">
										<div className="flex justify-between">
											<Label>Escala al Pasar el Ratón</Label>
											<span className="text-xs">{animationSystem.hoverScale.toFixed(2)}x</span>
										</div>
										<Slider
											value={[animationSystem.hoverScale || 1.02]}
											min={1}
											max={1.2}
											step={0.01}
											onValueChange={([value]) => updateField('hoverScale', value)}
											disabled={disabled}
										/>
										<p className="text-xs text-muted-foreground mt-1">Factor de escala aplicado al pasar el ratón</p>
									</div>

									<div className="flex items-center justify-between">
										<div>
											<Label htmlFor="hover-rotate">Rotación al Pasar el Ratón</Label>
											<p className="text-xs text-muted-foreground mt-1">Rota la tarjeta según la posición del cursor</p>
										</div>
										<Switch
											id="hover-rotate"
											checked={animationSystem.hoverRotate}
											onCheckedChange={(checked) => updateField('hoverRotate', checked)}
											disabled={disabled}
										/>
									</div>

									{animationSystem.hoverRotate && (
										<div className="space-y-2">
											<div className="flex justify-between">
												<Label>Rotación Máxima (grados)</Label>
												<span className="text-xs">{animationSystem.maxRotation || 15}°</span>
											</div>
											<Slider
												value={[animationSystem.maxRotation || 15]}
												min={1}
												max={45}
												step={1}
												onValueChange={([value]) => updateField('maxRotation', value)}
												disabled={disabled}
											/>
										</div>
									)}

									<div className="flex items-center justify-between">
										<div>
											<Label htmlFor="hover-lift">Elevación al Pasar el Ratón</Label>
											<p className="text-xs text-muted-foreground mt-1">
												Eleva la tarjeta cuando el cursor pasa sobre ella
											</p>
										</div>
										<Switch
											id="hover-lift"
											checked={animationSystem.hoverLift}
											onCheckedChange={(checked) => updateField('hoverLift', checked)}
											disabled={disabled}
										/>
									</div>

									{animationSystem.hoverLift && (
										<div className="space-y-2">
											<div className="flex justify-between">
												<Label>Altura de Elevación (px)</Label>
												<span className="text-xs">{animationSystem.liftHeight || 10}px</span>
											</div>
											<Slider
												value={[animationSystem.liftHeight || 10]}
												min={1}
												max={30}
												step={1}
												onValueChange={([value]) => updateField('liftHeight', value)}
												disabled={disabled}
											/>
										</div>
									)}
								</>
							)}

							<div className="flex items-center justify-between">
								<div>
									<Label htmlFor="click-effect">Efectos al Hacer Clic</Label>
									<p className="text-xs text-muted-foreground mt-1">
										Activa animaciones cuando se hace clic en la tarjeta
									</p>
								</div>
								<Switch
									id="click-effect"
									checked={animationSystem.clickEffect}
									onCheckedChange={(checked) => updateField('clickEffect', checked)}
									disabled={disabled || !animationSystem.enabled}
								/>
							</div>

							{animationSystem.enabled && animationSystem.clickEffect && (
								<>
									<div className="space-y-2">
										<div className="flex justify-between">
											<Label>Escala al Hacer Clic</Label>
											<span className="text-xs">{animationSystem.activeScale.toFixed(2)}x</span>
										</div>
										<Slider
											value={[animationSystem.activeScale || 0.98]}
											min={0.8}
											max={1}
											step={0.01}
											onValueChange={([value]) => updateField('activeScale', value)}
											disabled={disabled}
										/>
									</div>

									<div className="space-y-2">
										<div className="flex justify-between">
											<Label>Brillo al Hacer Clic</Label>
											<span className="text-xs">{animationSystem.activeBrightness.toFixed(2)}</span>
										</div>
										<Slider
											value={[animationSystem.activeBrightness || 0.95]}
											min={0.8}
											max={1}
											step={0.01}
											onValueChange={([value]) => updateField('activeBrightness', value)}
											disabled={disabled}
										/>
									</div>
								</>
							)}
						</div>
					</TabsContent>

					<TabsContent value="timing" className="space-y-4">
						<div className="space-y-4">
							<div className="space-y-2">
								<div className="flex justify-between">
									<Label>Duración de Transición (ms)</Label>
									<span className="text-xs">{animationSystem.transitionDuration || 300}ms</span>
								</div>
								<Slider
									value={[animationSystem.transitionDuration || 300]}
									min={0}
									max={1000}
									step={10}
									onValueChange={([value]) => updateField('transitionDuration', value)}
									disabled={disabled || !animationSystem.enabled}
								/>
								<p className="text-xs text-muted-foreground mt-1">Duración de todas las animaciones en milisegundos</p>
							</div>

							<div className="space-y-2">
								<Label>Función de Temporización</Label>
								<Select
									value={animationSystem.timingFunction || 'cubic-bezier(0.4, 0, 0.2, 1)'}
									onValueChange={(value) => updateField('timingFunction', value)}
									disabled={disabled || !animationSystem.enabled}
								>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar función" />
									</SelectTrigger>
									<SelectContent>
										{timingOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground mt-1">Controla la aceleración de las animaciones</p>
							</div>

							{animationSystem.timingFunction === 'custom' && (
								<div className="space-y-2">
									<Label>Función Personalizada</Label>
									<Input
										value={animationSystem.timingFunction || ''}
										onChange={(e) => updateField('timingFunction', e.target.value)}
										placeholder="cubic-bezier(0.4, 0, 0.2, 1)"
										disabled={disabled || !animationSystem.enabled}
									/>
									<p className="text-xs text-muted-foreground mt-1">Especifica una función cubic-bezier o steps()</p>
								</div>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
