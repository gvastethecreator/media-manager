/**
 * @file View Configuration Panel
 * @module components/features/file-browser/settings/view-configuration-panel
 * @description Panel principal para configurar todas las vistas del FileBrowser.
 * Proporciona una interfaz unificada para gestionar configuraciones de vistas.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Grid3X3,
  List,
  LayoutGrid,
  Columns,
  Download,
  Upload,
  RotateCcw,
  Save,
  Eye,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ViewSpecificConfiguration } from './view-specific-configs';
import { GlobalSectionConfiguration, EntitySpecificConfiguration } from './global-entity-configs';
import { useViewConfiguration } from '@/hooks/use-view-configuration';
import { toastService } from '@/services/toast/toast.service';
import { cn } from '@/lib/utils';
import { EntityStatsType } from '@/types/migration';
import type { ViewConfigurationPreset } from '@/types/file-browser/view-configuration';

interface ViewConfigurationPanelProps {
  /** Clase CSS adicional */
  className?: string;
  /** Callback cuando se cierra el panel */
  onClose?: () => void;
}

const VIEW_ICONS = {
  list: List,
  grid: Grid3X3,
  cards: LayoutGrid,
  masonry: Columns,
} as const;

const PRESET_ICONS = {
  performance: Zap,
  accessibility: Eye,
  visual: Sparkles,
  custom: Settings,
} as const;

