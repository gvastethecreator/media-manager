'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DragSelectIcon, GestureTapIcon, HandIcon, MousePointerClickIcon } from 'lucide-react';
import { useState } from 'react';
import {
  FormGroup,
  FormLayout,
  FormRow,
  FormSection,
  FormSelect,
  FormToggle
} from '../../../../settings/panels/shared/form-components';

// 🖱️ Opciones para acciones de clic
export const clickActionOptions = [
  { value: 'none', label: 'Ninguna' },
  { value: 'flip', label: 'Voltear' },
  { value: 'expand', label: 'Expandir' },
  { value: 'select', label: 'Seleccionar' },
  { value: 'navigate', label: 'Navegar' },
  { value: 'custom', label: 'Personalizada' }
];

// ✋ Opciones para acciones de hover
export const hoverActionOptions = [
  { value: 'none', label: 'Ninguna' },
  { value: 'preview', label: 'Previsualizar' },
  { value: 'highlight', label: 'Resaltar' },
  { value: 'showInfo', label: 'Mostrar información' },
  { value: 'custom', label: 'Personalizada' }
];

// 👆 Opciones para comportamiento táctil
export const touchBehaviorOptions = [
  { value: 'tap', label: 'Tap simple' },
  { value: 'doubleTap', label: 'Tap doble' },
  { value: 'longPress', label: 'Pulsación larga' },
  { value: 'swipe', label: 'Deslizar' }
];

// 📝 Tipos para opciones de interacción
export interface InteractionOptions {
  // Opciones generales
  enabled?: boolean;
  draggable?: boolean;
  selectable?: boolean;
  sortable?: boolean;

  // Opciones de hover
  hoverEnabled?: boolean;
  hoverAction?: string;
  hoverDelay?: number;
  hoverEffects?: boolean;

  // Opciones de clic
  clickEnabled?: boolean;
  clickAction?: string;
  doubleClickAction?: string;

  // Opciones táctiles
  touchEnabled?: boolean;
  touchBehavior?: string;
  tapAction?: string;

  // Efectos de retroalimentación
  feedbackEnabled?: boolean;
  hapticFeedback?: boolean;
  soundFeedback?: boolean;
  visualFeedback?: boolean;

  // Accesibilidad
  accessibilityEnabled?: boolean;
  keyboardNavigable?: boolean;
  ariaLabels?: boolean;
}

// 🔄 Props para el módulo de interacción
export interface InteractionModuleProps {
  initialOptions?: Partial<InteractionOptions>;
  onChange?: (options: InteractionOptions) => void;
  disabled?: boolean;
  className?: string;
}

// 🎛️ Valores por defecto para opciones de interacción
export const DEFAULT_INTERACTION_OPTIONS: InteractionOptions = {
  enabled: true,
  draggable: false,
  selectable: true,
  sortable: false,

  hoverEnabled: true,
  hoverAction: 'highlight',
  hoverDelay: 200,
  hoverEffects: true,

  clickEnabled: true,
  clickAction: 'select',
  doubleClickAction: 'expand',

  touchEnabled: true,
  touchBehavior: 'tap',
  tapAction: 'select',

  feedbackEnabled: true,
  hapticFeedback: false,
  soundFeedback: false,
  visualFeedback: true,

  accessibilityEnabled: true,
  keyboardNavigable: true,
  ariaLabels: true,
};

