'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Film, Settings2, Sliders, Sparkles, Video } from 'lucide-react';
import { useState } from 'react';
import {
  FormGroup,
  FormLayout,
  FormRow,
  FormSection,
  FormSelect,
  FormSlider,
  FormToggle,
} from '../../../../settings/panels/shared/form-components';
import { type VideoOptions, cornerStyleOptions } from './types';

// Props para el panel de video
interface VideoPanelProps {
  videoOptions: VideoOptions;
  handleVideoChange: (key: keyof VideoOptions, value: unknown) => void;
  handleDesignSystemChange: (key: string, value: unknown) => void;
  handleEffectsChange: (section: string, key: string, value: unknown) => void;
  handlePerformanceChange: (key: string, value: unknown) => void;
  resetOptions: () => void;
  disabled?: boolean;
  className?: string;
}

// Sección de diseño
const DesignSection = ({
  videoOptions,
  handleVideoChange,
  handleDesignSystemChange,
  disabled,
}: {
  videoOptions: VideoOptions;
  handleVideoChange: (key: keyof VideoOptions, value: unknown) => void;
  handleDesignSystemChange: (key: string, value: unknown) => void;
  disabled?: boolean;
}) => {
  return (
    <FormSection
      title="Diseño 3D"
      description="Configuración para los efectos de diseño 3D"
      colorScheme="core"
      icon={<Settings2 className="h-3.5 w-3.5 text-muted-foreground" />}
    >
      <FormGroup>
        <FormRow cols={1}>
          <FormToggle
            id="enable-3d-effect"
            label="Activar Efecto 3D"
            description="Habilita efectos tridimensionales para las tarjetas"
            checked={videoOptions.enable3DEffect}
            onCheckedChange={(checked) => handleVideoChange('enable3DEffect', checked)}
            disabled={disabled}
          />
        </FormRow>

        {videoOptions.enable3DEffect && (
          <>
            <FormRow cols={1}>
              <FormSelect
                id="corner-style"
                label="Estilo de Esquinas"
                description="Define la forma de las esquinas de la tarjeta"
                value={videoOptions.designSystem?.cornerStyle ?? 'rounded'}
                onValueChange={(value) => handleDesignSystemChange('cornerStyle', value)}
                options={cornerStyleOptions}
                disabled={disabled}
              />
            </FormRow>

            <FormRow cols={1}>
              <FormSlider
                id="elevation"
                label="Elevación"
                description="Altura del efecto 3D"
                min={0}
                max={10}
                step={1}
                value={[videoOptions.designSystem?.elevation ?? 2]}
                onValueChange={([value]) => handleDesignSystemChange('elevation', value)}
                disabled={disabled}
              />
            </FormRow>
          </>
        )}
      </FormGroup>
    </FormSection>
  );
};

// Sección de efectos básicos
const BasicEffectsSection = ({
  videoOptions,
  handleVideoChange,
  disabled,
}: {
  videoOptions: VideoOptions;
  handleVideoChange: (key: keyof VideoOptions, value: unknown) => void;
  disabled?: boolean;
}) => {
  return (
    <FormSection
      title="Efectos Básicos"
      description="Efectos visuales para mejorar la apariencia"
      colorScheme="core"
      icon={<Sparkles className="h-3.5 w-3.5 text-muted-foreground" />}
    >
      <FormGroup>
        <FormRow cols={2}>
          <FormToggle
            id="holographic-effect"
            label="Efecto Holográfico"
            description="Apariencia similar a un holograma"
            checked={videoOptions.enableHolographicEffect}
            onCheckedChange={(checked) => handleVideoChange('enableHolographicEffect', checked)}
            disabled={disabled}
          />

          <FormToggle
            id="glow-effect"
            label="Efecto de Brillo"
            description="Añade un halo luminoso alrededor"
            checked={videoOptions.enableGlowEffect}
            onCheckedChange={(checked) => handleVideoChange('enableGlowEffect', checked)}
            disabled={disabled}
          />
        </FormRow>

        <FormRow cols={2}>
          <FormToggle
            id="animated-border"
            label="Borde Animado"
            description="Animación en el borde de la tarjeta"
            checked={videoOptions.enableAnimatedBorder}
            onCheckedChange={(checked) => handleVideoChange('enableAnimatedBorder', checked)}
            disabled={disabled}
          />

          <FormToggle
            id="light-halo"
            label="Halo de Luz"
            description="Efecto de halo luminoso"
            checked={videoOptions.enableLightHalo}
            onCheckedChange={(checked) => handleVideoChange('enableLightHalo', checked)}
            disabled={disabled}
          />
        </FormRow>
      </FormGroup>
    </FormSection>
  );
};

