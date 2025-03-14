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

// 🎨 Esquema de colores para el panel
const panelColors = {
	images: {
		bg: 'bg-blue-500/5',
		border: 'border-blue-500/20',
		text: 'text-blue-600',
	},
};

interface ImageGridSettingsProps {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}

type ImageGridKey = keyof NonNullable<CardOptions['imageGrid']>;
type ImageGridValue = NonNullable<CardOptions['imageGrid']>[ImageGridKey];

/**
 * Panel de configuración para el grid de imágenes
 * @component
 */
export function ImageGridPanel({ options, onChange, disabled = false }: ImageGridSettingsProps) {
	// 🖼️ Manejador para cambios en las propiedades del grid de imágenes
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
				<CardTitle className="text-[11px] font-medium flex items-center gap-2">
					<LayoutGrid className="h-4 w-4" />
					Grid de Imágenes
				</CardTitle>
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
								<Label className="text-xs font-medium">Tipo de Layout</Label>
							</div>
							<RadioGroup
								defaultValue={options.imageGrid?.layout || 'single'}
								className="grid grid-cols-2 gap-2"
								onValueChange={(value) => handleImageGridChange('layout', value)}
								disabled={disabled}
							>
								<div>
									<RadioGroupItem value="single" id="single" className="peer sr-only" disabled={disabled} />
									<Label
										htmlFor="single"
										className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
									>
										<ImageIcon className="mb-1 h-4 w-4" />
										<span className="text-xs">Única</span>
									</Label>
								</div>
								<div>
									<RadioGroupItem value="dual" id="dual" className="peer sr-only" disabled={disabled} />
									<Label
										htmlFor="dual"
										className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
									>
										<Rows className="mb-1 h-4 w-4" />
										<span className="text-xs">Dual</span>
									</Label>
								</div>
								<div>
									<RadioGroupItem value="grid" id="grid" className="peer sr-only" disabled={disabled} />
									<Label
										htmlFor="grid"
										className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
									>
										<Grid2X2 className="mb-1 h-4 w-4" />
										<span className="text-xs">Cuadrícula</span>
									</Label>
								</div>
								<div>
									<RadioGroupItem value="masonry" id="masonry" className="peer sr-only" disabled={disabled} />
									<Label
										htmlFor="masonry"
										className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
									>
										<LayoutTemplate className="mb-1 h-4 w-4" />
										<span className="text-xs">Mosaico</span>
									</Label>
								</div>
							</RadioGroup>
						</div>

						{/* Configuración específica para grid */}
						{options.imageGrid?.layout === 'grid' && (
							<>
								<div className="space-y-3">
									<Label className="text-xs font-medium">Columnas</Label>
									<Slider
										defaultValue={[options.imageGrid?.columns || 2]}
										min={1}
										max={4}
										step={1}
										onValueChange={([value]) => handleImageGridChange('columns', value)}
										disabled={disabled}
									/>
									<div className="flex justify-between text-[10px] text-muted-foreground">
										<span>1</span>
										<span>2</span>
										<span>3</span>
										<span>4</span>
									</div>
								</div>

								<div className="space-y-3">
									<Label className="text-xs font-medium">Filas</Label>
									<Slider
										defaultValue={[options.imageGrid?.rows || 2]}
										min={1}
										max={4}
										step={1}
										onValueChange={([value]) => handleImageGridChange('rows', value)}
										disabled={disabled}
									/>
									<div className="flex justify-between text-[10px] text-muted-foreground">
										<span>1</span>
										<span>2</span>
										<span>3</span>
										<span>4</span>
									</div>
								</div>
							</>
						)}

						{/* Espaciado */}
						<div className="space-y-3">
							<Label className="text-xs font-medium">Espaciado</Label>
							<Slider
								defaultValue={[options.imageGrid?.gap || 4]}
								min={0}
								max={16}
								step={1}
								onValueChange={([value]) => handleImageGridChange('gap', value)}
								disabled={disabled}
							/>
							<div className="flex justify-between text-[10px] text-muted-foreground">
								<span>0px</span>
								<span>8px</span>
								<span>16px</span>
							</div>
						</div>
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
