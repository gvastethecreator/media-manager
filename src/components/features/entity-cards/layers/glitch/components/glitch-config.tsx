'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { glitchConfigSchema, useGlitchStore } from '../actions/glitch-config.action';

export const GlitchConfig = () => {
	const { config, updateConfig, resetConfig } = useGlitchStore();

	const form = useForm({
		resolver: zodResolver(glitchConfigSchema),
		defaultValues: config,
	});

	const onSubmit = (values: typeof config) => {
		updateConfig(values);
	};

	return (
		<Form {...form}>
			<form onChange={form.handleSubmit(onSubmit)} className="space-y-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-4">
							<FormField
								control={form.control}
								name="enabled"
								render={({ field }) => (
									<FormItem className="flex items-center space-x-2">
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<FormLabel className="!mt-0">Habilitar Glitch</FormLabel>
									</FormItem>
								)}
							/>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => resetConfig()}
								className="text-xs"
							>
								Restablecer
							</Button>
						</div>

						{form.watch('enabled') && (
							<>
								<div className="space-y-4">
									<FormField
										control={form.control}
										name="intensity"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Intensidad</FormLabel>
												<FormControl>
													<Slider
														min={0}
														max={1}
														step={0.01}
														value={[field.value]}
														onValueChange={([value]) => field.onChange(value)}
													/>
												</FormControl>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="frequency"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Frecuencia</FormLabel>
												<FormControl>
													<Slider
														min={0}
														max={1}
														step={0.01}
														value={[field.value]}
														onValueChange={([value]) => field.onChange(value)}
													/>
												</FormControl>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="animated"
										render={({ field }) => (
											<FormItem className="flex items-center space-x-2">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<FormLabel className="!mt-0">Animar</FormLabel>
											</FormItem>
										)}
									/>

									{form.watch('animated') && (
										<FormField
											control={form.control}
											name="speed"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Velocidad</FormLabel>
													<FormControl>
														<Slider
															min={0}
															max={2}
															step={0.1}
															value={[field.value]}
															onValueChange={([value]) => field.onChange(value)}
														/>
													</FormControl>
												</FormItem>
											)}
										/>
									)}

									<Separator className="my-4" />

									<Collapsible>
										<CollapsibleTrigger className="flex items-center justify-between w-full">
											<span className="text-sm font-medium">Efectos Avanzados</span>
											<ChevronDown className="w-4 h-4" />
										</CollapsibleTrigger>
										<CollapsibleContent className="space-y-4 mt-4">
											<FormField
												control={form.control}
												name="colorShift"
												render={({ field }) => (
													<FormItem className="flex items-center space-x-2">
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
														<FormLabel className="!mt-0">Desplazamiento de Color</FormLabel>
													</FormItem>
												)}
											/>

											{form.watch('colorShift') && (
												<FormField
													control={form.control}
													name="colorShiftAmount"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Cantidad de Desplazamiento</FormLabel>
															<FormControl>
																<Slider
																	min={0}
																	max={1}
																	step={0.01}
																	value={[field.value]}
																	onValueChange={([value]) => field.onChange(value)}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
											)}

											<FormField
												control={form.control}
												name="scanlines"
												render={({ field }) => (
													<FormItem className="flex items-center space-x-2">
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
														<FormLabel className="!mt-0">Líneas de Escaneo</FormLabel>
													</FormItem>
												)}
											/>

											{form.watch('scanlines') && (
												<>
													<FormField
														control={form.control}
														name="scanlinesCount"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Cantidad de Líneas</FormLabel>
																<FormControl>
																	<Slider
																		min={1}
																		max={100}
																		step={1}
																		value={[field.value]}
																		onValueChange={([value]) => field.onChange(value)}
																	/>
																</FormControl>
															</FormItem>
														)}
													/>

													<FormField
														control={form.control}
														name="scanlinesOpacity"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Opacidad de Líneas</FormLabel>
																<FormControl>
																	<Slider
																		min={0}
																		max={1}
																		step={0.01}
																		value={[field.value]}
																		onValueChange={([value]) => field.onChange(value)}
																	/>
																</FormControl>
															</FormItem>
														)}
													/>
												</>
											)}

											<FormField
												control={form.control}
												name="noise"
												render={({ field }) => (
													<FormItem className="flex items-center space-x-2">
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
														<FormLabel className="!mt-0">Ruido</FormLabel>
													</FormItem>
												)}
											/>

											{form.watch('noise') && (
												<FormField
													control={form.control}
													name="noiseIntensity"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Intensidad del Ruido</FormLabel>
															<FormControl>
																<Slider
																	min={0}
																	max={1}
																	step={0.01}
																	value={[field.value]}
																	onValueChange={([value]) => field.onChange(value)}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
											)}

											<FormField
												control={form.control}
												name="distortion"
												render={({ field }) => (
													<FormItem className="flex items-center space-x-2">
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
														<FormLabel className="!mt-0">Distorsión</FormLabel>
													</FormItem>
												)}
											/>

											{form.watch('distortion') && (
												<FormField
													control={form.control}
													name="distortionAmount"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Cantidad de Distorsión</FormLabel>
															<FormControl>
																<Slider
																	min={0}
																	max={1}
																	step={0.01}
																	value={[field.value]}
																	onValueChange={([value]) => field.onChange(value)}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
											)}

											<FormField
												control={form.control}
												name="chromatic"
												render={({ field }) => (
													<FormItem className="flex items-center space-x-2">
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
														<FormLabel className="!mt-0">Aberración Cromática</FormLabel>
													</FormItem>
												)}
											/>

											{form.watch('chromatic') && (
												<FormField
													control={form.control}
													name="chromaticOffset"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Desplazamiento Cromático</FormLabel>
															<FormControl>
																<Slider
																	min={0}
																	max={1}
																	step={0.01}
																	value={[field.value]}
																	onValueChange={([value]) => field.onChange(value)}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
											)}
										</CollapsibleContent>
									</Collapsible>

									<Separator className="my-4" />

									<FormField
										control={form.control}
										name="blend"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Modo de Mezcla</FormLabel>
												<Select
													value={field.value}
													onValueChange={field.onChange}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="normal">Normal</SelectItem>
														<SelectItem value="multiply">Multiplicar</SelectItem>
														<SelectItem value="screen">Pantalla</SelectItem>
														<SelectItem value="overlay">Superponer</SelectItem>
														<SelectItem value="color-dodge">Color Dodge</SelectItem>
													</SelectContent>
												</Select>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="layerIndex"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Índice de Capa</FormLabel>
												<FormControl>
													<Slider
														min={1}
														max={10}
														step={1}
														value={[field.value]}
														onValueChange={([value]) => field.onChange(value)}
													/>
												</FormControl>
												<FormDescription>
													Controla el orden de las capas en modo explotado
												</FormDescription>
											</FormItem>
										)}
									/>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</form>
		</Form>
	);
};