export function ViewConfigurationPanel({ className, onClose }: ViewConfigurationPanelProps) {
  const {
    currentConfig,
    updateViewConfig,
    updateGlobalConfig,
    updateEntityConfig,
    applyPreset,
    resetConfiguration,
    getAvailablePresets,
    exportConfiguration,
    importConfiguration,
    hasUnsavedChanges,
  } = useViewConfiguration('list'); // Default to list view

  // Create wrapper functions for component compatibility
  const wrappedUpdateViewConfig = useCallback(async (viewType: any, config: any): Promise<boolean> => {
    try {
      updateViewConfig(config);
      return true;
    } catch {
      return false;
    }
  }, [updateViewConfig]);

  const wrappedUpdateGlobalConfig = useCallback(async (config: any): Promise<boolean> => {
    try {
      updateGlobalConfig(config);
      return true;
    } catch {
      return false;
    }
  }, [updateGlobalConfig]);

  const wrappedUpdateEntityConfig = useCallback(async (entityType: any, config: any): Promise<boolean> => {
    try {
      updateEntityConfig(config);
      return true;
    } catch {
      return false;
    }
  }, [updateEntityConfig]);

  const [activeTab, setActiveTab] = useState<'views' | 'global' | 'entities' | 'presets'>('views');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['general']));
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState('');

  const presets = getAvailablePresets();

  // Convert ViewPreset[] to ViewConfigurationPreset[] for compatibility
  const configurationPresets = presets.map(preset => ({
    ...preset,
    globalConfig: {
      defaultViewMode: 'grid' as const,
      animations: {
        enabled: true,
        duration: 200,
        easing: 'ease' as const,
        types: {
          hover: { enabled: true, duration: 150, scale: 1.05 },
          selection: { enabled: true, duration: 200, highlightColor: '#3b82f6' },
          loading: { enabled: true, duration: 500, type: 'spinner' as const },
          viewTransition: { enabled: true, duration: 300, type: 'fade' as const }
        }
      },
      accessibility: {
        keyboardNavigation: true,
        screenReaderAnnouncements: true,
        highContrast: false,
        reduceMotion: false,
        largeFonts: false,
        focus: {
          showIndicators: true,
          indicatorColor: '#3b82f6',
          indicatorWidth: 2
        }
      },
      performance: {
        maxRenderItems: 1000,
        virtualization: true,
        virtualizationBuffer: 20,
        lazyThumbnails: true,
        thumbnailQuality: 'medium' as const,
        virtualScrolling: true,
        lazyImageLoading: true,
        cacheStrategy: 'memory' as const,
        maxMemoryUsage: 256,
        compressionLevel: 6,
        cache: { thumbnails: true, maxSize: 100, ttl: 3600 },
        debounce: { search: 300, resize: 100, scroll: 16 }
      },
      layout: {
        sidebar: { enabled: true, width: 240, position: 'left' as const },
        toolbar: { enabled: true, position: 'top' as const, compact: false },
        statusBar: { enabled: true, showItemCount: true, showSelectionInfo: true }
      },
      theme: { mode: 'light' as const, colorScheme: 'default' }
    },
    entityConfigs: [],
    metadata: {
      author: 'System',
      version: '1.0.0',
      createdAt: Date.now(),
      lastModified: Date.now(),
      tags: []
    }
  }));

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleApplyPreset = useCallback(
    async (presetName: string) => {
      const success = await applyPreset(presetName);
      if (success) {
        toastService.success(`Preset "${presetName}" aplicado correctamente`);
      }
    },
    [applyPreset]
  );

  const handleReset = useCallback(async () => {
    const success = await resetConfiguration();
    if (success) {
      toastService.success('Configuración restablecida a valores por defecto');
    }
  }, [resetConfiguration]);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      const result = exportConfiguration({ format: 'json' });

      // Crear y descargar archivo
      const blob = new Blob([result.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `view-configuration-${result.timestamp.getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toastService.success('Configuración exportada correctamente');
    } catch (error) {
      toastService.error('Error al exportar configuración');
    } finally {
      setIsExporting(false);
    }
  }, [exportConfiguration]);

  const handleImport = useCallback(async () => {
    if (!importData.trim()) {
      toastService.error('Por favor, ingresa los datos de configuración');
      return;
    }

    try {
      setIsImporting(true);
      const result = await importConfiguration(importData, {
        validate: true,
        createBackup: true,
        applyImmediately: true,
        overwrite: false,
      });

      if (result.success) {
        toastService.success('Configuración importada correctamente');
        setImportData('');
      } else {
        toastService.error(`Error al importar: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      toastService.error('Error al procesar la configuración');
    } finally {
      setIsImporting(false);
    }
  }, [importConfiguration, importData]);

  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  }, []);

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Vistas
            </CardTitle>
            <CardDescription>
              Personaliza la apariencia y comportamiento de todas las vistas del navegador de archivos
            </CardDescription>
          </div>
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Cambios sin guardar
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="views" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Vistas
            </TabsTrigger>
            <TabsTrigger value="global" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Global
            </TabsTrigger>
            <TabsTrigger value="entities" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Entidades
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Presets
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[600px] mt-6">
            <TabsContent value="views" className="space-y-6">
              <ViewsConfigurationTab
                config={currentConfig}
                onUpdateViewConfig={wrappedUpdateViewConfig}
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
              />
            </TabsContent>

            <TabsContent value="global" className="space-y-6">
              <GlobalConfigurationTab
                config={currentConfig.common}
                onUpdateGlobalConfig={wrappedUpdateGlobalConfig}
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
              />
            </TabsContent>

            <TabsContent value="entities" className="space-y-6">
              <EntitiesConfigurationTab
                config={{}} // Use empty object for now as this feature needs to be implemented
                onUpdateEntityConfig={wrappedUpdateEntityConfig}
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
              />
            </TabsContent>

            <TabsContent value="presets" className="space-y-6">
              <PresetsConfigurationTab
                presets={configurationPresets}
                onApplyPreset={handleApplyPreset}
                onExport={handleExport}
                onImport={handleImport}
                onFileImport={handleFileImport}
                onReset={handleReset}
                importData={importData}
                setImportData={setImportData}
                isExporting={isExporting}
                isImporting={isImporting}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Configuración guardada automáticamente
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restablecer
            </Button>
            {onClose && (
              <Button onClick={onClose}>
                <Save className="h-4 w-4 mr-2" />
                Cerrar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para configuración de vistas específicas
interface ViewsConfigurationTabProps {
  config: any;
  onUpdateViewConfig: (viewType: any, config: any) => Promise<boolean>;
  expandedSections: Set<string>;
  onToggleSection: (sectionId: string) => void;
}

function ViewsConfigurationTab({
  config,
  onUpdateViewConfig,
  expandedSections,
  onToggleSection,
}: ViewsConfigurationTabProps) {
  const views: { key: keyof typeof config; label: string; icon: any }[] = [
    { key: 'listView', label: 'Vista de Lista', icon: List },
    { key: 'gridView', label: 'Vista de Cuadrícula', icon: Grid3X3 },
    { key: 'cardsView', label: 'Vista de Tarjetas', icon: LayoutGrid },
    { key: 'masonryView', label: 'Vista de Mosaico', icon: Columns },
  ];

  return (
    <div className="space-y-4">
      {views.map(({ key, label, icon: Icon }) => {
        const keyStr = String(key);
        const isExpanded = expandedSections.has(keyStr);
        const viewConfig = config[key];

        return (
          <Card key={keyStr}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => onToggleSection(keyStr)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {label}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent>
                    <ViewSpecificConfiguration
                      viewType={key as "listView" | "gridView" | "cardsView" | "masonryView"}
                      config={viewConfig}
                      onUpdate={(newConfig) => onUpdateViewConfig(key, newConfig)}
                    />
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}

// Componente para configuración global
interface GlobalConfigurationTabProps {
  config: any;
  onUpdateGlobalConfig: (config: any) => Promise<boolean>;
  expandedSections: Set<string>;
  onToggleSection: (sectionId: string) => void;
}

function GlobalConfigurationTab({
  config,
  onUpdateGlobalConfig,
  expandedSections,
  onToggleSection,
}: GlobalConfigurationTabProps) {
  const sections = [
    { key: 'general', label: 'General', icon: Settings },
    { key: 'animations', label: 'Animaciones', icon: Sparkles },
    { key: 'accessibility', label: 'Accesibilidad', icon: Eye },
    { key: 'performance', label: 'Rendimiento', icon: Zap },
  ];

  return (
    <div className="space-y-4">
      {sections.map(({ key, label, icon: Icon }) => {
        const isExpanded = expandedSections.has(key);

        return (
          <Card key={key}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => onToggleSection(key)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {label}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent>
                    <GlobalSectionConfiguration
                      sectionType={key as "general" | "animations" | "accessibility" | "performance"}
                      config={config}
                      onUpdate={onUpdateGlobalConfig}
                    />
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}

// Componente para configuración por entidades
interface EntitiesConfigurationTabProps {
  config: Record<string, any>;
  onUpdateEntityConfig: (entityType: EntityStatsType, config: any) => Promise<boolean>;
  expandedSections: Set<string>;
  onToggleSection: (sectionId: string) => void;
}

function EntitiesConfigurationTab({
  config,
  onUpdateEntityConfig,
  expandedSections,
  onToggleSection,
}: EntitiesConfigurationTabProps) {
  const entityTypes: EntityStatsType[] = [
    EntityStatsType.IMAGE,
    EntityStatsType.VIDEO,
    EntityStatsType.AUDIO,
    EntityStatsType.DOCUMENT,
    EntityStatsType.FOLDER,
    EntityStatsType.COLLECTION,
    EntityStatsType.TAG,
    EntityStatsType.ALBUM,
    EntityStatsType.CHARACTER,
    EntityStatsType.CONCEPT,
    EntityStatsType.NOTE,
    EntityStatsType.PLACE,
  ];

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Configura preferencias específicas para cada tipo de entidad
      </div>

      {entityTypes.map((entityType) => {
        const entityTypeStr = String(entityType);
        const isExpanded = expandedSections.has(entityTypeStr);
        const entityConfig = config[entityType];

        return (
          <Card key={entityTypeStr}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => onToggleSection(entityTypeStr)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{entityType}</Badge>
                  {entityConfig?.preferredView && (
                    <Badge variant="secondary">{entityConfig.preferredView}</Badge>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent>
                    <EntitySpecificConfiguration
                      entityType={entityType}
                      config={entityConfig}
                      onUpdate={(newConfig) => onUpdateEntityConfig(entityType, newConfig)}
                    />
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}

// Componente para presets y importación/exportación
interface PresetsConfigurationTabProps {
  presets: ViewConfigurationPreset[];
  onApplyPreset: (presetName: string) => void;
  onExport: () => void;
  onImport: () => void;
  onFileImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  importData: string;
  setImportData: (data: string) => void;
  isExporting: boolean;
  isImporting: boolean;
}

function PresetsConfigurationTab({
  presets,
  onApplyPreset,
  onExport,
  onImport,
  onFileImport,
  onReset,
  importData,
  setImportData,
  isExporting,
  isImporting,
}: PresetsConfigurationTabProps) {
  return (
    <div className="space-y-6">
      {/* Presets predefinidos */}
      <Card>
        <CardHeader>
          <CardTitle>Presets Predefinidos</CardTitle>
          <CardDescription>
            Aplica configuraciones predefinidas optimizadas para diferentes casos de uso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {presets.map((preset) => {
              const Icon = PRESET_ICONS[preset.category as keyof typeof PRESET_ICONS] || Settings;

              return (
                <Card key={preset.name} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4" />
                      {preset.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground mb-3">
                      {preset.description}
                    </p>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => onApplyPreset(preset.name)}
                    >
                      Aplicar
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Importación/Exportación */}
      <Card>
        <CardHeader>
          <CardTitle>Importar/Exportar Configuración</CardTitle>
          <CardDescription>
            Guarda o carga configuraciones personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onExport}
              disabled={isExporting}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Exportar'}
            </Button>
            <div className="flex-1">
              <Input
                type="file"
                accept=".json"
                onChange={onFileImport}
                className="hidden"
                id="config-file-input"
              />
              <Label htmlFor="config-file-input" className="cursor-pointer">
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Cargar Archivo
                  </span>
                </Button>
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="import-data">O pega la configuración JSON:</Label>
            <Textarea
              id="import-data"
              placeholder="Pega aquí el JSON de configuración..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={6}
            />
            <Button
              onClick={onImport}
              disabled={!importData.trim() || isImporting}
              className="w-full"
            >
              {isImporting ? 'Importando...' : 'Importar Configuración'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Restablecer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
          <CardDescription>
            Acciones que no se pueden deshacer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restablecer a Valores por Defecto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Los componentes específicos ahora se importan desde archivos separados