// 🖱️ Sección de interacciones de mouse
const MouseInteractionsSection = ({
  options,
  handleInteractionChange,
  disabled,
}: {
  options: InteractionOptions;
  handleInteractionChange: (key: keyof InteractionOptions, value: unknown) => void;
  disabled?: boolean;
}) => {
  return (
    <FormSection
      title="Interacciones de Mouse"
      description="Configuración para interacciones con mouse"
      colorScheme="core"
      icon={<MousePointerClickIcon className="h-3.5 w-3.5 text-muted-foreground" />}
    >
      <FormGroup>
        <FormRow cols={1}>
          <FormToggle
            id="click-enabled"
            label="Activar Click"
            description="Habilita interacciones al hacer clic"
            checked={options.clickEnabled ?? DEFAULT_INTERACTION_OPTIONS.clickEnabled}
            onCheckedChange={(checked) => handleInteractionChange('clickEnabled', checked)}
            disabled={disabled}
          />
        </FormRow>

        {options.clickEnabled && (
          <>
            <FormRow cols={1}>
              <FormSelect
                id="click-action"
                label="Acción al hacer Click"
                description="Comportamiento al hacer clic sobre la tarjeta"
                value={options.clickAction ?? DEFAULT_INTERACTION_OPTIONS.clickAction}
                onValueChange={(value) => handleInteractionChange('clickAction', value)}
                options={clickActionOptions}
                disabled={disabled}
              />
            </FormRow>

            <FormRow cols={1}>
              <FormSelect
                id="double-click-action"
                label="Acción al hacer Doble Click"
                description="Comportamiento al hacer doble clic sobre la tarjeta"
                value={options.doubleClickAction ?? DEFAULT_INTERACTION_OPTIONS.doubleClickAction}
                onValueChange={(value) => handleInteractionChange('doubleClickAction', value)}
                options={clickActionOptions}
                disabled={disabled}
              />
            </FormRow>
          </>
        )}

        <FormRow cols={1}>
          <FormToggle
            id="hover-enabled"
            label="Activar Hover"
            description="Habilita interacciones al pasar el mouse"
            checked={options.hoverEnabled ?? DEFAULT_INTERACTION_OPTIONS.hoverEnabled}
            onCheckedChange={(checked) => handleInteractionChange('hoverEnabled', checked)}
            disabled={disabled}
          />
        </FormRow>

        {options.hoverEnabled && (
          <>
            <FormRow cols={1}>
              <FormSelect
                id="hover-action"
                label="Acción al Hover"
                description="Comportamiento al pasar el mouse sobre la tarjeta"
                value={options.hoverAction ?? DEFAULT_INTERACTION_OPTIONS.hoverAction}
                onValueChange={(value) => handleInteractionChange('hoverAction', value)}
                options={hoverActionOptions}
                disabled={disabled}
              />
            </FormRow>

            <FormRow cols={1}>
              <FormToggle
                id="hover-effects"
                label="Efectos al Hover"
                description="Activar efectos visuales al pasar el mouse"
                checked={options.hoverEffects ?? DEFAULT_INTERACTION_OPTIONS.hoverEffects}
                onCheckedChange={(checked) => handleInteractionChange('hoverEffects', checked)}
                disabled={disabled}
              />
            </FormRow>
          </>
        )}
      </FormGroup>
    </FormSection>
  );
};

// 👆 Sección de interacciones táctiles
const TouchInteractionsSection = ({
  options,
  handleInteractionChange,
  disabled,
}: {
  options: InteractionOptions;
  handleInteractionChange: (key: keyof InteractionOptions, value: unknown) => void;
  disabled?: boolean;
}) => {
  return (
    <FormSection
      title="Interacciones Táctiles"
      description="Configuración para interacciones en dispositivos táctiles"
      colorScheme="core"
      icon={<HandIcon className="h-3.5 w-3.5 text-muted-foreground" />}
    >
      <FormGroup>
        <FormRow cols={1}>
          <FormToggle
            id="touch-enabled"
            label="Activar Interacciones Táctiles"
            description="Habilita interacciones en dispositivos táctiles"
            checked={options.touchEnabled ?? DEFAULT_INTERACTION_OPTIONS.touchEnabled}
            onCheckedChange={(checked) => handleInteractionChange('touchEnabled', checked)}
            disabled={disabled}
          />
        </FormRow>

        {options.touchEnabled && (
          <>
            <FormRow cols={1}>
              <FormSelect
                id="touch-behavior"
                label="Comportamiento Táctil"
                description="Tipo de interacción táctil principal"
                value={options.touchBehavior ?? DEFAULT_INTERACTION_OPTIONS.touchBehavior}
                onValueChange={(value) => handleInteractionChange('touchBehavior', value)}
                options={touchBehaviorOptions}
                disabled={disabled}
              />
            </FormRow>

            <FormRow cols={1}>
              <FormSelect
                id="tap-action"
                label="Acción al Tap"
                description="Comportamiento al tocar la tarjeta"
                value={options.tapAction ?? DEFAULT_INTERACTION_OPTIONS.tapAction}
                onValueChange={(value) => handleInteractionChange('tapAction', value)}
                options={clickActionOptions}
                disabled={disabled}
              />
            </FormRow>
          </>
        )}
      </FormGroup>
    </FormSection>
  );
};

