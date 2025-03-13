'use client';

import { getScanlinesConfig, updateScanlinesConfig } from '@/components/features/entity-cards/layers/scanlines/actions';
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

const scanlinesFormSchema = z.object({
	enabled: z.boolean(),
	opacity: z.number().min(0).max(1),
	color: z.string(),
	spacing: z.number().min(1),
	thickness: z.number().min(0.1),
	angle: z.number().min(-180).max(180),
	animated: z.boolean(),
	animationSpeed: z.number().min(0).optional(),
	blend: z.enum(['normal', 'overlay', 'multiply', 'screen']),
	direction: z.enum(['vertical', 'horizontal']),
	pattern: z.enum(['linear', 'dotted']),
	distortion: z.number().min(0).max(1),
	noise: z.number().min(0).max(1),
	scanlineHeight: z.number().min(0.1),
});

type ScanlinesFormValues = z.infer<typeof scanlinesFormSchema>;

interface ScanlinesSettingsProps {
	entityType: string;
	entityId?: string;
	className?: string;
}

export function ScanlinesSettings({ entityType, entityId, className }: ScanlinesSettingsProps) {
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<ScanlinesFormValues>({
		resolver: zodResolver(scanlinesFormSchema),
		defaultValues: {
			enabled: true,
			opacity: 0.3,
			color: '#000000',
			spacing: 2,
			thickness: 0.5,
			angle: 0,
			animated: false,
			animationSpeed: 1,
			blend: 'overlay',
			direction: 'vertical',
			pattern: 'linear',
			distortion: 0,
			noise: 0,
			scanlineHeight: 1,
		},
	});

	useEffect(() => {
		const loadConfig = async () => {
			setIsLoading(true);
			try {
				const response = await getScanlinesConfig(entityType, entityId);
				if (response.success && response.data) {
					form.reset(response.data);
				}
			} catch (error) {
				console.error('Error al cargar la configuración:', error);
				toast({
					title: 'Error',
					description: 'No se pudo cargar la configuración de scanlines',
					variant: 'destructive',
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadConfig();
	}, [entityType, entityId, form]);

	const onSubmit = async (values: ScanlinesFormValues) => {
		setIsLoading(true);
		try {
			const response = await updateScanlinesConfig(entityType, values, entityId);
			if (response.success) {
				toast({
					title: 'Éxito',
					description: 'Configuración de scanlines actualizada',
				});
			} else {
				throw new Error(response.message);
			}
		} catch (error) {
			console.error('Error al actualizar la configuración:', error);
			toast({
				title: 'Error',
				description: 'No se pudo actualizar la configuración de scanlines',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader>
				<CardTitle>Configuración de Scanlines</CardTitle>
				<CardDescription>Personaliza el efecto de líneas de escaneo</CardDescription>
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
										<FormLabel className="text-base">Activar Scanlines</FormLabel>
										<FormDescription>Habilita o deshabilita el efecto de scanlines</FormDescription>
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
								name="opacity"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Opacidad</FormLabel>
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
								name="color"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Color</FormLabel>
										<FormControl>
											<Input type="color" {...field} />
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="spacing"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Espaciado</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={1}
												step={0.1}
												{...field}
												onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="thickness"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Grosor</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0.1}
												step={0.1}
												{...field}
												onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
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
												<SelectItem value="vertical">Vertical</SelectItem>
												<SelectItem value="horizontal">Horizontal</SelectItem>
											</SelectContent>
										</Select>
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
												<SelectItem value="linear">Lineal</SelectItem>
												<SelectItem value="dotted">Punteado</SelectItem>
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
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
												<SelectItem value="overlay">Superposición</SelectItem>
												<SelectItem value="multiply">Multiplicar</SelectItem>
												<SelectItem value="screen">Pantalla</SelectItem>
											</SelectContent>
										</Select>
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

						<FormField
							control={form.control}
							name="animated"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">Animación</FormLabel>
										<FormDescription>Habilita o deshabilita la animación de scanlines</FormDescription>
									</div>
									<FormControl>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
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
										<FormLabel>Velocidad de Animación</FormLabel>
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
						)}

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="distortion"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Distorsión</FormLabel>
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
								name="noise"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Ruido</FormLabel>
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
							name="scanlineHeight"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Altura de Línea</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={0.1}
											step={0.1}
											{...field}
											onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

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