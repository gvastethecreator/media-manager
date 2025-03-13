'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { InfoIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { type GlitchEffectConfig, getGlitchEffectConfig, updateGlitchEffectConfig } from './actions/glitch-effect-config.action';

// Schema para el formulario
const formSchema = z.object({
  enabled: z.boolean().default(true),
  intensity: z.number().min(0).max(1).default(0.1),
  frequency: z.number().min(0).max(10).default(0.05),
  duration: z.number().min(0).max(10).default(0.2),
  visibleOnHover: z.boolean().default(true),
  triggerOnHover: z.boolean().default(false),
  randomTrigger: z.boolean().default(false),
  randomFrequency: z.number().min(0).max(1).default(0.1),
  sliceCount: z.number().int().min(0).max(50).default(10),
  sliceOffset: z.number().min(0).max(20).default(5),
  colorShiftAmount: z.number().min(0).max(1).default(0.1),
  noiseIntensity: z.number().min(0).max(1).default(0.2),
  scanlineEffect: z.boolean().default(true),
  distortionType: z.enum(['digital', 'analog', 'vhs', 'custom']).default('digital'),
  blendMode: z.enum(['normal', 'overlay', 'screen', 'multiply', 'difference']).default('overlay'),
  stopAfterSeconds: z.number().min(0).max(10).default(2),
  affectContent: z.boolean().default(true),
  rgbShiftEnabled: z.boolean().default(true),
  brightnessNoise: z.number().min(0).max(1).default(0.1),
  staticNoise: z.number().min(0).max(1).default(0.05),
});

// Interfaz para las propiedades del componente
interface GlitchEffectConfigFormProps {
  entityType: string;
  entityId?: string;
  defaultValues?: GlitchEffectConfig;
}

