'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { CardOptions } from '../../types/card-settings-types';

interface ShadersSettingsProps {
	options: CardOptions;
	onOptionsChange: (options: CardOptions) => void;
}

export function ShadersSettings({ options, onOptionsChange }: ShadersSettingsProps) {
	const handleShaderChange = (shaderType: string, property: string, value: number | boolean | string) => {
		const newOptions = {
			...options,
			effects: {
				...options.effects,
				shaders: {
					...options.effects?.shaders,
					[shaderType]: {
						...options.effects?.shaders?.[shaderType],
						[property]: value,
					},
				},
			},
		};
		onOptionsChange(newOptions);
	};

	const handleShaderToggle = (shaderType: string) => {
		const newOptions = {
			...options,
			effects: {
				...options.effects,
				shaders: {
					...options.effects?.shaders,
					[shaderType]: {
						...options.effects?.shaders?.[shaderType],
						enabled: !options.effects?.shaders?.[shaderType]?.enabled,
					},
				},
			},
		};
		onOptionsChange(newOptions);
	};

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium">Shaders</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Distortion Shader */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Distortion Shader</Label>
							<Switch
								checked={options.effects?.shaders?.distortion?.enabled}
								onCheckedChange={() => handleShaderToggle('distortion')}
							/>
						</div>
						{options.effects?.shaders?.distortion?.enabled && (
							<div className="space-y-2 pl-4">
								<div className="flex items-center justify-between">
									<Label>Visible on Hover</Label>
									<Switch
										checked={options.effects?.shaders?.distortion?.visibleOnHover}
										onCheckedChange={(checked) => handleShaderChange('distortion', 'visibleOnHover', checked)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Intensity</Label>
									<Slider
										value={[options.effects?.shaders?.distortion?.intensity || 0.1]}
										onValueChange={([value]) => handleShaderChange('distortion', 'intensity', value)}
										min={0}
										max={1}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Frequency</Label>
									<Slider
										value={[options.effects?.shaders?.distortion?.frequency || 0.5]}
										onValueChange={([value]) => handleShaderChange('distortion', 'frequency', value)}
										min={0}
										max={2}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Amplitude</Label>
									<Slider
										value={[options.effects?.shaders?.distortion?.amplitude || 0.1]}
										onValueChange={([value]) => handleShaderChange('distortion', 'amplitude', value)}
										min={0}
										max={1}
										step={0.1}
									/>
								</div>
							</div>
						)}
					</div>

					<Separator />

					{/* Hologram Shader */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Hologram Shader</Label>
							<Switch
								checked={options.effects?.shaders?.hologram?.enabled}
								onCheckedChange={() => handleShaderToggle('hologram')}
							/>
						</div>
						{options.effects?.shaders?.hologram?.enabled && (
							<div className="space-y-2 pl-4">
								<div className="flex items-center justify-between">
									<Label>Visible on Hover</Label>
									<Switch
										checked={options.effects?.shaders?.hologram?.visibleOnHover}
										onCheckedChange={(checked) => handleShaderChange('hologram', 'visibleOnHover', checked)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Intensity</Label>
									<Slider
										value={[options.effects?.shaders?.hologram?.intensity || 0.5]}
										onValueChange={([value]) => handleShaderChange('hologram', 'intensity', value)}
										min={0}
										max={1}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Scanline Speed</Label>
									<Slider
										value={[options.effects?.shaders?.hologram?.scanlineSpeed || 1]}
										onValueChange={([value]) => handleShaderChange('hologram', 'scanlineSpeed', value)}
										min={0}
										max={5}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Scanline Density</Label>
									<Slider
										value={[options.effects?.shaders?.hologram?.scanlineDensity || 0.5]}
										onValueChange={([value]) => handleShaderChange('hologram', 'scanlineDensity', value)}
										min={0}
										max={1}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Color</Label>
									<input
										type="color"
										value={options.effects?.shaders?.hologram?.color || '#00ffff'}
										onChange={(e) => handleShaderChange('hologram', 'color', e.target.value)}
										className="w-full h-8 rounded-md border border-input"
									/>
								</div>
							</div>
						)}
					</div>

					<Separator />

					{/* Particle Shader */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Particle Shader</Label>
							<Switch
								checked={options.effects?.shaders?.particles?.enabled}
								onCheckedChange={() => handleShaderToggle('particles')}
							/>
						</div>
						{options.effects?.shaders?.particles?.enabled && (
							<div className="space-y-2 pl-4">
								<div className="flex items-center justify-between">
									<Label>Visible on Hover</Label>
									<Switch
										checked={options.effects?.shaders?.particles?.visibleOnHover}
										onCheckedChange={(checked) => handleShaderChange('particles', 'visibleOnHover', checked)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Intensity</Label>
									<Slider
										value={[options.effects?.shaders?.particles?.intensity || 0.5]}
										onValueChange={([value]) => handleShaderChange('particles', 'intensity', value)}
										min={0}
										max={1}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Particle Count</Label>
									<Slider
										value={[options.effects?.shaders?.particles?.particleCount || 100]}
										onValueChange={([value]) => handleShaderChange('particles', 'particleCount', value)}
										min={10}
										max={500}
										step={10}
									/>
								</div>
								<div className="space-y-1">
									<Label>Particle Size</Label>
									<Slider
										value={[options.effects?.shaders?.particles?.particleSize || 2]}
										onValueChange={([value]) => handleShaderChange('particles', 'particleSize', value)}
										min={1}
										max={10}
										step={1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Speed</Label>
									<Slider
										value={[options.effects?.shaders?.particles?.speed || 1]}
										onValueChange={([value]) => handleShaderChange('particles', 'speed', value)}
										min={0}
										max={5}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Color</Label>
									<input
										type="color"
										value={options.effects?.shaders?.particles?.color || '#ffffff'}
										onChange={(e) => handleShaderChange('particles', 'color', e.target.value)}
										className="w-full h-8 rounded-md border border-input"
									/>
								</div>
							</div>
						)}
					</div>

					<Separator />

					{/* Wave Shader */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Wave Shader</Label>
							<Switch
								checked={options.effects?.shaders?.wave?.enabled}
								onCheckedChange={() => handleShaderToggle('wave')}
							/>
						</div>
						{options.effects?.shaders?.wave?.enabled && (
							<div className="space-y-2 pl-4">
								<div className="flex items-center justify-between">
									<Label>Visible on Hover</Label>
									<Switch
										checked={options.effects?.shaders?.wave?.visibleOnHover}
										onCheckedChange={(checked) => handleShaderChange('wave', 'visibleOnHover', checked)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Intensity</Label>
									<Slider
										value={[options.effects?.shaders?.wave?.intensity || 0.5]}
										onValueChange={([value]) => handleShaderChange('wave', 'intensity', value)}
										min={0}
										max={1}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Frequency</Label>
									<Slider
										value={[options.effects?.shaders?.wave?.frequency || 0.5]}
										onValueChange={([value]) => handleShaderChange('wave', 'frequency', value)}
										min={0}
										max={2}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Amplitude</Label>
									<Slider
										value={[options.effects?.shaders?.wave?.amplitude || 0.1]}
										onValueChange={([value]) => handleShaderChange('wave', 'amplitude', value)}
										min={0}
										max={1}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Speed</Label>
									<Slider
										value={[options.effects?.shaders?.wave?.speed || 1]}
										onValueChange={([value]) => handleShaderChange('wave', 'speed', value)}
										min={0}
										max={5}
										step={0.1}
									/>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
