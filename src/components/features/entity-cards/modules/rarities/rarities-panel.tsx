'use client';

import {
  FormGroup,
  FormLayout,
  FormRow,
  FormSection,
  FormToggle
} from '../../../settings/panels/shared/form-components';
import type { CardOptions } from '../../types/card-settings-types';
import { DEFAULT_RARITIES, RaritySelector } from './';
import { RaritySystem } from './rarity-system';

// 🎨 Props para el panel de rareza
interface RaritiesPanelProps {
  options: CardOptions;
  onChange: (options: CardOptions) => void;
  entityType?: string;
  entityId?: string;
  disabled?: boolean;
}

// 💎 Panel de configuración del sistema de rareza
export function RaritiesPanel({
  options,
  onChange,
  entityType = 'generic',
  entityId,
  disabled = false,
}: RaritiesPanelProps) {
  // Manejar cambio en el uso del sistema de rareza
  const handleUseRaritySystem = (enabled: boolean) => {
    onChange({
      ...options,
      raritySystem: enabled,
    });
  };

  // Manejar cambio en la distribución de rareza
  const handleRarityDistributionChange = (distribution: Record<string, number>) => {
    onChange({
      ...options,
      rarityDistribution: distribution,
    });
  };

  // Manejar selección de rareza predeterminada
  const handleDefaultRarityChange = (rarityId: string) => {
    onChange({
      ...options,
      defaultRarity: rarityId,
    });
  };

  // Componente para la sección de distribución de rareza
  const DistributionSection = () => (
    <FormSection
      title="Distribución de Rarezas"
      description="Configura la probabilidad de aparición de cada rareza"
      colorScheme="design"
    >
      <FormGroup>
        <RaritySystem
          entityType={entityType}
          entityId={entityId}
          initialDistribution={options.rarityDistribution}
          onChange={handleRarityDistributionChange}
          enabled={options.raritySystem}
        />
      </FormGroup>
    </FormSection>
  );

  // Componente para la sección de rareza predeterminada
  const DefaultRaritySection = () => (
    <FormSection
      title="Rareza Predeterminada"
      description="Establece la rareza que se asignará por defecto"
      colorScheme="design"
      withSeparator={false}
    >
      <FormGroup>
        <RaritySelector
          rarities={DEFAULT_RARITIES}
          selectedRarityId={options.defaultRarity}
          onSelectRarity={(rarity) => handleDefaultRarityChange(rarity.id)}
          showChance={true}
          showLevel={true}
          size="sm"
          displayType="list"
        />
      </FormGroup>
    </FormSection>
  );

  return (
    <FormLayout
      title="Sistema de Rareza"
      description="Configura el sistema de rareza para tus entidades"
      colorScheme="design"
      variant="colored"
    >
      <FormToggle
        id="use-rarity-system"
        label="Habilitar sistema de rareza"
        description="Activa el sistema de rareza para clasificar tus entidades"
        checked={options.raritySystem}
        onCheckedChange={handleUseRaritySystem}
        disabled={disabled}
      />

      {options.raritySystem && (
        <div className="mt-4 space-y-6">
          <DistributionSection />
          <DefaultRaritySection />
        </div>
      )}
    </FormLayout>
  );
}