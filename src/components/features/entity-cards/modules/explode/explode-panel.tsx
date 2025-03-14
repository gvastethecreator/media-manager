'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Layers, Rotate3D, Play, Settings } from 'lucide-react';
import type { ExplodePanelProps, ExplodeSystemPreset, ExplodeDirection } from './types';

// Presets de vista explosionada
const explodePresets: ExplodeSystemPreset[] = [
  {
    id: 'default',
    name: 'Estándar',
    description: 'Vista explosionada 3D equilibrada',
    explodeSystem: {
      enabled: true,
      distance: 20,
      direction: '3d',
      perspective: 1000,
      rotationX: 10,
      rotationY: 15,
      rotationZ: 0,
      animated: true,
      animationDuration: 500,
      staggered: true,
      staggerDelay: 50,
      showLabels: true,
      autoRotate: false,
      autoRotateSpeed: 1,
      centerLayer: '',
      expandOnHover: true,
      hoverExpandFactor: 1.2
    }
  },
  {
    id: 'horizontal',
    name: 'Horizontal',
    description: 'Vista explosionada horizontal',
    explodeSystem: {
      enabled: true,
      distance: 30,
      direction: 'x',
      perspective: 1000,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      animated: true,
      animationDuration: 400,
      staggered: true,
      staggerDelay: 30,
      showLabels: true,
      autoRotate: false,
      autoRotateSpeed: 0,
      centerLayer: '',
      expandOnHover: true,
      hoverExpandFactor: 1.2
    }
  },
  {
    id: 'vertical',
    name: 'Vertical',
    description: 'Vista explosionada vertical',
    explodeSystem: {
      enabled: true,
      distance: 30,
      direction: 'y',
      perspective: 1000,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      animated: true,
      animationDuration: 400,
      staggered: true,
      staggerDelay: 30,
      showLabels: true,
      autoRotate: false,
      autoRotateSpeed: 0,
      centerLayer: '',
      expandOnHover: true,
      hoverExpandFactor: 1.2
    }
  },
  {
    id: 'depth',
    name: 'Profundidad',
    description: 'Vista explosionada en profundidad',
    explodeSystem: {
      enabled: true,
      distance: 30,
      direction: 'z',
      perspective: 1200,
      rotationX: 20,
      rotationY: 10,
      rotationZ: 0,
      animated: true,
      animationDuration: 600,
      staggered: true,
      staggerDelay: 60,
      showLabels: true,
      autoRotate: false,
      autoRotateSpeed: 0,
      centerLayer: '',
      expandOnHover: true,
      hoverExpandFactor: 1.2
    }
  },
  {
    id: 'dynamic',
    name: 'Dinámico',
    description: 'Vista con rotación automática',
    explodeSystem: {
      enabled: true,
      distance: 25,
      direction: '3d',
      perspective: 1000,
      rotationX: 5,
      rotationY: 5,
      rotationZ: 5,
      animated: true,
      animationDuration: 500,
      staggered: true,
      staggerDelay: 40,
      showLabels: true,
      autoRotate: true,
      autoRotateSpeed: 2,
      centerLayer: '',
      expandOnHover: true,
      hoverExpandFactor: 1.5
    }
  },
  {
    id: 'none',
    name: 'Desactivado',
    description: 'Sin vista explosionada',
    explodeSystem: {
      enabled: false,
      distance: 0,
      direction: '3d',
      perspective: 1000,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      animated: false,
      animationDuration: 0,
      staggered: false,
      staggerDelay: 0,
      showLabels: false,
      autoRotate: false,
      autoRotateSpeed: 0,
      centerLayer: '',
      expandOnHover: false,
      hoverExpandFactor: 1
    }
  }
];

// Opciones para dirección de explosión
const directionOptions: { value: ExplodeDirection; label: string }[] = [
  { value: 'x', label: 'Horizontal (X)' },
  { value: 'y', label: 'Vertical (Y)' },
  { value: 'z', label: 'Profundidad (Z)' },
  { value: '3d', label: 'Tridimensional (3D)' }
];

