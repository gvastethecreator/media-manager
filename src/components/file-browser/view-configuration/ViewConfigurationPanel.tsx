import React, { useState, useCallback } from 'react';
import { Settings, Sliders, Eye, Grid, List, LayoutGrid, Columns } from 'lucide-react';
import { useViewConfiguration } from '../../../hooks/use-view-configuration';
import { ViewType, ViewConfiguration, ViewPreset } from '../../../types/file-browser/view-configuration';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Switch } from '../../ui/switch';
import { Slider } from '../../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Separator } from '../../ui/separator';
import { Badge } from '../../ui/badge';
import { toast } from 'sonner';

interface ViewConfigurationPanelProps {
  viewType: ViewType;
  onConfigurationChange?: (config: ViewConfiguration) => void;
  className?: string;
}

const VIEW_TYPE_ICONS = {
  list: List,
  grid: Grid,
  cards: LayoutGrid,
  masonry: Columns,
} as const;

const VIEW_TYPE_LABELS = {
  list: 'Lista',
  grid: 'Cuadrícula',
  cards: 'Tarjetas',
  masonry: 'Mosaico',
} as const;

export const ViewConfigurationPanel: React.FC<ViewConfigurationPanelProps> = ({
  viewType,
  onConfigurationChange,
  className = '',
}) => {
  const {
    currentConfiguration,
    updateConfiguration,
    availablePresets,
    saveAsPreset,
    applyPreset,
    exportConfiguration,
    importConfiguration,
  } = useViewConfiguration(viewType);

  const [currentConfig, setCurrentConfig] = useState<ViewConfiguration>(
    () => currentConfiguration
  );
  const [presets] = useState<ViewPreset[]>(() => availablePresets);
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  const handleConfigChange = useCallback(
    (updates: Partial<ViewConfiguration>) => {
      const newConfig = { ...currentConfig, ...updates };
      setCurrentConfig(newConfig);
      updateConfiguration(updates);
      onConfigurationChange?.(newConfig);
    },
    [currentConfig, updateConfiguration, onConfigurationChange]
  );

  const handleCommonSettingChange = useCallback(
    (key: keyof ViewConfiguration['common'], value: any) => {
      handleConfigChange({
        common: {
          ...currentConfig.common,
          [key]: value,
        },
      });
    },
    [currentConfig.common, handleConfigChange]
  );

  const handleSpecificSettingChange = useCallback(
    (key: string, value: any) => {
      handleConfigChange({
        specific: {
          ...currentConfig.specific,
          [key]: value,
        },
      });
    },
    [currentConfig.specific, handleConfigChange]
  );

  const handlePresetApply = useCallback(
    async (preset: ViewPreset) => {
      const success = await applyPreset(preset.id);
      if (success) {
        setCurrentConfig(currentConfiguration);
        onConfigurationChange?.(currentConfiguration);
        toast.success(`Preset "${preset.name}" aplicado`);
      }
    },
    [applyPreset, currentConfiguration, onConfigurationChange]
  );

  const handleCreatePreset = useCallback(async () => {
    if (!presetName.trim()) {
      toast.error('El nombre del preset es requerido');
      return;
    }

    try {
      await saveAsPreset(presetName, presetDescription);
      
      setPresetName('');
      setPresetDescription('');
      setIsCreatingPreset(false);
      toast.success(`Preset "${presetName}" creado exitosamente`);
    } catch (error) {
      toast.error('Error al crear el preset');
    }
  }, [presetName, presetDescription, currentConfig, createPreset]);

  const handleExport = useCallback(async () => {
    try {
      const exported = exportConfiguration();
      const blob = new Blob([exported.data], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `view-config-${viewType}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Configuración exportada');
    } catch (error) {
      toast.error('Error al exportar la configuración');
    }
  }, [viewType, exportConfiguration]);

  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const result = await importConfiguration(content);
          if (result.success) {
            setCurrentConfig(currentConfiguration);
            onConfigurationChange?.(currentConfiguration);
            toast.success('Configuración importada exitosamente');
          } else {
            toast.error(`Error al importar: ${result.errors.join(', ')}`);
          }
        } catch (error) {
          toast.error('Error al importar la configuración');
        }
      };
      reader.readAsText(file);
    },
    [importConfiguration, currentConfiguration, onConfigurationChange]
  );

  const ViewIcon = VIEW_TYPE_ICONS[viewType];

  return (
    <Card className={`w-full max-w-4xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ViewIcon className="h-5 w-5" />
          Configuración de Vista {VIEW_TYPE_LABELS[viewType]}
        </CardTitle>
        <CardDescription>
          Personaliza la apariencia y comportamiento de la vista {VIEW_TYPE_LABELS[viewType].toLowerCase()}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="common" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="common">General</TabsTrigger>
            <TabsTrigger value="specific">Específico</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="advanced">Avanzado</TabsTrigger>
          </TabsList>
          
          <TabsContent value="common" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Elementos Visibles</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-thumbnails">Mostrar miniaturas</Label>
                  <Switch
                    id="show-thumbnails"
                    checked={currentConfig.common.showThumbnails}
                    onCheckedChange={(checked) =>
                      handleCommonSettingChange('showThumbnails', checked)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-metadata">Mostrar metadatos</Label>
                  <Switch
                    id="show-metadata"
                    checked={currentConfig.common.showMetadata}
                    onCheckedChange={(checked) =>
                      handleCommonSettingChange('showMetadata', checked)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-tags">Mostrar etiquetas</Label>
                  <Switch
                    id="show-tags"
                    checked={currentConfig.common.showTags}
                    onCheckedChange={(checked) =>
                      handleCommonSettingChange('showTags', checked)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-stats">Mostrar estadísticas</Label>
                  <Switch
                    id="show-stats"
                    checked={currentConfig.common.showStats}
                    onCheckedChange={(checked) =>
                      handleCommonSettingChange('showStats', checked)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-hidden">Mostrar archivos ocultos</Label>
                  <Switch
                    id="show-hidden"
                    checked={currentConfig.common.showHiddenFiles}
                    onCheckedChange={(checked) =>
                      handleCommonSettingChange('showHiddenFiles', checked)
                    }
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Ordenamiento</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="sort-by">Ordenar por</Label>
                  <Select
                    value={currentConfig.common.sortBy}
                    onValueChange={(value) =>
                      handleCommonSettingChange('sortBy', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nombre</SelectItem>
                      <SelectItem value="size">Tamaño</SelectItem>
                      <SelectItem value="modified">Fecha modificación</SelectItem>
                      <SelectItem value="created">Fecha creación</SelectItem>
                      <SelectItem value="type">Tipo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sort-direction">Dirección</Label>
                  <Select
                    value={currentConfig.common.sortDirection}
                    onValueChange={(value: 'asc' | 'desc') =>
                      handleCommonSettingChange('sortDirection', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascendente</SelectItem>
                      <SelectItem value="desc">Descendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Animaciones y Efectos</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-animations">Habilitar animaciones</Label>
                <Switch
                  id="enable-animations"
                  checked={currentConfig.common.enableAnimations}
                  onCheckedChange={(checked) =>
                    handleCommonSettingChange('enableAnimations', checked)
                  }
                />
              </div>
              
              {currentConfig.common.enableAnimations && (
                <div className="space-y-2">
                  <Label htmlFor="animation-duration">
                    Duración de animación: {currentConfig.common.animationDuration}ms
                  </Label>
                  <Slider
                    id="animation-duration"
                    min={0}
                    max={1000}
                    step={50}
                    value={[currentConfig.common.animationDuration]}
                    onValueChange={([value]) =>
                      handleCommonSettingChange('animationDuration', value)
                    }
                    className="w-full"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <Label htmlFor="hover-effects">Efectos de hover</Label>
                <Switch
                  id="hover-effects"
                  checked={currentConfig.common.enableHoverEffects}
                  onCheckedChange={(checked) =>
                    handleCommonSettingChange('enableHoverEffects', checked)
                  }
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="specific" className="space-y-6">
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Configuración Específica de {VIEW_TYPE_LABELS[viewType]}
              </h3>
              <p className="text-muted-foreground">
                Las opciones específicas para la vista {VIEW_TYPE_LABELS[viewType].toLowerCase()} aparecerán aquí.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="presets" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Presets Disponibles</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingPreset(true)}
              >
                Crear Preset
              </Button>
            </div>
            
            {isCreatingPreset && (
              <Card>
                <CardHeader>
                  <CardTitle>Crear Nuevo Preset</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="preset-name">Nombre</Label>
                    <Input
                      id="preset-name"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="Nombre del preset"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="preset-description">Descripción (opcional)</Label>
                    <Input
                      id="preset-description"
                      value={presetDescription}
                      onChange={(e) => setPresetDescription(e.target.value)}
                      placeholder="Descripción del preset"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleCreatePreset}>Crear</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreatingPreset(false);
                        setPresetName('');
                        setPresetDescription('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets.map((preset) => (
                <Card key={preset.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{preset.name}</CardTitle>
                      <Badge variant={preset.category === 'custom' ? 'secondary' : 'default'}>
                        {preset.category}
                      </Badge>
                    </div>
                    {preset.description && (
                      <CardDescription className="text-sm">
                        {preset.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetApply(preset)}
                      className="w-full"
                    >
                      Aplicar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Importar/Exportar</h3>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExport}>
                  Exportar Configuración
                </Button>
                
                <div className="relative">
                  <Button variant="outline" asChild>
                    <label htmlFor="import-config" className="cursor-pointer">
                      Importar Configuración
                    </label>
                  </Button>
                  <input
                    id="import-config"
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información de Configuración</h3>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Nombre:</span>
                  <span>{currentConfig.metadata.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Versión:</span>
                  <span>{currentConfig.metadata.version}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Creado:</span>
                  <span>
                    {new Date(currentConfig.metadata.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Modificado:</span>
                  <span>
                    {new Date(currentConfig.metadata.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ViewConfigurationPanel;