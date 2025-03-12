'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Grid, ImageIcon, Info } from 'lucide-react';
import type { CardOptions, CardSettingsProps, ImageGridLayout } from './card-settings-types';

export function ImageGridSettings({ cardOptions, onCardOptionsChange }: CardSettingsProps) {
	// Manejador para cambios en opciones individuales
	const handleOptionChange = (key: keyof CardOptions, value: unknown) => {
		onCardOptionsChange({
			...cardOptions,
			[key]: value,
		});
	};

	// Valores por defecto para grid layout
	const imageGridLayout = cardOptions.imageGridLayout || 'single';
	const imageGridGap = cardOptions.imageGridGap || 4;
	const imageGridStyle = cardOptions.imageGridStyle || 'standard';
	const showImageCount = cardOptions.showImageCount ?? true;

	return (
		<Card>
			<CardHeader className="p-3 pb-2">
				<CardTitle className="text-sm font-medium flex items-center gap-2">
					<Grid className="h-4 w-4 text-primary" />
					<span>Configuración de Grid de Imágenes</span>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
							</TooltipTrigger>
							<TooltipContent side="top" className="text-xs max-w-xs">
								Personaliza cómo se muestran las imágenes en las tarjetas.
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</CardTitle>
			</CardHeader>

			<CardContent className="p-3 pt-1 space-y-4">
				<div className="space-y-3">
					<div className="grid gap-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="imageGridLayout" className="text-xs">
								Layout de Imágenes
							</Label>
							<Select value={imageGridLayout} onValueChange={(value) => handleOptionChange('imageGridLayout', value)}>
								<SelectTrigger id="imageGridLayout" className="h-7 text-xs w-[180px]">
									<SelectValue placeholder="Selecciona layout" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="single">Una imagen</SelectItem>
									<SelectItem value="dual">Dos imágenes</SelectItem>
									<SelectItem value="quad">Cuatro imágenes</SelectItem>
									<SelectItem value="six">Seis imágenes</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid gap-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="imageGridStyle" className="text-xs">
								Estilo de Grid
							</Label>
							<Select value={imageGridStyle} onValueChange={(value) => handleOptionChange('imageGridStyle', value)}>
								<SelectTrigger id="imageGridStyle" className="h-7 text-xs w-[180px]">
									<SelectValue placeholder="Estilo de grid" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="standard">Estándar</SelectItem>
									<SelectItem value="masonry">Mosaico</SelectItem>
									<SelectItem value="carousel">Carrusel</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid gap-2">
						<div className="flex items-center justify-between">
							<Label className="text-xs">Espacio entre imágenes</Label>
							<span className="text-xs text-muted-foreground">{imageGridGap}px</span>
						</div>
						<Slider
							id="imageGridGap"
							min={0}
							max={16}
							step={1}
							value={[imageGridGap]}
							onValueChange={([value]) => handleOptionChange('imageGridGap', value)}
						/>
					</div>

					<Separator className="my-2" />

					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<Label htmlFor="showImageCount" className="text-xs cursor-pointer">
								Mostrar contador de imágenes
							</Label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
									</TooltipTrigger>
									<TooltipContent side="top" className="text-xs">
										Muestra el número total de imágenes en la tarjeta
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
						<Switch
							id="showImageCount"
							checked={showImageCount}
							onCheckedChange={(checked) => handleOptionChange('showImageCount', checked)}
						/>
					</div>

					<div className="mt-4 p-3 bg-muted/40 rounded-md">
						<div className="grid grid-cols-2 gap-2">
							{imageGridLayout === 'single' && (
								<div className="col-span-2 aspect-square bg-muted/70 rounded-md flex items-center justify-center">
									<ImageIcon className="h-6 w-6 text-muted-foreground/50" />
								</div>
							)}

							{imageGridLayout === 'dual' && (
								<>
									<div className="aspect-square bg-muted/70 rounded-md flex items-center justify-center">
										<ImageIcon className="h-4 w-4 text-muted-foreground/50" />
									</div>
									<div className="aspect-square bg-muted/70 rounded-md flex items-center justify-center">
										<ImageIcon className="h-4 w-4 text-muted-foreground/50" />
									</div>
								</>
							)}

							{imageGridLayout === 'quad' && (
								<>
									<div className="aspect-square bg-muted/70 rounded-md flex items-center justify-center">
										<ImageIcon className="h-3 w-3 text-muted-foreground/50" />
									</div>
									<div className="aspect-square bg-muted/70 rounded-md flex items-center justify-center">
										<ImageIcon className="h-3 w-3 text-muted-foreground/50" />
									</div>
									<div className="aspect-square bg-muted/70 rounded-md flex items-center justify-center">
										<ImageIcon className="h-3 w-3 text-muted-foreground/50" />
									</div>
									<div className="aspect-square bg-muted/70 rounded-md flex items-center justify-center">
										<ImageIcon className="h-3 w-3 text-muted-foreground/50" />
									</div>
								</>
							)}

							{imageGridLayout === 'six' && (
								<>
									<div className="aspect-square bg-muted/70 rounded-md flex items-center justify-center">
										<ImageIcon className="h-3 w-3 text-muted-foreground/50" />
									</div>
									<div className="aspect-square bg-muted/70 rounded-md flex items-center justify-center">
										<ImageIcon className="h-3 w-3 text-muted-foreground/50" />
									</div>
									<div className="aspect-square bg-muted/70 rounded-md flex items-center justify-center">
										<ImageIcon className="h-3 w-3 text-muted-foreground/50" />
									</div>
									<div className="aspect-square bg-muted/70 rounded-md flex items-center justify-center">
										<ImageIcon className="h-3 w-3 text-muted-foreground/50" />
									</div>
									<div className="aspect-square bg-muted/70 rounded-md flex items-center justify-center">
										<ImageIcon className="h-3 w-3 text-muted-foreground/50" />
									</div>
									<div className="aspect-square bg-muted/70 rounded-md flex items-center justify-center">
										<ImageIcon className="h-3 w-3 text-muted-foreground/50" />
									</div>
								</>
							)}

							{showImageCount && (
								<div className="col-span-2 mt-2 bg-background/50 rounded-md p-1 text-center">
									<span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
										<ImageIcon className="h-3 w-3" />
										{imageGridLayout === 'single'
											? '1'
											: imageGridLayout === 'dual'
												? '2'
												: imageGridLayout === 'quad'
													? '4'
													: '6'}{' '}
										imágenes
									</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
