'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { CardOptions } from '../../types/card-settings-types';

interface PatternsSettingsProps {
	options: CardOptions;
	onOptionsChange: (options: CardOptions) => void;
}

export function PatternsSettings({ options, onOptionsChange }: PatternsSettingsProps) {
	const handlePatternChange = (patternType: string, property: string, value: number | boolean | string) => {
		const newOptions = {
			...options,
			effects: {
				...options.effects,
				patterns: {
					...options.effects?.patterns,
					[patternType]: {
						...options.effects?.patterns?.[patternType],
						[property]: value,
					},
				},
			},
		};
		onOptionsChange(newOptions);
	};

	const handlePatternToggle = (patternType: string) => {
		const newOptions = {
			...options,
			effects: {
				...options.effects,
				patterns: {
					...options.effects?.patterns,
					[patternType]: {
						...options.effects?.patterns?.[patternType],
						enabled: !options.effects?.patterns?.[patternType]?.enabled,
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
					<CardTitle className="text-sm font-medium">Patterns</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Dots Pattern */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Dots Pattern</Label>
							<Switch
								checked={options.effects?.patterns?.dots?.enabled}
								onCheckedChange={() => handlePatternToggle('dots')}
							/>
						</div>
						{options.effects?.patterns?.dots?.enabled && (
							<div className="space-y-2 pl-4">
								<div className="flex items-center justify-between">
									<Label>Visible on Hover</Label>
									<Switch
										checked={options.effects?.patterns?.dots?.visibleOnHover}
										onCheckedChange={(checked) => handlePatternChange('dots', 'visibleOnHover', checked)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Opacity</Label>
									<Slider
										value={[options.effects?.patterns?.dots?.opacity || 0.1]}
										onValueChange={([value]) => handlePatternChange('dots', 'opacity', value)}
										min={0}
										max={1}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Scale</Label>
									<Slider
										value={[options.effects?.patterns?.dots?.scale || 1]}
										onValueChange={([value]) => handlePatternChange('dots', 'scale', value)}
										min={0.1}
										max={2}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Rotation</Label>
									<Slider
										value={[options.effects?.patterns?.dots?.rotation || 0]}
										onValueChange={([value]) => handlePatternChange('dots', 'rotation', value)}
										min={-180}
										max={180}
										step={1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Dot Size</Label>
									<Slider
										value={[options.effects?.patterns?.dots?.dotSize || 2]}
										onValueChange={([value]) => handlePatternChange('dots', 'dotSize', value)}
										min={1}
										max={10}
										step={1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Spacing</Label>
									<Slider
										value={[options.effects?.patterns?.dots?.spacing || 20]}
										onValueChange={([value]) => handlePatternChange('dots', 'spacing', value)}
										min={5}
										max={50}
										step={1}
									/>
								</div>
							</div>
						)}
					</div>

					<Separator />

					{/* Grid Pattern */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Grid Pattern</Label>
							<Switch
								checked={options.effects?.patterns?.grid?.enabled}
								onCheckedChange={() => handlePatternToggle('grid')}
							/>
						</div>
						{options.effects?.patterns?.grid?.enabled && (
							<div className="space-y-2 pl-4">
								<div className="flex items-center justify-between">
									<Label>Visible on Hover</Label>
									<Switch
										checked={options.effects?.patterns?.grid?.visibleOnHover}
										onCheckedChange={(checked) => handlePatternChange('grid', 'visibleOnHover', checked)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Opacity</Label>
									<Slider
										value={[options.effects?.patterns?.grid?.opacity || 0.1]}
										onValueChange={([value]) => handlePatternChange('grid', 'opacity', value)}
										min={0}
										max={1}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Scale</Label>
									<Slider
										value={[options.effects?.patterns?.grid?.scale || 1]}
										onValueChange={([value]) => handlePatternChange('grid', 'scale', value)}
										min={0.1}
										max={2}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Rotation</Label>
									<Slider
										value={[options.effects?.patterns?.grid?.rotation || 0]}
										onValueChange={([value]) => handlePatternChange('grid', 'rotation', value)}
										min={-180}
										max={180}
										step={1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Line Width</Label>
									<Slider
										value={[options.effects?.patterns?.grid?.lineWidth || 1]}
										onValueChange={([value]) => handlePatternChange('grid', 'lineWidth', value)}
										min={1}
										max={5}
										step={0.5}
									/>
								</div>
								<div className="space-y-1">
									<Label>Spacing</Label>
									<Slider
										value={[options.effects?.patterns?.grid?.spacing || 20]}
										onValueChange={([value]) => handlePatternChange('grid', 'spacing', value)}
										min={5}
										max={50}
										step={1}
									/>
								</div>
							</div>
						)}
					</div>

					<Separator />

					{/* Hexagon Pattern */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Hexagon Pattern</Label>
							<Switch
								checked={options.effects?.patterns?.hexagons?.enabled}
								onCheckedChange={() => handlePatternToggle('hexagons')}
							/>
						</div>
						{options.effects?.patterns?.hexagons?.enabled && (
							<div className="space-y-2 pl-4">
								<div className="flex items-center justify-between">
									<Label>Visible on Hover</Label>
									<Switch
										checked={options.effects?.patterns?.hexagons?.visibleOnHover}
										onCheckedChange={(checked) => handlePatternChange('hexagons', 'visibleOnHover', checked)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Opacity</Label>
									<Slider
										value={[options.effects?.patterns?.hexagons?.opacity || 0.1]}
										onValueChange={([value]) => handlePatternChange('hexagons', 'opacity', value)}
										min={0}
										max={1}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Scale</Label>
									<Slider
										value={[options.effects?.patterns?.hexagons?.scale || 1]}
										onValueChange={([value]) => handlePatternChange('hexagons', 'scale', value)}
										min={0.1}
										max={2}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Rotation</Label>
									<Slider
										value={[options.effects?.patterns?.hexagons?.rotation || 0]}
										onValueChange={([value]) => handlePatternChange('hexagons', 'rotation', value)}
										min={-180}
										max={180}
										step={1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Size</Label>
									<Slider
										value={[options.effects?.patterns?.hexagons?.size || 20]}
										onValueChange={([value]) => handlePatternChange('hexagons', 'size', value)}
										min={5}
										max={50}
										step={1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Spacing</Label>
									<Slider
										value={[options.effects?.patterns?.hexagons?.spacing || 30]}
										onValueChange={([value]) => handlePatternChange('hexagons', 'spacing', value)}
										min={10}
										max={100}
										step={1}
									/>
								</div>
							</div>
						)}
					</div>

					<Separator />

					{/* Lines Pattern */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Lines Pattern</Label>
							<Switch
								checked={options.effects?.patterns?.lines?.enabled}
								onCheckedChange={() => handlePatternToggle('lines')}
							/>
						</div>
						{options.effects?.patterns?.lines?.enabled && (
							<div className="space-y-2 pl-4">
								<div className="flex items-center justify-between">
									<Label>Visible on Hover</Label>
									<Switch
										checked={options.effects?.patterns?.lines?.visibleOnHover}
										onCheckedChange={(checked) => handlePatternChange('lines', 'visibleOnHover', checked)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Opacity</Label>
									<Slider
										value={[options.effects?.patterns?.lines?.opacity || 0.1]}
										onValueChange={([value]) => handlePatternChange('lines', 'opacity', value)}
										min={0}
										max={1}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Scale</Label>
									<Slider
										value={[options.effects?.patterns?.lines?.scale || 1]}
										onValueChange={([value]) => handlePatternChange('lines', 'scale', value)}
										min={0.1}
										max={2}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Rotation</Label>
									<Slider
										value={[options.effects?.patterns?.lines?.rotation || 0]}
										onValueChange={([value]) => handlePatternChange('lines', 'rotation', value)}
										min={-180}
										max={180}
										step={1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Line Width</Label>
									<Slider
										value={[options.effects?.patterns?.lines?.lineWidth || 1]}
										onValueChange={([value]) => handlePatternChange('lines', 'lineWidth', value)}
										min={1}
										max={5}
										step={0.5}
									/>
								</div>
								<div className="space-y-1">
									<Label>Spacing</Label>
									<Slider
										value={[options.effects?.patterns?.lines?.spacing || 20]}
										onValueChange={([value]) => handlePatternChange('lines', 'spacing', value)}
										min={5}
										max={50}
										step={1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Angle</Label>
									<Slider
										value={[options.effects?.patterns?.lines?.angle || 45]}
										onValueChange={([value]) => handlePatternChange('lines', 'angle', value)}
										min={0}
										max={180}
										step={1}
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
