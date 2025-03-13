'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Grid2X2, ImageIcon, LayoutGrid, Rows } from 'lucide-react';
import { LayoutList, LayoutTemplate } from 'lucide-react';
import type { CardOptions } from '../../types/card-settings-types';
import { panelColors } from './shared/panel-helpers';

interface ImageGridSettingsProps {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}

type ImageGridKey = keyof NonNullable<CardOptions['imageGrid']>;
type ImageGridValue = NonNullable<CardOptions['imageGrid']>[ImageGridKey];

export function ImageGridSettings({ options, onChange, disabled = false }: ImageGridSettingsProps) {
	const handleImageGridChange = (key: ImageGridKey, value: ImageGridValue) => {
		onChange({
			...options,
			imageGrid: {
				...options.imageGrid,
				[key]: value,
			},
		});
	};

	return (
		<Card className={cn('w-full', panelColors.images.bg, panelColors.images.border)}>
			<CardHeader className="pb-3">
				<CardTitle className="text-[11px] font-medium">Grid de Imágenes</CardTitle>
				<CardDescription className="text-[10px] text-muted-foreground">
					Configura la visualización de imágenes en la tarjeta
				</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<ScrollArea className="h-[300px] pr-4">
					<div className="space-y-5">
						{/* Layout */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-[10px] font-medium">Layout</h3>
							</div>
							<div className="space-y-3 pl-5">
								<RadioGroup
									value={options.imageGrid?.layout || 'grid'}
									onValueChange={(value) => handleImageGridChange('layout', value)}
									className="grid grid-cols-3 gap-4"
									disabled={disabled}
								>
									<div>
										<RadioGroupItem value="single" id="single" className="peer sr-only" />
										<Label
											htmlFor="single"
											className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
										>
											<LayoutTemplate className="mb-2 h-6 w-6" />
											<span className="text-xs">Individual</span>
										</Label>
									</div>
									<div>
										<RadioGroupItem value="dual" id="dual" className="peer sr-only" />
										<Label
											htmlFor="dual"
											className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
										>
											<LayoutList className="mb-2 h-6 w-6" />
											<span className="text-xs">Dual</span>
										</Label>
									</div>
									<div>
										<RadioGroupItem value="grid" id="grid" className="peer sr-only" />
										<Label
											htmlFor="grid"
											className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
										>
											<LayoutGrid className="mb-2 h-6 w-6" />
											<span className="text-xs">Grid</span>
										</Label>
									</div>
								</RadioGroup>

								<div className="space-y-2">
									<Label htmlFor="layout" className="text-[10px] font-medium">
										Tipo de Layout
									</Label>
									<Select
										id="layout"
										value={options.imageGrid?.layout || 'grid'}
										onValueChange={(value) => handleImageGridChange('layout', value)}
										disabled={disabled}
									>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona un layout" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="single">Single</SelectItem>
											<SelectItem value="dual">Dual</SelectItem>
											<SelectItem value="grid">Grid</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="gap" className="text-[10px] font-medium">
										Espaciado
									</Label>
									<Slider
										id="gap"
										value={[options.imageGrid?.gap || 4]}
										onValueChange={([value]) => handleImageGridChange('gap', value)}
										min={0}
										max={20}
										step={1}
										disabled={disabled}
									/>
								</div>
							</div>
						</div>
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
