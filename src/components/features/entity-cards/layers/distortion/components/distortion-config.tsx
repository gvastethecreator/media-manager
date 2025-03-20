'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { distortionConfigSchema, useDistortionStore } from '../actions/distortion-config.action';

export const DistortionConfig = () => {
	const { config, updateConfig, resetConfig } = useDistortionStore();

	const form = useForm({
		resolver: zodResolver(distortionConfigSchema),
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
										<FormLabel className="!mt-0">Habilitar Distorsión</FormLabel>
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
												<FormLabel>Intensidad Global</FormLabel>
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
										name="visibleOnHover"
										render={({ field }) => (
											<FormItem className="flex items-center space-x-2">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<FormLabel className="!mt-0">Solo visible al pasar el cursor</FormLabel>
											</FormItem>
										)}
									/>

									<Separator className="my-4" />

									<Collapsible>
										<CollapsibleTrigger className="flex items-center justify-between w-full">
											<span className="text-sm font-medium">Efecto Glitch</span>
											<ChevronDown className="w-4 h-4" />
										</CollapsibleTrigger>
										<CollapsibleContent className="space-y-4 mt-4">
											<FormField
												control={form.control}
												name="glitchEffect.enabled"
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

											{form.watch('glitchEffect.enabled') && (
												<>
													<FormField
														control={form.control}
														name="glitchEffect.intensity"
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
														name="glitchEffect.frequency"
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
														name="glitchEffect.duration"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Duración</FormLabel>
																<FormControl>
																	<Slider
																		min={0}
																		max={5}
																		step={0.1}
																		value={[field.value]}
																		onValueChange={([value]) => field.onChange(value)}
																	/>
																</FormControl>
															</FormItem>
														)}
													/>

													<FormField
														control={form.control}
														name="glitchEffect.visibleOnHover"
														render={({ field }) => (
															<FormItem className="flex items-center space-x-2">
																<FormControl>
																	<Checkbox
																		checked={field.value}
																		onCheckedChange={field.onChange}
																	/>
																</FormControl>
																<FormLabel className="!mt-0">Solo visible al pasar el cursor</FormLabel>
															</FormItem>
														)}
													/>
												</>
											)}
										</CollapsibleContent>
									</Collapsible>

									<Collapsible>
										<CollapsibleTrigger className="flex items-center justify-between w-full">
											<span className="text-sm font-medium">Aberración Cromática</span>
											<ChevronDown className="w-4 h-4" />
										</CollapsibleTrigger>
										<CollapsibleContent className="space-y-4 mt-4">
											<FormField
												control={form.control}
												name="chromaticAberration.enabled"
												render={({ field }) => (
													<FormItem className="flex items-center space-x-2">
														<FormControl>
															<Switch
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
														<FormLabel className="!mt-0">Habilitar Aberración Cromática</FormLabel>
													</FormItem>
												)}
											/>

											{form.watch('chromaticAberration.enabled') && (
												<>
													<FormField
														control={form.control}
														name="chromaticAberration.intensity"
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
														name="chromaticAberration.offset"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Desplazamiento</FormLabel>
																<FormControl>
																	<Slider
																		min={0}
																		max={10}
																		step={0.1}
																		value={[field.value]}
																		onValueChange={([value]) => field.onChange(value)}
																	/>
																</FormControl>
															</FormItem>
														)}
													/>

													<FormField
														control={form.control}
														name="chromaticAberration.visibleOnHover"
														render={({ field }) => (
															<FormItem className="flex items-center space-x-2">
																<FormControl>
																	<Checkbox
																		checked={field.value}
																		onCheckedChange={field.onChange}
																	/>
																</FormControl>
																<FormLabel className="!mt-0">Solo visible al pasar el cursor</FormLabel>
															</FormItem>
														)}
													/>
												</>
											)}
										</CollapsibleContent>
									</Collapsible>

									<Collapsible>
										<CollapsibleTrigger className="flex items-center justify-between w-full">
											<span className="text-sm font-medium">Pixelado</span>
											<ChevronDown className="w-4 h-4" />
										</CollapsibleTrigger>
										<CollapsibleContent className="space-y-4 mt-4">
											<FormField
												control={form.control}
												name="pixelate.enabled"
												render={({ field }) => (
													<FormItem className="flex items-center space-x-2">
														<FormControl>
															<Switch
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
														<FormLabel className="!mt-0">Habilitar Pixelado</FormLabel>
													</FormItem>
												)}
											/>

											{form.watch('pixelate.enabled') && (
												<>
													<FormField
														control={form.control}
														name="pixelate.intensity"
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
														name="pixelate.blockSize"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Tamaño de Bloque</FormLabel>
																<FormControl>
																	<Slider
																		min={1}
																		max={50}
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
														name="pixelate.visibleOnHover"
														render={({ field }) => (
															<FormItem className="flex items-center space-x-2">
																<FormControl>
																	<Checkbox
																		checked={field.value}
																		onCheckedChange={field.onChange}
																	/>
																</FormControl>
																<FormLabel className="!mt-0">Solo visible al pasar el cursor</FormLabel>
															</FormItem>
														)}
													/>
												</>
											)}
										</CollapsibleContent>
									</Collapsible>

									<Separator className="my-4" />

									<FormField
										control={form.control}
										name="layerIndex"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Índice de Capa</FormLabel>
												<FormControl>
													<Slider
														min={0}
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