// 🧰 Sección de interacciones avanzadas
const AdvancedInteractionsSection = ({
  options,
  handleInteractionChange,
  disabled,
}: {
  options: InteractionOptions;
  handleInteractionChange: (key: keyof InteractionOptions, value: unknown) => void;
  disabled?: boolean;
}) => {
  return (
    <FormSection
      title="Interacciones Avanzadas"
      description="Configuración avanzada de interactividad"
      colorScheme="core"
      icon={<DragSelectIcon className="h-3.5 w-3.5 text-muted-foreground" />}
    >
      <FormGroup>
        <FormRow cols={2}>
          <FormToggle
            id="draggable"
            label="Arrastrable"
            description="Permite arrastrar la tarjeta"
            checked={options.draggable ?? DEFAULT_INTERACTION_OPTIONS.draggable}
            onCheckedChange={(checked) => handleInteractionChange('draggable', checked)}
            disabled={disabled}
          />

          <FormToggle
            id="selectable"
            label="Seleccionable"
            description="Permite seleccionar la tarjeta"
            checked={options.selectable ?? DEFAULT_INTERACTION_OPTIONS.selectable}
            onCheckedChange={(checked) => handleInteractionChange('selectable', checked)}
            disabled={disabled}
          />
        </FormRow>

        <FormRow cols={2}>
          <FormToggle
            id="sortable"
            label="Ordenable"
            description="Permite reordenar la tarjeta"
            checked={options.sortable ?? DEFAULT_INTERACTION_OPTIONS.sortable}
            onCheckedChange={(checked) => handleInteractionChange('sortable', checked)}
            disabled={disabled}
          />

          <FormToggle
            id="keyboard-navigable"
            label="Navegable por Teclado"
            description="Permite navegar con teclado"
            checked={options.keyboardNavigable ?? DEFAULT_INTERACTION_OPTIONS.keyboardNavigable}
            onCheckedChange={(checked) => handleInteractionChange('keyboardNavigable', checked)}
            disabled={disabled}
          />
        </FormRow>

        <FormRow cols={1}>
          <FormToggle
            id="accessibility-enabled"
            label="Accesibilidad Mejorada"
            description="Habilita funciones adicionales de accesibilidad"
            checked={options.accessibilityEnabled ?? DEFAULT_INTERACTION_OPTIONS.accessibilityEnabled}
            onCheckedChange={(checked) => handleInteractionChange('accessibilityEnabled', checked)}
            disabled={disabled}
          />
        </FormRow>
      </FormGroup>
    </FormSection>
  );
};

// ✨ Componente principal del módulo de interacciones
export function InteractionModule({
  initialOptions,
  onChange,
  disabled,
  className,
}: InteractionModuleProps) {
  const [options, setOptions] = useState<InteractionOptions>({
    ...DEFAULT_INTERACTION_OPTIONS,
    ...initialOptions,
  });

  const [activeTab, setActiveTab] = useState<string>("mouse");

  // 🎚️ Manejador de cambios de interacciones
  const handleInteractionChange = (key: keyof InteractionOptions, value: unknown) => {
    const updatedOptions = {
      ...options,
      [key]: value,
    };

    setOptions(updatedOptions);
    onChange?.(updatedOptions);
  };

  return (
    <FormLayout
      title="Interacciones"
      description="Configura cómo los usuarios interactúan con las tarjetas"
      colorScheme="core"
      icon={<MousePointerClickIcon className="h-4 w-4" />}
      className={className}
      variant="colored"
    >
      <FormRow cols={1}>
        <FormToggle
          id="interactions-enabled"
          label="Habilitar Interacciones"
          description="Activa o desactiva todas las interacciones"
          checked={options.enabled ?? DEFAULT_INTERACTION_OPTIONS.enabled}
          onCheckedChange={(checked) => handleInteractionChange('enabled', checked)}
          disabled={disabled}
        />
      </FormRow>

      {options.enabled && (
        <div className="mt-4 space-y-6">
          <Tabs
            defaultValue="mouse"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger className="text-[10px]" value="mouse">Mouse</TabsTrigger>
              <TabsTrigger className="text-[10px]" value="touch">Táctil</TabsTrigger>
              <TabsTrigger className="text-[10px]" value="advanced">Avanzado</TabsTrigger>
            </TabsList>

            <TabsContent value="mouse" className="mt-2 space-y-6">
              <MouseInteractionsSection
                options={options}
                handleInteractionChange={handleInteractionChange}
                disabled={disabled}
              />
            </TabsContent>

            <TabsContent value="touch" className="mt-2 space-y-6">
              <TouchInteractionsSection
                options={options}
                handleInteractionChange={handleInteractionChange}
                disabled={disabled}
              />
            </TabsContent>

            <TabsContent value="advanced" className="mt-2 space-y-6">
              <AdvancedInteractionsSection
                options={options}
                handleInteractionChange={handleInteractionChange}
                disabled={disabled}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </FormLayout>
  );
}