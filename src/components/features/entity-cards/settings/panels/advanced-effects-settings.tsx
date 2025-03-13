'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { HolographicRainbow, Paintbrush, Sand, ScanLine, Wallpaper, Wand2 } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type { CardOptions } from '../types';
import { SliderOption, ToggleOption, createNestedOptionChangeHandler, panelColors } from './shared/panel-helpers';

export function AdvancedEffectsSettings({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Extraer opciones de efectos avanzados o inicializar un objeto vacío si no existe
	const advancedEffects = options.advancedEffects || {};

	// Handler para cambios en las opciones de efectos avanzados
	const handleAdvancedEffectsChange = createNestedOptionChangeHandler(options, onChange, 'advancedEffects');

	// Manejador genérico para cambios en valores booleanos
	const handleToggleChange = (key: string) => (checked: boolean) => {
		handleAdvancedEffectsChange(key, checked);
	};

	// Manejador genérico para cambios en valores numéricos
	const handleSliderChange = (key: string) => (value: number) => {
		handleAdvancedEffectsChange(key, value);
	};

	// Manejador para cambios en valores de color
	const handleColorChange = (key: string) => (e: ChangeEvent<HTMLInputElement>) => {
		handleAdvancedEffectsChange(key, e.target.value);
	};

	return (
		<Card className={cn('w-full', panelColors.advanced.bg, panelColors.advanced.border)}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium">Efectos Avanzados</CardTitle>
					<Badge variant="outline" className={cn('text-[10px]', panelColors.advanced.text)}>
						Premium
					</Badge>
				</div>
				<CardDescription className="text-xs text-muted-foreground">
					Configura efectos visuales avanzados para tus tarjetas
				</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<ScrollArea className="h-[300px] pr-4">
					<div className="space-y-5">
						{/* Efectos de Escaneo */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<ScanLine className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Efectos de Escaneo</h3>
							</div>
							<div className="space-y-3 pl-5">
								<ToggleOption
									id="scanlines"
									label="Líneas de Escaneo"
									description="Añade un efecto de líneas de escaneo retro a la tarjeta"
									checked={advancedEffects.scanlines ?? false}
									onCheckedChange={handleToggleChange('scanlines')}
									disabled={disabled}
								/>

								{advancedEffects.scanlines && (
									<>
										<SliderOption
											id="scanlinesDensity"
											label="Densidad"
											description="Controla la densidad de las líneas de escaneo"
											value={advancedEffects.scanlinesDensity ?? 2}
											onValueChange={handleSliderChange('scanlinesDensity')}
											min={1}
											max={10}
											step={0.1}
											disabled={disabled}
										/>

										<SliderOption
											id="scanlinesOpacity"
											label="Opacidad"
											description="Controla la opacidad de las líneas de escaneo"
											value={advancedEffects.scanlinesOpacity ?? 0.3}
											onValueChange={handleSliderChange('scanlinesOpacity')}
											min={0}
											max={1}
											step={0.01}
											disabled={disabled}
										/>
									</>
								)}
							</div>
						</div>

						<Separator />

						{/* Efectos de Textura */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<Wallpaper className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Efectos de Textura</h3>
							</div>
							<div className="space-y-3 pl-5">
								<ToggleOption
									id="grain"
									label="Grano"
									description="Añade un efecto de grano de película a la tarjeta"
									checked={advancedEffects.grain ?? false}
									onCheckedChange={handleToggleChange('grain')}
									disabled={disabled}
								/>

								{advancedEffects.grain && (
									<>
										<SliderOption
											id="grainDensity"
											label="Densidad"
											description="Controla la densidad del grano"
											value={advancedEffects.grainDensity ?? 30}
											onValueChange={handleSliderChange('grainDensity')}
											min={1}
											max={100}
											disabled={disabled}
										/>

										<SliderOption
											id="grainOpacity"
											label="Opacidad"
											description="Controla la opacidad del grano"
											value={advancedEffects.grainOpacity ?? 0.2}
											onValueChange={handleSliderChange('grainOpacity')}
											min={0}
											max={1}
											step={0.01}
											disabled={disabled}
										/>
									</>
								)}

								<ToggleOption
									id="noiseTexture"
									label="Textura de Ruido"
									description="Añade una textura de ruido sutil a la tarjeta"
									checked={advancedEffects.noiseTexture ?? false}
									onCheckedChange={handleToggleChange('noiseTexture')}
									disabled={disabled}
								/>

								{advancedEffects.noiseTexture && (
									<>
										<SliderOption
											id="noiseTextureDensity"
											label="Densidad"
											description="Controla la densidad de la textura de ruido"
											value={advancedEffects.noiseTextureDensity ?? 40}
											onValueChange={handleSliderChange('noiseTextureDensity')}
											min={1}
											max={100}
											disabled={disabled}
										/>

										<SliderOption
											id="noiseTextureOpacity"
											label="Opacidad"
											description="Controla la opacidad de la textura de ruido"
											value={advancedEffects.noiseTextureOpacity ?? 0.15}
											onValueChange={handleSliderChange('noiseTextureOpacity')}
											min={0}
											max={1}
											step={0.01}
											disabled={disabled}
										/>
									</>
								)}
							</div>
						</div>

						<Separator />

						{/* Efectos de Borde */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<Paintbrush className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Efectos de Borde</h3>
							</div>
							<div className="space-y-3 pl-5">
								<ToggleOption
									id="borderGlow"
									label="Resplandor de Borde"
									description="Añade un efecto de resplandor alrededor del borde de la tarjeta"
									checked={advancedEffects.borderGlow ?? false}
									onCheckedChange={handleToggleChange('borderGlow')}
									disabled={disabled}
								/>

								{advancedEffects.borderGlow && (
									<>
										<div className="flex items-center justify-between space-x-3">
											<label htmlFor="borderGlowColor" className="text-[11px] flex items-center gap-1.5">
												Color
											</label>
											<div className="flex items-center gap-2">
												<div
													className="h-4 w-4 rounded-full border"
													style={{
														backgroundColor: advancedEffects.borderGlowColor ?? '#3b82f6',
													}}
												/>
												<input
													id="borderGlowColor"
													type="color"
													value={advancedEffects.borderGlowColor ?? '#3b82f6'}
													onChange={handleColorChange('borderGlowColor')}
													className="h-6 w-6 cursor-pointer rounded-md p-0"
													disabled={disabled}
												/>
											</div>
										</div>

										<SliderOption
											id="borderGlowWidth"
											label="Ancho"
											description="Controla el ancho del resplandor del borde"
											value={advancedEffects.borderGlowWidth ?? 2}
											onValueChange={handleSliderChange('borderGlowWidth')}
											min={1}
											max={10}
											step={0.5}
											unit="px"
											disabled={disabled}
										/>

										<SliderOption
											id="borderGlowSpread"
											label="Expansión"
											description="Controla la expansión del resplandor del borde"
											value={advancedEffects.borderGlowSpread ?? 10}
											onValueChange={handleSliderChange('borderGlowSpread')}
											min={0}
											max={30}
											unit="px"
											disabled={disabled}
										/>

										<SliderOption
											id="borderGlowIntensity"
											label="Intensidad"
											description="Controla la intensidad del resplandor del borde"
											value={advancedEffects.borderGlowIntensity ?? 0.6}
											onValueChange={handleSliderChange('borderGlowIntensity')}
											min={0}
											max={1}
											step={0.01}
											disabled={disabled}
										/>
									</>
								)}
							</div>
						</div>

						<Separator />

						{/* Efectos Holográficos */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<HolographicRainbow className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Efectos Holográficos</h3>
							</div>
							<div className="space-y-3 pl-5">
								<ToggleOption
									id="holographicEffect"
									label="Efecto Holográfico"
									description="Añade un efecto holográfico que cambia con el movimiento"
									checked={advancedEffects.holographicEffect ?? false}
									onCheckedChange={handleToggleChange('holographicEffect')}
									disabled={disabled}
								/>

								{advancedEffects.holographicEffect && (
									<>
										<ToggleOption
											id="holographicRainbowMode"
											label="Modo Arcoíris"
											description="Activa el modo arcoíris para el efecto holográfico"
											checked={advancedEffects.holographicRainbowMode ?? false}
											onCheckedChange={handleToggleChange('holographicRainbowMode')}
											disabled={disabled}
										/>

										{!advancedEffects.holographicRainbowMode && (
											<div className="flex items-center justify-between space-x-3">
												<label htmlFor="holographicEffectColor" className="text-[11px] flex items-center gap-1.5">
													Color Base
												</label>
												<div className="flex items-center gap-2">
													<div
														className="h-4 w-4 rounded-full border"
														style={{
															backgroundColor: advancedEffects.holographicEffectColor ?? '#9333ea',
														}}
													/>
													<input
														id="holographicEffectColor"
														type="color"
														value={advancedEffects.holographicEffectColor ?? '#9333ea'}
														onChange={handleColorChange('holographicEffectColor')}
														className="h-6 w-6 cursor-pointer rounded-md p-0"
														disabled={disabled}
													/>
												</div>
											</div>
										)}

										<SliderOption
											id="holographicEffectIntensity"
											label="Intensidad"
											description="Controla la intensidad del efecto holográfico"
											value={advancedEffects.holographicEffectIntensity ?? 0.5}
											onValueChange={handleSliderChange('holographicEffectIntensity')}
											min={0}
											max={1}
											step={0.01}
											disabled={disabled}
										/>
									</>
								)}
							</div>
						</div>

						<Separator />

						{/* Efectos de Distorsión */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<Wand2 className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Efectos de Distorsión</h3>
							</div>
							<div className="space-y-3 pl-5">
								<ToggleOption
									id="chromaticAberration"
									label="Aberración Cromática"
									description="Añade un efecto de aberración cromática a la tarjeta"
									checked={advancedEffects.chromaticAberration ?? false}
									onCheckedChange={handleToggleChange('chromaticAberration')}
									disabled={disabled}
								/>

								{advancedEffects.chromaticAberration && (
									<>
										<SliderOption
											id="chromaticAberrationOffset"
											label="Desplazamiento"
											description="Controla el desplazamiento de la aberración cromática"
											value={advancedEffects.chromaticAberrationOffset ?? 2}
											onValueChange={handleSliderChange('chromaticAberrationOffset')}
											min={1}
											max={10}
											step={0.1}
											unit="px"
											disabled={disabled}
										/>

										<SliderOption
											id="chromaticAberrationIntensity"
											label="Intensidad"
											description="Controla la intensidad de la aberración cromática"
											value={advancedEffects.chromaticAberrationIntensity ?? 0.4}
											onValueChange={handleSliderChange('chromaticAberrationIntensity')}
											min={0}
											max={1}
											step={0.01}
											disabled={disabled}
										/>
									</>
								)}

								<ToggleOption
									id="glitchEffect"
									label="Efecto Glitch"
									description="Añade un efecto glitch digital aleatorio a la tarjeta"
									checked={advancedEffects.glitchEffect ?? false}
									onCheckedChange={handleToggleChange('glitchEffect')}
									disabled={disabled}
								/>

								{advancedEffects.glitchEffect && (
									<>
										<SliderOption
											id="glitchEffectIntensity"
											label="Intensidad"
											description="Controla la intensidad del efecto glitch"
											value={advancedEffects.glitchEffectIntensity ?? 0.3}
											onValueChange={handleSliderChange('glitchEffectIntensity')}
											min={0}
											max={1}
											step={0.01}
											disabled={disabled}
										/>

										<SliderOption
											id="glitchEffectFrequency"
											label="Frecuencia"
											description="Controla la frecuencia del efecto glitch"
											value={advancedEffects.glitchEffectFrequency ?? 0.2}
											onValueChange={handleSliderChange('glitchEffectFrequency')}
											min={0}
											max={1}
											step={0.01}
											disabled={disabled}
										/>
									</>
								)}

								<ToggleOption
									id="pixelate"
									label="Pixelado"
									description="Añade un efecto de pixelado a la tarjeta"
									checked={advancedEffects.pixelate ?? false}
									onCheckedChange={handleToggleChange('pixelate')}
									disabled={disabled}
								/>

								{advancedEffects.pixelate && (
									<SliderOption
										id="pixelateSize"
										label="Tamaño de Píxel"
										description="Controla el tamaño de los píxeles"
										value={advancedEffects.pixelateSize ?? 8}
										onValueChange={handleSliderChange('pixelateSize')}
										min={2}
										max={20}
										step={1}
										unit="px"
										disabled={disabled}
									/>
								)}
							</div>
						</div>

						<Separator />

						{/* Rendimiento */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<Sand className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Rendimiento</h3>
							</div>
							<div className="pl-5">
								<p className="text-[10px] text-muted-foreground mb-2">
									Activar múltiples efectos avanzados puede afectar al rendimiento en dispositivos de gama baja.
								</p>
							</div>
						</div>
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
