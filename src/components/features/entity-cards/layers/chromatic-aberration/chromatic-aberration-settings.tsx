'use client';

import {
	type ChromaticAberrationConfig,
	getChromaticAberrationConfig,
	updateChromaticAberrationConfig,
} from '@/components/features/entity-cards/layers/chromatic-aberration/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Schema para la validación del formulario
const chromaticAberrationFormSchema = z.object({
	enabled: z.boolean().default(true),
	offset: z.number().min(0).max(20).default(2),
	intensity: z.number().min(0).max(1).default(0.5),
	visibleOnHover: z.boolean().default(true),
	redOffset: z.number().default(2),
	greenOffset: z.number().default(0),
	blueOffset: z.number().default(-2),
	direction: z.enum(['horizontal', 'vertical', 'radial', 'custom']).default('horizontal'),
	blendMode: z.enum(['screen', 'overlay', 'multiply', 'difference', 'exclusion']).default('screen'),
	animateOnHover: z.boolean().default(false),
	animationSpeed: z.number().min(0.1).max(10).default(1),
	animationType: z.enum(['pulse', 'wave', 'random']).default('pulse'),
	blurAmount: z.number().min(0).max(10).default(0.5),
	quality: z.enum(['low', 'medium', 'high']).default('medium'),
	colorMode: z.enum(['rgb', 'cmyk', 'custom']).default('rgb'),
});

type ChromaticAberrationFormValues = z.infer<typeof chromaticAberrationFormSchema>;

interface ChromaticAberrationSettingsProps {
	entityType: string;
	entityId?: string;
	className?: string;
	initialConfig?: ChromaticAberrationFormValues;
	onConfigUpdate?: (config: ChromaticAberrationFormValues) => void;
}

