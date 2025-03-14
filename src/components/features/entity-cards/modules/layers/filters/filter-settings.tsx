'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import type { FilterConfig } from './actions/filter-config.action';
import { applyFilterPreset, getAvailablePresets } from './filter-presets';

interface FilterSettingsProps {
	config: FilterConfig;
	onChange: (config: FilterConfig) => void;
	onReset?: () => void;
}

export function FilterSettings({ config, onChange, onReset }: FilterSettingsProps) {
	const [localConfig, setLocalConfig] = useState<FilterConfig>(config);
	const [activeTab, setActiveTab] = useState('basic');
	const presets = getAvailablePresets();

	useEffect(() => {
		setLocalConfig(config);
	}, [config]);

	const handleChange = (changes: Partial<FilterConfig>) => {
		const newConfig = { ...localConfig, ...changes };
		setLocalConfig(newConfig);
		onChange(newConfig);
	};

	const handleGlowChange = (changes: Partial<FilterConfig['glow']>) => {
		handleChange({
			glow: {
				...localConfig.glow,
				...changes,
			},
		});
	};

	const handleShadowChange = (changes: Partial<FilterConfig['shadow']>) => {
		handleChange({
			shadow: {
				...localConfig.shadow,
				...changes,
			},
		});
	};

	const handleDistortionChange = (changes: Partial<FilterConfig['distortion']>) => {
		handleChange({
			distortion: {
				...localConfig.distortion,
				...changes,
			},
		});
	};

	const handlePresetChange = (presetId: string) => {
		const newConfig = applyFilterPreset(localConfig, presetId);
		setLocalConfig(newConfig);
		onChange(newConfig);
	};

	return (
		<Card className="w-full">
			<CardContent className="pt-6">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid grid-cols-5 mb-4">
						<TabsTrigger value="basic">Básico</TabsTrigger>
						<TabsTrigger value="presets">Presets</TabsTrigger>
						<TabsTrigger value="glow">Resplandor</TabsTrigger>
						<TabsTrigger value="shadow">Sombra</TabsTrigger>
						<TabsTrigger value="distortion">Distorsión</TabsTrigger>
					</TabsList>

					<TabsContent value="basic" className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="enabled" className="flex flex-col space-y-1">
								<span>Habilitado</span>
								<span className="text-xs text-muted-foreground">Activa o desactiva todos los filtros</span>
							</Label>
							<Switch
								id="enabled"
								checked={localConfig.enabled}
								onCheckedChange={(checked) => handleChange({ enabled: checked })}
							/>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="opacity">Opacidad Global</Label>
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

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="intensity">Intensidad Global</Label>
								<span className="text-sm text-muted-foreground">{localConfig.intensity.toFixed(2)}</span>
							</div>
							<Slider
								id="intensity"
								min={0}
								max={1}
								step={0.01}
								value={[localConfig.intensity]}
								onValueChange={([value]) => handleChange({ intensity: value })}
							/>
						</div>

						<div className="flex items-center justify-between">
							<Label htmlFor="visibleOnHover" className="flex flex-col space-y-1">
								<span>Visible al pasar mouse</span>
								<span className="text-xs text-muted-foreground">Los filtros solo se muestran al pasar el mouse</span>
							</Label>
							<Switch
								id="visibleOnHover"
								checked={localConfig.visibleOnHover || false}
								onCheckedChange={(checked) => handleChange({ visibleOnHover: checked })}
							/>
						</div>
					</TabsContent>

					<TabsContent value="presets" className="space-y-4">
						<div className="space-y-4">
							<Label htmlFor="preset-selector">Selecciona un preset</Label>
							<Select onValueChange={handlePresetChange}>
								<SelectTrigger>
									<SelectValue placeholder="Elige un preset predefinido" />
								</SelectTrigger>
								<SelectContent>
									{presets.map((preset) => (
										<SelectItem key={preset.id} value={preset.id}>
											<div className="flex flex-col">
												<span>{preset.name}</span>
												<span className="text-xs text-muted-foreground">{preset.description}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-sm text-muted-foreground">
								Estos presets proporcionan configuraciones optimizadas para diferentes efectos visuales. Puedes
								seleccionar uno y luego ajustar la configuración según tus necesidades.
							</p>
						</div>

						<div className="grid grid-cols-3 gap-3 mt-4">
							{presets.slice(0, 6).map((preset) => (
								<Button
									key={preset.id}
									variant="outline"
									className="h-auto py-2 px-2 flex flex-col items-start"
									onClick={() => handlePresetChange(preset.id)}
								>
									<span className="font-medium">{preset.name}</span>
									<span className="text-xs text-muted-foreground line-clamp-2 text-left">{preset.description}</span>
								</Button>
							))}
						</div>
					</TabsContent>

					<TabsContent value="glow" className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="glow-enabled" className="flex flex-col space-y-1">
								<span>Habilitar Resplandor</span>
								<span className="text-xs text-muted-foreground">Activa el efecto de resplandor</span>
							</Label>
							<Switch
								id="glow-enabled"
								checked={localConfig.glow?.enabled || false}
								onCheckedChange={(checked) => handleGlowChange({ enabled: checked })}
							/>
						</div>

						{localConfig.glow?.enabled && (
							<>
								<div className="space-y-2">
									<Label htmlFor="glow-color">Color</Label>
									<div className="flex items-center gap-2">
										<ColorPicker
											value={localConfig.glow?.color || 'rgba(0, 0, 255, 0.3)'}
											onChange={(value) => handleGlowChange({ color: value })}
										/>
										<Input
											id="glow-color"
											value={localConfig.glow?.color || 'rgba(0, 0, 255, 0.3)'}
											onChange={(e) => handleGlowChange({ color: e.target.value })}
											className="flex-1"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<Label htmlFor="glow-radius">Radio</Label>
										<span className="text-sm text-muted-foreground">
											{(localConfig.glow?.radius || 10).toFixed(0)}px
										</span>
									</div>
									<Slider
										id="glow-radius"
										min={0}
										max={100}
										step={1}
										value={[localConfig.glow?.radius || 10]}
										onValueChange={([value]) => handleGlowChange({ radius: value })}
									/>
									<span className="text-xs text-muted-foreground">Controla el tamaño del área de resplandor</span>
								</div>

								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<Label htmlFor="glow-intensity">Intensidad</Label>
										<span className="text-sm text-muted-foreground">
											{(localConfig.glow?.intensity || 0.5).toFixed(2)}
										</span>
									</div>
									<Slider
										id="glow-intensity"
										min={0}
										max={1}
										step={0.01}
										value={[localConfig.glow?.intensity || 0.5]}
										onValueChange={([value]) => handleGlowChange({ intensity: value })}
									/>
								</div>

								<div className="flex items-center justify-between">
									<Label htmlFor="glow-animated" className="flex flex-col space-y-1">
										<span>Animado</span>
										<span className="text-xs text-muted-foreground">Anima el efecto de resplandor</span>
									</Label>
									<Switch
										id="glow-animated"
										checked={localConfig.glow?.animated || false}
										onCheckedChange={(checked) => handleGlowChange({ animated: checked })}
									/>
								</div>

								{localConfig.glow?.animated && (
									<div className="space-y-2">
										<div className="flex justify-between items-center">
											<Label htmlFor="glow-animation-speed">Velocidad de animación</Label>
											<span className="text-sm text-muted-foreground">
												{(localConfig.glow?.animationSpeed || 1).toFixed(1)}
											</span>
										</div>
										<Slider
											id="glow-animation-speed"
											min={0.1}
											max={10}
											step={0.1}
											value={[localConfig.glow?.animationSpeed || 1]}
											onValueChange={([value]) => handleGlowChange({ animationSpeed: value })}
										/>
									</div>
								)}
							</>
						)}
					</TabsContent>

					<TabsContent value="shadow" className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="shadow-enabled" className="flex flex-col space-y-1">
								<span>Habilitar Sombra</span>
								<span className="text-xs text-muted-foreground">Activa el efecto de sombra</span>
							</Label>
							<Switch
								id="shadow-enabled"
								checked={localConfig.shadow?.enabled || false}
								onCheckedChange={(checked) => handleShadowChange({ enabled: checked })}
							/>
						</div>

						{localConfig.shadow?.enabled && (
							<>
								<div className="space-y-2">
									<Label htmlFor="shadow-color">Color</Label>
									<div className="flex items-center gap-2">
										<ColorPicker
											value={localConfig.shadow?.color || 'rgba(0, 0, 0, 0.3)'}
											onChange={(value) => handleShadowChange({ color: value })}
										/>
										<Input
											id="shadow-color"
											value={localConfig.shadow?.color || 'rgba(0, 0, 0, 0.3)'}
											onChange={(e) => handleShadowChange({ color: e.target.value })}
											className="flex-1"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<Label htmlFor="shadow-blur">Desenfoque</Label>
										<span className="text-sm text-muted-foreground">
											{(localConfig.shadow?.blur || 5).toFixed(0)}px
										</span>
									</div>
									<Slider
										id="shadow-blur"
										min={0}
										max={100}
										step={1}
										value={[localConfig.shadow?.blur || 5]}
										onValueChange={([value]) => handleShadowChange({ blur: value })}
									/>
								</div>

								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<Label htmlFor="shadow-offsetX">Desplazamiento X</Label>
										<span className="text-sm text-muted-foreground">
											{(localConfig.shadow?.offsetX || 0).toFixed(0)}px
										</span>
									</div>
									<Slider
										id="shadow-offsetX"
										min={-50}
										max={50}
										step={1}
										value={[localConfig.shadow?.offsetX || 0]}
										onValueChange={([value]) => handleShadowChange({ offsetX: value })}
									/>
								</div>

								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<Label htmlFor="shadow-offsetY">Desplazamiento Y</Label>
										<span className="text-sm text-muted-foreground">
											{(localConfig.shadow?.offsetY || 5).toFixed(0)}px
										</span>
									</div>
									<Slider
										id="shadow-offsetY"
										min={-50}
										max={50}
										step={1}
										value={[localConfig.shadow?.offsetY || 5]}
										onValueChange={([value]) => handleShadowChange({ offsetY: value })}
									/>
								</div>

								<div className="flex items-center justify-between">
									<Label htmlFor="shadow-inset" className="flex flex-col space-y-1">
										<span>Sombra Interior</span>
										<span className="text-xs text-muted-foreground">Aplica la sombra hacia adentro</span>
									</Label>
									<Switch
										id="shadow-inset"
										checked={localConfig.shadow?.inset || false}
										onCheckedChange={(checked) => handleShadowChange({ inset: checked })}
									/>
								</div>
							</>
						)}
					</TabsContent>

					<TabsContent value="distortion" className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="distortion-enabled" className="flex flex-col space-y-1">
								<span>Habilitar Distorsión</span>
								<span className="text-xs text-muted-foreground">Activa el efecto de distorsión</span>
							</Label>
							<Switch
								id="distortion-enabled"
								checked={localConfig.distortion?.enabled || false}
								onCheckedChange={(checked) => handleDistortionChange({ enabled: checked })}
							/>
						</div>

						{localConfig.distortion?.enabled && (
							<>
								<div className="space-y-2">
									<Label htmlFor="distortion-type">Tipo</Label>
									<Select
										value={localConfig.distortion?.type || 'wave'}
										onValueChange={(value) =>
											handleDistortionChange({ type: value as FilterConfig['distortion']['type'] })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona un tipo" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="wave">Onda</SelectItem>
											<SelectItem value="ripple">Ondulación</SelectItem>
											<SelectItem value="bulge">Abultamiento</SelectItem>
											<SelectItem value="twist">Torsión</SelectItem>
											<SelectItem value="noise">Ruido</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<Label htmlFor="distortion-amount">Cantidad</Label>
										<span className="text-sm text-muted-foreground">
											{(localConfig.distortion?.amount || 5).toFixed(1)}
										</span>
									</div>
									<Slider
										id="distortion-amount"
										min={0}
										max={50}
										step={0.5}
										value={[localConfig.distortion?.amount || 5]}
										onValueChange={([value]) => handleDistortionChange({ amount: value })}
									/>
								</div>

								<div className="flex items-center justify-between">
									<Label htmlFor="distortion-animated" className="flex flex-col space-y-1">
										<span>Animado</span>
										<span className="text-xs text-muted-foreground">Anima el efecto de distorsión</span>
									</Label>
									<Switch
										id="distortion-animated"
										checked={localConfig.distortion?.animated || false}
										onCheckedChange={(checked) => handleDistortionChange({ animated: checked })}
									/>
								</div>

								{localConfig.distortion?.animated && (
									<div className="space-y-2">
										<div className="flex justify-between items-center">
											<Label htmlFor="distortion-speed">Velocidad</Label>
											<span className="text-sm text-muted-foreground">
												{(localConfig.distortion?.speed || 1).toFixed(1)}
											</span>
										</div>
										<Slider
											id="distortion-speed"
											min={0.1}
											max={10}
											step={0.1}
											value={[localConfig.distortion?.speed || 1]}
											onValueChange={([value]) => handleDistortionChange({ speed: value })}
										/>
									</div>
								)}

								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<Label htmlFor="distortion-frequency">Frecuencia</Label>
										<span className="text-sm text-muted-foreground">
											{(localConfig.distortion?.frequency || 1).toFixed(1)}
										</span>
									</div>
									<Slider
										id="distortion-frequency"
										min={0.1}
										max={10}
										step={0.1}
										value={[localConfig.distortion?.frequency || 1]}
										onValueChange={([value]) => handleDistortionChange({ frequency: value })}
									/>
									<span className="text-xs text-muted-foreground">Controla la densidad de las ondulaciones</span>
								</div>
							</>
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