// Sección de efectos de profundidad
const DepthEffectsSection = ({
  videoOptions,
  handleEffectsChange,
  disabled,
}: {
  videoOptions: VideoOptions;
  handleEffectsChange: (key: string, subKey: string, value: unknown) => void;
  disabled?: boolean;
}) => {
  return (
    <FormSection
      title="Efectos de Profundidad"
      description="Efectos que añaden sensación de profundidad"
      colorScheme="core"
      icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />}
    >
      <FormGroup>
        <FormRow cols={1}>
          <FormToggle
            id="shadow-enabled"
            label="Sombra"
            description="Añade sombra proyectada"
            checked={videoOptions.effects?.shadow?.enabled ?? true}
            onCheckedChange={(checked) => handleEffectsChange('shadow', 'enabled', checked)}
            disabled={disabled}
          />
        </FormRow>

        <FormRow cols={1}>
          <FormToggle
            id="reflection-enabled"
            label="Reflejo"
            description="Añade reflejo bajo la tarjeta"
            checked={videoOptions.effects?.reflection?.enabled ?? false}
            onCheckedChange={(checked) => handleEffectsChange('reflection', 'enabled', checked)}
            disabled={disabled}
          />
        </FormRow>

        <FormRow cols={1}>
          <FormToggle
            id="parallax-enabled"
            label="Efecto Parallax"
            description="Movimiento de profundidad al mover el cursor"
            checked={videoOptions.effects?.parallax?.enabled ?? false}
            onCheckedChange={(checked) => handleEffectsChange('parallax', 'enabled', checked)}
            disabled={disabled}
          />
        </FormRow>
      </FormGroup>
    </FormSection>
  );
};

// Sección de rendimiento
const PerformanceSection = ({
  videoOptions,
  handlePerformanceChange,
  disabled,
}: {
  videoOptions: VideoOptions;
  handlePerformanceChange: (key: string, value: unknown) => void;
  disabled?: boolean;
}) => {
  return (
    <FormSection
      title="Rendimiento"
      description="Opciones para optimizar el rendimiento"
      colorScheme="core"
      icon={<Sliders className="h-3.5 w-3.5 text-muted-foreground" />}
    >
      <FormGroup>
        <FormRow cols={2}>
          <FormToggle
            id="hardware-acceleration"
            label="Aceleración por Hardware"
            description="Usar GPU para renderizado"
            checked={videoOptions.performance?.enableHardwareAcceleration ?? true}
            onCheckedChange={(checked) => handlePerformanceChange('enableHardwareAcceleration', checked)}
            disabled={disabled}
          />

          <FormToggle
            id="use-raf"
            label="Usar requestAnimationFrame"
            description="Sincronizar con refresco de pantalla"
            checked={videoOptions.performance?.useRAF ?? true}
            onCheckedChange={(checked) => handlePerformanceChange('useRAF', checked)}
            disabled={disabled}
          />
        </FormRow>

        <FormRow cols={2}>
          <FormToggle
            id="batch-updates"
            label="Actualizar por Lotes"
            description="Agrupar actualizaciones del DOM"
            checked={videoOptions.performance?.batchUpdates ?? true}
            onCheckedChange={(checked) => handlePerformanceChange('batchUpdates', checked)}
            disabled={disabled}
          />

          <FormSlider
            id="throttle-ms"
            label="Throttle (ms)"
            description="Limitar frecuencia de eventos"
            min={0}
            max={500}
            step={10}
            value={[videoOptions.performance?.throttleMs ?? 100]}
            onValueChange={([value]) => handlePerformanceChange('throttleMs', value)}
            disabled={disabled}
          />
        </FormRow>
      </FormGroup>
    </FormSection>
  );
};

