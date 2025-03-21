'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LayerConfigFormWrapper } from '../../components/layer-config-form-wrapper';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BLEND_MODES,
  GRID_COLORS,
  GRID_PRESETS,
  GRID_TYPES,
  type GridConfig,
} from '../actions/grid-config.action';
import { useCallback } from 'react';
import type { CommonLayerFormProps } from '../../types';
import { Button } from '@/components/ui/button';

// Esquema de validación
const gridConfigSchema = z.object({
  enabled: z.boolean(),
  visibleOnHover: z.boolean().optional(),
  layerIndex: z.number().int().min(0),
  gridType: z.enum(GRID_TYPES),
  spacing: z.number().min(5).max(100),
  thickness: z.number().min(0.5).max(10),
  color: z.string(),
  opacity: z.number().min(0).max(1),
  blendMode: z.enum(BLEND_MODES),
  angle: z.number().min(0).max(360),
  showSubgrid: z.boolean(),
  subgridDivisions: z.number().int().min(2).max(10),
  subgridOpacity: z.number().min(0).max(1),
  animateOnHover: z.boolean(),
  animationSpeed: z.number().min(0).max(10),
  colorMode: z.enum(GRID_COLORS),
});

type GridFormValues = z.infer<typeof gridConfigSchema>;

export function GridConfigForm({ config, onUpdate, onDelete }: CommonLayerFormProps<GridConfig>) {
  // Configurar formulario
  const form = useForm<GridFormValues>({
    resolver: zodResolver(gridConfigSchema),
    defaultValues: {
      enabled: config.enabled,
      visibleOnHover: config.visibleOnHover || false,
      layerIndex: config.layerIndex,
      gridType: config.gridType,
      spacing: config.spacing,
      thickness: config.thickness,
      color: config.color,
      opacity: config.opacity,
      blendMode: config.blendMode,
      angle: config.angle,
      showSubgrid: config.showSubgrid,
      subgridDivisions: config.subgridDivisions,
      subgridOpacity: config.subgridOpacity,
      animateOnHover: config.animateOnHover,
      animationSpeed: config.animationSpeed,
      colorMode: config.colorMode,
    },
  });

  // Manejar envío
  const handleSubmit = useCallback(
    (values: GridFormValues) => {
      onUpdate({
        ...config,
        ...values,
      });
    },
    [config, onUpdate]
  );

  // Aplicar preset
  const applyPreset = useCallback(
    (presetKey: keyof typeof GRID_PRESETS) => {
      const preset = GRID_PRESETS[presetKey];
      form.setValue('gridType', preset.type as typeof GRID_TYPES[number]);
      form.setValue('spacing', preset.spacing);
      form.setValue('thickness', preset.thickness);
      form.setValue('color', preset.color);
      form.setValue('opacity', preset.opacity);
    },
    [form]
  );

  return (
    <LayerConfigFormWrapper
      title="Configuración de Grid"
      description="Ajusta el patrón de cuadrícula"
      form={form}
      onSubmit={handleSubmit}
      onDelete={onDelete}
    >
      {/* Configuración básica */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between">
              <FormLabel>Habilitado</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visibleOnHover"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between">
              <FormLabel>Mostrar solo al pasar el cursor</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="layerIndex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Índice de capa</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  {...field}
                  onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <Separator className="my-4" />

      {/* Presets */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Presets</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(GRID_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(key as keyof typeof GRID_PRESETS)}
              type="button"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Tipo y apariencia */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="gridType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de grid</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GRID_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="spacing"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Espaciado ({field.value}px)</FormLabel>
              <FormControl>
                <Slider
                  min={5}
                  max={100}
                  step={1}
                  value={[field.value]}
                  onValueChange={(value) => field.onChange(value[0])}
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
              <FormLabel>Grosor ({field.value}px)</FormLabel>
              <FormControl>
                <Slider
                  min={0.5}
                  max={10}
                  step={0.1}
                  value={[field.value]}
                  onValueChange={(value) => field.onChange(value[0])}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="colorMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modo de color</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Modo de color" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GRID_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem className={form.watch('colorMode') !== 'custom' ? 'opacity-50' : ''}>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <div
                      className="h-10 w-10 rounded border"
                      style={{ backgroundColor: field.value }}
                    />
                    <Input
                      type="text"
                      {...field}
                      disabled={form.watch('colorMode') !== 'custom'}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="opacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opacidad ({Math.round(field.value * 100)}%)</FormLabel>
              <FormControl>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[field.value]}
                  onValueChange={(value) => field.onChange(value[0])}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="blendMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modo de fusión</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un modo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BLEND_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </SelectItem>
                  ))}
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
              <FormLabel>Ángulo ({field.value}°)</FormLabel>
              <FormControl>
                <Slider
                  min={0}
                  max={360}
                  step={1}
                  value={[field.value]}
                  onValueChange={(value) => field.onChange(value[0])}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <Separator className="my-4" />

      {/* Subgrid */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="showSubgrid"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between">
              <FormLabel>Mostrar subgrid</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className={form.watch('showSubgrid') ? '' : 'opacity-50'}>
          <FormField
            control={form.control}
            name="subgridDivisions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Divisiones ({field.value})</FormLabel>
                <FormControl>
                  <Slider
                    min={2}
                    max={10}
                    step={1}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    disabled={!form.watch('showSubgrid')}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subgridOpacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opacidad subgrid ({Math.round(field.value * 100)}%)</FormLabel>
                <FormControl>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    disabled={!form.watch('showSubgrid')}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator className="my-4" />

      {/* Animación */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="animateOnHover"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between">
              <FormLabel>Animar al pasar el cursor</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className={form.watch('animateOnHover') ? '' : 'opacity-50'}>
          <FormField
            control={form.control}
            name="animationSpeed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Velocidad de animación ({field.value})</FormLabel>
                <FormControl>
                  <Slider
                    min={0}
                    max={10}
                    step={0.1}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    disabled={!form.watch('animateOnHover')}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
    </LayerConfigFormWrapper>
  );
}