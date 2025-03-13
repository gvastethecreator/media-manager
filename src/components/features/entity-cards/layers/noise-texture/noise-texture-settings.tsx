'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import type { NoiseTextureConfig } from './actions/noise-texture-config.action';

interface NoiseTextureSettingsProps {
	config: NoiseTextureConfig;
	onChange: (config: NoiseTextureConfig) => void;
	onReset?: () => void;
}

export function NoiseTextureSettings({ config, onChange, onReset }: NoiseTextureSettingsProps) {
	const [localConfig, setLocalConfig] = useState<NoiseTextureConfig>(config);

	useEffect(() => {
		setLocalConfig(config);
	}, [config]);

	const handleChange = (changes: Partial<NoiseTextureConfig>) => {
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
						<TabsTrigger value="pattern">Patrón</TabsTrigger>
						<TabsTrigger value="advanced">Avanzado</TabsTrigger>
					</TabsList>

					<TabsContent value="basic" className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="enabled" className="flex flex-col space-y-1">
								<span>Habilitado</span>
								<span className="text-xs text-muted-foreground">Activa o desactiva el efecto</span>
							</Label>
							<Checkbox
								id="enabled"
								checked={localConfig.enabled}
								onCheckedChange={(checked) => handleChange({ enabled: !!checked })}
							/>
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
							<span className="text-xs text-muted-foreground">
								Determina la transparencia del efecto de ruido
							</span>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="density">Densidad</Label>
								<span className="text-sm text-muted-foreground">{localConfig.density.toFixed(2)}</span>
							</div>
							<Slider
								id="density"
								min={0.01}
								max={2}
								step={0.01}
								value={[localConfig.density]}
								onValueChange={([value]) => handleChange({ density: value })}
							/>
							<span className="text-xs text-muted-foreground">
								Controla cuán detallado es el patrón de ruido
							</span>
						</div>

						<div className="flex items-center justify-between">
							<Label htmlFor="visibleOnHover" className="flex flex-col space-y-1">
								<span>Visible al pasar mouse</span>
								<span className="text-xs text-muted-foreground">
									El efecto solo se muestra al pasar el mouse
								</span>
							</Label>
							<Checkbox
								id="visibleOnHover"
								checked={localConfig.visibleOnHover}
								onCheckedChange={(checked) => handleChange({ visibleOnHover: !!checked })}
							/>
						</div>
					</TabsContent>

					<TabsContent value="pattern" className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="pattern">Tipo de Patrón</Label>
							<Select
								value={localConfig.pattern || 'fractalNoise'}
								onValueChange={(value) =>
									handleChange({
										pattern: value as NoiseTextureConfig['pattern'],
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un tipo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="perlin">Perlin</SelectItem>
									<SelectItem value="simplex">Simplex</SelectItem>
									<SelectItem value="fractalNoise">Ruido Fractal</SelectItem>
									<SelectItem value="turbulence">Turbulencia</SelectItem>
								</SelectContent>
							</Select>
							<span className="text-xs text-muted-foreground">Algoritmo usado para generar el ruido</span>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="scale">Escala</Label>
								<span className="text-sm text-muted-foreground">{localConfig.scale?.toFixed(1) || '1.0'}</span>
							</div>
							<Slider
								id="scale"
								min={0.1}
								max={10}
								step={0.1}
								value={[localConfig.scale || 1]}
								onValueChange={([value]) => handleChange({ scale: value })}
							/>
							<span className="text-xs text-muted-foreground">
								Ajusta el tamaño relativo del patrón de ruido
							</span>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="seed">Seed</Label>
								<span className="text-sm text-muted-foreground">{localConfig.seed || '0'}</span>
							</div>
							<Slider
								id="seed"
								min={0}
								max={1000}
								step={1}
								value={[localConfig.seed || 0]}
								onValueChange={([value]) => handleChange({ seed: value })}
							/>
							<span className="text-xs text-muted-foreground">
								Cambia el valor para generar un patrón diferente
							</span>
						</div>
					</TabsContent>

					<TabsContent value="advanced" className="space-y-4">
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="intensity">Intensidad</Label>
								<span className="text-sm text-muted-foreground">
									{(localConfig.intensity || 0.5).toFixed(2)}
								</span>
							</div>
							<Slider
								id="intensity"
								min={0}
								max={1}
								step={0.01}
								value={[localConfig.intensity || 0.5]}
								onValueChange={([value]) => handleChange({ intensity: value })}
							/>
							<span className="text-xs text-muted-foreground">
								Controla la intensidad general del efecto
							</span>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="octaves">Octavas</Label>
								<span className="text-sm text-muted-foreground">{localConfig.octaves || '3'}</span>
							</div>
							<Slider
								id="octaves"
								min={1}
								max={8}
								step={1}
								value={[localConfig.octaves || 3]}
								onValueChange={([value]) => handleChange({ octaves: value })}
							/>
							<span className="text-xs text-muted-foreground">
								Mayor número significa más detalle y complejidad
							</span>
						</div>

						<div className="flex items-center justify-between">
							<Label htmlFor="animated" className="flex flex-col space-y-1">
								<span>Animado</span>
								<span className="text-xs text-muted-foreground">Activa la animación del ruido</span>
							</Label>
							<Checkbox
								id="animated"
								checked={localConfig.animated || false}
								onCheckedChange={(checked) => handleChange({ animated: !!checked })}
							/>
						</div>

						{localConfig.animated && (
							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<Label htmlFor="animationSpeed">Velocidad de animación</Label>
									<span className="text-sm text-muted-foreground">
										{(localConfig.animationSpeed || 1).toFixed(1)}
									</span>
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

						<div className="space-y-2">
							<Label htmlFor="blendMode">Modo de fusión</Label>
							<Select
								value={localConfig.blendMode || 'overlay'}
								onValueChange={(value) =>
									handleChange({
										blendMode: value as NoiseTextureConfig['blendMode'],
									})
								}
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
							<span className="text-xs text-muted-foreground">
								Determina cómo se mezcla el ruido con las capas inferiores
							</span>
						</div>
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