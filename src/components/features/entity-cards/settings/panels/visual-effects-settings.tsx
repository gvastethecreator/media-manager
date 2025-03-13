'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Contrast, Droplets, Eye, Palette, Sparkles } from 'lucide-react';
import type { CardOptions } from '../types';
import { SliderOption, ToggleOption, createNestedOptionChangeHandler, panelColors } from './shared/panel-helpers';

export function VisualEffectsSettings({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Handler para cambios en las opciones de efectos visuales
	const handleVisualEffectsChange = (key: keyof NonNullable<CardOptions['visualEffects']>, value: unknown) => {
		onChange({
			...options,
			visualEffects: {
				...options.visualEffects,
				[key]: value,
			},
		});
	};

	return (
		<Card className={cn('w-full', panelColors.visual.bg, panelColors.visual.border)}>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-medium">Efectos Visuales</CardTitle>
				<CardDescription className="text-xs text-muted-foreground">
					Configura filtros y efectos visuales básicos para las tarjetas
				</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<ScrollArea className="h-[300px] pr-4">
					<div className="space-y-5">
						{/* Filtros de imagen */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<Contrast className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Ajustes de Imagen</h3>
							</div>
							<div className="space-y-3 pl-5">
								<SliderOption
									id="brightness"
									label="Brillo"
									description="Ajusta el brillo de la imagen"
									value={options.visualEffects?.brightness ?? 100}
									onValueChange={(value) => handleVisualEffectsChange('brightness', value)}
									min={0}
									max={200}
									step={1}
									unit="%"
									disabled={disabled}
								/>

								<SliderOption
									id="contrast"
									label="Contraste"
									description="Ajusta el contraste de la imagen"
									value={options.visualEffects?.contrast ?? 100}
									onValueChange={(value) => handleVisualEffectsChange('contrast', value)}
									min={0}
									max={200}
									step={1}
									unit="%"
									disabled={disabled}
								/>

								<SliderOption
									id="saturate"
									label="Saturación"
									description="Ajusta la saturación de los colores"
									value={options.visualEffects?.saturate ?? 100}
									onValueChange={(value) => handleVisualEffectsChange('saturate', value)}
									min={0}
									max={200}
									step={1}
									unit="%"
									disabled={disabled}
								/>

								<SliderOption
									id="hueRotate"
									label="Rotación de Tono"
									description="Rota los colores de la imagen"
									value={options.visualEffects?.hueRotate ?? 0}
									onValueChange={(value) => handleVisualEffectsChange('hueRotate', value)}
									min={0}
									max={360}
									step={1}
									unit="°"
									disabled={disabled}
								/>
							</div>
						</div>

						<Separator />

						{/* Filtros de estilo */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<Palette className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Filtros de Estilo</h3>
							</div>
							<div className="space-y-3 pl-5">
								<SliderOption
									id="grayscale"
									label="Escala de Grises"
									description="Convierte la imagen a escala de grises"
									value={options.visualEffects?.grayscale ?? 0}
									onValueChange={(value) => handleVisualEffectsChange('grayscale', value)}
									min={0}
									max={100}
									step={1}
									unit="%"
									disabled={disabled}
								/>

								<SliderOption
									id="sepia"
									label="Sepia"
									description="Añade un tono sepia a la imagen"
									value={options.visualEffects?.sepia ?? 0}
									onValueChange={(value) => handleVisualEffectsChange('sepia', value)}
									min={0}
									max={100}
									step={1}
									unit="%"
									disabled={disabled}
								/>

								<SliderOption
									id="invert"
									label="Invertir"
									description="Invierte los colores de la imagen"
									value={options.visualEffects?.invert ?? 0}
									onValueChange={(value) => handleVisualEffectsChange('invert', value)}
									min={0}
									max={100}
									step={1}
									unit="%"
									disabled={disabled}
								/>

								<SliderOption
									id="opacity"
									label="Opacidad"
									description="Ajusta la transparencia de la imagen"
									value={options.visualEffects?.opacity ?? 100}
									onValueChange={(value) => handleVisualEffectsChange('opacity', value)}
									min={0}
									max={100}
									step={1}
									unit="%"
									disabled={disabled}
								/>
							</div>
						</div>

						<Separator />

						{/* Efectos de desenfoque */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<Droplets className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Efectos de Desenfoque</h3>
							</div>
							<div className="space-y-3 pl-5">
								<SliderOption
									id="blur"
									label="Desenfoque"
									description="Aplica un desenfoque a la imagen"
									value={options.visualEffects?.blur ?? 0}
									onValueChange={(value) => handleVisualEffectsChange('blur', value)}
									min={0}
									max={20}
									step={0.1}
									unit="px"
									disabled={disabled}
								/>

								<ToggleOption
									id="dropShadow"
									label="Sombra"
									description="Añade una sombra a la imagen"
									checked={options.visualEffects?.dropShadow ?? false}
									onCheckedChange={(checked) => handleVisualEffectsChange('dropShadow', checked)}
									disabled={disabled}
								/>
							</div>
						</div>

						<Separator />

						{/* Efectos de backdrop */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Efectos de Fondo</h3>
							</div>
							<div className="space-y-3 pl-5">
								<SliderOption
									id="backdropBlur"
									label="Desenfoque de Fondo"
									description="Aplica un desenfoque al fondo detrás de la tarjeta"
									value={options.visualEffects?.backdropBlur ?? 0}
									onValueChange={(value) => handleVisualEffectsChange('backdropBlur', value)}
									min={0}
									max={20}
									step={0.1}
									unit="px"
									disabled={disabled}
								/>

								<SliderOption
									id="backdropBrightness"
									label="Brillo de Fondo"
									description="Ajusta el brillo del fondo detrás de la tarjeta"
									value={options.visualEffects?.backdropBrightness ?? 100}
									onValueChange={(value) => handleVisualEffectsChange('backdropBrightness', value)}
									min={0}
									max={200}
									step={1}
									unit="%"
									disabled={disabled}
								/>

								<SliderOption
									id="backdropSaturate"
									label="Saturación de Fondo"
									description="Ajusta la saturación del fondo detrás de la tarjeta"
									value={options.visualEffects?.backdropSaturate ?? 100}
									onValueChange={(value) => handleVisualEffectsChange('backdropSaturate', value)}
									min={0}
									max={200}
									step={1}
									unit="%"
									disabled={disabled}
								/>

								<SliderOption
									id="backdropOpacity"
									label="Opacidad de Fondo"
									description="Ajusta la transparencia del fondo detrás de la tarjeta"
									value={options.visualEffects?.backdropOpacity ?? 100}
									onValueChange={(value) => handleVisualEffectsChange('backdropOpacity', value)}
									min={0}
									max={100}
									step={1}
									unit="%"
									disabled={disabled}
								/>
							</div>
						</div>
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
