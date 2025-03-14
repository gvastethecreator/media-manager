'use client';

import {
	getHolographicConfig,
	updateHolographicConfig,
} from '@/components/features/entity-cards/layers/holographic/actions';
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

const holographicFormSchema = z.object({
	enabled: z.boolean(),
	intensity: z.number().min(0).max(1),
	pattern: z.enum(['rainbow', 'linear', 'radial', 'custom']),
	colors: z.array(z.string()).min(1),
	speed: z.number().min(0).optional(),
	angle: z.number().min(-180).max(180).optional(),
	scale: z.number().min(0).optional(),
	blend: z.enum(['normal', 'screen', 'overlay', 'soft-light']).optional(),
	animated: z.boolean().optional(),
	interactiveMode: z.enum(['none', 'tilt', 'mouse']).optional(),
	depth: z.number().min(0).max(1),
	refraction: z.number().min(0).max(1),
	dispersion: z.number().min(0).max(1),
	specularHighlights: z.boolean(),
	iridescence: z.number().min(0).max(1),
});

type HolographicFormValues = z.infer<typeof holographicFormSchema>;

interface HolographicSettingsProps {
	entityType: string;
	entityId?: string;
	className?: string;
}

export function HolographicSettings({ entityType, entityId, className }: HolographicSettingsProps) {
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<HolographicFormValues>({
		resolver: zodResolver(holographicFormSchema),
		defaultValues: {
			enabled: true,
			intensity: 0.5,
			pattern: 'rainbow',
			colors: ['#ff0000', '#00ff00', '#0000ff'],
			speed: 1,
			angle: 45,
			scale: 1,
			blend: 'overlay',
			animated: true,
			interactiveMode: 'tilt',
			depth: 0.5,
			refraction: 0.5,
			dispersion: 0.3,
			specularHighlights: true,
			iridescence: 0.5,
		},
	});

	useEffect(() => {
		const loadConfig = async () => {
			setIsLoading(true);
			try {
				const response = await getHolographicConfig(entityType, entityId);
				if (response.success && response.data) {
					form.reset(response.data);
				}
			} catch (error) {
				console.error('Error al cargar la configuración:', error);
				toast({
					title: 'Error',
					description: 'No se pudo cargar la configuración holográfica',
					variant: 'destructive',
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadConfig();
	}, [entityType, entityId, form]);

	const onSubmit = async (values: HolographicFormValues) => {
		setIsLoading(true);
		try {
			const response = await updateHolographicConfig(entityType, values, entityId);
			if (response.success) {
				toast({
					title: 'Éxito',
					description: 'Configuración holográfica actualizada',
				});
			} else {
				throw new Error(response.message);
			}
		} catch (error) {
			console.error('Error al actualizar la configuración:', error);
			toast({
				title: 'Error',
				description: 'No se pudo actualizar la configuración holográfica',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader>
				<CardTitle>Configuración Holográfica</CardTitle>
				<CardDescription>Personaliza el efecto holográfico</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="enabled"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">Activar Efecto Holográfico</FormLabel>
										<FormDescription>Habilita o deshabilita el efecto holográfico</FormDescription>
									</div>
									<FormControl>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
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
								name="pattern"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Patrón</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecciona un patrón" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="rainbow">Arcoíris</SelectItem>
												<SelectItem value="linear">Lineal</SelectItem>
												<SelectItem value="radial">Radial</SelectItem>
												<SelectItem value="custom">Personalizado</SelectItem>
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-3 gap-4">
							{form.watch('pattern') === 'custom' &&
								form.watch('colors').map((_color, index) => (
									<FormField
										key={index}
										control={form.control}
										name={`colors.${index}`}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Color {index + 1}</FormLabel>
												<FormControl>
													<Input type="color" {...field} />
												</FormControl>
											</FormItem>
										)}
									/>
								))}
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="blend"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Modo de Mezcla</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecciona un modo" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="normal">Normal</SelectItem>
												<SelectItem value="screen">Pantalla</SelectItem>
												<SelectItem value="overlay">Superposición</SelectItem>
												<SelectItem value="soft-light">Luz Suave</SelectItem>
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="interactiveMode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Modo Interactivo</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecciona un modo" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">Ninguno</SelectItem>
												<SelectItem value="tilt">Inclinación</SelectItem>
												<SelectItem value="mouse">Ratón</SelectItem>
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="depth"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Profundidad</FormLabel>
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
								name="refraction"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Refracción</FormLabel>
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
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="dispersion"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Dispersión</FormLabel>
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
								name="iridescence"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Iridiscencia</FormLabel>
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
						</div>

						<FormField
							control={form.control}
							name="specularHighlights"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">Brillos Especulares</FormLabel>
										<FormDescription>Habilita o deshabilita los brillos especulares</FormDescription>
									</div>
									<FormControl>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="animated"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">Animación</FormLabel>
										<FormDescription>Habilita o deshabilita la animación del efecto</FormDescription>
									</div>
									<FormControl>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
								</FormItem>
							)}
						/>

						{form.watch('animated') && (
							<div className="grid grid-cols-2 gap-4">
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
													value={[field.value || 1]}
													onValueChange={([value]) => field.onChange(value)}
												/>
											</FormControl>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="angle"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Ángulo</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={-180}
													max={180}
													{...field}
													onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
							</div>
						)}

						<Button type="submit" className="w-full" disabled={isLoading}>
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
