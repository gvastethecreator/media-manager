'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { BoxIcon, FileStackIcon, FlipHorizontalIcon, InfoIcon, LayoutIcon, MessageSquareIcon, MouseIcon, PaletteIcon, RectangleHorizontalIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CardOptions } from '../types';
import { ToggleOption, createNestedOptionChangeHandler, panelColors } from './shared/panel-helpers';

// Tipo para las opciones de backside
interface BacksideOptions {
  enabled: boolean;
  layoutType?: string;
  colorMode?: string;
  customColor?: string;
  opacity?: number;
  blurBackground?: boolean;
  blurAmount?: number;
  showAttributes?: boolean;
  showDescription?: boolean;
  showStats?: boolean;
  showMetadata?: boolean;
  showRelations?: boolean;
  maxDescriptionLength?: number;
  flipAnimation?: string;
  flipDuration?: number;
  enableAutoFlip?: boolean;
  autoFlipDelay?: number;
  flipTrigger?: string;
  headingStyle?: string;
  infoStyle?: string;
  separatorStyle?: string;
}

export function BacksideSettings({
  options,
  onChange,
  disabled = false,
}: {
  options: CardOptions;
  onChange: (options: CardOptions) => void;
  disabled?: boolean;
}) {
  // Inicializar backside options desde las opciones de la tarjeta o con valores predeterminados
  const [backsideOptions, setBacksideOptions] = useState<BacksideOptions>({
    enabled: options.backside?.enabled ?? false,
    layoutType: options.backside?.layoutType ?? 'standard',
    colorMode: options.backside?.colorMode ?? 'inherit',
    customColor: options.backside?.customColor ?? '',
    opacity: options.backside?.opacity ?? 0.95,
    blurBackground: options.backside?.blurBackground ?? true,
    blurAmount: options.backside?.blurAmount ?? 10,
    showAttributes: options.backside?.showAttributes ?? true,
    showDescription: options.backside?.showDescription ?? true,
    showStats: options.backside?.showStats ?? true,
    showMetadata: options.backside?.showMetadata ?? true,
    showRelations: options.backside?.showRelations ?? false,
    maxDescriptionLength: options.backside?.maxDescriptionLength ?? 300,
    flipAnimation: options.backside?.flipAnimation ?? 'rotate',
    flipDuration: options.backside?.flipDuration ?? 600,
    enableAutoFlip: options.backside?.enableAutoFlip ?? false,
    autoFlipDelay: options.backside?.autoFlipDelay ?? 3000,
    flipTrigger: options.backside?.flipTrigger ?? 'click',
    headingStyle: options.backside?.headingStyle ?? 'default',
    infoStyle: options.backside?.infoStyle ?? 'default',
    separatorStyle: options.backside?.separatorStyle ?? 'line',
  });

  // Actualizar backside options cuando cambien las opciones externas
  useEffect(() => {
    if (options.backside) {
      setBacksideOptions(prev => ({
        ...prev,
        ...options.backside
      }));
    }
  }, [options.backside]);

  // Manejar cambios en opciones de backside
  const handleBacksideChange = (key: keyof BacksideOptions, value: any) => {
    const updatedBacksideOptions = {
      ...backsideOptions,
      [key]: value,
    };

    setBacksideOptions(updatedBacksideOptions);

    // Propagar cambios al componente padre
    onChange({
      ...options,
      backside: updatedBacksideOptions,
    });
  };

  return (
    <Card className={cn('w-full', panelColors.advanced.bg, panelColors.advanced.border)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-[11px] font-medium">Configuración del Backside</CardTitle>
        <CardDescription className="text-[10px] text-muted-foreground">
          Personaliza el diseño y comportamiento de la parte trasera de las tarjetas
        </CardDescription>
        <div className="mt-2 flex items-center space-x-2">
          <Switch
            id="enable-backside"
            checked={backsideOptions.enabled}
            onCheckedChange={(value) => handleBacksideChange('enabled', value)}
            disabled={disabled}
          />
          <FormLabel htmlFor="enable-backside" className="text-[10px] font-medium">
            Habilitar Backside
          </FormLabel>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-5">
            {/* Sección solo visible si backside está habilitado */}
            {backsideOptions.enabled && (
              <>
                {/* Diseño y estilo */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <LayoutIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[10px] font-medium">Diseño y Estilo</h3>
                  </div>
                  <div className="space-y-4 pl-5">
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Tipo de Layout</FormLabel>
                      <Select
                        value={backsideOptions.layoutType}
                        onValueChange={(value) => handleBacksideChange('layoutType', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Estándar</SelectItem>
                          <SelectItem value="tabbed">Con pestañas</SelectItem>
                          <SelectItem value="grid">Grid</SelectItem>
                          <SelectItem value="minimal">Minimalista</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Modo de Color</FormLabel>
                      <Select
                        value={backsideOptions.colorMode}
                        onValueChange={(value) => handleBacksideChange('colorMode', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar modo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inherit">Heredar del frente</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                          <SelectItem value="reverse">Invertir</SelectItem>
                          <SelectItem value="contrast">Alto contraste</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    {backsideOptions.colorMode === 'custom' && (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px]">Color Personalizado</FormLabel>
                        <Input
                          type="text"
                          value={backsideOptions.customColor || ''}
                          onChange={(e) => handleBacksideChange('customColor', e.target.value)}
                          className="h-8 text-[10px]"
                          placeholder="#RRGGBB"
                          disabled={disabled}
                        />
                      </FormItem>
                    )}

                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Opacidad</FormLabel>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[backsideOptions.opacity ? backsideOptions.opacity * 100 : 95]}
                          min={50}
                          max={100}
                          step={1}
                          onValueChange={([value]) => handleBacksideChange('opacity', value / 100)}
                          disabled={disabled}
                          className="flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground w-8">
                          {Math.round((backsideOptions.opacity || 0.95) * 100)}%
                        </span>
                      </div>
                    </FormItem>

                    <ToggleOption
                      id="blur-background"
                      label="Fondo Borroso"
                      description="Aplica efecto de desenfoque al fondo"
                      checked={backsideOptions.blurBackground || false}
                      onCheckedChange={(checked) => handleBacksideChange('blurBackground', checked)}
                      disabled={disabled}
                    />

                    {backsideOptions.blurBackground && (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px]">Intensidad de Desenfoque</FormLabel>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[backsideOptions.blurAmount || 10]}
                            min={0}
                            max={20}
                            step={1}
                            onValueChange={([value]) => handleBacksideChange('blurAmount', value)}
                            disabled={disabled}
                            className="flex-1"
                          />
                          <span className="text-[10px] text-muted-foreground w-8">
                            {backsideOptions.blurAmount || 10}px
                          </span>
                        </div>
                      </FormItem>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Contenido */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <FileStackIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[10px] font-medium">Contenido</h3>
                  </div>
                  <div className="space-y-3 pl-5">
                    <ToggleOption
                      id="show-attributes"
                      label="Mostrar Atributos"
                      description="Muestra los atributos de la entidad"
                      checked={backsideOptions.showAttributes || false}
                      onCheckedChange={(checked) => handleBacksideChange('showAttributes', checked)}
                      disabled={disabled}
                    />

                    <ToggleOption
                      id="show-description"
                      label="Mostrar Descripción"
                      description="Muestra la descripción completa"
                      checked={backsideOptions.showDescription || false}
                      onCheckedChange={(checked) => handleBacksideChange('showDescription', checked)}
                      disabled={disabled}
                    />

                    {backsideOptions.showDescription && (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px]">Longitud Máxima</FormLabel>
                        <Input
                          type="number"
                          value={backsideOptions.maxDescriptionLength || 300}
                          onChange={(e) => handleBacksideChange('maxDescriptionLength', Number.parseInt(e.target.value) || 300)}
                          className="h-8 text-[10px]"
                          disabled={disabled}
                        />
                      </FormItem>
                    )}

                    <ToggleOption
                      id="show-stats"
                      label="Mostrar Estadísticas"
                      description="Muestra estadísticas relacionadas"
                      checked={backsideOptions.showStats || false}
                      onCheckedChange={(checked) => handleBacksideChange('showStats', checked)}
                      disabled={disabled}
                    />

                    <ToggleOption
                      id="show-metadata"
                      label="Mostrar Metadatos"
                      description="Muestra información adicional"
                      checked={backsideOptions.showMetadata || false}
                      onCheckedChange={(checked) => handleBacksideChange('showMetadata', checked)}
                      disabled={disabled}
                    />

                    <ToggleOption
                      id="show-relations"
                      label="Mostrar Relaciones"
                      description="Muestra elementos relacionados"
                      checked={backsideOptions.showRelations || false}
                      onCheckedChange={(checked) => handleBacksideChange('showRelations', checked)}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <Separator />

                {/* Interacción */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <FlipHorizontalIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[10px] font-medium">Interacción</h3>
                  </div>
                  <div className="space-y-4 pl-5">
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Animación de Volteo</FormLabel>
                      <Select
                        value={backsideOptions.flipAnimation}
                        onValueChange={(value) => handleBacksideChange('flipAnimation', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar animación" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rotate">Rotación</SelectItem>
                          <SelectItem value="fade">Desvanecer</SelectItem>
                          <SelectItem value="flip3d">Flip 3D</SelectItem>
                          <SelectItem value="slide">Deslizar</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Duración de la Animación (ms)</FormLabel>
                      <Input
                        type="number"
                        value={backsideOptions.flipDuration || 600}
                        onChange={(e) => handleBacksideChange('flipDuration', Number.parseInt(e.target.value) || 600)}
                        className="h-8 text-[10px]"
                        disabled={disabled}
                      />
                    </FormItem>

                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Disparador de Volteo</FormLabel>
                      <Select
                        value={backsideOptions.flipTrigger}
                        onValueChange={(value) => handleBacksideChange('flipTrigger', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar disparador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="click">Click</SelectItem>
                          <SelectItem value="hover">Hover</SelectItem>
                          <SelectItem value="doubleClick">Doble Click</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <ToggleOption
                      id="auto-flip"
                      label="Volteo Automático"
                      description="Voltea la tarjeta automáticamente"
                      checked={backsideOptions.enableAutoFlip || false}
                      onCheckedChange={(checked) => handleBacksideChange('enableAutoFlip', checked)}
                      disabled={disabled}
                    />

                    {backsideOptions.enableAutoFlip && (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px]">Retardo de Auto-Volteo (ms)</FormLabel>
                        <Input
                          type="number"
                          value={backsideOptions.autoFlipDelay || 3000}
                          onChange={(e) => handleBacksideChange('autoFlipDelay', Number.parseInt(e.target.value) || 3000)}
                          className="h-8 text-[10px]"
                          disabled={disabled}
                        />
                      </FormItem>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Estilo de UI */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <PaletteIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[10px] font-medium">Estilo de UI</h3>
                  </div>
                  <div className="space-y-4 pl-5">
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Estilo de Encabezados</FormLabel>
                      <Select
                        value={backsideOptions.headingStyle}
                        onValueChange={(value) => handleBacksideChange('headingStyle', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar estilo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Predeterminado</SelectItem>
                          <SelectItem value="large">Grande</SelectItem>
                          <SelectItem value="subtle">Sutil</SelectItem>
                          <SelectItem value="accent">Acento</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Estilo de Información</FormLabel>
                      <Select
                        value={backsideOptions.infoStyle}
                        onValueChange={(value) => handleBacksideChange('infoStyle', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar estilo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Predeterminado</SelectItem>
                          <SelectItem value="pills">Pills</SelectItem>
                          <SelectItem value="cards">Tarjetas</SelectItem>
                          <SelectItem value="minimal">Minimalista</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Estilo de Separadores</FormLabel>
                      <Select
                        value={backsideOptions.separatorStyle}
                        onValueChange={(value) => handleBacksideChange('separatorStyle', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar estilo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="line">Línea</SelectItem>
                          <SelectItem value="dotted">Punteada</SelectItem>
                          <SelectItem value="gradient">Gradiente</SelectItem>
                          <SelectItem value="none">Ninguno</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}