export function ChromaticAberrationSettings({
	entityType,
	entityId,
	className,
	initialConfig,
	onConfigUpdate
}: ChromaticAberrationSettingsProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [previewStyle, setPreviewStyle] = useState<Record<string, string>>({});

	// Inicializar el formulario con valores por defecto
	const form = useForm<ChromaticAberrationFormValues>({
		resolver: zodResolver(chromaticAberrationFormSchema),
		defaultValues: initialConfig || {
			enabled: true,
			offset: 2,
			intensity: 0.5,
			visibleOnHover: true,
			redOffset: 2,
			greenOffset: 0,
			blueOffset: -2,
			direction: 'horizontal',
			blendMode: 'screen',
			animateOnHover: false,
			animationSpeed: 1,
			animationType: 'pulse',
			blurAmount: 0.5,
			quality: 'medium',
			colorMode: 'rgb',
		}
	});

	// Cargar la configuración al montar el componente
	useEffect(() => {
		// Si se proporciona initialConfig, no es necesario cargar del servidor
		if (initialConfig) {
			form.reset(initialConfig);
			updatePreview(initialConfig);
			return;
		}

		const loadConfig = async () => {
			setIsLoading(true);
			try {
				const response = await getChromaticAberrationConfig(entityType, entityId);
				if (response.success && response.data) {
					form.reset(response.data as unknown as ChromaticAberrationFormValues);
					updatePreview(response.data);
				}
			} catch (error) {
				console.error('Error al cargar la configuración:', error);
				toast({
					title: 'Error',
					description: 'No se pudo cargar la configuración de aberración cromática',
					variant: 'destructive',
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadConfig();
	}, [entityType, entityId, form, initialConfig]);

	// Observar cambios en el formulario para actualizar la vista previa
	useEffect(() => {
		const subscription = form.watch((value) => {
			updatePreview(value as ChromaticAberrationConfig);

			// Si hay una función onConfigUpdate, llamarla con los nuevos valores
			if (onConfigUpdate) {
				onConfigUpdate(value as ChromaticAberrationFormValues);
			}
		});
		return () => subscription.unsubscribe();
	}, [form, onConfigUpdate]);

	// Función para actualizar el estilo de previsualización
	const updatePreview = (values: ChromaticAberrationConfig) => {
		if (!values.enabled) {
			setPreviewStyle({});
			return;
		}

		// Crear un ejemplo de texto con efecto de aberración cromática
		const style: Record<string, string> = {
			position: 'relative',
			overflow: 'hidden',
			filter: `blur(${values.blurAmount}px)`,
		};

		setPreviewStyle(style);
	};

	// Manejar el envío del formulario
	const onSubmit = async (values: ChromaticAberrationFormValues) => {
		// Si hay un manejador de actualización externo, usarlo
		if (onConfigUpdate) {
			onConfigUpdate(values);
			return;
		}

		setIsLoading(true);
		try {
			const response = await updateChromaticAberrationConfig(
				entityType,
				values as unknown as ChromaticAberrationConfig,
				entityId
			);
			if (response.success) {
				toast({
					title: 'Éxito',
					description: 'Configuración de aberración cromática actualizada',
				});
			} else {
				throw new Error(response.message);
			}
		} catch (error) {
			console.error('Error al actualizar la configuración:', error);
			toast({
				title: 'Error',
				description: 'No se pudo actualizar la configuración de aberración cromática',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader>
				<CardTitle>Configuración de Aberración Cromática</CardTitle>
				<CardDescription>Personaliza el efecto de aberración cromática para tus entidades.</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Vista previa */}
						{form.watch('enabled') && (
							<div className="mb-6">
								<h3 className="text-sm font-medium mb-2">Vista previa</h3>
								<div className="relative w-full h-24 bg-neutral-900 rounded-md overflow-hidden">
									<div className="absolute inset-0 w-full h-full" style={previewStyle} />
									<div
										className="absolute inset-0 w-full h-full text-white flex items-center justify-center text-2xl font-bold"
										style={{
											textShadow: `${form.watch('redOffset')}px 0 red, ${form.watch('greenOffset')}px 0 green, ${form.watch('blueOffset')}px 0 blue`,
											mixBlendMode: form.watch('blendMode'),
										}}
									>
										Aberración Cromática
									</div>
								</div>
							</div>
						)}

						{/* Activar/Desactivar */}
						<FormField
							control={form.control}
							name="enabled"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>Activar Aberración Cromática</FormLabel>
										<FormDescription>Activa o desactiva el efecto de aberración cromática.</FormDescription>
									</div>
									<FormControl>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
								</FormItem>
							)}
						/>

						{form.watch('enabled') && (
							<>
								{/* Visible solo al pasar el ratón */}
								<FormField
									control={form.control}
									name="visibleOnHover"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
											<div className="space-y-0.5">
												<FormLabel>Visible solo al pasar el ratón</FormLabel>
												<FormDescription>
													El efecto solo se mostrará al pasar el ratón sobre la entidad.
												</FormDescription>
											</div>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
										</FormItem>
									)}
								/>

								{/* Intensidad */}
								<FormField
									control={form.control}
									name="intensity"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Intensidad: {field.value.toFixed(2)}</FormLabel>
											<FormControl>
												<Slider
													min={0}
													max={1}
													step={0.01}
													defaultValue={[field.value]}
													onValueChange={(value) => field.onChange(value[0])}
												/>
											</FormControl>
											<FormDescription>Intensidad del efecto de aberración cromática.</FormDescription>
										</FormItem>
									)}
								/>

								{/* Desplazamiento general */}
								<FormField
									control={form.control}
									name="offset"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Desplazamiento general: {field.value}px</FormLabel>
											<FormControl>
												<Slider
													min={0}
													max={20}
													step={0.5}
													defaultValue={[field.value]}
													onValueChange={(value) => field.onChange(value[0])}
												/>
											</FormControl>
											<FormDescription>Controla el desplazamiento general de los colores.</FormDescription>
										</FormItem>
									)}
								/>

								{/* Desplazamiento canal rojo */}
								<FormField
									control={form.control}
									name="redOffset"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Desplazamiento Rojo: {field.value}px</FormLabel>
											<FormControl>
												<Slider
													min={-10}
													max={10}
													step={0.5}
													defaultValue={[field.value]}
													onValueChange={(value) => field.onChange(value[0])}
												/>
											</FormControl>
											<FormDescription>Controla el desplazamiento del canal rojo.</FormDescription>
										</FormItem>
									)}
								/>

								{/* Desplazamiento canal verde */}
								<FormField
									control={form.control}
									name="greenOffset"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Desplazamiento Verde: {field.value}px</FormLabel>
											<FormControl>
												<Slider
													min={-10}
													max={10}
													step={0.5}
													defaultValue={[field.value]}
													onValueChange={(value) => field.onChange(value[0])}
												/>
											</FormControl>
											<FormDescription>Controla el desplazamiento del canal verde.</FormDescription>
										</FormItem>
									)}
								/>

								{/* Desplazamiento canal azul */}
								<FormField
									control={form.control}
									name="blueOffset"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Desplazamiento Azul: {field.value}px</FormLabel>
											<FormControl>
												<Slider
													min={-10}
													max={10}
													step={0.5}
													defaultValue={[field.value]}
													onValueChange={(value) => field.onChange(value[0])}
												/>
											</FormControl>
											<FormDescription>Controla el desplazamiento del canal azul.</FormDescription>
										</FormItem>
									)}
								/>

								{/* Dirección */}
								<FormField
									control={form.control}
									name="direction"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Dirección</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecciona una dirección" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="horizontal">Horizontal</SelectItem>
													<SelectItem value="vertical">Vertical</SelectItem>
													<SelectItem value="radial">Radial</SelectItem>
													<SelectItem value="custom">Personalizado</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>Dirección del efecto de aberración cromática.</FormDescription>
										</FormItem>
									)}
								/>

								{/* Modo de mezcla */}
								<FormField
									control={form.control}
									name="blendMode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Modo de mezcla</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecciona un modo de mezcla" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="screen">Screen</SelectItem>
													<SelectItem value="overlay">Overlay</SelectItem>
													<SelectItem value="multiply">Multiply</SelectItem>
													<SelectItem value="difference">Difference</SelectItem>
													<SelectItem value="exclusion">Exclusion</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>Modo de mezcla para el efecto de aberración cromática.</FormDescription>
										</FormItem>
									)}
								/>

								{/* Animar al pasar el ratón */}
								<FormField
									control={form.control}
									name="animateOnHover"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
											<div className="space-y-0.5">
												<FormLabel>Animar al pasar el ratón</FormLabel>
												<FormDescription>El efecto se animará al pasar el ratón sobre la entidad.</FormDescription>
											</div>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
										</FormItem>
									)}
								/>

								{form.watch('animateOnHover') && (
									<>
										{/* Velocidad de animación */}
										<FormField
											control={form.control}
											name="animationSpeed"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Velocidad de animación: {field.value.toFixed(1)}</FormLabel>
													<FormControl>
														<Slider
															min={0.1}
															max={10}
															step={0.1}
															defaultValue={[field.value]}
															onValueChange={(value) => field.onChange(value[0])}
														/>
													</FormControl>
													<FormDescription>Controla la velocidad de la animación.</FormDescription>
												</FormItem>
											)}
										/>

										{/* Tipo de animación */}
										<FormField
											control={form.control}
											name="animationType"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Tipo de animación</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value}>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Selecciona un tipo de animación" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="pulse">Pulso</SelectItem>
															<SelectItem value="wave">Onda</SelectItem>
															<SelectItem value="random">Aleatorio</SelectItem>
														</SelectContent>
													</Select>
													<FormDescription>Tipo de animación para el efecto.</FormDescription>
												</FormItem>
											)}
										/>
									</>
								)}

								{/* Cantidad de desenfoque */}
								<FormField
									control={form.control}
									name="blurAmount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Cantidad de desenfoque: {field.value.toFixed(1)}</FormLabel>
											<FormControl>
												<Slider
													min={0}
													max={10}
													step={0.1}
													defaultValue={[field.value]}
													onValueChange={(value) => field.onChange(value[0])}
												/>
											</FormControl>
											<FormDescription>Controla la cantidad de desenfoque del efecto.</FormDescription>
										</FormItem>
									)}
								/>

								{/* Calidad */}
								<FormField
									control={form.control}
									name="quality"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Calidad</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecciona una calidad" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="low">Baja</SelectItem>
													<SelectItem value="medium">Media</SelectItem>
													<SelectItem value="high">Alta</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>Calidad del renderizado (impacta en el rendimiento).</FormDescription>
										</FormItem>
									)}
								/>

								{/* Modo de color */}
								<FormField
									control={form.control}
									name="colorMode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Modo de color</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecciona un modo de color" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="rgb">RGB</SelectItem>
													<SelectItem value="cmyk">CMYK</SelectItem>
													<SelectItem value="custom">Personalizado</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>Modelo de color para el efecto de aberración.</FormDescription>
										</FormItem>
									)}
								/>
							</>
						)}

						{/* Botón de guardar */}
						<Button type="submit" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Guardando...
								</>
							) : (
								<>
									<Save className="mr-2 h-4 w-4" />
									Guardar Cambios
								</>
							)}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
