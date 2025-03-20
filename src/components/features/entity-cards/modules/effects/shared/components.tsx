'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FormGroup, FormRow, FormSection, FormSlider, FormToggle } from '@/components/settings/panels/shared';
import type { BaseEffectOptions, BaseEffectSectionProps, ColorEffectOptions, DimensionalEffectOptions, EffectColorScheme } from './types';

/**
 * 🎨 Sección base para efectos
 */
export function EffectSection({
  title,
  description,
  icon,
  colorScheme = 'visual',
  disabled,
  children,
}: BaseEffectSectionProps & { colorScheme?: EffectColorScheme }) {
  return (
    <FormSection
      title={title}
      description={description}
      colorScheme={colorScheme}
      action={icon && <span className="text-muted-foreground">{icon}</span>}
    >
      <div className="space-y-4">{children}</div>
    </FormSection>
  );
}

/**
 * 🎛️ Controles base para efectos
 */
export function BaseEffectControls({
  effect,
  onChange,
  disabled,
}: {
  effect: BaseEffectOptions;
  onChange: (value: Partial<BaseEffectOptions>) => void;
  disabled?: boolean;
}) {
  return (
    <FormGroup>
      <FormRow>
        <FormToggle
          checked={effect.enabled}
          onCheckedChange={(enabled) => onChange({ enabled })}
          disabled={disabled}
          label="Activar"
        />
      </FormRow>
      {effect.enabled && (
        <>
          {effect.intensity !== undefined && (
            <FormRow>
              <FormSlider
                value={[effect.intensity]}
                onValueChange={([intensity]) => onChange({ intensity })}
                disabled={disabled}
                label="Intensidad"
                min={0}
                max={100}
                step={1}
              />
            </FormRow>
          )}
          {effect.opacity !== undefined && (
            <FormRow>
              <FormSlider
                value={[effect.opacity]}
                onValueChange={([opacity]) => onChange({ opacity })}
                disabled={disabled}
                label="Opacidad"
                min={0}
                max={100}
                step={1}
              />
            </FormRow>
          )}
        </>
      )}
    </FormGroup>
  );
}

/**
 * 🌈 Controles para efectos con color
 */
export function ColorEffectControls({
  effect,
  onChange,
  disabled,
}: {
  effect: ColorEffectOptions;
  onChange: (value: Partial<ColorEffectOptions>) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <BaseEffectControls effect={effect} onChange={onChange} disabled={disabled} />
      {effect.enabled && effect.color !== undefined && (
        <FormRow>
          <FormGroup>
            <FormRow>
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border"
                  style={{ backgroundColor: effect.color }}
                />
                <span className="text-sm text-muted-foreground">{effect.color}</span>
              </div>
            </FormRow>
          </FormGroup>
        </FormRow>
      )}
    </>
  );
}

/**
 * 📏 Controles para efectos con dimensiones
 */
export function DimensionalEffectControls({
  effect,
  onChange,
  disabled,
}: {
  effect: DimensionalEffectOptions;
  onChange: (value: Partial<DimensionalEffectOptions>) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <BaseEffectControls effect={effect} onChange={onChange} disabled={disabled} />
      {effect.enabled && (
        <>
          {effect.width !== undefined && (
            <FormRow>
              <FormSlider
                value={[effect.width]}
                onValueChange={([width]) => onChange({ width })}
                disabled={disabled}
                label="Ancho"
                min={0}
                max={100}
                step={1}
              />
            </FormRow>
          )}
          {effect.spread !== undefined && (
            <FormRow>
              <FormSlider
                value={[effect.spread]}
                onValueChange={([spread]) => onChange({ spread })}
                disabled={disabled}
                label="Dispersión"
                min={0}
                max={100}
                step={1}
              />
            </FormRow>
          )}
        </>
      )}
    </>
  );
}

/**
 * 🎭 Indicador de estado del efecto
 */
export function EffectStatus({ enabled, className }: { enabled: boolean; className?: string }) {
  return (
    <Badge variant={enabled ? 'default' : 'outline'} className={className}>
      {enabled ? 'Activado' : 'Desactivado'}
    </Badge>
  );
}
