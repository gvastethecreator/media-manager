'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Wand2 } from 'lucide-react';
import { Sliders } from 'lucide-react';
import type { CardOptions } from '../../types/card-settings-types';

interface DistortionEffectsSettingsProps {
	cardOptions: CardOptions;
	onCardOptionsChange: (options: CardOptions) => void;
}

export function DistortionEffectsSettings({ cardOptions, onCardOptionsChange }: DistortionEffectsSettingsProps) {
	// Manejadores para efectos de distorsión
	const handleDistortionChange = (
		effect: 'glitch' | 'chromatic' | 'pixelate',
		property: string,
		value: number | boolean
	) => {
		const newOptions = { ...cardOptions };
		if (!newOptions.effects) {
			newOptions.effects = {
				enabled: true,
				visibleOnHover: false,
				intensity: 1,
			};
		}

		switch (effect) {
			case 'glitch':
				if (!newOptions.effects.glitchEffect) {
					newOptions.effects.glitchEffect = {
						enabled: false,
						visibleOnHover: false,
						intensity: 0.5,
						frequency: 0.1,
						duration: 0.2,
					};
				}
				newOptions.effects.glitchEffect[property as keyof typeof newOptions.effects.glitchEffect] = value;
				break;
			case 'chromatic':
				if (!newOptions.effects.chromaticAberration) {
					newOptions.effects.chromaticAberration = {
						enabled: false,
						visibleOnHover: false,
						intensity: 0.5,
						offset: 0.1,
					};
				}
				newOptions.effects.chromaticAberration[property as keyof typeof newOptions.effects.chromaticAberration] = value;
				break;
			case 'pixelate':
				if (!newOptions.effects.pixelate) {
					newOptions.effects.pixelate = {
						enabled: false,
						visibleOnHover: false,
						intensity: 0.5,
						blockSize: 4,
					};
				}
				newOptions.effects.pixelate[property as keyof typeof newOptions.effects.pixelate] = value;
				break;
		}

		onCardOptionsChange(newOptions);
	};

	return (
		<Card className="border-none shadow-none">
			<CardHeader className="p-0">
				<CardTitle className="text-sm font-medium flex items-center gap-2">
					<Sliders className="h-4 w-4 text-purple-500" />
					Efectos de Distorsión
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0 mt-4">
				<ScrollArea className="h-[400px] pr-4">
					<div className="space-y-6">
						{/* Efecto Glitch */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label className="text-sm font-medium">Efecto Glitch</Label>
								<Switch
									checked={cardOptions.effects?.glitchEffect?.enabled}
									onCheckedChange={(checked) => handleDistortionChange('glitch', 'enabled', checked)}
								/>
							</div>
							{cardOptions.effects?.glitchEffect?.enabled && (
								<div className="space-y-4 pl-4">
									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">Intensidad</Label>
										<Slider
											value={[cardOptions.effects.glitchEffect.intensity || 0.5]}
											onValueChange={([value]) => handleDistortionChange('glitch', 'intensity', value)}
											min={0}
											max={1}
											step={0.1}
											className="w-full"
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">Frecuencia</Label>
										<Slider
											value={[cardOptions.effects.glitchEffect.frequency || 0.1]}
											onValueChange={([value]) => handleDistortionChange('glitch', 'frequency', value)}
											min={0}
											max={1}
											step={0.1}
											className="w-full"
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">Duración</Label>
										<Slider
											value={[cardOptions.effects.glitchEffect.duration || 0.2]}
											onValueChange={([value]) => handleDistortionChange('glitch', 'duration', value)}
											min={0}
											max={1}
											step={0.1}
											className="w-full"
										/>
									</div>
									<div className="flex items-center justify-between">
										<Label className="text-xs text-muted-foreground">Visible al pasar el mouse</Label>
										<Switch
											checked={cardOptions.effects.glitchEffect.visibleOnHover}
											onCheckedChange={(checked) => handleDistortionChange('glitch', 'visibleOnHover', checked)}
										/>
									</div>
								</div>
							)}
						</div>

						<Separator />

						{/* Aberración Cromática */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label className="text-sm font-medium">Aberración Cromática</Label>
								<Switch
									checked={cardOptions.effects?.chromaticAberration?.enabled}
									onCheckedChange={(checked) => handleDistortionChange('chromatic', 'enabled', checked)}
								/>
							</div>
							{cardOptions.effects?.chromaticAberration?.enabled && (
								<div className="space-y-4 pl-4">
									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">Intensidad</Label>
										<Slider
											value={[cardOptions.effects.chromaticAberration.intensity || 0.5]}
											onValueChange={([value]) => handleDistortionChange('chromatic', 'intensity', value)}
											min={0}
											max={1}
											step={0.1}
											className="w-full"
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">Offset</Label>
										<Slider
											value={[cardOptions.effects.chromaticAberration.offset || 0.1]}
											onValueChange={([value]) => handleDistortionChange('chromatic', 'offset', value)}
											min={0}
											max={1}
											step={0.1}
											className="w-full"
										/>
									</div>
									<div className="flex items-center justify-between">
										<Label className="text-xs text-muted-foreground">Visible al pasar el mouse</Label>
										<Switch
											checked={cardOptions.effects.chromaticAberration.visibleOnHover}
											onCheckedChange={(checked) => handleDistortionChange('chromatic', 'visibleOnHover', checked)}
										/>
									</div>
								</div>
							)}
						</div>

						<Separator />

						{/* Pixelación */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label className="text-sm font-medium">Pixelación</Label>
								<Switch
									checked={cardOptions.effects?.pixelate?.enabled}
									onCheckedChange={(checked) => handleDistortionChange('pixelate', 'enabled', checked)}
								/>
							</div>
							{cardOptions.effects?.pixelate?.enabled && (
								<div className="space-y-4 pl-4">
									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">Intensidad</Label>
										<Slider
											value={[cardOptions.effects.pixelate.intensity || 0.5]}
											onValueChange={([value]) => handleDistortionChange('pixelate', 'intensity', value)}
											min={0}
											max={1}
											step={0.1}
											className="w-full"
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">Tamaño de bloque</Label>
										<Slider
											value={[cardOptions.effects.pixelate.blockSize || 4]}
											onValueChange={([value]) => handleDistortionChange('pixelate', 'blockSize', value)}
											min={1}
											max={20}
											step={1}
											className="w-full"
										/>
									</div>
									<div className="flex items-center justify-between">
										<Label className="text-xs text-muted-foreground">Visible al pasar el mouse</Label>
										<Switch
											checked={cardOptions.effects.pixelate.visibleOnHover}
											onCheckedChange={(checked) => handleDistortionChange('pixelate', 'visibleOnHover', checked)}
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
