'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Eye, Grid2X2, Layers, MousePointer, Settings2, Sliders, Sparkles } from 'lucide-react';
import type { CardOptions } from '../../types/card-settings-types';

interface FolderSettingsProps {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}

export function FolderSettings({ options, onChange, disabled = false }: FolderSettingsProps) {
	// Función para actualizar opciones
	const updateOptions = (updates: Partial<CardOptions>) => {
		onChange({
			...options,
			...updates,
		});
	};

	return (
		<Card className="border-none bg-transparent">
			<Tabs defaultValue="visual" className="w-full">
				<TabsList className="w-full grid grid-cols-3 h-auto p-1">
					<TabsTrigger value="visual" className="text-[10px] h-7 gap-1">
						<Eye className="h-3 w-3" />
						Visual
					</TabsTrigger>
					<TabsTrigger value="effects" className="text-[10px] h-7 gap-1">
						<Sparkles className="h-3 w-3" />
						Efectos
					</TabsTrigger>
					<TabsTrigger value="advanced" className="text-[10px] h-7 gap-1">
						<Settings2 className="h-3 w-3" />
						Avanzado
					</TabsTrigger>
				</TabsList>

				<ScrollArea className="h-[500px] pr-4">
					<TabsContent value="visual" className="mt-4 space-y-4">
						{/* Diseño */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label className="text-xs font-medium">Diseño</Label>
								<div className="flex items-center space-x-2">
									<Switch
										checked={options.enable3DEffect}
										onCheckedChange={(checked) =>
											updateOptions({ enable3DEffect: checked })
										}
										disabled={disabled}
									/>
									<Label className="text-[10px]">Efecto 3D</Label>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-2">
									<Label className="text-[10px]">Esquinas</Label>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.designSystem?.cornerStyle === 'rounded'}
											onCheckedChange={(checked) =>
												updateOptions({
													designSystem: {
														...options.designSystem,
														cornerStyle: checked ? 'rounded' : 'sharp',
													},
												})
											}
											disabled={disabled}
										/>
										<Label className="text-[10px]">Redondeadas</Label>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="text-[10px]">Elevación</Label>
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.designSystem?.elevation > 0}
											onCheckedChange={(checked) =>
												updateOptions({
													designSystem: {
														...options.designSystem,
														elevation: checked ? 2 : 0,
													},
												})
											}
											disabled={disabled}
										/>
										<Label className="text-[10px]">Activada</Label>
									</div>
								</div>
							</div>
						</div>

						<Separator />

						{/* Efectos Básicos */}
						<div className="space-y-4">
							<Label className="text-xs font-medium">Efectos Básicos</Label>
							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.enableHolographicEffect}
											onCheckedChange={(checked) =>
												updateOptions({ enableHolographicEffect: checked })
											}
											disabled={disabled}
										/>
										<Label className="text-[10px]">Holográfico</Label>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.enableGlowEffect}
											onCheckedChange={(checked) =>
												updateOptions({ enableGlowEffect: checked })
											}
											disabled={disabled}
										/>
										<Label className="text-[10px]">Brillo</Label>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.enableAnimatedBorder}
											onCheckedChange={(checked) =>
												updateOptions({ enableAnimatedBorder: checked })
											}
											disabled={disabled}
										/>
										<Label className="text-[10px]">Borde Animado</Label>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.enableLightHalo}
											onCheckedChange={(checked) =>
												updateOptions({ enableLightHalo: checked })
											}
											disabled={disabled}
										/>
										<Label className="text-[10px]">Halo de Luz</Label>
									</div>
								</div>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="effects" className="mt-4 space-y-4">
						{/* Sistema de Capas */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label className="text-xs font-medium">Sistema de Capas</Label>
								<Button
									variant="outline"
									size="sm"
									className="h-7 text-[10px]"
									onClick={() =>
										updateOptions({
											layerSystem: {
												order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
												layerBlending: 'screen',
												layerSpacing: 2,
											},
										})
									}
									disabled={disabled}
								>
									<Layers className="h-3 w-3 mr-1" />
									Restaurar
								</Button>
							</div>

							<div className="space-y-2">
								<Label className="text-[10px]">Modo de Mezcla</Label>
								<div className="flex items-center space-x-2">
									<select
										className="w-full text-[10px] h-7 rounded-md border border-input bg-background px-3"
										value={options.layerSystem?.layerBlending}
										onChange={(e) =>
											updateOptions({
												layerSystem: {
													...options.layerSystem,
													layerBlending: e.target.value,
												},
											})
										}
										disabled={disabled}
									>
										<option value="normal">Normal</option>
										<option value="multiply">Multiplicar</option>
										<option value="screen">Pantalla</option>
										<option value="overlay">Superponer</option>
									</select>
								</div>
							</div>
						</div>

						<Separator />

						{/* Efectos de Profundidad */}
						<div className="space-y-4">
							<Label className="text-xs font-medium">Efectos de Profundidad</Label>
							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.effects?.shadow?.enabled}
											onCheckedChange={(checked) =>
												updateOptions({
													effects: {
														...options.effects,
														shadow: {
															...options.effects?.shadow,
															enabled: checked,
														},
													},
												})
											}
											disabled={disabled}
										/>
										<Label className="text-[10px]">Sombra</Label>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.effects?.reflection?.enabled}
											onCheckedChange={(checked) =>
												updateOptions({
													effects: {
														...options.effects,
														reflection: {
															...options.effects?.reflection,
															enabled: checked,
														},
													},
												})
											}
											disabled={disabled}
										/>
										<Label className="text-[10px]">Reflexión</Label>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.effects?.parallax?.enabled}
											onCheckedChange={(checked) =>
												updateOptions({
													effects: {
														...options.effects,
														parallax: {
															...options.effects?.parallax,
															enabled: checked,
														},
													},
												})
											}
											disabled={disabled}
										/>
										<Label className="text-[10px]">Parallax</Label>
									</div>
								</div>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="advanced" className="mt-4 space-y-4">
						{/* Rendimiento */}
						<div className="space-y-4">
							<Label className="text-xs font-medium">Rendimiento</Label>
							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.performance?.enableHardwareAcceleration}
											onCheckedChange={(checked) =>
												updateOptions({
													performance: {
														...options.performance,
														enableHardwareAcceleration: checked,
													},
												})
											}
											disabled={disabled}
										/>
										<Label className="text-[10px]">Aceleración Hardware</Label>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.performance?.useRAF}
											onCheckedChange={(checked) =>
												updateOptions({
													performance: {
														...options.performance,
														useRAF: checked,
													},
												})
											}
											disabled={disabled}
										/>
										<Label className="text-[10px]">Usar RAF</Label>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.performance?.batchUpdates}
											onCheckedChange={(checked) =>
												updateOptions({
													performance: {
														...options.performance,
														batchUpdates: checked,
													},
												})
											}
											disabled={disabled}
										/>
										<Label className="text-[10px]">Batch Updates</Label>
									</div>
								</div>
							</div>
						</div>

						<Separator />

						{/* Estados */}
						<div className="space-y-4">
							<Label className="text-xs font-medium">Estados</Label>
							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.states?.hover?.scale !== undefined}
											onCheckedChange={(checked) =>
												updateOptions({
													states: {
														...options.states,
														hover: {
															...options.states?.hover,
															scale: checked ? 1.02 : undefined,
														},
													},
												})
											}
											disabled={disabled}
										/>
										<Label className="text-[10px]">Escala en Hover</Label>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.states?.hover?.rotate}
											onCheckedChange={(checked) =>
												updateOptions({
													states: {
														...options.states,
														hover: {
															...options.states?.hover,
															rotate: checked,
														},
													},
												})
											}
											disabled={disabled}
										/>
										<Label className="text-[10px]">Rotación en Hover</Label>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Switch
											checked={options.states?.hover?.lift}
											onCheckedChange={(checked) =>
												updateOptions({
													states: {
														...options.states,
														hover: {
															...options.states?.hover,
															lift: checked,
														},
													},
												})
											}
											disabled={disabled}
										/>
										<Label className="text-[10px]">Elevación en Hover</Label>
									</div>
								</div>
							</div>
						</div>
					</TabsContent>
				</ScrollArea>
			</Tabs>
		</Card>
	);
}