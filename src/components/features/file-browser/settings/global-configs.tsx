/**
 * @file Global Configuration Components
 * @module components/features/file-browser/settings/global-configs
 * @description Componentes para configurar opciones globales del FileBrowser.
 * Incluye animaciones, accesibilidad, rendimiento y configuraciones generales.
 */

import React, { useCallback } from 'react';
import {
  Settings,
  Sparkles,
  Eye,
  Zap,
  Clock,
  Monitor,
  Keyboard,
  Mouse,
  Volume2,
  Contrast,
  Type,
  Gauge,
  Database,
  Cpu,
  HardDrive,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type {
  AnimationConfig,
  AccessibilityConfig,
  PerformanceConfig,
  GlobalViewConfig,
} from '@/types/file-browser/view-configuration';

// Configuración General
interface GeneralConfigurationProps {
  config: GlobalViewConfig;
  onUpdate: (config: Partial<GlobalViewConfig>) => Promise<boolean>;
  className?: string;
}

export function GeneralConfiguration({ config, onUpdate, className }: GeneralConfigurationProps) {
  const handleUpdate = useCallback(
    (updates: Partial<GlobalViewConfig>) => {
      onUpdate(updates);
    },
    [onUpdate]
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Configuración de Vista por Defecto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Vista por Defecto
          </CardTitle>
          <CardDescription>
            Configura la vista predeterminada para diferentes tipos de contenido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vista Principal</Label>
              <Select
                value={config.defaultViewMode ?? 'grid'}
                onValueChange={(defaultViewMode) => handleUpdate({ defaultViewMode: defaultViewMode as 'list' | 'grid' | 'masonry' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">Lista</SelectItem>
                  <SelectItem value="grid">Cuadrícula</SelectItem>
                  <SelectItem value="cards">Tarjetas</SelectItem>
                  <SelectItem value="masonry">Mosaico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tema</Label>
              <Select
                value={config.theme?.mode ?? 'auto'}
                onValueChange={(mode) => handleUpdate({ 
                  theme: { ...config.theme, mode: mode as 'light' | 'dark' | 'auto' }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Oscuro</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
              <Label>Recordar Preferencias por Carpeta</Label>
              <Switch
                checked={config.layout?.sidebar?.enabled ?? true}
                onCheckedChange={(enabled) =>
                  handleUpdate({ 
                    layout: { 
                      ...config.layout, 
                      sidebar: { ...config.layout?.sidebar, enabled } 
                    } 
                  })
                }
              />
            </div>
        </CardContent>
      </Card>

      {/* Configuración de Selección */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mouse className="h-4 w-4" />
            Selección
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Selección Múltiple</Label>
              <Switch
                checked={config.layout?.statusBar?.showSelectionInfo ?? true}
                onCheckedChange={(showSelectionInfo) =>
                  handleUpdate({ 
                    layout: { 
                      ...config.layout, 
                      statusBar: { ...config.layout?.statusBar, showSelectionInfo } 
                    } 
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Arrastrar para Seleccionar</Label>
              <Switch
                checked={config.animations?.types?.selection?.enabled ?? true}
                onCheckedChange={(enabled) =>
                  handleUpdate({ 
                    animations: { 
                      ...config.animations, 
                      types: { 
                        ...config.animations?.types, 
                        selection: { ...config.animations?.types?.selection, enabled } 
                      } 
                    } 
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mostrar Barra de Estado</Label>
            <Switch
              checked={config.layout?.statusBar?.enabled ?? true}
              onCheckedChange={(enabled) =>
                handleUpdate({ 
                  layout: { 
                    ...config.layout, 
                    statusBar: { ...config.layout?.statusBar, enabled } 
                  } 
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Ordenamiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Ordenamiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mostrar Contador de Items</Label>
              <Switch
                checked={config.layout?.statusBar?.showItemCount ?? true}
                onCheckedChange={(showItemCount) =>
                  handleUpdate({ 
                    layout: { 
                      ...config.layout, 
                      statusBar: { ...config.layout?.statusBar, showItemCount } 
                    } 
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Barra de Herramientas Compacta</Label>
              <Switch
                checked={config.layout?.toolbar?.compact ?? false}
                onCheckedChange={(compact) =>
                  handleUpdate({ 
                    layout: { 
                      ...config.layout, 
                      toolbar: { ...config.layout?.toolbar, compact } 
                    } 
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Configuración de Animaciones
interface AnimationConfigurationProps {
  config: AnimationConfig;
  onUpdate: (config: Partial<AnimationConfig>) => Promise<boolean>;
  className?: string;
}

export function AnimationConfiguration({ config, onUpdate, className }: AnimationConfigurationProps) {
  const handleUpdate = useCallback(
    (updates: Partial<AnimationConfig>) => {
      onUpdate(updates);
    },
    [onUpdate]
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Configuración General de Animaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Animaciones Generales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Habilitar Animaciones</Label>
            <Switch
              checked={config.enabled ?? true}
              onCheckedChange={(enabled) => handleUpdate({ enabled })}
            />
          </div>

          <div className="space-y-2">
            <Label>Duración Global (ms)</Label>
            <div className="space-y-2">
              <Slider
                value={[config.duration ?? 200]}
                onValueChange={([duration]) => handleUpdate({ duration })}
                min={50}
                max={1000}
                step={50}
                disabled={!config.enabled}
              />
              <div className="text-sm text-muted-foreground">
                {config.duration ?? 200}ms
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Función de Easing</Label>
            <Select
              value={config.easing ?? 'ease-out'}
              onValueChange={(easing) => handleUpdate({ easing: easing as 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' })}
              disabled={!config.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="ease">Ease</SelectItem>
                <SelectItem value="ease-in">Ease In</SelectItem>
                <SelectItem value="ease-out">Ease Out</SelectItem>
                <SelectItem value="ease-in-out">Ease In Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Configuración Específica de Animaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Animaciones Específicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Transiciones de Vista</Label>
              <Switch
                checked={config.types?.viewTransition?.enabled ?? true}
                onCheckedChange={(enabled) => handleUpdate({ 
                  types: { 
                    ...config.types, 
                    viewTransition: { ...config.types?.viewTransition, enabled } 
                  } 
                })}
                disabled={!config.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Efectos de Hover</Label>
              <Switch
                checked={config.types?.hover?.enabled ?? true}
                onCheckedChange={(enabled) => handleUpdate({ 
                  types: { 
                    ...config.types, 
                    hover: { ...config.types?.hover, enabled } 
                  } 
                })}
                disabled={!config.enabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Animaciones de Carga</Label>
              <Switch
                checked={config.types?.loading?.enabled ?? true}
                onCheckedChange={(enabled) => handleUpdate({ 
                  types: { 
                    ...config.types, 
                    loading: { ...config.types?.loading, enabled } 
                  } 
                })}
                disabled={!config.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Animaciones de Selección</Label>
              <Switch
                checked={config.types?.selection?.enabled ?? true}
                onCheckedChange={(enabled) => handleUpdate({ 
                  types: { 
                    ...config.types, 
                    selection: { ...config.types?.selection, enabled } 
                  } 
                })}
                disabled={!config.enabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reducir Movimiento</Label>
            <Switch
              checked={config.reduceMotion ?? false}
              onCheckedChange={(reduceMotion) => handleUpdate({ reduceMotion })}
            />
            <div className="text-xs text-muted-foreground">
              Respeta la preferencia del sistema para reducir movimiento
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Configuración de Accesibilidad
interface AccessibilityConfigurationProps {
  config: AccessibilityConfig;
  onUpdate: (config: Partial<AccessibilityConfig>) => Promise<boolean>;
  className?: string;
}

export function AccessibilityConfiguration({
  config,
  onUpdate,
  className,
}: AccessibilityConfigurationProps) {
  const handleUpdate = useCallback(
    (updates: Partial<AccessibilityConfig>) => {
      onUpdate(updates);
    },
    [onUpdate]
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Configuración de Navegación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Navegación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Navegación por Teclado</Label>
              <Switch
                checked={config.keyboardNavigation ?? true}
                onCheckedChange={(keyboardNavigation) =>
                  handleUpdate({ keyboardNavigation })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Indicadores de Foco</Label>
              <Switch
                checked={config.focusIndicators ?? true}
                onCheckedChange={(focusIndicators) => handleUpdate({ focusIndicators })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Anuncios de Pantalla</Label>
            <Switch
              checked={config.screenReaderAnnouncements ?? true}
              onCheckedChange={(screenReaderAnnouncements) =>
                handleUpdate({ screenReaderAnnouncements })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuración Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Configuración Visual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Alto Contraste</Label>
              <Switch
                checked={config.highContrast ?? false}
                onCheckedChange={(highContrast) => handleUpdate({ highContrast })}
              />
            </div>

            <div className="space-y-2">
              <Label>Texto Grande</Label>
              <Switch
                checked={config.largeText ?? false}
                onCheckedChange={(largeText) => handleUpdate({ largeText })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Escala de Texto</Label>
            <div className="space-y-2">
              <Slider
                value={[config.textScale ?? 1]}
                onValueChange={([textScale]) => handleUpdate({ textScale })}
                min={0.8}
                max={2}
                step={0.1}
              />
              <div className="text-sm text-muted-foreground">
                {((config.textScale ?? 1) * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tooltips Descriptivos</Label>
            <Switch
              checked={config.descriptiveTooltips ?? true}
              onCheckedChange={(descriptiveTooltips) =>
                handleUpdate({ descriptiveTooltips })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Audio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Audio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Retroalimentación de Audio</Label>
            <Switch
              checked={config.audioFeedback ?? false}
              onCheckedChange={(audioFeedback) => handleUpdate({ audioFeedback })}
            />
          </div>

          <div className="space-y-2">
            <Label>Volumen de Retroalimentación</Label>
            <div className="space-y-2">
              <Slider
                value={[config.audioVolume ?? 0.5]}
                onValueChange={([audioVolume]) => handleUpdate({ audioVolume })}
                min={0}
                max={1}
                step={0.1}
                disabled={!config.audioFeedback}
              />
              <div className="text-sm text-muted-foreground">
                {((config.audioVolume ?? 0.5) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Configuración de Rendimiento
interface PerformanceConfigurationProps {
  config: PerformanceConfig;
  onUpdate: (config: Partial<PerformanceConfig>) => Promise<boolean>;
  className?: string;
}

export function PerformanceConfiguration({
  config,
  onUpdate,
  className,
}: PerformanceConfigurationProps) {
  const handleUpdate = useCallback(
    (updates: Partial<PerformanceConfig>) => {
      onUpdate(updates);
    },
    [onUpdate]
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Configuración de Virtualización */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Virtualización
          </CardTitle>
          <CardDescription>
            Optimiza el rendimiento para grandes cantidades de elementos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Habilitar Virtualización</Label>
            <Switch
              checked={config.virtualization ?? true}
              onCheckedChange={(virtualization) => handleUpdate({ virtualization })}
            />
          </div>

          <div className="space-y-2">
            <Label>Tamaño de Buffer</Label>
            <div className="space-y-2">
              <Slider
                value={[config.bufferSize ?? 10]}
                onValueChange={([bufferSize]) => handleUpdate({ bufferSize })}
                min={5}
                max={50}
                step={5}
                disabled={!config.virtualization}
              />
              <div className="text-sm text-muted-foreground">
                {config.bufferSize ?? 10} elementos adicionales
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Caché */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Caché
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Caché de Miniaturas</Label>
            <Switch
              checked={config.thumbnailCache ?? true}
              onCheckedChange={(thumbnailCache) => handleUpdate({ thumbnailCache })}
            />
          </div>

          <div className="space-y-2">
            <Label>Tamaño Máximo de Caché (MB)</Label>
            <div className="space-y-2">
              <Slider
                value={[config.maxCacheSize ?? 100]}
                onValueChange={([maxCacheSize]) => handleUpdate({ maxCacheSize })}
                min={50}
                max={500}
                step={25}
                disabled={!config.thumbnailCache}
              />
              <div className="text-sm text-muted-foreground">
                {config.maxCacheSize ?? 100} MB
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Precarga de Elementos</Label>
            <Switch
              checked={config.preloadItems ?? true}
              onCheckedChange={(preloadItems) => handleUpdate({ preloadItems })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Renderizado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Renderizado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Límite de FPS</Label>
            <div className="space-y-2">
              <Slider
                value={[config.maxFPS ?? 60]}
                onValueChange={([maxFPS]) => handleUpdate({ maxFPS })}
                min={30}
                max={120}
                step={15}
              />
              <div className="text-sm text-muted-foreground">
                {config.maxFPS ?? 60} FPS
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Debounce de Scroll (ms)</Label>
            <div className="space-y-2">
              <Slider
                value={[config.scrollDebounce ?? 16]}
                onValueChange={([scrollDebounce]) => handleUpdate({ scrollDebounce })}
                min={0}
                max={100}
                step={16}
              />
              <div className="text-sm text-muted-foreground">
                {config.scrollDebounce ?? 16}ms
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lazy Loading</Label>
            <Switch
              checked={config.lazyLoading ?? true}
              onCheckedChange={(lazyLoading) => handleUpdate({ lazyLoading })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Memoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Memoria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Límite de Memoria (MB)</Label>
            <div className="space-y-2">
              <Slider
                value={[config.memoryLimit ?? 512]}
                onValueChange={([memoryLimit]) => handleUpdate({ memoryLimit })}
                min={256}
                max={2048}
                step={128}
              />
              <div className="text-sm text-muted-foreground">
                {config.memoryLimit ?? 512} MB
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Limpieza Automática</Label>
            <Switch
              checked={config.autoCleanup ?? true}
              onCheckedChange={(autoCleanup) => handleUpdate({ autoCleanup })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}