export function ExplodePanel({
  explodeSystem,
  onChange,
  layersList = [],
  disabled = false,
  className
}: ExplodePanelProps) {
  const [activeTab, setActiveTab] = useState('general');

  // Función para seleccionar un preset completo
  const selectPreset = (presetId: string) => {
    const preset = explodePresets.find(p => p.id === presetId);
    if (preset) {
      onChange(preset.explodeSystem);
    }
  };

  // Función para actualizar un campo específico
  const updateField = (field: string, value: any) => {
    onChange({ ...explodeSystem, [field]: value });
  };

  // Función para obtener un preset basado en la configuración actual
  const getCurrentPreset = () => {
    // Intentamos encontrar un preset que coincida exactamente
    const exactMatch = explodePresets.find(
      p => JSON.stringify(p.explodeSystem) === JSON.stringify(explodeSystem)
    );

    if (exactMatch) return exactMatch.id;

    // Si no hay coincidencia exacta, verificamos si está habilitado
    if (!explodeSystem.enabled) return 'none';

    // Por defecto, devolvemos 'default' o un ID personalizado
    return 'custom';
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <Layers className="h-4 w-4 mr-2 text-muted-foreground" />
          Vista Explosionada
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="general">
              <Layers className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="rotation">
              <Rotate3D className="h-4 w-4 mr-2" />
              Rotación
            </TabsTrigger>
            <TabsTrigger value="animation">
              <Play className="h-4 w-4 mr-2" />
              Animación
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preset de Explosión</Label>
                <Select
                  value={getCurrentPreset()}
                  onValueChange={(value) => selectPreset(value)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {explodePresets.map(preset => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecciona un estilo predefinido de vista explosionada
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="explode-enabled">Vista Explosionada</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Activa o desactiva la vista explosionada
                  </p>
                </div>
                <Switch
                  id="explode-enabled"
                  checked={explodeSystem.enabled}
                  onCheckedChange={(checked) => updateField('enabled', checked)}
                  disabled={disabled}
                />
              </div>

              {explodeSystem.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Dirección de Explosión</Label>
                    <Select
                      value={explodeSystem.direction}
                      onValueChange={(value: ExplodeDirection) => updateField('direction', value)}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar dirección" />
                      </SelectTrigger>
                      <SelectContent>
                        {directionOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Eje en el que se separarán las capas
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Distancia entre Capas</Label>
                      <span className="text-xs">{explodeSystem.distance}px</span>
                    </div>
                    <Slider
                      value={[explodeSystem.distance]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([value]) => updateField('distance', value)}
                      disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Espacio entre cada capa en la vista explosionada
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Perspectiva 3D</Label>
                      <span className="text-xs">{explodeSystem.perspective}px</span>
                    </div>
                    <Slider
                      value={[explodeSystem.perspective]}
                      min={200}
                      max={2000}
                      step={100}
                      onValueChange={([value]) => updateField('perspective', value)}
                      disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Intensidad del efecto de perspectiva 3D
                    </p>
                  </div>

                  {layersList.length > 0 && (
                    <div className="space-y-2">
                      <Label>Capa Central</Label>
                      <Select
                        value={explodeSystem.centerLayer || ''}
                        onValueChange={(value) => updateField('centerLayer', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar capa central" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Ninguna (centrado automático)</SelectItem>
                          {layersList.map((layer) => (
                            <SelectItem key={layer} value={layer}>
                              {layer}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Capa que se mantendrá fija en el centro
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-labels">Mostrar Etiquetas</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Muestra el nombre de cada capa
                      </p>
                    </div>
                    <Switch
                      id="show-labels"
                      checked={explodeSystem.showLabels}
                      onCheckedChange={(checked) => updateField('showLabels', checked)}
                      disabled={disabled}
                    />
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="rotation" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Rotación X (grados)</Label>
                  <span className="text-xs">{explodeSystem.rotationX}°</span>
                </div>
                <Slider
                  value={[explodeSystem.rotationX]}
                  min={-180}
                  max={180}
                  step={5}
                  onValueChange={([value]) => updateField('rotationX', value)}
                  disabled={disabled || !explodeSystem.enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Rotación en el eje horizontal
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Rotación Y (grados)</Label>
                  <span className="text-xs">{explodeSystem.rotationY}°</span>
                </div>
                <Slider
                  value={[explodeSystem.rotationY]}
                  min={-180}
                  max={180}
                  step={5}
                  onValueChange={([value]) => updateField('rotationY', value)}
                  disabled={disabled || !explodeSystem.enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Rotación en el eje vertical
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Rotación Z (grados)</Label>
                  <span className="text-xs">{explodeSystem.rotationZ}°</span>
                </div>
                <Slider
                  value={[explodeSystem.rotationZ]}
                  min={-180}
                  max={180}
                  step={5}
                  onValueChange={([value]) => updateField('rotationZ', value)}
                  disabled={disabled || !explodeSystem.enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Rotación en el eje de profundidad
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-rotate">Rotación Automática</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rota la vista automáticamente
                  </p>
                </div>
                <Switch
                  id="auto-rotate"
                  checked={explodeSystem.autoRotate}
                  onCheckedChange={(checked) => updateField('autoRotate', checked)}
                  disabled={disabled || !explodeSystem.enabled}
                />
              </div>

              {explodeSystem.autoRotate && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Velocidad de Rotación</Label>
                    <span className="text-xs">x{explodeSystem.autoRotateSpeed}</span>
                  </div>
                  <Slider
                    value={[explodeSystem.autoRotateSpeed]}
                    min={0.1}
                    max={5}
                    step={0.1}
                    onValueChange={([value]) => updateField('autoRotateSpeed', value)}
                    disabled={disabled || !explodeSystem.enabled}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="expand-hover">Expandir al Pasar el Ratón</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Amplía la separación al pasar el ratón
                  </p>
                </div>
                <Switch
                  id="expand-hover"
                  checked={explodeSystem.expandOnHover}
                  onCheckedChange={(checked) => updateField('expandOnHover', checked)}
                  disabled={disabled || !explodeSystem.enabled}
                />
              </div>

              {explodeSystem.expandOnHover && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Factor de Expansión</Label>
                    <span className="text-xs">{explodeSystem.hoverExpandFactor.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[explodeSystem.hoverExpandFactor]}
                    min={1.1}
                    max={3}
                    step={0.1}
                    onValueChange={([value]) => updateField('hoverExpandFactor', value)}
                    disabled={disabled || !explodeSystem.enabled}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="animation" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="animated">Animación</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Anima la transición a vista explosionada
                  </p>
                </div>
                <Switch
                  id="animated"
                  checked={explodeSystem.animated}
                  onCheckedChange={(checked) => updateField('animated', checked)}
                  disabled={disabled || !explodeSystem.enabled}
                />
              </div>

              {explodeSystem.animated && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Duración de Animación (ms)</Label>
                      <span className="text-xs">{explodeSystem.animationDuration}ms</span>
                    </div>
                    <Slider
                      value={[explodeSystem.animationDuration]}
                      min={0}
                      max={2000}
                      step={50}
                      onValueChange={([value]) => updateField('animationDuration', value)}
                      disabled={disabled || !explodeSystem.enabled}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Duración de la transición a vista explosionada
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="staggered">Efecto Escalonado</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Anima las capas con efecto cascada
                      </p>
                    </div>
                    <Switch
                      id="staggered"
                      checked={explodeSystem.staggered}
                      onCheckedChange={(checked) => updateField('staggered', checked)}
                      disabled={disabled || !explodeSystem.enabled || !explodeSystem.animated}
                    />
                  </div>

                  {explodeSystem.staggered && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Retraso entre Capas (ms)</Label>
                        <span className="text-xs">{explodeSystem.staggerDelay}ms</span>
                      </div>
                      <Slider
                        value={[explodeSystem.staggerDelay]}
                        min={0}
                        max={300}
                        step={10}
                        onValueChange={([value]) => updateField('staggerDelay', value)}
                        disabled={disabled || !explodeSystem.enabled || !explodeSystem.animated}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Tiempo entre la animación de cada capa
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}