'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { CardOptions } from '../../types/card-settings-types';

interface FiltersSettingsProps {
	options: CardOptions;
	onOptionsChange: (options: CardOptions) => void;
}

export function FiltersSettings({ options, onOptionsChange }: FiltersSettingsProps) {
	const handleFilterChange = (filterType: string, property: string, value: number | boolean | string) => {
		const newOptions = {
			...options,
			effects: {
				...options.effects,
				filters: {
					...options.effects?.filters,
					[filterType]: {
						...options.effects?.filters?.[filterType],
						[property]: value,
					},
				},
			},
		};
		onOptionsChange(newOptions);
	};

	const handleFilterToggle = (filterType: string) => {
		const newOptions = {
			...options,
			effects: {
				...options.effects,
				filters: {
					...options.effects?.filters,
					[filterType]: {
						...options.effects?.filters?.[filterType],
						enabled: !options.effects?.filters?.[filterType]?.enabled,
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
					<CardTitle className="text-sm font-medium">Filters</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Distortion Filter */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Distortion Filter</Label>
							<Switch
								checked={options.effects?.filters?.distortion?.enabled}
								onCheckedChange={() => handleFilterToggle('distortion')}
							/>
						</div>
						{options.effects?.filters?.distortion?.enabled && (
							<div className="space-y-2 pl-4">
								<div className="flex items-center justify-between">
									<Label>Visible on Hover</Label>
									<Switch
										checked={options.effects?.filters?.distortion?.visibleOnHover}
										onCheckedChange={(checked) => handleFilterChange('distortion', 'visibleOnHover', checked)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Intensity</Label>
									<Slider
										value={[options.effects?.filters?.distortion?.intensity || 0.1]}
										onValueChange={([value]) => handleFilterChange('distortion', 'intensity', value)}
										min={0}
										max={1}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Frequency</Label>
									<Slider
										value={[options.effects?.filters?.distortion?.frequency || 0.5]}
										onValueChange={([value]) => handleFilterChange('distortion', 'frequency', value)}
										min={0}
										max={2}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Amplitude</Label>
									<Slider
										value={[options.effects?.filters?.distortion?.amplitude || 0.1]}
										onValueChange={([value]) => handleFilterChange('distortion', 'amplitude', value)}
										min={0}
										max={1}
										step={0.1}
									/>
								</div>
							</div>
						)}
					</div>

					<Separator />

					{/* Glow Filter */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Glow Filter</Label>
							<Switch
								checked={options.effects?.filters?.glow?.enabled}
								onCheckedChange={() => handleFilterToggle('glow')}
							/>
						</div>
						{options.effects?.filters?.glow?.enabled && (
							<div className="space-y-2 pl-4">
								<div className="flex items-center justify-between">
									<Label>Visible on Hover</Label>
									<Switch
										checked={options.effects?.filters?.glow?.visibleOnHover}
										onCheckedChange={(checked) => handleFilterChange('glow', 'visibleOnHover', checked)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Intensity</Label>
									<Slider
										value={[options.effects?.filters?.glow?.intensity || 0.5]}
										onValueChange={([value]) => handleFilterChange('glow', 'intensity', value)}
										min={0}
										max={2}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Radius</Label>
									<Slider
										value={[options.effects?.filters?.glow?.radius || 10]}
										onValueChange={([value]) => handleFilterChange('glow', 'radius', value)}
										min={0}
										max={50}
										step={1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Color</Label>
									<input
										type="color"
										value={options.effects?.filters?.glow?.color || '#ffffff'}
										onChange={(e) => handleFilterChange('glow', 'color', e.target.value)}
										className="w-full h-8 rounded-md border border-input"
									/>
								</div>
							</div>
						)}
					</div>

					<Separator />

					{/* Shadow Filter */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Shadow Filter</Label>
							<Switch
								checked={options.effects?.filters?.shadow?.enabled}
								onCheckedChange={() => handleFilterToggle('shadow')}
							/>
						</div>
						{options.effects?.filters?.shadow?.enabled && (
							<div className="space-y-2 pl-4">
								<div className="flex items-center justify-between">
									<Label>Visible on Hover</Label>
									<Switch
										checked={options.effects?.filters?.shadow?.visibleOnHover}
										onCheckedChange={(checked) => handleFilterChange('shadow', 'visibleOnHover', checked)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Intensity</Label>
									<Slider
										value={[options.effects?.filters?.shadow?.intensity || 0.5]}
										onValueChange={([value]) => handleFilterChange('shadow', 'intensity', value)}
										min={0}
										max={2}
										step={0.1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Blur</Label>
									<Slider
										value={[options.effects?.filters?.shadow?.blur || 10]}
										onValueChange={([value]) => handleFilterChange('shadow', 'blur', value)}
										min={0}
										max={50}
										step={1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Color</Label>
									<input
										type="color"
										value={options.effects?.filters?.shadow?.color || '#000000'}
										onChange={(e) => handleFilterChange('shadow', 'color', e.target.value)}
										className="w-full h-8 rounded-md border border-input"
									/>
								</div>
								<div className="space-y-1">
									<Label>Offset X</Label>
									<Slider
										value={[options.effects?.filters?.shadow?.offsetX || 0]}
										onValueChange={([value]) => handleFilterChange('shadow', 'offsetX', value)}
										min={-50}
										max={50}
										step={1}
									/>
								</div>
								<div className="space-y-1">
									<Label>Offset Y</Label>
									<Slider
										value={[options.effects?.filters?.shadow?.offsetY || 0]}
										onValueChange={([value]) => handleFilterChange('shadow', 'offsetY', value)}
										min={-50}
										max={50}
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