export function GlitchEffectConfigForm({
  entityType,
  entityId,
  defaultValues,
}: GlitchEffectConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Configuración del formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      enabled: true,
      intensity: 0.1,
      frequency: 0.05,
      duration: 0.2,
      visibleOnHover: true,
      triggerOnHover: false,
      randomTrigger: false,
      randomFrequency: 0.1,
      sliceCount: 10,
      sliceOffset: 5,
      colorShiftAmount: 0.1,
      noiseIntensity: 0.2,
      scanlineEffect: true,
      distortionType: 'digital',
      blendMode: 'overlay',
      stopAfterSeconds: 2,
      affectContent: true,
      rgbShiftEnabled: true,
      brightnessNoise: 0.1,
      staticNoise: 0.05,
    },
  });

  // Cargar configuración inicial
  useEffect(() => {
    async function loadConfig() {
      if (!defaultValues) {
        setIsLoading(true);
        try {
          const response = await getGlitchEffectConfig(entityType, entityId);
          if (response.success && response.data) {
            form.reset(response.data);
          }
        } catch (error) {
          console.error('Error al cargar la configuración:', error);
          toast({
            title: 'Error',
            description: 'No se pudo cargar la configuración del efecto glitch.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }
    }

    loadConfig();
  }, [entityType, entityId, defaultValues, form, toast]);

  // Manejar el envío del formulario
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const response = await updateGlitchEffectConfig(entityType, values, entityId);
      if (response.success) {
        toast({
          title: 'Configuración guardada',
          description: 'La configuración del efecto glitch se ha guardado correctamente.',
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración del efecto glitch.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuración del Efecto Glitch</CardTitle>
        <CardDescription>
          Personaliza el efecto de distorsión tipo glitch para tus tarjetas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="advanced">Avanzado</TabsTrigger>
                <TabsTrigger value="behavior">Comportamiento</TabsTrigger>
              </TabsList>

              {/* Pestaña de configuración básica */}
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Activar efecto glitch</FormLabel>
                        <FormDescription>
                          Habilita o deshabilita este efecto para la entidad
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="intensity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intensidad del efecto</FormLabel>
                        <div className="flex flex-col">
                          <Slider
                            value={[field.value]}
                            min={0}
                            max={1}
                            step={0.01}
                            onValueChange={(value) => field.onChange(value[0])}
                            disabled={isLoading || !form.getValues('enabled')}
                            className="mb-2"
                          />
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Sutil</span>
                            <span className="text-xs font-semibold">{field.value.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">Intenso</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frecuencia del efecto</FormLabel>
                        <div className="flex flex-col">
                          <Slider
                            value={[field.value]}
                            min={0}
                            max={10}
                            step={0.05}
                            onValueChange={(value) => field.onChange(value[0])}
                            disabled={isLoading || !form.getValues('enabled')}
                            className="mb-2"
                          />
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Poco frecuente</span>
                            <span className="text-xs font-semibold">{field.value.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">Muy frecuente</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="distortionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de distorsión</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoading || !form.getValues('enabled')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo de distorsión" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="digital">Digital</SelectItem>
                            <SelectItem value="analog">Analógico</SelectItem>
                            <SelectItem value="vhs">VHS</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Selecciona el estilo de la distorsión glitch
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Pestaña de configuración avanzada */}
              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sliceCount"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center">
                          <FormLabel>Número de cortes</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cantidad de secciones en las que se divide la imagen</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={50}
                            {...field}
                            onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                            disabled={isLoading || !form.getValues('enabled')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sliceOffset"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center">
                          <FormLabel>Desplazamiento</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Distancia máxima de desplazamiento de los cortes</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={20}
                            step={0.5}
                            {...field}
                            onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                            disabled={isLoading || !form.getValues('enabled')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="colorShiftAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desplazamiento de color</FormLabel>
                        <div className="flex flex-col">
                          <Slider
                            value={[field.value]}
                            min={0}
                            max={1}
                            step={0.01}
                            onValueChange={(value) => field.onChange(value[0])}
                            disabled={isLoading || !form.getValues('enabled')}
                            className="mb-2"
                          />
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Mínimo</span>
                            <span className="text-xs font-semibold">{field.value.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">Máximo</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="noiseIntensity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intensidad del ruido</FormLabel>
                        <div className="flex flex-col">
                          <Slider
                            value={[field.value]}
                            min={0}
                            max={1}
                            step={0.01}
                            onValueChange={(value) => field.onChange(value[0])}
                            disabled={isLoading || !form.getValues('enabled')}
                            className="mb-2"
                          />
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Sutil</span>
                            <span className="text-xs font-semibold">{field.value.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">Fuerte</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rgbShiftEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Desplazamiento RGB</FormLabel>
                          <FormDescription>
                            Efecto de separación de canales de color
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading || !form.getValues('enabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scanlineEffect"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Efecto de líneas de escaneo</FormLabel>
                          <FormDescription>
                            Añade líneas horizontales como en pantallas antiguas
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading || !form.getValues('enabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="blendMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modo de fusión</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoading || !form.getValues('enabled')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un modo de fusión" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="overlay">Overlay</SelectItem>
                            <SelectItem value="screen">Screen</SelectItem>
                            <SelectItem value="multiply">Multiply</SelectItem>
                            <SelectItem value="difference">Difference</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Controla cómo se fusiona el efecto con la imagen base
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Pestaña de comportamiento */}
              <TabsContent value="behavior" className="space-y-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="visibleOnHover"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Visible al pasar el cursor</FormLabel>
                          <FormDescription>
                            El efecto solo se muestra al pasar el cursor sobre la tarjeta
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading || !form.getValues('enabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="triggerOnHover"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Activar al pasar el cursor</FormLabel>
                          <FormDescription>
                            El efecto se activa cuando el cursor pasa sobre la tarjeta
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading || !form.getValues('enabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="randomTrigger"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Activación aleatoria</FormLabel>
                          <FormDescription>
                            El efecto se activa aleatoriamente según la frecuencia configurada
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading || !form.getValues('enabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.getValues('randomTrigger') && (
                    <FormField
                      control={form.control}
                      name="randomFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia de activación aleatoria</FormLabel>
                          <div className="flex flex-col">
                            <Slider
                              value={[field.value]}
                              min={0}
                              max={1}
                              step={0.01}
                              onValueChange={(value) => field.onChange(value[0])}
                              disabled={isLoading || !form.getValues('enabled') || !form.getValues('randomTrigger')}
                              className="mb-2"
                            />
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">Raramente</span>
                              <span className="text-xs font-semibold">{field.value.toFixed(2)}</span>
                              <span className="text-xs text-muted-foreground">Frecuentemente</span>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración del efecto (segundos)</FormLabel>
                        <div className="flex flex-col">
                          <Slider
                            value={[field.value]}
                            min={0}
                            max={10}
                            step={0.1}
                            onValueChange={(value) => field.onChange(value[0])}
                            disabled={isLoading || !form.getValues('enabled')}
                            className="mb-2"
                          />
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Corto</span>
                            <span className="text-xs font-semibold">{field.value.toFixed(1)}s</span>
                            <span className="text-xs text-muted-foreground">Largo</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stopAfterSeconds"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center">
                          <FormLabel>Detener después de (segundos)</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Tiempo después del cual el efecto se detiene automáticamente (0 para nunca)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            {...field}
                            onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                            disabled={isLoading || !form.getValues('enabled')}
                          />
                        </FormControl>
                        <FormDescription>
                          0 para mantener el efecto activo indefinidamente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="affectContent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Afectar al contenido</FormLabel>
                          <FormDescription>
                            El efecto también afecta al contenido de la tarjeta (no solo al fondo)
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading || !form.getValues('enabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Guardando...' : 'Guardar configuración'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="border-t text-sm text-muted-foreground">
        <p>
          Ajusta los parámetros para personalizar el efecto de distorsión digital tipo glitch para la visualización de tus tarjetas.
        </p>
      </CardFooter>
    </Card>
  );
}