'use client';

import { type AnimatedBorderConfig, getAnimatedBorderConfig, updateAnimatedBorderConfig } from '@/components/features/entity-cards/layers/animated-border/actions';
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

// Schema para la validación del formulario
const animatedBorderFormSchema = z.object({
  enabled: z.boolean().default(true),
  width: z.number().min(0.5).default(2),
  color: z.string().default('#ffffff'),
  secondaryColor: z.string().default('#00ffff'),
  animationSpeed: z.number().min(0.1).max(10).default(1),
  animationType: z.enum(['flow', 'pulse', 'rainbow', 'sparkle']).default('flow'),
  glowAmount: z.number().min(0).max(20).default(5),
  dashArray: z.string().optional(),
  opacity: z.number().min(0).max(1).default(0.8),
  glowColor: z.string().default('rgba(255, 255, 255, 0.5)'),
  borderRadius: z.number().min(0).default(4),
});

type AnimatedBorderFormValues = z.infer<typeof animatedBorderFormSchema>;

interface AnimatedBorderSettingsProps {
  entityType: string;
  entityId?: string;
  className?: string;
}

export function AnimatedBorderSettings({ entityType, entityId, className }: AnimatedBorderSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewStyle, setPreviewStyle] = useState<Record<string, string>>({});

  // Inicializar el formulario con valores por defecto
  const form = useForm<AnimatedBorderFormValues>({
    resolver: zodResolver(animatedBorderFormSchema),
    defaultValues: {
      enabled: true,
      width: 2,
      color: '#ffffff',
      secondaryColor: '#00ffff',
      animationSpeed: 1,
      animationType: 'flow',
      glowAmount: 5,
      opacity: 0.8,
      glowColor: 'rgba(255, 255, 255, 0.5)',
      borderRadius: 4,
    },
  });

  // Cargar la configuración al montar el componente
  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true);
      try {
        const response = await getAnimatedBorderConfig(entityType, entityId);
        if (response.success && response.data) {
          form.reset(response.data);
          updatePreview(response.data);
        }
      } catch (error) {
        console.error('Error al cargar la configuración:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar la configuración de borde animado',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [entityType, entityId, form]);

  // Actualizar el preview cuando cambien los valores del formulario
  useEffect(() => {
    const subscription = form.watch((values) => {
      updatePreview(values as AnimatedBorderConfig);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Función para actualizar el estilo de previsualización
  const updatePreview = (values: AnimatedBorderConfig) => {
    if (!values.enabled) {
      setPreviewStyle({});
      return;
    }

    const style: Record<string, string> = {
      borderWidth: `${values.width}px`,
      borderStyle: 'solid',
      borderRadius: `${values.borderRadius}px`,
      opacity: `${values.opacity}`,
    };

    // Diferentes estilos según el tipo de animación
    switch (values.animationType) {
      case 'flow':
        style.borderColor = values.color;
        style.boxShadow = `0 0 ${values.glowAmount}px ${values.glowColor}`;
        break;
      case 'pulse':
        style.borderColor = values.color;
        style.boxShadow = `0 0 ${values.glowAmount}px ${values.glowColor}`;
        break;
      case 'rainbow':
        style.borderImage = 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet) 1';
        break;
      case 'sparkle':
        style.borderColor = values.color;
        style.boxShadow = `0 0 ${values.glowAmount}px ${values.glowColor}`;
        break;
    }

    setPreviewStyle(style);
  };

  // Manejar el envío del formulario
  const onSubmit = async (values: AnimatedBorderFormValues) => {
    setIsLoading(true);
    try {
      const response = await updateAnimatedBorderConfig(entityType, values, entityId);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Configuración de borde animado actualizada',
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error al actualizar la configuración:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la configuración de borde animado',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Configuración de Borde Animado</CardTitle>
        <CardDescription>
          Personaliza el aspecto y comportamiento del borde animado para esta entidad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Vista previa */}
            {form.watch('enabled') && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Vista previa</h3>
                <div
                  className="w-full h-20 border-box transition-all duration-300"
                  style={previewStyle}
                />
              </div>
            )}

            {/* Activar/Desactivar */}
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Activar Borde Animado</FormLabel>
                    <FormDescription>
                      Activa o desactiva el efecto de borde animado.
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

            {form.watch('enabled') && (
              <>
                {/* Tipo de animación */}
                <FormField
                  control={form.control}
                  name="animationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Animación</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo de animación" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="flow">Flujo</SelectItem>
                          <SelectItem value="pulse">Pulso</SelectItem>
                          <SelectItem value="rainbow">Arcoíris</SelectItem>
                          <SelectItem value="sparkle">Destello</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        El tipo de animación que se aplicará al borde.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Color principal */}
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color Principal</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            {...field}
                            type="text"
                            placeholder="#ffffff"
                          />
                          <input
                            type="color"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-10 h-10 rounded-md"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Color principal del borde animado.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Color secundario */}
                <FormField
                  control={form.control}
                  name="secondaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color Secundario</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            {...field}
                            type="text"
                            placeholder="#00ffff"
                          />
                          <input
                            type="color"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-10 h-10 rounded-md"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Color secundario para efectos de transición.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Velocidad de animación */}
                <FormField
                  control={form.control}
                  name="animationSpeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Velocidad de Animación: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0.1}
                          max={10}
                          step={0.1}
                          defaultValue={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Controla la velocidad de la animación.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Ancho del borde */}
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ancho del Borde: {field.value}px</FormLabel>
                      <FormControl>
                        <Slider
                          min={0.5}
                          max={10}
                          step={0.5}
                          defaultValue={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Grosor del borde animado en píxeles.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Cantidad de brillo */}
                <FormField
                  control={form.control}
                  name="glowAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad de Brillo: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={20}
                          step={1}
                          defaultValue={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Intensidad del efecto de brillo alrededor del borde.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Color del brillo */}
                <FormField
                  control={form.control}
                  name="glowColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color del Brillo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="rgba(255, 255, 255, 0.5)"
                        />
                      </FormControl>
                      <FormDescription>
                        Color del efecto de brillo (formato rgba recomendado).
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
                      <FormLabel>Opacidad: {Math.round(field.value * 100)}%</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          defaultValue={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Transparencia del borde animado.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Radio del borde */}
                <FormField
                  control={form.control}
                  name="borderRadius"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Radio del Borde: {field.value}px</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={20}
                          step={1}
                          defaultValue={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Redondeo de las esquinas del borde.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Patrón de segmentos (opcional) */}
                <FormField
                  control={form.control}
                  name="dashArray"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patrón de Segmentos (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          type="text"
                          placeholder="5,5"
                        />
                      </FormControl>
                      <FormDescription>
                        Patrón de segmentos del borde (formato: "largo,espacio").
                      </FormDescription>
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