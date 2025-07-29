/**
 * @file Global and Entity Configuration Components
 * @module components/features/file-browser/settings/global-entity-configs
 * @description Componentes para configurar opciones globales y específicas por entidad.
 */

import React, { useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  Sparkles,
  Eye,
  Zap,
  Image,
  Video,
  Music,
  FileText,
  Folder,
  Bookmark,
  Tag,
  Album,
  User,
  Lightbulb,
  StickyNote,
  MapPin,
  Grid3X3,
  List,
  LayoutGrid,
  Columns,
  Palette,
  MousePointer,
  Clock,
  HardDrive,
  Cpu,
  Monitor,
  Accessibility,
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
  EntityViewConfig,
  GlobalViewConfig,
} from '@/types/file-browser/view-configuration';
import type { EntityStatsType } from '@/types/migration';

// Iconos para tipos de entidad
const ENTITY_ICONS = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  folder: Folder,
  collection: Bookmark,
  tag: Tag,
  album: Album,
  character: User,
  concept: Lightbulb,
  note: StickyNote,
  place: MapPin,
} as const;

// Configuración de Animaciones
interface AnimationConfigurationProps {
  config: AnimationConfig;
  onUpdate: (config: AnimationConfig) => Promise<boolean>;
  className?: string;
}

export function AnimationConfiguration({ config, onUpdate, className }: AnimationConfigurationProps) {
  const handleUpdate = useCallback(
    (updates: Partial<AnimationConfig>) => {
      onUpdate({ ...config, ...updates });
    },
    [config, onUpdate]
  );

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Configuración de Animaciones
          </CardTitle>
          <CardDescription>
            Controla las animaciones y transiciones en todas las vistas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Habilitar Animaciones</Label>
              <Switch
                checked={config.enabled ?? true}
                onCheckedChange={(enabled) => handleUpdate({ enabled })}
              />
            </div>

            <div className="space-y-2">
              <Label>Reducir Movimiento</Label>
              <Switch
                checked={config.reduceMotion ?? false}
                onCheckedChange={(reduceMotion) => handleUpdate({ reduceMotion })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duración de Transiciones</Label>
              <div className="space-y-2">
                <Slider
                  value={[config.duration ?? 200]}
                  onValueChange={([duration]) => handleUpdate({ duration })}
                  min={100}
                  max={1000}
                  step={50}
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
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Tipos de Animación</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'hover', label: 'Efectos de Hover' },
                { key: 'selection', label: 'Selección' },
                { key: 'loading', label: 'Carga' },
                { key: 'viewTransition', label: 'Transición de Vista' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Switch
                    id={`animation-${key}`}
                    checked={config.types?.[key as keyof typeof config.types]?.enabled ?? true}
                    onCheckedChange={(checked) => {
                      const updatedTypes = {
                        ...config.types,
                        [key]: {
                          ...config.types?.[key as keyof typeof config.types],
                          enabled: checked
                        }
                      };
                      handleUpdate({ types: updatedTypes });
                    }}
                  />
                  <Label htmlFor={`animation-${key}`} className="text-sm">
                    {label}
                  </Label>
                </div>
              ))}
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
  onUpdate: (config: AccessibilityConfig) => Promise<boolean>;
  className?: string;
}

