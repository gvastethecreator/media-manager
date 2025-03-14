'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, Settings2, Volume2, Zap } from 'lucide-react';
import { useState } from 'react';
import { FormLayout, FormToggle } from '../../settings/panels/shared';
import type { CardOptions } from '../../types/card-settings-types';
import {
  ContentSection,
  FeedbackSection,
  InteractivitySection,
  PerformanceSection
} from './components/sections';
import { useCoreSettings } from './hooks/use-core-settings';

/**
 * 🔧 Panel de Configuración del Núcleo
 *
 * Componente principal para la configuración de todos los aspectos
 * fundamentales del sistema de tarjetas.
 */
export function CorePanel({
  options,
  onChange,
  disabled = false,
}: {
  options: CardOptions;
  onChange: (options: CardOptions) => void;
  disabled?: boolean;
}) {
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState('interactivity');

  // Usar el hook de configuración del núcleo
  const {
    coreOptions,
    updateCoreOption
  } = useCoreSettings(options.core);

  // Manejar cambios en opciones específicas del núcleo
  const handleCoreChange = <K extends keyof typeof coreOptions>(
    key: K,
    value: typeof coreOptions[K]
  ) => {
    updateCoreOption(key, value);

    // Actualizar opciones principales
    onChange({
      ...options,
      core: {
        ...options.core,
        [key]: value
      }
    });
  };

  return (
    <FormLayout
      title="Configuración del Núcleo"
      description="Ajustes fundamentales del sistema de tarjetas"
      colorScheme="system"
      variant="colored"
    >
      <FormToggle
        id="core-enabled"
        label="Habilitar configuración del núcleo"
        description="Activa o desactiva todas las características del núcleo"
        checked={coreOptions.enabled}
        onCheckedChange={(checked) => handleCoreChange('enabled', checked)}
        disabled={disabled}
        icon={<Settings2 className="h-3.5 w-3.5 text-muted-foreground" />}
      />

      {coreOptions.enabled && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="interactivity" className="flex-1">
              <Zap className="h-4 w-4 mr-2" />
              Interactividad
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex-1">
              <Settings2 className="h-4 w-4 mr-2" />
              Rendimiento
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex-1">
              <Volume2 className="h-4 w-4 mr-2" />
              Retroalimentación
            </TabsTrigger>
            <TabsTrigger value="content" className="flex-1">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Contenido
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interactivity">
            <InteractivitySection
              coreOptions={coreOptions}
              handleCoreChange={handleCoreChange}
              disabled={disabled}
            />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceSection
              coreOptions={coreOptions}
              handleCoreChange={handleCoreChange}
              disabled={disabled}
            />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackSection
              coreOptions={coreOptions}
              handleCoreChange={handleCoreChange}
              disabled={disabled}
            />
          </TabsContent>

          <TabsContent value="content">
            <ContentSection
              coreOptions={coreOptions}
              handleCoreChange={handleCoreChange}
              disabled={disabled}
            />
          </TabsContent>
        </Tabs>
      )}
    </FormLayout>
  );
}