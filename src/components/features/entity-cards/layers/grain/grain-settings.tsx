'use client';

import { getGrainConfig, updateGrainConfig } from '@/components/features/entity-cards/layers/grain/actions';
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

const grainFormSchema = z.object({
	enabled: z.boolean(),
	intensity: z.number().min(0).max(1),
	size: z.number().min(0.1),
	animated: z.boolean(),
	speed: z.number().min(0).optional(),
	colorMode: z.enum(['monochrome', 'color']),
	opacity: z.number().min(0).max(1),
	blend: z.enum(['normal', 'overlay', 'multiply', 'screen']),
	seed: z.number().int().min(0),
	pattern: z.enum(['perlin', 'simplex', 'worley']),
	fractalNoise: z.boolean(),
	roughness: z.number().min(0).max(1),
	distribution: z.enum(['gaussian', 'uniform']),
});

type GrainFormValues = z.infer<typeof grainFormSchema>;

interface GrainSettingsProps {
	entityType: string;
	entityId?: string;
	className?: string;
}

export function GrainSettings({ entityType, entityId, className }: GrainSettingsProps) {
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<GrainFormValues>({
		resolver: zodResolver(grainFormSchema),
		defaultValues: {
			enabled: true,
			intensity: 0.3,
			size: 1,
			animated: true,
			speed: 1,
			colorMode: 'monochrome',
			opacity: 0.2,
			blend: 'overlay',
			seed: 12345,
			pattern: 'perlin',
			fractalNoise: false,
			roughness: 0.5,
			distribution: 'gaussian',
		},
	});

	useEffect(() => {
		const loadConfig = async () => {
			setIsLoading(true);
			try {
				const response = await getGrainConfig(entityType, entityId);
				if (response.success && response.data) {
					form.reset(response.data);
				}
			} catch (error) {
				console.error('Error al cargar la configuración:', error);
				toast({
					title: 'Error',
					description: 'No se pudo cargar la configuración de grain',
					variant: 'destructive',
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadConfig();
	}, [entityType, entityId, form]);

	const onSubmit = async (values: GrainFormValues) => {
		setIsLoading(true);
		try {
			const response = await updateGrainConfig(entityType, values, entityId);
			if (response.success) {
				toast({
					title: 'Éxito',
					description: 'Configuración de grain actualizada',
				});
			} else {
				throw new Error(response.message);
			}
		} catch (error) {
			console.error('Error al actualizar la configuración:', error);
			toast({
				title: 'Error',
				description: 'No se pudo actualizar la configuración de grain',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader>
				<CardTitle>Configuración de Grain</CardTitle>
				<CardDescription>Personaliza el efecto de grano</CardDescription>
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
										<FormLabel className="text-base">Activar Grain</FormLabel>
										<FormDescription>Habilita o deshabilita el efecto de grano</FormDescription>
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
								name="size"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tamaño</FormLabel>
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
												<SelectItem value="perlin">Perlin</SelectItem>
												<SelectItem value="simplex">Simplex</SelectItem>
												<SelectItem value="worley">Worley</SelectItem>
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="distribution"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Distribución</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecciona una distribución" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="gaussian">Gaussiana</SelectItem>
												<SelectItem value="uniform">Uniforme</SelectItem>
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="colorMode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Modo de Color</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecciona un modo" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="monochrome">Monocromático</SelectItem>
												<SelectItem value="color">Color</SelectItem>
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>

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
						</div>

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
								name="roughness"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Rugosidad</FormLabel>
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
							name="fractalNoise"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">Ruido Fractal</FormLabel>
										<FormDescription>Habilita o deshabilita el ruido fractal</FormDescription>
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
										<FormDescription>Habilita o deshabilita la animación del grano</FormDescription>
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
								name="speed"
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

						<FormField
							control={form.control}
							name="seed"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Semilla</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={0}
											step={1}
											{...field}
											onChange={(e) => field.onChange(Number.parseInt(e.target.value, 10))}
										/>
									</FormControl>
									<FormDescription>Valor para generar patrones consistentes</FormDescription>
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