// Sección de controles de video
const VideoControlSection = ({
  videoOptions,
  handleVideoChange,
  disabled,
}: {
  videoOptions: VideoOptions;
  handleVideoChange: (key: keyof VideoOptions, value: unknown) => void;
  disabled?: boolean;
}) => {
  return (
    <FormSection
      title="Controles de Video"
      description="Configuración para la reproducción de video"
      colorScheme="core"
      icon={<Film className="h-3.5 w-3.5 text-muted-foreground" />}
    >
      <FormGroup>
        <FormRow cols={2}>
          <FormToggle
            id="video-autoplay"
            label="Reproducción Automática"
            description="Iniciar reproducción automáticamente"
            checked={videoOptions.videoAutoplay ?? false}
            onCheckedChange={(checked) => handleVideoChange('videoAutoplay', checked)}
            disabled={disabled}
          />

          <FormToggle
            id="video-loop"
            label="Bucle"
            description="Repetir video al finalizar"
            checked={videoOptions.videoLoop ?? true}
            onCheckedChange={(checked) => handleVideoChange('videoLoop', checked)}
            disabled={disabled}
          />
        </FormRow>

        <FormRow cols={2}>
          <FormToggle
            id="video-muted"
            label="Silenciado"
            description="Reproducir sin sonido"
            checked={videoOptions.videoMuted ?? true}
            onCheckedChange={(checked) => handleVideoChange('videoMuted', checked)}
            disabled={disabled}
          />

          <FormToggle
            id="video-controls"
            label="Mostrar Controles"
            description="Mostrar controles de reproducción"
            checked={videoOptions.videoControls ?? true}
            onCheckedChange={(checked) => handleVideoChange('videoControls', checked)}
            disabled={disabled}
          />
        </FormRow>

        <FormRow cols={1}>
          <FormSlider
            id="video-playback-rate"
            label="Velocidad de Reproducción"
            description="Velocidad a la que se reproduce el video"
            min={0.25}
            max={2}
            step={0.25}
            value={[videoOptions.videoPlaybackRate ?? 1.0]}
            onValueChange={([value]) => handleVideoChange('videoPlaybackRate', value)}
            disabled={disabled}
          />
        </FormRow>
      </FormGroup>
    </FormSection>
  );
};

/**
 * Panel de configuración de video
 * @param props - Propiedades del panel
 * @returns Componente React
 */
export function VideoPanel({
  videoOptions,
  handleVideoChange,
  handleDesignSystemChange,
  handleEffectsChange,
  handlePerformanceChange,
  resetOptions,
  disabled = false,
  className,
}: VideoPanelProps) {
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState<string>("design");

  return (
    <FormLayout
      title="Configuración de Video"
      description="Personaliza la apariencia y comportamiento de los videos"
      className={className}
      colorScheme="core"
      icon={<Video className="h-4 w-4" />}
      variant="colored"
      trailing={
        <Button
          onClick={resetOptions}
          variant="outline"
          size="sm"
          disabled={disabled}
          className="mt-1"
        >
          Restablecer
        </Button>
      }
    >
      <Tabs
        defaultValue="design"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 h-8">
          <TabsTrigger className="text-[10px]" value="design">Diseño</TabsTrigger>
          <TabsTrigger className="text-[10px]" value="effects">Efectos</TabsTrigger>
          <TabsTrigger className="text-[10px]" value="controls">Controles</TabsTrigger>
          <TabsTrigger className="text-[10px]" value="performance">Rendimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="design" className="mt-4 space-y-6">
          <DesignSection
            videoOptions={videoOptions}
            handleVideoChange={handleVideoChange}
            handleDesignSystemChange={handleDesignSystemChange}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="effects" className="mt-4 space-y-6">
          <BasicEffectsSection
            videoOptions={videoOptions}
            handleVideoChange={handleVideoChange}
            disabled={disabled}
          />
          <DepthEffectsSection
            videoOptions={videoOptions}
            handleEffectsChange={handleEffectsChange}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="controls" className="mt-4 space-y-6">
          <VideoControlSection
            videoOptions={videoOptions}
            handleVideoChange={handleVideoChange}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="performance" className="mt-4 space-y-6">
          <PerformanceSection
            videoOptions={videoOptions}
            handlePerformanceChange={handlePerformanceChange}
            disabled={disabled}
          />
        </TabsContent>
      </Tabs>
    </FormLayout>
  );
}