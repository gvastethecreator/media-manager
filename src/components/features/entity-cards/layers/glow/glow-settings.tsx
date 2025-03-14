'use client';

import { getGlowConfig, updateGlowConfig } from '@/components/features/entity-cards/layers/glow/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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

const glowFormSchema = z.object({
	enabled: z.boolean(),
	intensity: z.number().min(0).max(1),
	color: z.string(),
	size: z.number().min(0),
	blurAmount: z.number().min(0),
	animationType: z.enum(['none', 'pulse', 'wave', 'sparkle']),
	pulseSpeed: z.number().min(0),
	visibleOnHover: z.boolean(),
});

type GlowFormValues = z.infer<typeof glowFormSchema>;

interface GlowSettingsProps {
	entityType: string;
	entityId?: string;
	className?: string;
}

export function GlowSettings({ entityType, entityId, className }: GlowSettingsProps) {
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<GlowFormValues>({
		resolver: zodResolver(glowFormSchema),
		defaultValues: {
			enabled: true,
			intensity: 0.5,
			color: '#ffffff',
			size: 20,
			blurAmount: 10,
			animationType: 'none',
			pulseSpeed: 1,
			visibleOnHover: false,
		},
	});

	useEffect(() => {
		const loadConfig = async () => {
			try {
				setIsLoading(true);
				const response = await getGlowConfig(entityType, entityId);

				if (response.success && response.data) {
					form.reset({
						enabled: response.data.enabled,
						intensity: response.data.intensity,
						color: response.data.color,
						size: response.data.size,
						blurAmount: response.data.blurAmount,
						animationType: response.data.animationType || 'none',
						pulseSpeed: response.data.pulseSpeed || 1,
						visibleOnHover: response.data.visibleOnHover || false,
					});
				} else {
					toast({
						title: 'Error',
						description: response.message,
						variant: 'destructive',
					});
				}
			} catch (error) {
				console.error('Error al cargar la configuración de glow:', error);
				toast({
					title: 'Error',
					description: 'No se pudo cargar la configuración de glow.',
					variant: 'destructive',
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadConfig();
	}, [entityType, entityId, form]);

	const onSubmit = async (values: GlowFormValues) => {
		try {
			setIsLoading(true);
			const response = await updateGlowConfig(entityType, values, entityId);

			if (response.success) {
				toast({
					title: 'Éxito',
					description: 'Configuración de glow actualizada correctamente.',
				});
			} else {
				toast({
					title: 'Error',
					description: response.message,
					variant: 'destructive',
				});
			}
		} catch (error) {
			console.error('Error al actualizar la configuración de glow:', error);
			toast({
				title: 'Error',
				description: 'No se pudo actualizar la configuración de glow.',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader>
				<CardTitle>Configuración de Efecto Glow</CardTitle>
				<CardDescription>
					Configura el efecto de brillo para las tarjetas. Este efecto añade un halo luminoso alrededor del contenido.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="enabled"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">Habilitar Efecto Glow</FormLabel>
										<FormDescription>Activa o desactiva el efecto de brillo en las tarjetas.</FormDescription>
									</div>
									<FormControl>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
								</FormItem>
							)}
						/>

						{form.watch('enabled') && (
							<>
								<FormField
									control={form.control}
									name="color"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Color del Glow</FormLabel>
											<FormControl>
												<div className="flex gap-2">
													<Input {...field} type="color" className="w-12 h-12 p-1" />
													<Input {...field} placeholder="#ffffff" className="flex-1" />
												</div>
											</FormControl>
											<FormDescription>Selecciona el color del efecto glow.</FormDescription>
										</FormItem>
									)}
								/>

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
													value={[field.value]}
													onValueChange={(values) => field.onChange(values[0])}
												/>
											</FormControl>
											<FormDescription>Controla la intensidad del efecto glow.</FormDescription>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="size"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tamaño: {field.value}px</FormLabel>
											<FormControl>
												<Slider
													min={0}
													max={100}
													step={1}
													value={[field.value]}
													onValueChange={(values) => field.onChange(values[0])}
												/>
											</FormControl>
											<FormDescription>Controla el tamaño del efecto glow en píxeles.</FormDescription>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="blurAmount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Desenfoque: {field.value}px</FormLabel>
											<FormControl>
												<Slider
													min={0}
													max={50}
													step={1}
													value={[field.value]}
													onValueChange={(values) => field.onChange(values[0])}
												/>
											</FormControl>
											<FormDescription>Controla el nivel de desenfoque del efecto glow.</FormDescription>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="animationType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tipo de Animación</FormLabel>
											<Select value={field.value} onValueChange={field.onChange}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecciona un tipo de animación" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="none">Sin animación</SelectItem>
													<SelectItem value="pulse">Pulsar</SelectItem>
													<SelectItem value="wave">Onda</SelectItem>
													<SelectItem value="sparkle">Destellos</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>Selecciona el tipo de animación para el efecto glow.</FormDescription>
										</FormItem>
									)}
								/>

								{form.watch('animationType') !== 'none' && (
									<FormField
										control={form.control}
										name="pulseSpeed"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Velocidad de Animación: {field.value.toFixed(1)}x</FormLabel>
												<FormControl>
													<Slider
														min={0.1}
														max={3}
														step={0.1}
														value={[field.value]}
														onValueChange={(values) => field.onChange(values[0])}
													/>
												</FormControl>
												<FormDescription>Controla la velocidad de la animación.</FormDescription>
											</FormItem>
										)}
									/>
								)}

								<FormField
									control={form.control}
									name="visibleOnHover"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
											<div className="space-y-0.5">
												<FormLabel className="text-base">Visible solo al hacer hover</FormLabel>
												<FormDescription>
													Muestra el efecto glow solo cuando el ratón está sobre la tarjeta.
												</FormDescription>
											</div>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
										</FormItem>
									)}
								/>
							</>
						)}

						<Button type="submit" disabled={isLoading} className="w-full">
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Guardando...
								</>
							) : (
								<>
									<Save className="mr-2 h-4 w-4" />
									Guardar Configuración
								</>
							)}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
