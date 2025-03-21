'use client';

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { LayerSettingsProps } from '../../types';
import { defaultShaderConfig, shaderConfigSchema, type ShaderConfig } from '../shader-config-schema';

export function ShaderSettings({
	config,
	onChange,
	entityType,
	entityId,
}: LayerSettingsProps<ShaderConfig>) {
	// Inicializar formulario con configuración actual o valores por defecto
	const form = useForm<ShaderConfig>({
		resolver: zodResolver(shaderConfigSchema),
		defaultValues: {
			...defaultShaderConfig,
			...config,
		},
	});

	// Manejar cambios de formulario
	const handleSubmit = (values: ShaderConfig) => {
		onChange(values);
		toast.success('Configuración de shader actualizada');
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
				<Tabs defaultValue="basic" className="w-full">
					<TabsList className="grid grid-cols-2 mb-4">
						<TabsTrigger value="basic">Básico</TabsTrigger>
						<TabsTrigger value="advanced">Avanzado</TabsTrigger>
					</TabsList>

					{/* Configuración básica */}
					<TabsContent value="basic" className="space-y-4">
						{/* Activar/Desactivar */}
						<FormField
							control={form.control}
							name="enabled"
							render={({ field }) => (
								<FormItem className="flex items-center space-x-2 rounded-md p-2 border">
									<FormControl>
										<Checkbox checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
									<div className="space-y-0.5">
										<FormLabel className="text-base">Activar efecto shader</FormLabel>
										<FormDescription>
											Habilita o deshabilita completamente el efecto de shader
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>

						{/* Tipo de shader */}
						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tipo de shader</FormLabel>
									<Select
										value={field.value}
										onValueChange={field.onChange}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Selecciona un tipo de shader" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="base">Base</SelectItem>
											<SelectItem value="distortion">Distorsión</SelectItem>
											<SelectItem value="hologram">Holograma</SelectItem>
											<SelectItem value="wave">Ondas</SelectItem>
											<SelectItem value="particle">Partículas</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>
										Selecciona el efecto de shader que deseas aplicar
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
									<FormLabel>Intensidad: {field.value.toFixed(2)}</FormLabel>
									<FormControl>
										<Slider
											value={[field.value]}
											min={0}
											max={1}
											step={0.01}
											onValueChange={(vals) => field.onChange(vals[0])}
										/>
									</FormControl>
									<FormDescription>
										Ajusta la intensidad del efecto de shader
									</FormDescription>
								</FormItem>
							)}
						/>

						{/* Velocidad para animaciones */}
						<FormField
							control={form.control}
							name="speed"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Velocidad: {field.value.toFixed(2)}</FormLabel>
									<FormControl>
										<Slider
											value={[field.value]}
											min={0}
											max={3}
											step={0.1}
											onValueChange={(vals) => field.onChange(vals[0])}
										/>
									</FormControl>
									<FormDescription>
										Controla la velocidad de las animaciones del shader
									</FormDescription>
								</FormItem>
							)}
						/>

						{/* Activar animación */}
						<FormField
							control={form.control}
							name="animated"
							render={({ field }) => (
								<FormItem className="flex items-center space-x-2 rounded-md p-2 border">
									<FormControl>
										<Checkbox checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
									<div className="space-y-0.5">
										<FormLabel className="text-base">Animación</FormLabel>
										<FormDescription>
											Activa las animaciones del shader
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>

						{/* Visible al pasar el ratón */}
						<FormField
							control={form.control}
							name="visibleOnHover"
							render={({ field }) => (
								<FormItem className="flex items-center space-x-2 rounded-md p-2 border">
									<FormControl>
										<Checkbox checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
									<div className="space-y-0.5">
										<FormLabel className="text-base">Solo visible al hover</FormLabel>
										<FormDescription>
											El efecto solo se muestra al pasar el ratón
										</FormDescription>
									</div>
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
									<Select
										value={field.value}
										onValueChange={field.onChange}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Selecciona un modo de mezcla" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="normal">Normal</SelectItem>
											<SelectItem value="multiply">Multiplicar</SelectItem>
											<SelectItem value="screen">Pantalla</SelectItem>
											<SelectItem value="overlay">Superposición</SelectItem>
											<SelectItem value="darken">Oscurecer</SelectItem>
											<SelectItem value="lighten">Aclarar</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>
										Define cómo se mezcla el shader con las capas inferiores
									</FormDescription>
								</FormItem>
							)}
						/>

						{/* Opacidad */}
						<FormField
							control={form.control}
							name="opacity"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Opacidad: {field.value?.toFixed(2) || "1.00"}</FormLabel>
									<FormControl>
										<Slider
											value={[field.value || 1]}
											min={0}
											max={1}
											step={0.01}
											onValueChange={(vals) => field.onChange(vals[0])}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
					</TabsContent>

					{/* Configuración avanzada */}
					<TabsContent value="advanced" className="space-y-4">
						<Accordion type="single" collapsible className="w-full">
							{/* Vertex Shader */}
							<AccordionItem value="vertex">
								<AccordionTrigger>Vertex Shader</AccordionTrigger>
								<AccordionContent>
									<FormField
										control={form.control}
										name="advanced.vertexShader"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Código GLSL para Vertex Shader</FormLabel>
												<FormControl>
													<Textarea
														className="font-mono text-xs h-40"
														value={field.value || ''}
														onChange={field.onChange}
														placeholder={`attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = 0.5 * (position + 1.0);
  gl_Position = vec4(position, 0.0, 1.0);
}`}
													/>
												</FormControl>
												<FormDescription>
													Personaliza el vertex shader con código GLSL
												</FormDescription>
											</FormItem>
										)}
									/>
								</AccordionContent>
							</AccordionItem>

							{/* Fragment Shader */}
							<AccordionItem value="fragment">
								<AccordionTrigger>Fragment Shader</AccordionTrigger>
								<AccordionContent>
									<FormField
										control={form.control}
										name="advanced.fragmentShader"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Código GLSL para Fragment Shader</FormLabel>
												<FormControl>
													<Textarea
														className="font-mono text-xs h-40"
														value={field.value || ''}
														onChange={field.onChange}
														placeholder={`precision mediump float;
varying vec2 vUv;
uniform float time;
uniform vec2 resolution;

void main() {
  vec2 uv = vUv;
  vec3 color = 0.5 + 0.5 * cos(time + uv.xyx + vec3(0, 2, 4));
  gl_FragColor = vec4(color, 1.0);
}`}
													/>
												</FormControl>
												<FormDescription>
													Personaliza el fragment shader con código GLSL
												</FormDescription>
											</FormItem>
										)}
									/>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					</TabsContent>
				</Tabs>

				{/* Botón de guardar */}
				<div className="flex justify-end">
					<Button
						type="submit"
						className={cn("gap-1", form.formState.isSubmitting && "opacity-70 pointer-events-none")}
						disabled={form.formState.isSubmitting}
					>
						Guardar cambios
					</Button>
				</div>
			</form>
		</Form>
	);
}