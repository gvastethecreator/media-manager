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
import { Cpu, Layers3, MousePointerSquare, Settings2, Smile, SpeakerIcon, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CardOptions } from '../types';
import { ToggleOption, createNestedOptionChangeHandler, panelColors } from './shared/panel-helpers';

// Tipo para las opciones de core
interface CoreOptions {
  enabled: boolean;
  layerSystem?: {
    order?: string[];
    layerBlending?: string;
    layerSpacing?: number;
  };
  interactiveMode?: string;
  hoverDelay?: number;
  touchBehavior?: string;
  pointerPrecision?: string;
  motionReduction?: boolean;
  performanceMode?: string;
  enableCache?: boolean;
  loadingStrategy?: string;
  enablePreloading?: boolean;
  enableHaptics?: boolean;
  hapticIntensity?: number;
  enableSounds?: boolean;
  soundVolume?: number;
  soundTheme?: string;
  contentArrangement?: string;
  enableAutoHeight?: boolean;
  maxLines?: number;
  textTruncation?: string;
  mediaFit?: string;
}

export function CoreSettings({
  options,
  onChange,
  disabled = false,
}: {
  options: CardOptions;
  onChange: (options: CardOptions) => void;
  disabled?: boolean;
}) {
  // Inicializar core options desde las opciones de la tarjeta o con valores predeterminados
  const [coreOptions, setCoreOptions] = useState<CoreOptions>({
    enabled: options.core?.enabled ?? false,
    layerSystem: options.core?.layerSystem ?? {
      order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
      layerBlending: 'screen',
      layerSpacing: 2,
    },
    interactiveMode: options.core?.interactiveMode ?? 'hover',
    hoverDelay: options.core?.hoverDelay ?? 100,
    touchBehavior: options.core?.touchBehavior ?? 'tap',
    pointerPrecision: options.core?.pointerPrecision ?? 'medium',
    motionReduction: options.core?.motionReduction ?? false,
    performanceMode: options.core?.performanceMode ?? 'balanced',
    enableCache: options.core?.enableCache ?? true,
    loadingStrategy: options.core?.loadingStrategy ?? 'progressive',
    enablePreloading: options.core?.enablePreloading ?? true,
    enableHaptics: options.core?.enableHaptics ?? false,
    hapticIntensity: options.core?.hapticIntensity ?? 0.5,
    enableSounds: options.core?.enableSounds ?? false,
    soundVolume: options.core?.soundVolume ?? 0.5,
    soundTheme: options.core?.soundTheme ?? 'minimal',
    contentArrangement: options.core?.contentArrangement ?? 'standard',
    enableAutoHeight: options.core?.enableAutoHeight ?? true,
    maxLines: options.core?.maxLines ?? undefined,
    textTruncation: options.core?.textTruncation ?? 'ellipsis',
    mediaFit: options.core?.mediaFit ?? 'cover',
  });

  // Actualizar core options cuando cambien las opciones externas
  useEffect(() => {
    if (options.core) {
      setCoreOptions(prev => ({
        ...prev,
        ...options.core
      }));
    }
  }, [options.core]);

  // Manejar cambios en opciones de core
  const handleCoreChange = (key: keyof CoreOptions, value: unknown) => {
    let updatedCoreOptions: CoreOptions;

    if (key === 'layerSystem' && typeof value === 'object') {
      // Caso especial para layerSystem que es un objeto
      updatedCoreOptions = {
        ...coreOptions,
        layerSystem: {
          ...coreOptions.layerSystem,
          ...value,
        }
      };
    } else {
      // Caso general para propiedades simples
      updatedCoreOptions = {
        ...coreOptions,
        [key]: value,
      };
    }

    setCoreOptions(updatedCoreOptions);

    // Propagar cambios al componente padre
    onChange({
      ...options,
      core: updatedCoreOptions,
    });
  };

  // Manejar cambios en propiedades anidadas de layerSystem
  const handleLayerSystemChange = (key: string, value: unknown) => {
    const updatedLayerSystem = {
      ...coreOptions.layerSystem,
      [key]: value,
    };

    handleCoreChange('layerSystem', updatedLayerSystem);
  };

  return (
    <Card className={cn('w-full', panelColors.technical.bg, panelColors.technical.border)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-[11px] font-medium">Configuración del Core</CardTitle>
        <CardDescription className="text-[10px] text-muted-foreground">
          Personaliza los aspectos fundamentales del sistema de tarjetas
        </CardDescription>
        <div className="mt-2 flex items-center space-x-2">
          <Switch
            id="enable-core"
            checked={coreOptions.enabled}
            onCheckedChange={(value) => handleCoreChange('enabled', value)}
            disabled={disabled}
          />
          <FormLabel htmlFor="enable-core" className="text-[10px] font-medium">
            Habilitar Core
          </FormLabel>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-5">
            {/* Sección solo visible si core está habilitado */}
            {coreOptions.enabled && (
              <>
                {/* Sistema de capas */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Layers3 className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[10px] font-medium">Sistema de Capas</h3>
                  </div>
                  <div className="space-y-4 pl-5">
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Mezclado de Capas</FormLabel>
                      <Select
                        value={coreOptions.layerSystem?.layerBlending}
                        onValueChange={(value) => handleLayerSystemChange('layerBlending', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar tipo de mezclado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="multiply">Multiplicar</SelectItem>
                          <SelectItem value="screen">Pantalla</SelectItem>
                          <SelectItem value="overlay">Superposición</SelectItem>
                          <SelectItem value="darken">Oscurecer</SelectItem>
                          <SelectItem value="lighten">Aclarar</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Espaciado entre Capas (px)</FormLabel>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[coreOptions.layerSystem?.layerSpacing || 2]}
                          min={0}
                          max={10}
                          step={0.5}
                          onValueChange={([value]) => handleLayerSystemChange('layerSpacing', value)}
                          disabled={disabled}
                          className="flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground w-8">
                          {coreOptions.layerSystem?.layerSpacing || 2}px
                        </span>
                      </div>
                    </FormItem>
                  </div>
                </div>

                <Separator />

                {/* Interactividad */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <MousePointerSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[10px] font-medium">Interactividad</h3>
                  </div>
                  <div className="space-y-4 pl-5">
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Modo Interactivo</FormLabel>
                      <Select
                        value={coreOptions.interactiveMode}
                        onValueChange={(value) => handleCoreChange('interactiveMode', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar modo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hover">Hover</SelectItem>
                          <SelectItem value="click">Click</SelectItem>
                          <SelectItem value="none">Ninguno</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Retardo de Hover (ms)</FormLabel>
                      <Input
                        type="number"
                        value={coreOptions.hoverDelay || 100}
                        onChange={(e) => handleCoreChange('hoverDelay', Number.parseInt(e.target.value) || 100)}
                        className="h-8 text-[10px]"
                        disabled={disabled}
                      />
                    </FormItem>

                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Comportamiento Táctil</FormLabel>
                      <Select
                        value={coreOptions.touchBehavior}
                        onValueChange={(value) => handleCoreChange('touchBehavior', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar comportamiento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tap">Tap</SelectItem>
                          <SelectItem value="longPress">Pulsación larga</SelectItem>
                          <SelectItem value="doubleTap">Doble tap</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Precisión del Puntero</FormLabel>
                      <Select
                        value={coreOptions.pointerPrecision}
                        onValueChange={(value) => handleCoreChange('pointerPrecision', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar precisión" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baja</SelectItem>
                          <SelectItem value="medium">Media</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <ToggleOption
                      id="motion-reduction"
                      label="Reducción de Movimiento"
                      description="Disminuye animaciones para accesibilidad"
                      checked={coreOptions.motionReduction || false}
                      onCheckedChange={(checked) => handleCoreChange('motionReduction', checked)}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <Separator />

                {/* Rendimiento */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[10px] font-medium">Rendimiento</h3>
                  </div>
                  <div className="space-y-4 pl-5">
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Modo de Rendimiento</FormLabel>
                      <Select
                        value={coreOptions.performanceMode}
                        onValueChange={(value) => handleCoreChange('performanceMode', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar modo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="performance">Rendimiento</SelectItem>
                          <SelectItem value="balanced">Balanceado</SelectItem>
                          <SelectItem value="quality">Calidad</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <ToggleOption
                      id="enable-cache"
                      label="Habilitar Caché"
                      description="Almacena en caché recursos para mejorar el rendimiento"
                      checked={coreOptions.enableCache || false}
                      onCheckedChange={(checked) => handleCoreChange('enableCache', checked)}
                      disabled={disabled}
                    />

                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Estrategia de Carga</FormLabel>
                      <Select
                        value={coreOptions.loadingStrategy}
                        onValueChange={(value) => handleCoreChange('loadingStrategy', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar estrategia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eager">Inmediata</SelectItem>
                          <SelectItem value="lazy">Perezosa</SelectItem>
                          <SelectItem value="progressive">Progresiva</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <ToggleOption
                      id="enable-preloading"
                      label="Habilitar Precarga"
                      description="Precarga recursos para mejorar la experiencia"
                      checked={coreOptions.enablePreloading || false}
                      onCheckedChange={(checked) => handleCoreChange('enablePreloading', checked)}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <Separator />

                {/* Feedback y Respuesta */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Smile className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[10px] font-medium">Feedback y Respuesta</h3>
                  </div>
                  <div className="space-y-4 pl-5">
                    <ToggleOption
                      id="enable-haptics"
                      label="Habilitar Hápticos"
                      description="Proporciona feedback táctil en dispositivos compatibles"
                      checked={coreOptions.enableHaptics || false}
                      onCheckedChange={(checked) => handleCoreChange('enableHaptics', checked)}
                      disabled={disabled}
                    />

                    {coreOptions.enableHaptics && (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px]">Intensidad Háptica</FormLabel>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[coreOptions.hapticIntensity ? coreOptions.hapticIntensity * 100 : 50]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={([value]) => handleCoreChange('hapticIntensity', value / 100)}
                            disabled={disabled}
                            className="flex-1"
                          />
                          <span className="text-[10px] text-muted-foreground w-8">
                            {Math.round((coreOptions.hapticIntensity || 0.5) * 100)}%
                          </span>
                        </div>
                      </FormItem>
                    )}

                    <ToggleOption
                      id="enable-sounds"
                      label="Habilitar Sonidos"
                      description="Reproduce efectos de sonido para interacciones"
                      checked={coreOptions.enableSounds || false}
                      onCheckedChange={(checked) => handleCoreChange('enableSounds', checked)}
                      disabled={disabled}
                    />

                    {coreOptions.enableSounds && (
                      <>
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px]">Volumen de Sonido</FormLabel>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[coreOptions.soundVolume ? coreOptions.soundVolume * 100 : 50]}
                              min={0}
                              max={100}
                              step={1}
                              onValueChange={([value]) => handleCoreChange('soundVolume', value / 100)}
                              disabled={disabled}
                              className="flex-1"
                            />
                            <span className="text-[10px] text-muted-foreground w-8">
                              {Math.round((coreOptions.soundVolume || 0.5) * 100)}%
                            </span>
                          </div>
                        </FormItem>

                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px]">Tema de Sonido</FormLabel>
                          <Select
                            value={coreOptions.soundTheme}
                            onValueChange={(value) => handleCoreChange('soundTheme', value)}
                            disabled={disabled}
                          >
                            <SelectTrigger className="h-8 text-[10px]">
                              <SelectValue placeholder="Seleccionar tema" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minimal">Minimalista</SelectItem>
                              <SelectItem value="classic">Clásico</SelectItem>
                              <SelectItem value="modern">Moderno</SelectItem>
                              <SelectItem value="playful">Juguetón</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Contenido */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Wand2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[10px] font-medium">Contenido</h3>
                  </div>
                  <div className="space-y-4 pl-5">
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Disposición del Contenido</FormLabel>
                      <Select
                        value={coreOptions.contentArrangement}
                        onValueChange={(value) => handleCoreChange('contentArrangement', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar disposición" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Estándar</SelectItem>
                          <SelectItem value="compact">Compacto</SelectItem>
                          <SelectItem value="expanded">Expandido</SelectItem>
                          <SelectItem value="minimal">Minimalista</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <ToggleOption
                      id="enable-auto-height"
                      label="Altura Automática"
                      description="Ajusta la altura automáticamente al contenido"
                      checked={coreOptions.enableAutoHeight || false}
                      onCheckedChange={(checked) => handleCoreChange('enableAutoHeight', checked)}
                      disabled={disabled}
                    />

                    {!coreOptions.enableAutoHeight && (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px]">Máximo de Líneas</FormLabel>
                        <Input
                          type="number"
                          value={coreOptions.maxLines || ''}
                          onChange={(e) => handleCoreChange('maxLines', e.target.value ? Number.parseInt(e.target.value) : undefined)}
                          className="h-8 text-[10px]"
                          disabled={disabled}
                          placeholder="Sin límite"
                        />
                      </FormItem>
                    )}

                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Truncado de Texto</FormLabel>
                      <Select
                        value={coreOptions.textTruncation}
                        onValueChange={(value) => handleCoreChange('textTruncation', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ellipsis">Puntos suspensivos</SelectItem>
                          <SelectItem value="fade">Desvanecer</SelectItem>
                          <SelectItem value="scroll">Desplazamiento</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px]">Ajuste de Medios</FormLabel>
                      <Select
                        value={coreOptions.mediaFit}
                        onValueChange={(value) => handleCoreChange('mediaFit', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-[10px]">
                          <SelectValue placeholder="Seleccionar ajuste" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Cubrir</SelectItem>
                          <SelectItem value="contain">Contener</SelectItem>
                          <SelectItem value="fill">Rellenar</SelectItem>
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