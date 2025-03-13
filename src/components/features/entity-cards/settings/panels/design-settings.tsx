'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
	BorderAll,
	Brush,
	ImageIcon,
	Layers,
	LayoutTemplateIcon,
	Palette,
	SparklesIcon,
	TextCursorInput,
	Type,
} from 'lucide-react';
import type { CardOptions } from '../types';
import { SliderOption, ToggleOption, createNestedOptionChangeHandler, panelColors } from './shared/panel-helpers';

type DesignSystemKey = keyof NonNullable<CardOptions['designSystem']>;
type DesignSystemValue = string | number;

export function DesignSettings({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Handler para cambios en las opciones
	const handleChange = (key: keyof CardOptions, value: unknown) => {
		onChange({
			...options,
			[key]: value,
		});
	};

	// Manejador para cambios en el sistema de diseño
	const handleDesignSystemChange = (key: DesignSystemKey, value: DesignSystemValue) => {
		onChange({
			...options,
			designSystem: {
				...options.designSystem,
				[key]: value,
			},
		});
	};

	return (
		<Card className={cn('w-full', panelColors.design.bg, panelColors.design.border)}>
			<CardHeader className="pb-3">
				<CardTitle className="text-[11px] font-medium">Diseño y Colores</CardTitle>
				<CardDescription className="text-[10px] text-muted-foreground">
					Personaliza el aspecto visual de las tarjetas
				</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<ScrollArea className="h-[300px] pr-4">
					<div className="space-y-5">
						{/* Diseño */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<Palette className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-[10px] font-medium">Diseño</h3>
							</div>
							<div className="space-y-3 pl-5">
								<div className="space-y-2">
									<Label htmlFor="preset" className="text-[10px] font-medium">
										Preset de Diseño
									</Label>
									<Select
										id="preset"
										value={options.designSystem?.preset || 'default'}
										onValueChange={(value) => handleDesignSystemChange('preset', value)}
										disabled={disabled}
									>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona un preset" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="default">Por defecto</SelectItem>
											<SelectItem value="modern">Moderno</SelectItem>
											<SelectItem value="classic">Clásico</SelectItem>
											<SelectItem value="minimal">Minimalista</SelectItem>
											<SelectItem value="elegant">Elegante</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="cornerStyle" className="text-[10px] font-medium">
										Estilo de Esquinas
									</Label>
									<Select
										id="cornerStyle"
										value={options.designSystem?.cornerStyle || 'rounded'}
										onValueChange={(value) => handleDesignSystemChange('cornerStyle', value)}
										disabled={disabled}
									>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona un estilo" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="rounded">Redondeadas</SelectItem>
											<SelectItem value="sharp">Afiladas</SelectItem>
											<SelectItem value="beveled">Biseladas</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="cornerRadius" className="text-[10px] font-medium">
										Radio de Esquinas
									</Label>
									<Slider
										id="cornerRadius"
										value={[options.designSystem?.cornerRadius || 8]}
										onValueChange={([value]) => handleDesignSystemChange('cornerRadius', value)}
										min={0}
										max={20}
										step={1}
										disabled={disabled}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="shadowStyle" className="text-[10px] font-medium">
										Estilo de Sombra
									</Label>
									<Select
										id="shadowStyle"
										value={options.designSystem?.shadowStyle || 'soft'}
										onValueChange={(value) => handleDesignSystemChange('shadowStyle', value)}
										disabled={disabled}
									>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona un estilo" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="soft">Suave</SelectItem>
											<SelectItem value="hard">Dura</SelectItem>
											<SelectItem value="layered">En capas</SelectItem>
											<SelectItem value="none">Ninguna</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="elevation" className="text-[10px] font-medium">
										Elevación
									</Label>
									<Slider
										id="elevation"
										value={[options.designSystem?.elevation || 1]}
										onValueChange={([value]) => handleDesignSystemChange('elevation', value)}
										min={0}
										max={5}
										step={1}
										disabled={disabled}
									/>
								</div>
							</div>
						</div>

						<Separator />

						{/* Grid de Imágenes */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Grid de Imágenes</h3>
							</div>
							<div className="space-y-3 pl-5">
								<div className="space-y-1.5">
									<label htmlFor="imageGridLayout" className="text-[11px] flex items-center gap-1.5">
										Layout
									</label>
									<Select
										value={options.imageGridLayout || 'single'}
										onValueChange={(value) => handleChange('imageGridLayout', value)}
										disabled={disabled}
									>
										<SelectTrigger id="imageGridLayout" className="h-8">
											<SelectValue placeholder="Selecciona un layout" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="single">Una imagen</SelectItem>
											<SelectItem value="dual">Dos imágenes</SelectItem>
											<SelectItem value="quad">Cuatro imágenes</SelectItem>
											<SelectItem value="six">Seis imágenes</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-1.5">
									<label htmlFor="imageGridStyle" className="text-[11px] flex items-center gap-1.5">
										Estilo de Grid
									</label>
									<Select
										value={options.imageGridStyle || 'standard'}
										onValueChange={(value) => handleChange('imageGridStyle', value)}
										disabled={disabled}
									>
										<SelectTrigger id="imageGridStyle" className="h-8">
											<SelectValue placeholder="Selecciona un estilo" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="standard">Estándar</SelectItem>
											<SelectItem value="masonry">Masonry</SelectItem>
											<SelectItem value="carousel">Carrusel</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<SliderOption
									id="imageGridGap"
									label="Espacio entre imágenes"
									description="Ajusta el espacio entre las imágenes del grid"
									value={options.imageGridGap ?? 4}
									onValueChange={(value) => handleChange('imageGridGap', value)}
									min={0}
									max={16}
									step={1}
									disabled={disabled}
								/>

								<ToggleOption
									id="showImageCount"
									label="Mostrar contador de imágenes"
									description="Muestra el número total de imágenes en la tarjeta"
									checked={options.showImageCount ?? false}
									onCheckedChange={(checked) => handleChange('showImageCount', checked)}
									disabled={disabled}
								/>
							</div>
						</div>

						<Separator />

						{/* Efectos Visuales */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<SparklesIcon className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-[10px] font-medium">Efectos Visuales</h3>
							</div>
							<div className="space-y-3 pl-5">
								<ToggleOption
									id="enable3DEffect"
									label="Efecto 3D"
									description="Añade un efecto de profundidad a la tarjeta"
									checked={options.enable3DEffect ?? false}
									onCheckedChange={(checked) => handleChange('enable3DEffect', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="enableHolographicEffect"
									label="Efecto Holográfico"
									description="Añade un efecto holográfico a la tarjeta"
									checked={options.enableHolographicEffect ?? false}
									onCheckedChange={(checked) => handleChange('enableHolographicEffect', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="enableGlow"
									label="Efecto de Brillo"
									description="Añade un efecto de brillo a la tarjeta"
									checked={options.enableGlow ?? false}
									onCheckedChange={(checked) => handleChange('enableGlow', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="enableScanlines"
									label="Efecto de Líneas de Escaneo"
									description="Añade un efecto de líneas de escaneo a la tarjeta"
									checked={options.enableScanlines ?? false}
									onCheckedChange={(checked) => handleChange('enableScanlines', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="enableGrainEffect"
									label="Efecto de Grano"
									description="Añade un efecto de grano a la tarjeta"
									checked={options.enableGrainEffect ?? false}
									onCheckedChange={(checked) => handleChange('enableGrainEffect', checked)}
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