export function AccessibilityConfiguration({ config, onUpdate, className }: AccessibilityConfigurationProps) {
  const handleUpdate = useCallback(
    (updates: Partial<AccessibilityConfig>) => {
      onUpdate({ ...config, ...updates });
    },
    [config, onUpdate]
  );

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Configuración de Accesibilidad
          </CardTitle>
          <CardDescription>
            Mejora la accesibilidad para todos los usuarios
          </CardDescription>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Navegación por Teclado</Label>
              <Switch
                checked={config.keyboardNavigation ?? true}
                onCheckedChange={(keyboardNavigation) => handleUpdate({ keyboardNavigation })}
              />
            </div>

            <div className="space-y-2">
              <Label>Lector de Pantalla</Label>
              <Switch
                checked={config.screenReader ?? true}
                onCheckedChange={(screenReader) => handleUpdate({ screenReader })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Indicadores de Foco</Label>
            <Select
              value={String(config.focusIndicators ?? 'enhanced')}
              onValueChange={(focusIndicators) => handleUpdate({ focusIndicators: focusIndicators === 'true' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                <SelectItem value="basic">Básico</SelectItem>
                <SelectItem value="enhanced">Mejorado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Opciones Adicionales</Label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { key: 'skipLinks', label: 'Enlaces de Salto' },
                { key: 'ariaLabels', label: 'Etiquetas ARIA Detalladas' },
                { key: 'colorBlindSupport', label: 'Soporte para Daltonismo' },
                { key: 'tooltips', label: 'Tooltips Descriptivos' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Switch
                    id={`accessibility-${key}`}
                    checked={Array.isArray(config.features) ? config.features.includes(key) : true}
                    onCheckedChange={(checked) => {
                      const features = config.features || [];
                      const newFeatures: string[] = checked
                        ? [...(Array.isArray(features) ? features : []), key]
                        : (Array.isArray(features) ? features.filter((feature: string) => feature !== key) : []);
                      handleUpdate({ features: newFeatures });
                    }}
                  />
                  <Label htmlFor={`accessibility-${key}`} className="text-sm">
                    {label}
                  </Label>
                </div>
              ))}
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
  onUpdate: (config: PerformanceConfig) => Promise<boolean>;
  className?: string;
}

export function PerformanceConfiguration({ config, onUpdate, className }: PerformanceConfigurationProps) {
  const handleUpdate = useCallback(
    (updates: Partial<PerformanceConfig>) => {
      onUpdate({ ...config, ...updates });
    },
    [config, onUpdate]
  );

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Configuración de Rendimiento
          </CardTitle>
          <CardDescription>
            Optimiza el rendimiento según tu hardware y preferencias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Virtualización</Label>
              <Switch
                checked={config.virtualization ?? true}
                onCheckedChange={(virtualization) => handleUpdate({ virtualization })}
              />
            </div>

            <div className="space-y-2">
              <Label>Carga Lazy</Label>
              <Switch
                checked={config.lazyLoading ?? true}
                onCheckedChange={(lazyLoading) => handleUpdate({ lazyLoading })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tamaño de Lote</Label>
              <div className="space-y-2">
                <Slider
                  value={[config.batchSize ?? 50]}
                  onValueChange={([batchSize]) => handleUpdate({ batchSize })}
                  min={10}
                  max={200}
                  step={10}
                />
                <div className="text-sm text-muted-foreground">
                  {config.batchSize ?? 50} elementos
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tiempo de Debounce</Label>
              <div className="space-y-2">
                <Slider
                  value={[config.debounce?.search ?? 300]}
                  onValueChange={([debounceTime]) => handleUpdate({ debounce: { ...config.debounce, search: debounceTime } })}
                  min={100}
                  max={1000}
                  step={50}
                />
                <div className="text-sm text-muted-foreground">
                  {config.debounce?.search ?? 300}ms
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Calidad de Miniaturas</Label>
            <Select
              value={config.thumbnailQuality ?? 'medium'}
              onValueChange={(thumbnailQuality) => handleUpdate({ thumbnailQuality: thumbnailQuality as 'low' | 'medium' | 'high' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja (Más Rápido)</SelectItem>
                <SelectItem value="medium">Media (Equilibrado)</SelectItem>
                <SelectItem value="high">Alta (Mejor Calidad)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Optimizaciones</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'memoryOptimization', label: 'Optimización de Memoria' },
                { key: 'caching', label: 'Cache Inteligente' },
                { key: 'preloading', label: 'Precarga de Contenido' },
                { key: 'compression', label: 'Compresión de Datos' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Switch
                    id={`performance-${key}`}
                    checked={Array.isArray(config.optimizations) ? config.optimizations.includes(key) : true}
                    onCheckedChange={(checked) => {
                      const optimizations = config.optimizations || [];
                      const newOptimizations = checked
                        ? [...(Array.isArray(optimizations) ? optimizations : []), key]
                        : (Array.isArray(optimizations) ? optimizations.filter((opt: string) => opt !== key) : []);
                      handleUpdate({ optimizations: newOptimizations });
                    }}
                  />
                  <Label htmlFor={`performance-${key}`} className="text-sm">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Configuración General Global
interface GeneralConfigurationProps {
  config: GlobalViewConfig;
  onUpdate: (config: GlobalViewConfig) => Promise<boolean>;
  className?: string;
}

export function GeneralConfiguration({ config, onUpdate, className }: GeneralConfigurationProps) {
  const handleUpdate = useCallback(
    (updates: Partial<GlobalViewConfig>) => {
      onUpdate({ ...config, ...updates });
    },
    [config, onUpdate]
  );

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración General
          </CardTitle>
          <CardDescription>
            Opciones generales que afectan a todas las vistas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vista por Defecto</Label>
              <Select
                value={config.defaultView ?? 'grid'}
                onValueChange={(defaultView) => handleUpdate({ defaultView })}
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
                value={typeof config.theme === 'object' ? config.theme.mode : (config.theme ?? 'system')}
                onValueChange={(theme) => handleUpdate({ theme: { mode: theme as 'auto' | 'light' | 'dark', colorScheme: 'default' } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Oscuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Recordar Vista por Carpeta</Label>
              <Switch
                checked={config.rememberViewPerFolder ?? true}
                onCheckedChange={(rememberViewPerFolder) => handleUpdate({ rememberViewPerFolder })}
              />
            </div>

            <div className="space-y-2">
              <Label>Sincronizar Configuración</Label>
              <Switch
                checked={config.syncSettings ?? false}
                onCheckedChange={(syncSettings) => handleUpdate({ syncSettings })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Funciones Experimentales</Label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { key: 'advancedFiltering', label: 'Filtrado Avanzado' },
                { key: 'aiSuggestions', label: 'Sugerencias IA' },
                { key: 'cloudSync', label: 'Sincronización en la Nube' },
                { key: 'betaFeatures', label: 'Funciones Beta' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Switch
                    id={`experimental-${key}`}
                    checked={config.experimentalFeatures?.includes(key) ?? false}
                    onCheckedChange={(checked) => {
                      const features = config.experimentalFeatures || [];
                      const newFeatures = checked
                        ? [...features, key]
                        : features.filter((feature: string) => feature !== key);
                      handleUpdate({ experimentalFeatures: newFeatures });
                    }}
                  />
                  <Label htmlFor={`experimental-${key}`} className="text-sm">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Configuración Específica por Entidad
interface EntitySpecificConfigurationProps {
  entityType: EntityStatsType;
  config: EntityViewConfig;
  onUpdate: (config: EntityViewConfig) => Promise<boolean>;
  className?: string;
}

export function EntitySpecificConfiguration({
  entityType,
  config,
  onUpdate,
  className,
}: EntitySpecificConfigurationProps) {
  const handleUpdate = useCallback(
    (updates: Partial<EntityViewConfig>) => {
      onUpdate({ ...config, ...updates });
    },
    [config, onUpdate]
  );

  const Icon = ENTITY_ICONS[entityType as keyof typeof ENTITY_ICONS] || Settings;

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            Configuración para {entityType}
          </CardTitle>
          <CardDescription>
            Personaliza la vista específicamente para este tipo de entidad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vista Preferida</Label>
              <Select
                value={config.preferredView ?? 'grid'}
                onValueChange={(preferredView) => handleUpdate({ preferredView })}
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
              <Label>Ordenamiento por Defecto</Label>
              <Select
                value={typeof config.defaultSort === 'string' ? config.defaultSort : `${config.defaultSort?.field}-${config.defaultSort?.direction}`}
                onValueChange={(value) => {
                  const [field, direction] = value.split('-');
                  handleUpdate({ defaultSort: { field, direction: direction as 'asc' | 'desc' } });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                  <SelectItem value="date-asc">Fecha (Más Antigua)</SelectItem>
                  <SelectItem value="date-desc">Fecha (Más Reciente)</SelectItem>
                  <SelectItem value="size-asc">Tamaño (Menor)</SelectItem>
                  <SelectItem value="size-desc">Tamaño (Mayor)</SelectItem>
                  <SelectItem value="type-asc">Tipo (A-Z)</SelectItem>
                  <SelectItem value="type-desc">Tipo (Z-A)</SelectItem>
                  <SelectItem value="rating-asc">Calificación (Menor)</SelectItem>
                  <SelectItem value="rating-desc">Calificación (Mayor)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mostrar Miniaturas</Label>
              <Switch
                checked={config.showThumbnails ?? true}
                onCheckedChange={(showThumbnails) => handleUpdate({ showThumbnails })}
              />
            </div>

            <div className="space-y-2">
              <Label>Mostrar Metadatos</Label>
              <Switch
                checked={config.showMetadata ?? true}
                onCheckedChange={(showMetadata) => handleUpdate({ showMetadata })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Campos Visibles</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'title', label: 'Título' },
                { key: 'description', label: 'Descripción' },
                { key: 'tags', label: 'Etiquetas' },
                { key: 'rating', label: 'Calificación' },
                { key: 'date', label: 'Fecha' },
                { key: 'size', label: 'Tamaño' },
                { key: 'dimensions', label: 'Dimensiones' },
                { key: 'format', label: 'Formato' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Switch
                    id={`entity-field-${key}`}
                    checked={config.visibleFields?.includes(key) ?? true}
                    onCheckedChange={(checked) => {
                      const fields = config.visibleFields || [];
                      const newFields = checked
                        ? [...fields, key]
                        : fields.filter((field: string) => field !== key);
                      handleUpdate({ visibleFields: newFields });
                    }}
                  />
                  <Label htmlFor={`entity-field-${key}`} className="text-sm">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Configuraciones específicas según el tipo de entidad */}
          {entityType === 'image' && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Opciones Específicas para Imágenes</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-exif"
                      checked={config.customOptions?.showExif ?? false}
                      onCheckedChange={(showExif) =>
                        handleUpdate({
                          customOptions: { ...config.customOptions, showExif },
                        })
                      }
                    />
                    <Label htmlFor="show-exif" className="text-sm">
                      Mostrar datos EXIF
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-histogram"
                      checked={config.customOptions?.showHistogram ?? false}
                      onCheckedChange={(showHistogram) =>
                        handleUpdate({
                          customOptions: { ...config.customOptions, showHistogram },
                        })
                      }
                    />
                    <Label htmlFor="show-histogram" className="text-sm">
                      Mostrar histograma
                    </Label>
                  </div>
                </div>
              </div>
            </>
          )}

          {entityType === 'video' && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Opciones Específicas para Videos</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-play-preview"
                      checked={config.customOptions?.autoPlayPreview ?? false}
                      onCheckedChange={(autoPlayPreview) =>
                        handleUpdate({
                          customOptions: { ...config.customOptions, autoPlayPreview },
                        })
                      }
                    />
                    <Label htmlFor="auto-play-preview" className="text-sm">
                      Reproducir preview automáticamente
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-duration"
                      checked={config.customOptions?.showDuration ?? true}
                      onCheckedChange={(showDuration) =>
                        handleUpdate({
                          customOptions: { ...config.customOptions, showDuration },
                        })
                      }
                    />
                    <Label htmlFor="show-duration" className="text-sm">
                      Mostrar duración
                    </Label>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente principal para configuraciones globales por sección
interface GlobalSectionConfigurationProps {
  sectionType: 'general' | 'animations' | 'accessibility' | 'performance';
  config: GlobalViewConfig;
  onUpdate: (config: GlobalViewConfig) => Promise<boolean>;
  className?: string;
}

export function GlobalSectionConfiguration({
  sectionType,
  config,
  onUpdate,
  className,
}: GlobalSectionConfigurationProps) {
  switch (sectionType) {
    case 'general':
      return (
        <GeneralConfiguration
          config={config}
          onUpdate={onUpdate}
          className={className}
        />
      );
    case 'animations':
      return (
        <AnimationConfiguration
          config={config.animations}
          onUpdate={async (animationConfig) => {
            return onUpdate({ ...config, animations: animationConfig });
          }}
          className={className}
        />
      );
    case 'accessibility':
      return (
        <AccessibilityConfiguration
          config={config.accessibility}
          onUpdate={async (accessibilityConfig) => {
            return onUpdate({ ...config, accessibility: accessibilityConfig });
          }}
          className={className}
        />
      );
    case 'performance':
      return (
        <PerformanceConfiguration
          config={config.performance}
          onUpdate={async (performanceConfig) => {
            return onUpdate({ ...config, performance: performanceConfig });
          }}
          className={className}
        />
      );
    default:
      return (
        <div className="text-sm text-muted-foreground">
          Configuración no disponible para {sectionType}
        </div>
      );
  }
}