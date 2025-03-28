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
import { imageConfigSchema, useImageStore } from '../actions/image-config.action';

/**
 * 🎛️ Componente de configuración de la capa de imagen
 * Permite ajustar todos los parámetros de la imagen
 */
export function ImageConfig() {
	// 🏪 Estado global
	const { config, updateConfig, resetConfig } = useImageStore();

	// 📝 Formulario
	const form = useForm({
		resolver: zodResolver(imageConfigSchema),
		defaultValues: config,
	});

	// 💾 Guardar cambios
	const onSubmit = (values: typeof config) => {
		updateConfig(values);
	};

	return (
		<Form {...form}>
			<form onChange={form.handleSubmit(onSubmit)} className="space-y-4">
				<Card>
					<CardContent className="pt-6">
						{/* 🎯 Control principal */}
						<div className="flex items-center justify-between mb-4">
							<FormField
								control={form.control}
								name="enabled"
								render={({ field }) => (
									<FormItem className="flex items-center space-x-2">
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
										<FormLabel className="!mt-0">Habilitar Imagen</FormLabel>
									</FormItem>
								)}
							/>
							<Button variant="ghost" size="sm" onClick={() => resetConfig()} className="text-xs">
								Restablecer
							</Button>
						</div>

						{form.watch('enabled') && (
							<>
								<div className="space-y-4">
									{/* 🖼️ Ajustes básicos */}
									<FormField
										control={form.control}
										name="objectFit"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Ajuste de imagen</FormLabel>
												<Select value={field.value} onValueChange={field.onChange}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Seleccionar ajuste" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="cover">Cubrir</SelectItem>
														<SelectItem value="contain">Contener</SelectItem>
														<SelectItem value="fill">Llenar</SelectItem>
														<SelectItem value="none">Ninguno</SelectItem>
													</SelectContent>
												</Select>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="aspectRatio"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Relación de aspecto</FormLabel>
												<Select value={field.value} onValueChange={field.onChange}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Seleccionar relación" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="1/1">1:1 (Cuadrado)</SelectItem>
														<SelectItem value="4/3">4:3 (Clásico)</SelectItem>
														<SelectItem value="3/4">3:4 (Retrato)</SelectItem>
														<SelectItem value="16/9">16:9 (Panorámico)</SelectItem>
														<SelectItem value="auto">Auto (Original)</SelectItem>
													</SelectContent>
												</Select>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="borderRadius"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Bordes redondeados</FormLabel>
												<Select value={field.value} onValueChange={field.onChange}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Seleccionar radio" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="none">Ninguno</SelectItem>
														<SelectItem value="sm">Pequeño</SelectItem>
														<SelectItem value="md">Medio</SelectItem>
														<SelectItem value="lg">Grande</SelectItem>
														<SelectItem value="full">Completo</SelectItem>
													</SelectContent>
												</Select>
											</FormItem>
										)}
									/>

									<Separator className="my-4" />

									{/* 🎨 Ajustes de filtros */}
									<Collapsible>
										<CollapsibleTrigger className="flex items-center justify-between w-full">
											<span className="text-sm font-medium">Filtros</span>
											<ChevronDown className="w-4 h-4" />
										</CollapsibleTrigger>
										<CollapsibleContent className="space-y-4 mt-4">
											<FormField
												control={form.control}
												name="blur"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Desenfoque</FormLabel>
														<FormControl>
															<Slider
																min={0}
																max={10}
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
												name="grayscale"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Escala de grises</FormLabel>
														<FormControl>
															<Slider
																min={0}
																max={100}
																step={10}
																value={[field.value]}
																onValueChange={([value]) => field.onChange(value)}
															/>
														</FormControl>
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="brightness"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Brillo</FormLabel>
														<FormControl>
															<Slider
																min={50}
																max={150}
																step={5}
																value={[field.value]}
																onValueChange={([value]) => field.onChange(value)}
															/>
														</FormControl>
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="contrast"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Contraste</FormLabel>
														<FormControl>
															<Slider
																min={50}
																max={150}
																step={5}
																value={[field.value]}
																onValueChange={([value]) => field.onChange(value)}
															/>
														</FormControl>
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="saturate"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Saturación</FormLabel>
														<FormControl>
															<Slider
																min={0}
																max={200}
																step={10}
																value={[field.value]}
																onValueChange={([value]) => field.onChange(value)}
															/>
														</FormControl>
													</FormItem>
												)}
											/>
										</CollapsibleContent>
									</Collapsible>

									<Separator className="my-4" />

									{/* 🚀 Ajustes de rendimiento */}
									<Collapsible>
										<CollapsibleTrigger className="flex items-center justify-between w-full">
											<span className="text-sm font-medium">Rendimiento</span>
											<ChevronDown className="w-4 h-4" />
										</CollapsibleTrigger>
										<CollapsibleContent className="space-y-4 mt-4">
											<FormField
												control={form.control}
												name="loading"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Estrategia de carga</FormLabel>
														<Select value={field.value} onValueChange={field.onChange}>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Seleccionar estrategia" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="lazy">Lazy (Al ser visible)</SelectItem>
																<SelectItem value="eager">Eager (Inmediata)</SelectItem>
															</SelectContent>
														</Select>
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="placeholder"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Placeholder</FormLabel>
														<Select value={field.value} onValueChange={field.onChange}>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Seleccionar placeholder" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="shimmer">Shimmer</SelectItem>
																<SelectItem value="blur">Blur</SelectItem>
																<SelectItem value="empty">Empty</SelectItem>
															</SelectContent>
														</Select>
													</FormItem>
												)}
											/>
										</CollapsibleContent>
									</Collapsible>

									<Separator className="my-4" />

									{/* ♿ Ajustes de accesibilidad */}
									<Collapsible>
										<CollapsibleTrigger className="flex items-center justify-between w-full">
											<span className="text-sm font-medium">Accesibilidad</span>
											<ChevronDown className="w-4 h-4" />
										</CollapsibleTrigger>
										<CollapsibleContent className="space-y-4 mt-4">
											<FormField
												control={form.control}
												name="accessibility.alt"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Texto alternativo</FormLabel>
														<FormControl>
															<input type="text" className="w-full px-3 py-2 border rounded-md" {...field} />
														</FormControl>
														<FormDescription>Descripción corta para lectores de pantalla</FormDescription>
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="accessibility.description"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Descripción larga</FormLabel>
														<FormControl>
															<textarea className="w-full px-3 py-2 border rounded-md" rows={3} {...field} />
														</FormControl>
														<FormDescription>Descripción detallada de la imagen</FormDescription>
													</FormItem>
												)}
											/>
										</CollapsibleContent>
									</Collapsible>

									<Separator className="my-4" />

									{/* 🎯 Ajustes de capa */}
									<FormField
										control={form.control}
										name="layerIndex"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Índice de capa</FormLabel>
												<FormControl>
													<Slider
														min={0}
														max={10}
														step={1}
														value={[field.value]}
														onValueChange={([value]) => field.onChange(value)}
													/>
												</FormControl>
												<FormDescription>Controla el orden de las capas en modo explotado</FormDescription>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="visibleOnHover"
										render={({ field }) => (
											<FormItem className="flex items-center space-x-2">
												<FormControl>
													<Checkbox checked={field.value} onCheckedChange={field.onChange} />
												</FormControl>
												<FormLabel className="!mt-0">Solo visible al pasar el cursor</FormLabel>
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
}
