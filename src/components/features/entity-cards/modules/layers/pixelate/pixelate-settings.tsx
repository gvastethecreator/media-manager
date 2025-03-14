'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';

import { LayerSettingsProps } from '../layer-plugin-system';
import {
	pixelateConfigSchema,
	PixelateConfig,
	createDefaultPixelateConfig
} from './pixelate-schema';
import { updatePixelateConfig } from '@/app/actions/pixelate-config.action';
import { cn } from '@/lib/utils';

/**
 * Componente de configuración para la capa de pixelado
 */
export function PixelateSettings({
	config,
	entityId,
	entityType,
	onConfigChange,
}: LayerSettingsProps<PixelateConfig>) {
	const [activeTab, setActiveTab] = useState('basic');
	const [isSaving, setIsSaving] = useState(false);

	// Configurar el formulario con React Hook Form y validación Zod
	const form = useForm<PixelateConfig>({
		resolver: zodResolver(pixelateConfigSchema),
		defaultValues: config || createDefaultPixelateConfig(),
	});

	// Actualizar el formulario cuando cambia la configuración externa
	useEffect(() => {
		if (config) {
			form.reset(config);
		}
	}, [config, form]);

	// Manejar cambios en el formulario
	useEffect(() => {
		const subscription = form.watch((values) => {
			// Notificar cambios al componente padre
			onConfigChange?.(values as PixelateConfig);
		});

		return () => subscription.unsubscribe();
	}, [form, onConfigChange]);

	// Guardar la configuración
	const onSubmit = async (data: PixelateConfig) => {
		if (!entityId) return;

		setIsSaving(true);
		try {
			const result = await updatePixelateConfig({
				entityId,
				entityType,
				config: data,
			});

			if (result.success) {
				toast.success('Configuración de pixelado guardada');
				form.reset(data); // Resetear el estado "dirty" del formulario
			} else {
				toast.error(`Error al guardar: ${result.error}`);
			}
		} catch (error) {
			console.error('Error al guardar la configuración de pixelado:', error);
			toast.error('Error al guardar la configuración');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Configuración de Pixelado</CardTitle>
				<CardDescription>
					Personaliza el efecto de pixelado para esta entidad
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						{/* Habilitar/deshabilitar la capa */}
						<FormField
							control={form.control}
							name="enabled"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>Habilitar pixelado</FormLabel>
										<FormDescription>
											Activa o desactiva el efecto de pixelado
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Mostrar configuración solo si está habilitado */}
						{form.watch('enabled') && (
							<>
								<Tabs value={activeTab} onValueChange={setActiveTab}>
									<TabsList className="grid grid-cols-3 mb-4">
										<TabsTrigger value="basic">Básico</TabsTrigger>
										<TabsTrigger value="advanced">Avanzado</TabsTrigger>
										<TabsTrigger value="animation">Animación</TabsTrigger>
									</TabsList>

									{/* Configuración básica */}
									<TabsContent value="basic" className="space-y-4">
										{/* Tamaño de píxel */}
										<FormField
											control={form.control}
											name="pixelSize"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Tamaño de píxel: {field.value}px</FormLabel>
													<FormControl>
														<Slider
															min={1}
															max={50}
															step={1}
															value={[field.value]}
															onValueChange={(value) => field.onChange(value[0])}
														/>
													</FormControl>
													<FormDescription>
														Controla el tamaño de los bloques de píxeles
													</FormDescription>
												</FormItem>
											)}
										/>

										{/* Algoritmo de pixelado */}
										<FormField
											control={form.control}
											name="algorithm"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Algoritmo</FormLabel>
													<Select
														value={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Seleccionar algoritmo" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="simple">Simple</SelectItem>
															<SelectItem value="weighted">Ponderado</SelectItem>
															<SelectItem value="adaptive">Adaptativo</SelectItem>
															<SelectItem value="color">Reducción de color</SelectItem>
															<SelectItem value="mosaic">Mosaico</SelectItem>
														</SelectContent>
													</Select>
													<FormDescription>
														Algoritmo utilizado para el efecto de pixelado
													</FormDescription>
												</FormItem>
											)}
										/>

										{/* Intensidad */}
										<FormField
											control={form.control}
											name="intensity"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Intensidad: {field.value.toFixed(1)}</FormLabel>
													<FormControl>
														<Slider
															min={0}
															max={2}
															step={0.1}
															value={[field.value]}
															onValueChange={(value) => field.onChange(value[0])}
														/>
													</FormControl>
													<FormDescription>
														Controla la intensidad del efecto
													</FormDescription>
												</FormItem>
											)}
										/>

										{/* Opciones específicas según el algoritmo seleccionado */}
										{form.watch('algorithm') === 'color' && (
											<FormField
												control={form.control}
												name="colorReduction"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Niveles de color: {field.value}</FormLabel>
														<FormControl>
															<Slider
																min={2}
																max={32}
																step={1}
																value={[field.value]}
																onValueChange={(value) => field.onChange(value[0])}
															/>
														</FormControl>
														<FormDescription>
															Número de niveles de color por canal
														</FormDescription>
													</FormItem>
												)}
											/>
										)}

										{/* Forma de píxel para algoritmo mosaico */}
										{form.watch('algorithm') === 'mosaic' && (
											<FormField
												control={form.control}
												name="shape"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Forma de píxel</FormLabel>
														<Select
															value={field.value}
															onValueChange={field.onChange}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Seleccionar forma" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="square">Cuadrado</SelectItem>
																<SelectItem value="circle">Círculo</SelectItem>
																<SelectItem value="diamond">Diamante</SelectItem>
																<SelectItem value="hexagon">Hexágono</SelectItem>
															</SelectContent>
														</Select>
														<FormDescription>
															Forma geométrica para el efecto mosaico
														</FormDescription>
													</FormItem>
												)}
											/>
										)}
									</TabsContent>

									{/* Configuración avanzada */}
									<TabsContent value="advanced" className="space-y-4">
										{/* Modo de fusión */}
										<FormField
											control={form.control}
											name="blendMode"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Modo de fusión</FormLabel>
													<Select
														value={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Seleccionar modo" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="normal">Normal</SelectItem>
															<SelectItem value="multiply">Multiplicar</SelectItem>
															<SelectItem value="screen">Pantalla</SelectItem>
															<SelectItem value="overlay">Superponer</SelectItem>
															<SelectItem value="darken">Oscurecer</SelectItem>
															<SelectItem value="lighten">Aclarar</SelectItem>
															<SelectItem value="color-dodge">Sobreexposición</SelectItem>
															<SelectItem value="color-burn">Subexposición</SelectItem>
															<SelectItem value="hard-light">Luz fuerte</SelectItem>
															<SelectItem value="soft-light">Luz suave</SelectItem>
															<SelectItem value="difference">Diferencia</SelectItem>
															<SelectItem value="exclusion">Exclusión</SelectItem>
														</SelectContent>
													</Select>
													<FormDescription>
														Cómo se fusiona esta capa con las capas inferiores
													</FormDescription>
												</FormItem>
											)}
										/>

										{/* Preservar canal alfa */}
										<FormField
											control={form.control}
											name="preserveAlpha"
											render={({ field }) => (
												<FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
													<div className="space-y-0.5">
														<FormLabel>Preservar transparencia</FormLabel>
														<FormDescription>
															Mantiene la transparencia original de la imagen
														</FormDescription>
													</div>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
												</FormItem>
											)}
										/>

										{/* Visible solo en hover */}
										<FormField
											control={form.control}
											name="visibleOnHover"
											render={({ field }) => (
												<FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
													<div className="space-y-0.5">
														<FormLabel>Solo visible en hover</FormLabel>
														<FormDescription>
															El efecto solo se muestra al pasar el cursor
														</FormDescription>
													</div>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
												</FormItem>
											)}
										/>

										{/* Configuración de zona */}
										<div className="space-y-2">
											<h3 className="text-sm font-medium">Zona de efecto</h3>

											<FormField
												control={form.control}
												name="zone.enabled"
												render={({ field }) => (
													<FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
														<div className="space-y-0.5">
															<FormLabel>Habilitar zona</FormLabel>
															<FormDescription>
																Aplicar efecto solo en un área específica
															</FormDescription>
														</div>
														<FormControl>
															<Switch
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
													</FormItem>
												)}
											/>

											{form.watch('zone.enabled') && (
												<div className="space-y-3 mt-2 pl-2 border-l-2 border-gray-200">
													{/* Radio de la zona */}
													<FormField
														control={form.control}
														name="zone.radius"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Radio: {(field.value * 100).toFixed(0)}%</FormLabel>
																<FormControl>
																	<Slider
																		min={0.1}
																		max={1}
																		step={0.05}
																		value={[field.value]}
																		onValueChange={(value) => field.onChange(value[0])}
																	/>
																</FormControl>
															</FormItem>
														)}
													/>

													{/* Suavizado del borde */}
													<FormField
														control={form.control}
														name="zone.feather"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Suavizado: {(field.value * 100).toFixed(0)}%</FormLabel>
																<FormControl>
																	<Slider
																		min={0}
																		max={1}
																		step={0.05}
																		value={[field.value]}
																		onValueChange={(value) => field.onChange(value[0])}
																	/>
																</FormControl>
															</FormItem>
														)}
													/>

													{/* Posición X */}
													<FormField
														control={form.control}
														name="zone.centerX"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Posición X: {(field.value * 100).toFixed(0)}%</FormLabel>
																<FormControl>
																	<Slider
																		min={0}
																		max={1}
																		step={0.05}
																		value={[field.value]}
																		onValueChange={(value) => field.onChange(value[0])}
																	/>
																</FormControl>
															</FormItem>
														)}
													/>

													{/* Posición Y */}
													<FormField
														control={form.control}
														name="zone.centerY"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Posición Y: {(field.value * 100).toFixed(0)}%</FormLabel>
																<FormControl>
																	<Slider
																		min={0}
																		max={1}
																		step={0.05}
																		value={[field.value]}
																		onValueChange={(value) => field.onChange(value[0])}
																	/>
																</FormControl>
															</FormItem>
														)}
													</div>
												)}
											</div>
										)}
									</TabsContent>

									{/* Configuración de animación */}
									<TabsContent value="animation" className="space-y-4">
										{/* Animación */}
										<FormField
											control={form.control}
											name="animated"
											render={({ field }) => (
												<FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
													<div className="space-y-0.5">
														<FormLabel>Habilitar animación</FormLabel>
														<FormDescription>
															Anima el efecto de pixelado
														</FormDescription>
													</div>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
												</FormItem>
											)}
										/>

										{form.watch('animated') && (
											<FormField
												control={form.control}
												name="animationSpeed"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Velocidad: {field.value.toFixed(1)}x</FormLabel>
														<FormControl>
															<Slider
																min={0.1}
																max={5}
																step={0.1}
																value={[field.value]}
																onValueChange={(value) => field.onChange(value[0])}
															/>
														</FormControl>
														<FormDescription>
															Velocidad de la animación
														</FormDescription>
													</FormItem>
												)}
											/>
										)}

										{/* Transiciones */}
										<div className="space-y-2 mt-4">
											<h3 className="text-sm font-medium">Transiciones</h3>

											<FormField
												control={form.control}
												name="transition.enabled"
												render={({ field }) => (
													<FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
														<div className="space-y-0.5">
															<FormLabel>Habilitar transiciones</FormLabel>
															<FormDescription>
																Transiciones suaves al cambiar el estado
															</FormDescription>
														</div>
														<FormControl>
															<Switch
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
													</FormItem>
												)}
											/>

											{form.watch('transition.enabled') && (
												<div className="space-y-3 mt-2 pl-2 border-l-2 border-gray-200">
													{/* Duración */}
													<FormField
														control={form.control}
														name="transition.duration"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Duración: {field.value}ms</FormLabel>
																<FormControl>
																	<Slider
																		min={100}
																		max={2000}
																		step={100}
																		value={[field.value]}
																		onValueChange={(value) => field.onChange(value[0])}
																	/>
																</FormControl>
															</FormItem>
														)}
													/>

													{/* Easing */}
													<FormField
														control={form.control}
														name="transition.easing"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Tipo de easing</FormLabel>
																<Select
																	value={field.value}
																	onValueChange={field.onChange}
																>
																	<FormControl>
																		<SelectTrigger>
																			<SelectValue placeholder="Seleccionar easing" />
																		</SelectTrigger>
																	</FormControl>
																	<SelectContent>
																		<SelectItem value="linear">Lineal</SelectItem>
																		<SelectItem value="ease">Suave</SelectItem>
																		<SelectItem value="ease-in">Aceleración</SelectItem>
																		<SelectItem value="ease-out">Desaceleración</SelectItem>
																		<SelectItem value="ease-in-out">Aceleración y desaceleración</SelectItem>
																	</SelectContent>
																</Select>
															</FormItem>
														)}
													/>

													{/* Transición al entrar */}
													<FormField
														control={form.control}
														name="transition.onEnter"
														render={({ field }) => (
															<FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
																<div className="space-y-0.5">
																	<FormLabel>Al entrar</FormLabel>
																	<FormDescription>
																		Aplicar transición al entrar en hover
																	</FormDescription>
																</div>
																<FormControl>
																	<Switch
																		checked={field.value}
																		onCheckedChange={field.onChange}
																	/>
																</FormControl>
															</FormItem>
														)}
													/>

													{/* Transición al salir */}
													<FormField
														control={form.control}
														name="transition.onExit"
														render={({ field }) => (
															<FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
																<div className="space-y-0.5">
																	<FormLabel>Al salir</FormLabel>
																	<FormDescription>
																		Aplicar transición al salir del hover
																	</FormDescription>
																</div>
																<FormControl>
																	<Switch
																		checked={field.value}
																		onCheckedChange={field.onChange}
																	/>
																</FormControl>
															</FormItem>
														)}
													/>
												</div>
											)}
										</div>
									</TabsContent>
								</Tabs>

								<Separator className="my-4" />

								{/* Índice de capa */}
								<FormField
									control={form.control}
									name="layerIndex"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Índice de capa: {field.value}</FormLabel>
											<FormControl>
												<Slider
													min={1}
													max={20}
													step={1}
													value={[field.value]}
													onValueChange={(value) => field.onChange(value[0])}
												/>
											</FormControl>
											<FormDescription>
												Controla el orden de apilamiento (mayor = más arriba)
											</FormDescription>
										</FormItem>
									)}
								/>
							</>
						)}

						{/* Botones de acción */}
						<div className="flex justify-end space-x-2 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => form.reset(config)}
								disabled={isSaving}
							>
								Restablecer
							</Button>
							<Button type="submit" disabled={isSaving || !form.formState.isDirty}>
								{isSaving ? 'Guardando...' : 'Guardar cambios'}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
