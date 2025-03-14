'use client';

import { getBorderConfig, updateBorderConfig } from '@/components/features/entity-cards/layers/border/actions';
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

const borderFormSchema = z.object({
	enabled: z.boolean(),
	width: z.number().min(0),
	style: z.enum(['solid', 'dashed', 'dotted', 'double']),
	color: z.string(),
	radius: z.number().min(0).optional(),
	animated: z.boolean().optional(),
	animationType: z.enum(['none', 'pulse', 'flow', 'rainbow']).optional(),
	animationSpeed: z.number().min(0).optional(),
	glowAmount: z.number().min(0).optional(),
	opacity: z.number().min(0).max(1).optional(),
	gradient: z.array(z.string()).optional(),
	dashPattern: z.array(z.number()).optional(),
	cornerStyle: z.enum(['round', 'bevel', 'miter']),
	borderImage: z.string().optional(),
});

type BorderFormValues = z.infer<typeof borderFormSchema>;

interface BorderSettingsProps {
	entityType: string;
	entityId?: string;
	className?: string;
}

export function BorderSettings({ entityType, entityId, className }: BorderSettingsProps) {
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<BorderFormValues>({
		resolver: zodResolver(borderFormSchema),
		defaultValues: {
			enabled: true,
			width: 2,
			style: 'solid',
			color: '#ffffff',
			radius: 8,
			animated: false,
			animationType: 'none',
			animationSpeed: 1,
			glowAmount: 0,
			opacity: 1,
			gradient: [],
			dashPattern: [],
			cornerStyle: 'round',
			borderImage: '',
		},
	});

	useEffect(() => {
		const loadConfig = async () => {
			setIsLoading(true);
			try {
				const response = await getBorderConfig(entityType, entityId);
				if (response.success && response.data) {
					form.reset(response.data);
				}
			} catch (error) {
				console.error('Error al cargar la configuración:', error);
				toast({
					title: 'Error',
					description: 'No se pudo cargar la configuración de borde',
					variant: 'destructive',
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadConfig();
	}, [entityType, entityId, form]);

	const onSubmit = async (values: BorderFormValues) => {
		setIsLoading(true);
		try {
			const response = await updateBorderConfig(entityType, values, entityId);
			if (response.success) {
				toast({
					title: 'Éxito',
					description: 'Configuración de borde actualizada',
				});
			} else {
				throw new Error(response.message);
			}
		} catch (error) {
			console.error('Error al actualizar la configuración:', error);
			toast({
				title: 'Error',
				description: 'No se pudo actualizar la configuración de borde',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader>
				<CardTitle>Configuración de Borde</CardTitle>
				<CardDescription>Personaliza el borde de la tarjeta</CardDescription>
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
										<FormLabel className="text-base">Activar Borde</FormLabel>
										<FormDescription>Habilita o deshabilita el borde</FormDescription>
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
								name="width"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Ancho</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0}
												step={1}
												{...field}
												onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="style"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Estilo</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecciona un estilo" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="solid">Sólido</SelectItem>
												<SelectItem value="dashed">Discontinuo</SelectItem>
												<SelectItem value="dotted">Punteado</SelectItem>
												<SelectItem value="double">Doble</SelectItem>
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
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
												value={[field.value || 1]}
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
								name="cornerStyle"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Estilo de Esquinas</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecciona un estilo" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="round">Redondeado</SelectItem>
												<SelectItem value="bevel">Biselado</SelectItem>
												<SelectItem value="miter">Angular</SelectItem>
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="radius"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Radio de Esquinas</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0}
												step={1}
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
										<FormDescription>Habilita o deshabilita la animación del borde</FormDescription>
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
									name="animationType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tipo de Animación</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecciona un tipo" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="none">Ninguna</SelectItem>
													<SelectItem value="pulse">Pulso</SelectItem>
													<SelectItem value="flow">Flujo</SelectItem>
													<SelectItem value="rainbow">Arcoíris</SelectItem>
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>

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
							</div>
						)}

						<FormField
							control={form.control}
							name="glowAmount"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Cantidad de Brillo</FormLabel>
									<FormControl>
										<Slider
											min={0}
											max={20}
											step={1}
											value={[field.value || 0]}
											onValueChange={([value]) => field.onChange(value)}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="borderImage"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Imagen de Borde</FormLabel>
									<FormControl>
										<Input
											type="text"
											placeholder="URL de la imagen"
											{...field}
											onChange={(e) => field.onChange(e.target.value)}
										/>
									</FormControl>
									<FormDescription>URL de la imagen para usar como borde</FormDescription>
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
