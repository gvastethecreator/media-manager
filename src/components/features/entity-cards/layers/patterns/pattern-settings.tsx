'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import type { PatternConfig } from './actions/pattern-config.action';

interface PatternSettingsProps {
	config: PatternConfig;
	onChange: (config: PatternConfig) => void;
	onReset?: () => void;
}

export function PatternSettings({ config, onChange, onReset }: PatternSettingsProps) {
	const [localConfig, setLocalConfig] = useState<PatternConfig>(config);

	useEffect(() => {
		setLocalConfig(config);
	}, [config]);

	const handleChange = (changes: Partial<PatternConfig>) => {
		const newConfig = { ...localConfig, ...changes };
		setLocalConfig(newConfig);
		onChange(newConfig);
	};

	return (
		<Card className="w-full">
			<CardContent className="pt-6">
				<Tabs defaultValue="basic" className="w-full">
					<TabsList className="grid grid-cols-3 mb-4">
						<TabsTrigger value="basic">Básico</TabsTrigger>
						<TabsTrigger value="appearance">Apariencia</TabsTrigger>
						<TabsTrigger value="animation">Animación</TabsTrigger>
					</TabsList>

					<TabsContent value="basic" className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="enabled" className="flex flex-col space-y-1">
								<span>Habilitado</span>
								<span className="text-xs text-muted-foreground">Activa o desactiva el patrón</span>
							</Label>
							<Switch
								id="enabled"
								checked={localConfig.enabled}
								onCheckedChange={(checked) => handleChange({ enabled: checked })}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="patternType">Tipo de Patrón</Label>
							<Select
								value={localConfig.patternType}
								onValueChange={(value) => handleChange({ patternType: value as PatternConfig['patternType'] })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un tipo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="dots">Puntos</SelectItem>
									<SelectItem value="lines">Líneas</SelectItem>
									<SelectItem value="grid">Cuadrícula</SelectItem>
									<SelectItem value="hexagon">Hexágono</SelectItem>
								</SelectContent>
							</Select>
							<span className="text-xs text-muted-foreground">Forma básica del patrón</span>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="opacity">Opacidad</Label>
								<span className="text-sm text-muted-foreground">{localConfig.opacity.toFixed(2)}</span>
							</div>
							<Slider
								id="opacity"
								min={0}
								max={1}
								step={0.01}
								value={[localConfig.opacity]}
								onValueChange={([value]) => handleChange({ opacity: value })}
							/>
						</div>

						<div className="flex items-center justify-between">
							<Label htmlFor="visibleOnHover" className="flex flex-col space-y-1">
								<span>Visible al pasar mouse</span>
								<span className="text-xs text-muted-foreground">El patrón solo se muestra al pasar el mouse</span>
							</Label>
							<Switch
								id="visibleOnHover"
								checked={localConfig.visibleOnHover || false}
								onCheckedChange={(checked) => handleChange({ visibleOnHover: checked })}
							/>
						</div>
					</TabsContent>

					<TabsContent value="appearance" className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="color">Color Principal</Label>
							<div className="flex items-center gap-2">
								<ColorPicker value={localConfig.color} onChange={(value) => handleChange({ color: value })} />
								<Input
									id="color"
									value={localConfig.color}
									onChange={(e) => handleChange({ color: e.target.value })}
									className="flex-1"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="secondaryColor">Color Secundario (opcional)</Label>
							<div className="flex items-center gap-2">
								<ColorPicker
									value={localConfig.secondaryColor || ''}
									onChange={(value) => handleChange({ secondaryColor: value })}
								/>
								<Input
									id="secondaryColor"
									value={localConfig.secondaryColor || ''}
									onChange={(e) => handleChange({ secondaryColor: e.target.value })}
									className="flex-1"
								/>
							</div>
							<span className="text-xs text-muted-foreground">
								Usado para gradientes o elementos secundarios del patrón
							</span>
						</div>

						<div className="space-y-2">
							<Label htmlFor="blendMode">Modo de Fusión</Label>
							<Select
								value={localConfig.blendMode || 'normal'}
								onValueChange={(value) => handleChange({ blendMode: value as PatternConfig['blendMode'] })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un modo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="normal">Normal</SelectItem>
									<SelectItem value="multiply">Multiplicar</SelectItem>
									<SelectItem value="screen">Pantalla</SelectItem>
									<SelectItem value="overlay">Superposición</SelectItem>
									<SelectItem value="darken">Oscurecer</SelectItem>
									<SelectItem value="lighten">Aclarar</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="size">Tamaño</Label>
								<span className="text-sm text-muted-foreground">{localConfig.size}px</span>
							</div>
							<Slider
								id="size"
								min={1}
								max={100}
								step={1}
								value={[localConfig.size]}
								onValueChange={([value]) => handleChange({ size: value })}
							/>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="spacing">Espaciado</Label>
								<span className="text-sm text-muted-foreground">{localConfig.spacing}px</span>
							</div>
							<Slider
								id="spacing"
								min={1}
								max={100}
								step={1}
								value={[localConfig.spacing]}
								onValueChange={([value]) => handleChange({ spacing: value })}
							/>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="rotation">Rotación</Label>
								<span className="text-sm text-muted-foreground">{localConfig.rotation}°</span>
							</div>
							<Slider
								id="rotation"
								min={0}
								max={360}
								step={1}
								value={[localConfig.rotation]}
								onValueChange={([value]) => handleChange({ rotation: value })}
							/>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="density">Densidad</Label>
								<span className="text-sm text-muted-foreground">{localConfig.density.toFixed(1)}</span>
							</div>
							<Slider
								id="density"
								min={0.1}
								max={10}
								step={0.1}
								value={[localConfig.density || 1]}
								onValueChange={([value]) => handleChange({ density: value })}
							/>
							<span className="text-xs text-muted-foreground">Controla cuántos elementos del patrón se muestran</span>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="strokeWidth">Grosor de Trazo</Label>
								<span className="text-sm text-muted-foreground">{localConfig.strokeWidth || 1}px</span>
							</div>
							<Slider
								id="strokeWidth"
								min={0}
								max={10}
								step={0.5}
								value={[localConfig.strokeWidth || 1]}
								onValueChange={([value]) => handleChange({ strokeWidth: value })}
							/>
						</div>
					</TabsContent>

					<TabsContent value="animation" className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="animated" className="flex flex-col space-y-1">
								<span>Animado</span>
								<span className="text-xs text-muted-foreground">Activa la animación del patrón</span>
							</Label>
							<Switch
								id="animated"
								checked={localConfig.animated || false}
								onCheckedChange={(checked) => handleChange({ animated: checked })}
							/>
						</div>

						{localConfig.animated && (
							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<Label htmlFor="animationSpeed">Velocidad de animación</Label>
									<span className="text-sm text-muted-foreground">{(localConfig.animationSpeed || 1).toFixed(1)}</span>
								</div>
								<Slider
									id="animationSpeed"
									min={0.1}
									max={10}
									step={0.1}
									value={[localConfig.animationSpeed || 1]}
									onValueChange={([value]) => handleChange({ animationSpeed: value })}
								/>
							</div>
						)}
					</TabsContent>
				</Tabs>

				{onReset && (
					<div className="mt-6 flex justify-end">
						<Button variant="outline" size="sm" onClick={onReset}>
							Restablecer valores predeterminados
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
