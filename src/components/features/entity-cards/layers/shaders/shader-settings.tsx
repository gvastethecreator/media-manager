'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toastService } from '@/lib/services/toast.service';
import { cn } from '@/lib/utils';
import { Eye, Square, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LayerSettingsProps } from '../layer-plugin-system';
import type { ShaderConfig } from './shader-config-schema';

export function ShaderSettings({ entityType, entityId, className, onConfigUpdate }: LayerSettingsProps<ShaderConfig>) {
	const [config, setConfig] = useState<ShaderConfig | null>(null);
	const [loading, setLoading] = useState(true);

	// Cargar la configuración inicial
	useEffect(() => {
		const loadConfig = async () => {
			try {
				// Aquí se cargaría la configuración desde el servidor
				// Implementar cuando se creen las server actions

				// Por ahora, usamos una configuración por defecto
				setConfig({
					enabled: true,
					layerIndex: 5,
					type: 'base',
					intensity: 0.5,
					speed: 1,
					color: '#00aaff',
					blendMode: 'screen',
					visibleOnHover: false,
					animated: true,
				});
			} catch (error) {
				console.error('Error al cargar la configuración del shader:', error);
				toastService.error('Error al cargar la configuración del shader');
			} finally {
				setLoading(false);
			}
		};

		loadConfig();
	}, []);

	// Manejar cambios en la configuración
	const handleConfigChange = <K extends keyof ShaderConfig>(key: K, value: ShaderConfig[K]) => {
		if (!config) {
			return;
		}

		const updatedConfig = {
			...config,
			[key]: value,
		};

		setConfig(updatedConfig);
		onConfigUpdate?.(updatedConfig);
	};

	if (loading || !config) {
		return <div className="p-4 text-center">Cargando configuración del shader...</div>;
	}

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader>
				<CardTitle className="flex items-center">
					<Wand2 className="mr-2 h-5 w-5" />
					Configuración de Shader
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="basic">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="basic">Básico</TabsTrigger>
						<TabsTrigger value="appearance">Apariencia</TabsTrigger>
						<TabsTrigger value="advanced">Avanzado</TabsTrigger>
					</TabsList>

					{/* Configuración básica */}
					<TabsContent value="basic" className="space-y-4 mt-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="enabled">Habilitar shader</Label>
							<Switch
								id="enabled"
								checked={config.enabled}
								onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
							/>
						</div>

						<div className="space-y-2">
							<Label>Tipo de shader</Label>
							<RadioGroup
								value={config.type}
								onValueChange={(value) => handleConfigChange('type', value as ShaderConfig['type'])}
								className="flex flex-col space-y-1"
							>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="base" id="shader-base" />
									<Label htmlFor="shader-base">Base</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="distortion" id="shader-distortion" />
									<Label htmlFor="shader-distortion">Distorsión</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="hologram" id="shader-hologram" />
									<Label htmlFor="shader-hologram">Holograma</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="wave" id="shader-wave" />
									<Label htmlFor="shader-wave">Ondas</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="particle" id="shader-particle" />
									<Label htmlFor="shader-particle">Partículas</Label>
								</div>
							</RadioGroup>
						</div>
					</TabsContent>

					{/* Configuración de apariencia */}
					<TabsContent value="appearance" className="space-y-4 mt-4">
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="intensity">Intensidad</Label>
								<span className="text-sm text-muted-foreground">{Math.round(config.intensity * 100)}%</span>
							</div>
							<Slider
								id="intensity"
								min={0}
								max={1}
								step={0.01}
								value={[config.intensity]}
								onValueChange={([value]) => handleConfigChange('intensity', value)}
							/>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="speed">Velocidad</Label>
								<span className="text-sm text-muted-foreground">{config.speed.toFixed(1)}x</span>
							</div>
							<Slider
								id="speed"
								min={0}
								max={5}
								step={0.1}
								value={[config.speed]}
								onValueChange={([value]) => handleConfigChange('speed', value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="blend-mode">Modo de mezcla</Label>
							<Select
								value={config.blendMode}
								onValueChange={(value) => handleConfigChange('blendMode', value as ShaderConfig['blendMode'])}
							>
								<SelectTrigger id="blend-mode">
									<SelectValue placeholder="Seleccionar modo de mezcla" />
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
							<div className="flex items-center justify-between">
								<Label htmlFor="color">Color</Label>
								<div className="flex items-center space-x-2">
									<div className="w-6 h-6 rounded-full border" style={{ backgroundColor: config.color }} />
									<input
										type="color"
										id="color"
										value={config.color}
										onChange={(e) => handleConfigChange('color', e.target.value)}
										className="w-10 h-10"
									/>
								</div>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<Label htmlFor="animated">Animado</Label>
							<Switch
								id="animated"
								checked={config.animated}
								onCheckedChange={(checked) => handleConfigChange('animated', checked)}
							/>
						</div>

						<div className="flex items-center justify-between">
							<Label htmlFor="visibleOnHover">Visible solo al pasar el ratón</Label>
							<Switch
								id="visibleOnHover"
								checked={config.visibleOnHover}
								onCheckedChange={(checked) => handleConfigChange('visibleOnHover', checked)}
							/>
						</div>
					</TabsContent>

					{/* Configuración avanzada */}
					<TabsContent value="advanced" className="space-y-4 mt-4">
						<div className="space-y-2">
							<Label htmlFor="vertex-shader">Vertex Shader (GLSL)</Label>
							<Textarea
								id="vertex-shader"
								className="font-mono text-sm h-32"
								placeholder="attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = 0.5 * (position + 1.0);
  gl_Position = vec4(position, 0.0, 1.0);
}"
								value={config.advanced?.vertexShader || ''}
								onChange={(e) =>
									handleConfigChange('advanced', {
										...(config.advanced || {}),
										vertexShader: e.target.value,
									})
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="fragment-shader">Fragment Shader (GLSL)</Label>
							<Textarea
								id="fragment-shader"
								className="font-mono text-sm h-32"
								placeholder="precision mediump float;
varying vec2 vUv;
uniform float time;
uniform vec2 resolution;

void main() {
  vec3 color = 0.5 + 0.5 * cos(time + vUv.xyx + vec3(0, 2, 4));
  gl_FragColor = vec4(color, 1.0);
}"
								value={config.advanced?.fragmentShader || ''}
								onChange={(e) =>
									handleConfigChange('advanced', {
										...(config.advanced || {}),
										fragmentShader: e.target.value,
									})
								}
							/>
						</div>

						<div className="flex justify-end space-x-2">
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									// Resetear la configuración avanzada
									handleConfigChange('advanced', undefined);
								}}
							>
								<Square className="h-4 w-4 mr-2" />
								Resetear
							</Button>
							<Button
								size="sm"
								variant="default"
								onClick={() => {
									// Previsualizar el shader personalizado
									toastService.info('Previsualización del shader aplicada');
								}}
							>
								<Eye className="h-4 w-4 mr-2" />
								Previsualizar
							</Button>
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
