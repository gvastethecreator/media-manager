'use client';

import { ColorPicker } from '@/components/features/entity-cards/settings-old/panels/shared/color-picker';
import type { CardOptions } from '@/components/features/entity-cards/types/card-settings-types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { BookOpenText, LayoutGrid, PaintBucket, Ruler } from 'lucide-react';
import { useState } from 'react';

interface CardConfigManagerProps {
	options: CardOptions;
	onOptionsChange: (options: Partial<CardOptions>) => void;
}

/**
 * Componente que gestiona la configuración general de diseño de una tarjeta
 * 📦 Incluye: colores, dimensiones, bordes, estilos generales
 */
export function CardConfigManager({ options, onOptionsChange }: CardConfigManagerProps) {
	const [expanded, setExpanded] = useState<string[]>(['colors']);

	// Usamos Record<string, string> para definir el tipo de colors
	const handleColorChange = (colorKey: string, value: string) => {
		onOptionsChange({
			colors: {
				...(options.colors as Record<string, string>),
				[colorKey]: value,
			},
		});
	};

	const handleSizeChange = (size: number[]) => {
		onOptionsChange({
			size: size[0],
		});
	};

	const handleBorderRadiusChange = (radius: number[]) => {
		onOptionsChange({
			borderRadius: radius[0],
		});
	};

	const handleShadowIntensityChange = (intensity: number[]) => {
		onOptionsChange({
			shadowIntensity: intensity[0],
		});
	};

	const handleOptionToggle = (key: string, value: boolean) => {
		onOptionsChange({
			[key]: value,
		});
	};

	// Usar Record<string, unknown> para acceder a propiedades que no existen en CardOptions
	const optionsExtended = options as Record<string, unknown>;

	return (
		<Accordion type="multiple" value={expanded} onValueChange={setExpanded} className="space-y-2">
			{/* Sección de colores */}
			<AccordionItem value="colors" className="border rounded-md">
				<AccordionTrigger className="px-3 py-2 text-xs font-medium flex items-center">
					<div className="flex items-center gap-1.5">
						<PaintBucket className="h-3.5 w-3.5 text-emerald-500" />
						<span>Colores</span>
					</div>
				</AccordionTrigger>
				<AccordionContent className="px-3 pb-3 pt-1 space-y-3">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="text-xs">Fondo</Label>
							<ColorPicker
								color={(options.colors as Record<string, string>)?.background || '#ffffff'}
								onChange={(color) => handleColorChange('background', color)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs">Texto</Label>
							<ColorPicker
								color={(options.colors as Record<string, string>)?.text || '#000000'}
								onChange={(color) => handleColorChange('text', color)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs">Borde</Label>
							<ColorPicker
								color={(options.colors as Record<string, string>)?.border || '#e2e8f0'}
								onChange={(color) => handleColorChange('border', color)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs">Acento</Label>
							<ColorPicker
								color={(options.colors as Record<string, string>)?.accent || '#3b82f6'}
								onChange={(color) => handleColorChange('accent', color)}
							/>
						</div>
					</div>
				</AccordionContent>
			</AccordionItem>

			{/* Sección de dimensiones */}
			<AccordionItem value="dimensions" className="border rounded-md">
				<AccordionTrigger className="px-3 py-2 text-xs font-medium">
					<div className="flex items-center gap-1.5">
						<Ruler className="h-3.5 w-3.5 text-blue-500" />
						<span>Dimensiones</span>
					</div>
				</AccordionTrigger>
				<AccordionContent className="px-3 pb-3 pt-1 space-y-3">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label className="text-xs">Tamaño</Label>
							<span className="text-xs text-muted-foreground">{Number(optionsExtended.size || 100)}%</span>
						</div>
						<Slider
							value={[Number(optionsExtended.size || 100)]}
							min={50}
							max={150}
							step={5}
							onValueChange={handleSizeChange}
							className={cn('w-full')}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label className="text-xs">Radio de bordes</Label>
							<span className="text-xs text-muted-foreground">{Number(optionsExtended.borderRadius || 8)}px</span>
						</div>
						<Slider
							value={[Number(optionsExtended.borderRadius || 8)]}
							min={0}
							max={32}
							step={1}
							onValueChange={handleBorderRadiusChange}
							className={cn('w-full')}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label className="text-xs">Intensidad de sombra</Label>
							<span className="text-xs text-muted-foreground">{Number(optionsExtended.shadowIntensity || 50)}%</span>
						</div>
						<Slider
							value={[Number(optionsExtended.shadowIntensity || 50)]}
							min={0}
							max={100}
							step={5}
							onValueChange={handleShadowIntensityChange}
							className={cn('w-full')}
						/>
					</div>
				</AccordionContent>
			</AccordionItem>

			{/* Sección de estilo */}
			<AccordionItem value="style" className="border rounded-md">
				<AccordionTrigger className="px-3 py-2 text-xs font-medium">
					<div className="flex items-center gap-1.5">
						<LayoutGrid className="h-3.5 w-3.5 text-purple-500" />
						<span>Estilo</span>
					</div>
				</AccordionTrigger>
				<AccordionContent className="px-3 pb-3 pt-1 space-y-3">
					<div className="space-y-2.5">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-xs">Borde visible</Label>
								<p className="text-[10px] text-muted-foreground">Mostrar borde alrededor de la tarjeta</p>
							</div>
							<Switch
								checked={Boolean(optionsExtended.showBorder) || false}
								onCheckedChange={(checked) => handleOptionToggle('showBorder', checked)}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-xs">Gradiente de fondo</Label>
								<p className="text-[10px] text-muted-foreground">Aplicar efecto de gradiente sutil</p>
							</div>
							<Switch
								checked={Boolean(optionsExtended.enableGradient) || false}
								onCheckedChange={(checked) => handleOptionToggle('enableGradient', checked)}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-xs">Sombra</Label>
								<p className="text-[10px] text-muted-foreground">Mostrar sombra para efecto de elevación</p>
							</div>
							<Switch
								checked={Boolean(optionsExtended.showShadow) || false}
								onCheckedChange={(checked) => handleOptionToggle('showShadow', checked)}
							/>
						</div>
					</div>
				</AccordionContent>
			</AccordionItem>

			{/* Sección de contenido */}
			<AccordionItem value="content" className="border rounded-md">
				<AccordionTrigger className="px-3 py-2 text-xs font-medium">
					<div className="flex items-center gap-1.5">
						<BookOpenText className="h-3.5 w-3.5 text-amber-500" />
						<span>Contenido</span>
					</div>
				</AccordionTrigger>
				<AccordionContent className="px-3 pb-3 pt-1 space-y-3">
					<div className="space-y-2.5">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-xs">Mostrar título</Label>
								<p className="text-[10px] text-muted-foreground">Visualizar el título de la entidad</p>
							</div>
							<Switch
								checked={options.showTitle || false}
								onCheckedChange={(checked) => handleOptionToggle('showTitle', checked)}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-xs">Mostrar descripción</Label>
								<p className="text-[10px] text-muted-foreground">Incluir descripción si está disponible</p>
							</div>
							<Switch
								checked={options.showDescription || false}
								onCheckedChange={(checked) => handleOptionToggle('showDescription', checked)}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-xs">Mostrar metadatos</Label>
								<p className="text-[10px] text-muted-foreground">Incluir información adicional</p>
							</div>
							<Switch
								checked={Boolean(optionsExtended.showMetadata) || false}
								onCheckedChange={(checked) => handleOptionToggle('showMetadata', checked)}
							/>
						</div>
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
